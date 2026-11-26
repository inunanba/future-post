import { CHAIN_ID } from "./protocol.js";

export const DIANA_REST = "https://api-testnet.qore.host";

export async function readRecipientKemKey({ address, fetch }) {
  const { fetchKemKey } = await import("@qorechain/qoreseal/network");
  return fetchKemKey({ rest: DIANA_REST, address, ...(fetch ? { fetch } : {}) });
}

export async function sealShareA({
  address,
  purpose,
  shareA,
  associatedData,
  card,
  mode = card ? "hybrid" : "mlkem",
  fetch
}) {
  const [{ sealToAddresses }, { envelopeToText }] = await Promise.all([
    import("@qorechain/qoreseal/network"),
    import("@qorechain/qoreseal")
  ]);
  const envelope = await sealToAddresses({
    rest: DIANA_REST,
    fetch,
    chainId: CHAIN_ID,
    purpose,
    mode,
    recipients: [{ address, ...(card ? { card } : {}) }],
    plaintext: shareA,
    aad: new TextEncoder().encode(associatedData)
  });
  return envelopeToText(envelope);
}

export async function openShareA({
  envelopeText,
  purpose,
  associatedData,
  recipientKeys
}) {
  const { envelopeFromText, open } = await import("@qorechain/qoreseal");
  return open({
    chainId: CHAIN_ID,
    purpose,
    envelope: envelopeFromText(envelopeText),
    keys: recipientKeys,
    aad: new TextEncoder().encode(associatedData)
  });
}

/**
 * Wallet integration boundary.
 *
 * QoreX is responsible for ML-DSA-bound transaction construction/signing.
 * This module intentionally accepts a broadcaster supplied by the wallet
 * adapter and never reads a mnemonic, seed, or private key.
 */
export async function broadcastRelease({ broadcaster, releaseMessage }) {
  if (typeof broadcaster !== "function") {
    throw new TypeError("A QoreX-backed broadcaster is required");
  }
  const result = await broadcaster(releaseMessage);
  if (!result || result.code !== 0) {
    const error = new Error("Release transaction was not accepted");
    error.code = "RELEASE_NOT_ACCEPTED";
    error.result = result;
    throw error;
  }
  return result;
}
