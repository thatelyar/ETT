import { createClient } from "@supabase/supabase-js";

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
  return {
    settings,
    trades: (trades || []).map((trade) => ({
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
    })),
  };
}

export async function saveCloudSettings(userId, { profile, balance, plan }) {
  const { error } = await supabase.from("user_settings").upsert({
    user_id: userId,
    profile,
    balance,
    plan,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function saveCloudTrades(userId, trades) {
  const rows = trades.map((trade) => ({
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
    image: trade.image || "",
    updated_at: new Date().toISOString(),
  }));
  const { data: existing, error: readError } = await supabase
    .from("trades")
    .select("id")
    .eq("user_id", userId);
  if (readError) throw readError;
  const currentIds = new Set(rows.map((row) => row.id));
  const removedIds = (existing || []).map((row) => row.id).filter((id) => !currentIds.has(id));
  if (removedIds.length) {
    const { error } = await supabase.from("trades").delete().eq("user_id", userId).in("id", removedIds);
    if (error) throw error;
  }
  if (rows.length) {
    const { error } = await supabase.from("trades").upsert(rows);
    if (error) throw error;
  }
}
