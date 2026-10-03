import { createClient } from "@supabase/supabase-js";
import { partitionJournalTrades, tradeBelongsToJournal } from "./tradeJournal.mjs";
import { backtestImages, backtestMetadata, encodeBacktestImages } from "./backtestImages.mjs";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const cloudEnabled = Boolean(url && key);
export const supabase = cloudEnabled
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export async function loadCloudData(userId) {
  const [{ data: settings, error: settingsError }, { data: trades, error: tradesError }] =
    await Promise.all([
      supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("trades").select("*").eq("user_id", userId).order("trade_date"),
    ]);
  if (settingsError) throw settingsError;
  if (tradesError) throw tradesError;
  const mappedTrades = (trades || []).map((trade) => ({
      id: trade.id,
      date: trade.trade_date,
      market: trade.market,
      side: trade.side,
      entry: trade.entry ?? "",
      exit: trade.exit ?? "",
      pnl: Number(trade.pnl || 0),
      risk: trade.risk ?? "",
      setup: trade.setup || "",
      emotion: trade.emotion || "",
      notes: trade.notes || "",
      image: trade.image || "",
    }));
  const journals = partitionJournalTrades(mappedTrades);
  const withImagesAndStatus = (trade) => ({ ...trade, ...backtestMetadata(trade), images: backtestImages(trade), image: "" });
  return {
    settings,
    trades: journals.trades.map(withImagesAndStatus),
    backtestTrades: journals.backtestTrades.map(withImagesAndStatus),
  };
}

export async function saveCloudSettings(userId, { profile, balance, plan }, signal) {
  let query = supabase.from("user_settings").upsert({
    user_id: userId,
    profile,
    balance,
    plan,
    updated_at: new Date().toISOString(),
  });
  if (signal) query = query.abortSignal(signal);
  const { error } = await query;
  if (error) throw error;
}

export async function saveCloudTrades(userId, trades, journal = "live") {
  if (journal !== "live" && journal !== "backtest") throw new Error("Unknown trade journal");
  if (!trades.every((trade) => tradeBelongsToJournal(trade, journal))) {
    throw new Error(`A ${journal} save included a trade from another journal`);
  }
  const inJournal = (query) => journal === "backtest" ? query.lt("id", 0) : query.gte("id", 0);
  const rows = trades.map((trade) => tradeRow(userId, trade, journal));
  const { data: existing, error: readError } = await inJournal(supabase
    .from("trades")
    .select("id")
    .eq("user_id", userId));
  if (readError) throw readError;
  const currentIds = new Set(rows.map((row) => row.id));
  const removedIds = (existing || []).map((row) => Number(row.id)).filter((id) => !currentIds.has(id));
  if (removedIds.length) {
    const { error } = await inJournal(supabase.from("trades").delete().eq("user_id", userId)).in("id", removedIds);
    if (error) throw error;
  }
  if (rows.length) {
    const { error } = await supabase.from("trades").upsert(rows);
    if (error) throw error;
  }
}

function tradeRow(userId, trade, journal) {
  return {
    id: Number(trade.id),
    user_id: userId,
    trade_date: trade.date,
    market: trade.market,
    side: trade.side,
    entry: trade.entry === "" ? null : Number(trade.entry),
    exit: trade.exit === "" ? null : Number(trade.exit),
    pnl: Number(trade.pnl || 0),
    risk: trade.risk === "" ? null : Number(trade.risk),
    setup: trade.setup || "",
    emotion: trade.emotion || "",
    notes: trade.notes || "",
    image: encodeBacktestImages(trade),
    updated_at: new Date().toISOString(),
  };
}

// Import adds only the new backtest rows. It never removes existing cloud rows
// and never touches the live journal.
export async function addCloudBacktestTrades(userId, trades, signal) {
  if (!trades.every((trade) => tradeBelongsToJournal(trade, "backtest"))) {
    throw new Error("Backtest import included a live trade");
  }
  if (!trades.length) return;
  let query = supabase.from("trades").upsert(trades.map((trade) => tradeRow(userId, trade, "backtest")));
  if (signal) query = query.abortSignal(signal);
  const { error } = await query;
  if (error) throw error;
}
