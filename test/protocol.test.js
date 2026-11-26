import test from "node:test";
import assert from "node:assert/strict";
import {
  CHAIN_ID, envelopeContext, formatRemaining, lockState, requireReady, validateRecipient
} from "../src/protocol.js";

const recipient = "qor1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

test("refuses an early opening request", () => {
  const unlock = Date.parse("2026-12-01T00:00:00Z");
  const now = unlock - 1;
  assert.deepEqual(lockState(unlock, now), {
    code: "LOCKED", remainingMs: 1, canRequestOpen: false
  });
  assert.throws(() => requireReady(unlock, now), error => error.code === "TOO_EARLY");
});

test("allows an opening request at the boundary", () => {
  const unlock = Date.parse("2026-12-01T00:00:00Z");
  assert.equal(requireReady(unlock, unlock).code, "READY");
});

test("binds chain, letter, date, and registered recipient context", () => {
  const context = envelopeContext({
    id: "letter_123456",
    unlockAt: "2026-12-01T00:00:00Z",
    recipient
  });
  assert.equal(context.chainId, CHAIN_ID);
  assert.equal(context.purpose, "future-post:v1:letter_123456");
  assert.deepEqual(JSON.parse(context.associatedData), {
    version: 1,
    id: "letter_123456",
    unlockAt: "2026-12-01T00:00:00.000Z",
    recipient
  });
});

test("rejects a non-QoreChain recipient", () => {
  assert.throws(() => validateRecipient("0x1234"), /qorechain-diana/);
});

test("formats the countdown without negative values", () => {
  assert.equal(formatRemaining(65_000), "1m 5s");
  assert.equal(formatRemaining(-1), "0m 0s");
});
