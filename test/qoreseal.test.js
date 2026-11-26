import test from "node:test";
import assert from "node:assert/strict";
import { generateSealKeys, open, recipientOf, seal } from "@qorechain/qoreseal";

test("official QoreSeal opens share A only for the matching recipient", () => {
  const recipient = generateSealKeys();
  const outsider = generateSealKeys();
  const shareA = Uint8Array.from({ length: 32 }, (_, i) => i);
  const aad = new TextEncoder().encode(JSON.stringify({
    letterId: "letter_123456",
    unlockAt: "2026-12-01T00:00:00.000Z"
  }));
  const envelope = seal({
    chainId: "qorechain-diana",
    purpose: "future-post:v1:letter_123456",
    recipients: [recipientOf(recipient)],
    plaintext: shareA,
    aad
  });

  const opened = open({
    chainId: "qorechain-diana",
    purpose: "future-post:v1:letter_123456",
    envelope,
    keys: recipient,
    aad
  });
  assert.deepEqual(opened, shareA);

  assert.throws(
    () => open({
      chainId: "qorechain-diana",
      purpose: "future-post:v1:letter_123456",
      envelope,
      keys: outsider,
      aad
    }),
    error => error.code === "NOT_A_RECIPIENT"
  );
});
