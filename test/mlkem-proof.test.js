import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import test from "node:test";
import { runLocalMlkemProof } from "../src/mlkem-proof.js";

if (!globalThis.crypto) globalThis.crypto = webcrypto;

test("official QoreSeal ML-KEM proof opens only for the intended recipient", async () => {
  const proof = await runLocalMlkemProof();
  assert.equal(proof.algorithm, "ML-KEM-1024");
  assert.equal(proof.matchingRecipientOpen, true);
  assert.equal(proof.outsiderOpen, false);
  assert.equal(proof.evidenceBoundary, "LOCAL_FUNCTIONAL_PROOF_NOT_CHAIN_REGISTRATION");
  assert.match(proof.envelopeSha256, /^[0-9a-f]{64}$/);
});
