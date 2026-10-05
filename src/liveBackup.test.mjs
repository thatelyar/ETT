import assert from "node:assert/strict";
import test from "node:test";
import { createLiveBackup, mergeLiveBackup, parseLiveBackup, reconcileLiveTrades } from "./liveBackup.mjs";

const trade = {
  id: 100, date: "2026-10-04", market: "GBP/USD", side: "Long",
  entry: "1.3400", exit: "1.3450", pnl: 50, risk: 20,
  setup: "London sweep", emotion: "calm", notes: "followed plan",
  images: ["4H", "1H", "15M", "5M"].map((timeframe) => ({
    id: timeframe, timeframe, src: `data:image/jpeg;base64,${timeframe}`,
  })),
};

test("live backup round-trips capital, all position photos and no-entry reason", () => {
  const opportunity = { ...trade, id: 101, status: "no-entry", noEntryReason: "No BOS", pnl: 999 };
  const backup = createLiveBackup([trade, opportunity], 8000, "2026-10-05T00:00:00.000Z");
  const restored = parseLiveBackup(JSON.stringify(backup));
  assert.equal(backup.type, "ett-live");
  assert.equal(restored.balance, 8000);
  assert.deepEqual(restored.trades[0].images, trade.images);
  assert.equal(restored.trades[1].pnl, 0);
  assert.equal(restored.trades[1].noEntryReason, "No BOS");
});

test("old settings backup can restore live rows without importing backtest rows", () => {
  const source = { profile: { name: "Test" }, balance: 10, trades: [trade], backtestTrades: [{ ...trade, id: -100 }] };
  const parsed = parseLiveBackup(JSON.stringify(source));
  assert.equal(parsed.trades.length, 1);
  assert.equal(parsed.trades[0].id, 100);
});

test("rejects backtest files, negative IDs and unsafe images", () => {
  assert.throws(() => parseLiveBackup(JSON.stringify({ type: "ett-backtest", version: 2, balance: 1, trades: [trade] })));
  assert.throws(() => parseLiveBackup(JSON.stringify({ ...createLiveBackup([trade], 1), trades: [{ ...trade, id: -100 }] })));
  assert.throws(() => parseLiveBackup(JSON.stringify({ ...createLiveBackup([trade], 1), trades: [{ ...trade, id: null }] })));
  assert.throws(() => parseLiveBackup(JSON.stringify({ ...createLiveBackup([trade], 1), trades: [{ ...trade, images: [{ src: "javascript:alert(1)" }] }] })));
});

test("reimport skips duplicates and remaps IDs without changing original records", () => {
  const altered = { ...trade, notes: "different" };
  const merged = mergeLiveBackup([trade], [trade, altered], 100);
  assert.equal(merged.skipped, 1);
  assert.equal(merged.added.length, 1);
  assert.equal(merged.added[0].id, 101);
  assert.equal(merged.trades[0], trade);
  assert.equal(mergeLiveBackup(merged.trades, [trade, altered], 100).added.length, 0);
});

test("cloud reconciliation retains new remote records and rejects conflicting edits", () => {
  const remote = { ...trade, id: 102 };
  assert.deepEqual(reconcileLiveTrades([trade], [trade, remote]), [trade, remote]);
  assert.throws(() => reconcileLiveTrades([{ ...trade, pnl: 70 }], [trade]));
});
