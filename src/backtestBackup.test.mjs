import assert from "node:assert/strict";
import test from "node:test";
import { createBacktestBackup, mergeBacktestBackup, parseBacktestBackup } from "./backtestBackup.mjs";

const trade = {
  id: -12, date: "2026-09-25", market: "XAU/USD", side: "Long", entry: 100,
  exit: 110, pnl: 10, risk: 1, setup: "breakout", notes: "test", emotion: "calm",
  images: ["4H", "1H", "15M", "5M"].map((timeframe) => ({
    id: timeframe, timeframe, src: `data:image/jpeg;base64,${timeframe}`,
  })),
};

test("full backup round-trips every timeframe image and simulated balance", () => {
  const backup = createBacktestBackup([trade], 10000, "2026-10-02T00:00:00.000Z");
  const restored = parseBacktestBackup(JSON.stringify(backup));
  assert.deepEqual(restored.trades[0].images, trade.images);
  assert.equal(restored.balance, 10000);
  assert.equal(backup.type, "ett-backtest");
});

test("previous backup format and legacy single image still restore", () => {
  const old = { type: "backtest", balance: 5000, trades: [{ ...trade, images: undefined, image: "data:image/png;base64,old" }] };
  const restored = parseBacktestBackup(JSON.stringify(old));
  assert.equal(restored.trades[0].images[0].src, "data:image/png;base64,old");
});

test("reimport skips duplicates and remaps conflicting ids without changing existing", () => {
  const other = { ...trade, setup: "different" };
  const first = mergeBacktestBackup([trade], [trade, other], 100);
  assert.equal(first.added.length, 1);
  assert.equal(first.added[0].id, -100);
  assert.equal(first.trades[0], trade);
  const second = mergeBacktestBackup(first.trades, [trade, other], 100);
  assert.equal(second.added.length, 0);
  assert.equal(second.skipped, 2);
});

test("cloud numeric normalization does not turn the same trade into a duplicate", () => {
  const cloudTrade = { ...trade, entry: 100, exit: 110, risk: 1 };
  const backupTrade = { ...trade, entry: "100", exit: "110", risk: "1" };
  assert.equal(mergeBacktestBackup([cloudTrade], [backupTrade]).skipped, 1);
});

test("rejects a live backup and invalid images", () => {
  assert.throws(() => parseBacktestBackup(JSON.stringify({ type: "live", balance: 1, trades: [] })));
  assert.throws(() => parseBacktestBackup(JSON.stringify({ type: "backtest", balance: 1, trades: [{ ...trade, images: [{ src: "javascript:alert(1)" }] }] })));
});

test("a no-entry opportunity retains its reason and photos but cannot add PNL", () => {
  const opportunity = { ...trade, status: "no-entry", noEntryReason: "No BOS", pnl: 999 };
  const restored = parseBacktestBackup(JSON.stringify(createBacktestBackup([opportunity], 2500))).trades[0];
  assert.equal(restored.status, "no-entry");
  assert.equal(restored.noEntryReason, "No BOS");
  assert.equal(restored.pnl, 0);
  assert.deepEqual(restored.images, trade.images);
});
