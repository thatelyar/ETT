import assert from "node:assert/strict";
import test from "node:test";
import {
  nextBacktestTradeId,
  nextLiveTradeId,
  partitionJournalTrades,
  tradeBelongsToJournal,
} from "./tradeJournal.mjs";

test("live and backtest trades remain in separate journals", () => {
  const live = { id: 1720000000000, market: "XAU/USD" };
  const backtest = { id: -1720000000000, market: "EUR/USD" };
  const partition = partitionJournalTrades([live, backtest]);

  assert.deepEqual(partition.trades, [live]);
  assert.deepEqual(partition.backtestTrades, [backtest]);
  assert.equal(tradeBelongsToJournal(live, "backtest"), false);
  assert.equal(tradeBelongsToJournal(backtest, "live"), false);
});

test("new backtest IDs never collide with an existing trade", () => {
  const id = nextBacktestTradeId([{ id: -1720000000000 }], 1720000000000);
  assert.equal(id, -1720000000001);
  assert.equal(tradeBelongsToJournal({ id }, "backtest"), true);
});

test("new live IDs remain positive and never collide", () => {
  assert.equal(nextLiveTradeId([{ id: 100 }], 100), 101);
});
