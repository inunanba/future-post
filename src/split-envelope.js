import { requireReady } from "./protocol.js";

const KEY_BYTES = 32;
const IV_BYTES = 12;

function cryptoApi() {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error("Web Crypto API is required");
  }
  return globalThis.crypto;
}

function assertBytes(value, length, label) {
  if (!(value instanceof Uint8Array) || value.length !== length) {
    throw new TypeError(`${label} must be ${length} bytes`);
  }
}

export function randomBytes(length) {
  return cryptoApi().getRandomValues(new Uint8Array(length));
}

export function xorBytes(left, right) {
  if (!(left instanceof Uint8Array) || !(right instanceof Uint8Array) || left.length !== right.length) {
    throw new TypeError("shares must be byte arrays of equal length");
  }
  return left.map((value, index) => value ^ right[index]);
}

export function splitContentKey(contentKey, shareA = randomBytes(KEY_BYTES)) {
  assertBytes(contentKey, KEY_BYTES, "content key");
  assertBytes(shareA, KEY_BYTES, "share A");
  return { shareA, shareB: xorBytes(contentKey, shareA) };
}

export function combineShares(shareA, shareB) {
  assertBytes(shareA, KEY_BYTES, "share A");
  assertBytes(shareB, KEY_BYTES, "share B");
  return xorBytes(shareA, shareB);
}

export async function encryptLetter({ plaintext, associatedData = "" }) {
  const api = cryptoApi();
  const contentKey = randomBytes(KEY_BYTES);
  const { shareA, shareB } = splitContentKey(contentKey);
  const iv = randomBytes(IV_BYTES);
  const key = await api.subtle.importKey("raw", contentKey, "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(await api.subtle.encrypt({
    name: "AES-GCM",
    iv,
    additionalData: new TextEncoder().encode(associatedData),
    tagLength: 128
  }, key, new TextEncoder().encode(plaintext)));
  contentKey.fill(0);
  return { version: 1, algorithm: "AES-256-GCM", iv, ciphertext, shareA, shareB };
}

export async function decryptLetter({ ciphertext, iv, shareA, shareB, associatedData = "" }) {
  assertBytes(iv, IV_BYTES, "iv");
  const api = cryptoApi();
  const contentKey = combineShares(shareA, shareB);
  try {
    const key = await api.subtle.importKey("raw", contentKey, "AES-GCM", false, ["decrypt"]);
    const plaintext = await api.subtle.decrypt({
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode(associatedData),
      tagLength: 128
    }, key, ciphertext);
    return new TextDecoder().decode(plaintext);
  } finally {
    contentKey.fill(0);
  }
}

export function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

export function buildReleaseRecord({ letterId, unlockAt, shareB, now = Date.now() }) {
  requireReady(unlockAt, now);
  assertBytes(shareB, KEY_BYTES, "share B");
  return {
    version: 1,
    letterId: String(letterId),
    unlockAt: new Date(unlockAt).toISOString(),
    releasedAt: new Date(now).toISOString(),
    shareB: toBase64Url(shareB),
    warning: "Public by design; useless without the recipient-only QoreSeal share A"
  };
}
