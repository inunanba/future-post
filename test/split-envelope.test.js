import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReleaseRecord, combineShares, decryptLetter, encryptLetter, splitContentKey, xorBytes
} from "../src/split-envelope.js";

const unlockAt = "2026-12-01T00:00:00.000Z";

test("splits and recombines a 256-bit content key", () => {
  const key = Uint8Array.from({ length: 32 }, (_, i) => i);
  const shareA = Uint8Array.from({ length: 32 }, (_, i) => 255 - i);
  const shares = splitContentKey(key, shareA);
  assert.deepEqual(combineShares(shares.shareA, shares.shareB), key);
});

test("XOR needs both equal-length shares", () => {
  assert.throws(() => xorBytes(new Uint8Array(32), new Uint8Array(31)), /equal length/);
});

test("encrypts and decrypts only with matching A and B", async () => {
  const associatedData = JSON.stringify({ letterId: "letter_123456", unlockAt });
  const sealed = await encryptLetter({ plaintext: "Dear tomorrow", associatedData });
  const opened = await decryptLetter({ ...sealed, associatedData });
  assert.equal(opened, "Dear tomorrow");

  const wrongB = sealed.shareB.slice();
  wrongB[0] ^= 1;
  await assert.rejects(
    () => decryptLetter({ ...sealed, shareB: wrongB, associatedData }),
    /operation|decrypt|cipher|data/i
  );
});

test("authenticated context cannot be changed", async () => {
  const sealed = await encryptLetter({ plaintext: "Bound to its date", associatedData: unlockAt });
  await assert.rejects(
    () => decryptLetter({ ...sealed, associatedData: "2027-01-01T00:00:00.000Z" }),
    /operation|decrypt|cipher|data/i
  );
});

test("refuses to build a public B release before unlock", () => {
  const shareB = new Uint8Array(32);
  assert.throws(
    () => buildReleaseRecord({
      letterId: "letter_123456", unlockAt, shareB, now: Date.parse(unlockAt) - 1
    }),
    error => error.code === "TOO_EARLY"
  );
});

test("builds a public B release at unlock without plaintext or share A", () => {
  const shareB = Uint8Array.from({ length: 32 }, (_, i) => i);
  const record = buildReleaseRecord({
    letterId: "letter_123456", unlockAt, shareB, now: Date.parse(unlockAt)
  });
  assert.equal(record.letterId, "letter_123456");
  assert.equal(record.releasedAt, unlockAt);
  assert.equal("shareA" in record, false);
  assert.equal("plaintext" in record, false);
  assert.match(record.shareB, /^[A-Za-z0-9_-]+$/);
});
