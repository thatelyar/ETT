export const isNoEntry = (trade) => trade?.status === "no-entry";

export const executedTrades = (trades) => trades.filter((trade) => !isNoEntry(trade));
