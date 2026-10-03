import assert from "node:assert/strict";
import test from "node:test";
import { executedTrades, isNoEntry } from "./backtestEntries.mjs";

test("no-entry opportunities never count as executed trades", () => {
  const entries = [{ id: 1, pnl: 50 }, { id: 2, status: "no-entry", pnl: 0 }, { id: 3, status: "executed", pnl: -25 }];
  assert.equal(isNoEntry(entries[1]), true);
  assert.deepEqual(executedTrades(entries).map((entry) => entry.id), [1, 3]);
});
