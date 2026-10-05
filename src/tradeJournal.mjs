// Existing live trades use non-negative IDs. Backtest trades use negative IDs,
// giving each journal an independent slice of the existing Supabase table.
export function tradeBelongsToJournal(trade, journal) {
  const id = Number(trade.id);
  return Number.isSafeInteger(id) && (journal === "backtest" ? id < 0 : id >= 0);
}

export function partitionJournalTrades(trades) {
  return {
    trades: trades.filter((trade) => tradeBelongsToJournal(trade, "live")),
    backtestTrades: trades.filter((trade) => tradeBelongsToJournal(trade, "backtest")),
  };
}

export function nextBacktestTradeId(trades, now = Date.now()) {
  const used = new Set(trades.map((trade) => Number(trade.id)));
  let id = -Math.abs(Math.trunc(now));
  while (used.has(id)) id -= 1;
  return id;
}

export function nextLiveTradeId(trades, now = Date.now()) {
  const used = new Set(trades.map((trade) => Number(trade.id)));
  let id = Math.max(1, Math.abs(Math.trunc(now)));
  while (used.has(id)) id += 1;
  return id;
}
