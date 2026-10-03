import { backtestImages } from "./backtestImages.mjs";
import { nextBacktestTradeId } from "./tradeJournal.mjs";
import { isNoEntry } from "./backtestEntries.mjs";

const imageSourceIsPortable = (src) => /^data:image\/[a-z0-9.+-]+;base64,/i.test(src) || /^https?:\/\//i.test(src);

function portableTrade(trade) {
  const images = backtestImages(trade).map(({ id, timeframe, src }) => ({ id, timeframe: timeframe || "", src }));
  return { ...trade, image: "", images };
}

export function createBacktestBackup(trades, balance, exportedAt = new Date().toISOString()) {
  return {
    type: "ett-backtest",
    version: 2,
    exportedAt,
    balance: Number(balance) || 0,
    trades: trades.map(portableTrade),
  };
}

export function parseBacktestBackup(source) {
  let backup;
  try {
    backup = JSON.parse(source);
  } catch {
    throw new Error("فایل JSON قابل خواندن نیست.");
  }
  if (!backup || !["ett-backtest", "backtest"].includes(backup.type) ||
      (backup.type === "ett-backtest" && backup.version !== 2) || !Array.isArray(backup.trades)) {
    throw new Error("این فایل، نسخهٔ پشتیبان معتبر بک‌تست ETT نیست.");
  }
  const balance = Number(backup.balance);
  if (!Number.isFinite(balance)) throw new Error("سرمایهٔ فرضی فایل معتبر نیست.");
  const trades = backup.trades.map((trade, index) => {
    const date = trade?.date;
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(`${date}T12:00:00Z`)) ||
        new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date ||
        typeof trade.market !== "string" || !trade.market.trim() ||
        !["Long", "Short"].includes(trade.side)) {
      throw new Error(`مشخصات معاملهٔ شمارهٔ ${index + 1} معتبر نیست.`);
    }
    const images = backtestImages(trade);
    if (isNoEntry(trade) && !String(trade.noEntryReason || "").trim()) {
      throw new Error(`دلیلِ ورودندادن برای موقعیت شمارهٔ ${index + 1} ثبت نشده است.`);
    }
    if ((Array.isArray(trade.images) && images.length !== trade.images.length) ||
        images.some((image) => !imageSourceIsPortable(image.src))) {
      throw new Error(`عکس‌های معاملهٔ شمارهٔ ${index + 1} قابل بازیابی نیستند.`);
    }
    return portableTrade(isNoEntry(trade)
      ? { ...trade, entry: "", exit: "", pnl: 0, risk: "", noEntryReason: trade.noEntryReason.trim() }
      : trade);
  });
  return { balance, trades };
}

function tradeSignature(trade) {
  const normalized = portableTrade(trade);
  const nullableNumber = (value) => value === "" || value == null ? null : Number(value);
  return JSON.stringify({
    date: normalized.date, market: normalized.market, side: normalized.side,
    entry: nullableNumber(normalized.entry), exit: nullableNumber(normalized.exit),
    pnl: Number(normalized.pnl || 0), risk: nullableNumber(normalized.risk),
    setup: normalized.setup || "", emotion: normalized.emotion || "",
    notes: normalized.notes || "", status: isNoEntry(normalized) ? "no-entry" : "executed",
    noEntryReason: isNoEntry(normalized) ? normalized.noEntryReason?.trim() || "" : "",
    images: normalized.images.map(({ timeframe, src }) => ({ timeframe, src })),
  });
}

export function mergeBacktestBackup(existing, imported, now = Date.now()) {
  const trades = [...existing];
  const usedIds = new Set(existing.map((trade) => Number(trade.id)));
  const signatures = new Set(existing.map(tradeSignature));
  const added = [];
  let skipped = 0;
  for (const incoming of imported) {
    const signature = tradeSignature(incoming);
    if (signatures.has(signature)) {
      skipped += 1;
      continue;
    }
    const validId = Number.isSafeInteger(Number(incoming.id)) && Number(incoming.id) < 0;
    const id = validId && !usedIds.has(Number(incoming.id))
      ? Number(incoming.id)
      : nextBacktestTradeId(trades, now);
    const trade = { ...incoming, id };
    trades.push(trade);
    added.push(trade);
    usedIds.add(id);
    signatures.add(signature);
  }
  return { trades, added, skipped };
}
