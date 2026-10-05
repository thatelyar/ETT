import { backtestImages } from "./backtestImages.mjs";
import { isNoEntry } from "./backtestEntries.mjs";
import { nextLiveTradeId, tradeBelongsToJournal } from "./tradeJournal.mjs";

const portableImage = (src) => /^data:image\/[a-z0-9.+-]+;base64,\S+/i.test(src) || /^https?:\/\/\S+/i.test(src);

function portableTrade(trade) {
  return {
    id: Number(trade.id), date: trade.date, market: trade.market, side: trade.side,
    entry: isNoEntry(trade) ? "" : trade.entry ?? "",
    exit: isNoEntry(trade) ? "" : trade.exit ?? "",
    pnl: isNoEntry(trade) ? 0 : Number(trade.pnl || 0),
    risk: isNoEntry(trade) ? "" : trade.risk ?? "",
    setup: String(trade.setup || ""), emotion: String(trade.emotion || ""), notes: String(trade.notes || ""),
    status: isNoEntry(trade) ? "no-entry" : "executed",
    noEntryReason: isNoEntry(trade) ? String(trade.noEntryReason || "").trim() : "",
    image: "",
    images: backtestImages(trade).map(({ id, timeframe, src }) => ({
      id: id || "", timeframe: timeframe || "", src,
    })),
  };
}

export function createLiveBackup(trades, balance, exportedAt = new Date().toISOString()) {
  if (!trades.every((trade) => tradeBelongsToJournal(trade, "live"))) {
    throw new Error("فهرست لایو شامل رکورد غیرلایو است؛ فایل ساخته نشد.");
  }
  const initialBalance = Number(balance);
  if (!Number.isFinite(initialBalance)) throw new Error("سرمایهٔ اولیه معتبر نیست.");
  return {
    type: "ett-live", version: 1, exportedAt,
    balance: initialBalance, trades: trades.map(portableTrade),
  };
}

export function parseLiveBackup(source) {
  let backup;
  try { backup = JSON.parse(source); }
  catch { throw new Error("فایل JSON قابل خواندن نیست."); }
  const currentFormat = backup?.type === "ett-live" && backup.version === 1;
  const legacySettingsFormat = backup?.type == null &&
    (Array.isArray(backup?.backtestTrades) || (backup?.profile && typeof backup.profile === "object"));
  if (!(currentFormat || legacySettingsFormat) || !Array.isArray(backup.trades)) {
    throw new Error("این فایل، نسخهٔ پشتیبان معتبر ژورنال لایو ETT نیست.");
  }
  const balance = Number(backup.balance);
  if ((typeof backup.balance !== "number" && typeof backup.balance !== "string") ||
      String(backup.balance).trim() === "" || !Number.isFinite(balance)) {
    throw new Error("سرمایهٔ اولیهٔ فایل معتبر نیست.");
  }
  const trades = backup.trades.map((trade, index) => {
    const date = trade?.date;
    const rawId = trade?.id;
    const validId = (typeof rawId === "number" || typeof rawId === "string") &&
      /^\d+$/.test(String(rawId)) && tradeBelongsToJournal(trade, "live");
    if (!validId || typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T12:00:00Z`)) ||
        new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date ||
        typeof trade.market !== "string" || !trade.market.trim() ||
        !["Long", "Short"].includes(trade.side) ||
        (trade.status && !["executed", "no-entry"].includes(trade.status))) {
      throw new Error(`مشخصات معاملهٔ لایو شمارهٔ ${index + 1} معتبر نیست.`);
    }
    const images = backtestImages(trade);
    if (trade.images != null && !Array.isArray(trade.images)) {
      throw new Error(`عکس‌های معاملهٔ لایو شمارهٔ ${index + 1} قابل بازیابی نیستند.`);
    }
    if ((Array.isArray(trade.images) && images.length !== trade.images.length) ||
        images.some((image) => !portableImage(image.src))) {
      throw new Error(`عکس‌های معاملهٔ لایو شمارهٔ ${index + 1} قابل بازیابی نیستند.`);
    }
    if (isNoEntry(trade) && !String(trade.noEntryReason || "").trim()) {
      throw new Error(`دلیل ورودندادن برای موقعیت شمارهٔ ${index + 1} ثبت نشده است.`);
    }
    if (!isNoEntry(trade) && [trade.entry, trade.exit, trade.risk, trade.pnl]
      .some((value) => value != null && value !== "" &&
        ((typeof value !== "number" && typeof value !== "string") || !Number.isFinite(Number(value))))) {
      throw new Error(`مقادیر معاملهٔ لایو شمارهٔ ${index + 1} معتبر نیست.`);
    }
    return portableTrade(trade);
  });
  return { balance, trades };
}

function signature(trade) {
  const normalized = portableTrade(trade);
  const numeric = (value) => value === "" || value == null ? null : Number(value);
  return JSON.stringify({
    date: normalized.date, market: normalized.market, side: normalized.side,
    entry: numeric(normalized.entry), exit: numeric(normalized.exit),
    pnl: Number(normalized.pnl), risk: numeric(normalized.risk),
    setup: normalized.setup, emotion: normalized.emotion, notes: normalized.notes,
    status: normalized.status, noEntryReason: normalized.noEntryReason,
    images: normalized.images.map(({ timeframe, src }) => ({ timeframe, src })),
  });
}

export function reconcileLiveTrades(local, remote) {
  const byId = new Map(remote.map((trade) => [Number(trade.id), trade]));
  for (const trade of local) {
    const remoteTrade = byId.get(Number(trade.id));
    if (remoteTrade && signature(remoteTrade) !== signature(trade)) {
      throw new Error("دادهٔ لایو در دستگاه دیگری تغییر کرده است. صفحه را تازه‌سازی کن و دوباره فایل را وارد کن؛ چیزی بازنویسی نشد.");
    }
    if (!remoteTrade) byId.set(Number(trade.id), trade);
  }
  return [...byId.values()];
}

export function mergeLiveBackup(existing, imported, now = Date.now()) {
  const trades = [...existing];
  const usedIds = new Set(existing.map((trade) => Number(trade.id)));
  const signatures = new Set(existing.map(signature));
  const added = [];
  let skipped = 0;
  for (const incoming of imported) {
    const tradeSignature = signature(incoming);
    if (signatures.has(tradeSignature)) { skipped += 1; continue; }
    const id = tradeBelongsToJournal(incoming, "live") && !usedIds.has(Number(incoming.id))
      ? Number(incoming.id) : nextLiveTradeId(trades, now);
    const trade = { ...portableTrade(incoming), id };
    trades.push(trade);
    added.push(trade);
    usedIds.add(id);
    signatures.add(tradeSignature);
  }
  return { trades, added, skipped };
}
