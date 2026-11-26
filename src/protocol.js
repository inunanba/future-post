export const CHAIN_ID = "qorechain-diana";
export const PURPOSE_PREFIX = "future-post:v1";

export function normalizeUnlockAt(value) {
  const ms = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(ms)) throw new TypeError("Opening date is invalid");
  return ms;
}

export function lockState(unlockAt, now = Date.now()) {
  const unlockMs = normalizeUnlockAt(unlockAt);
  const nowMs = normalizeUnlockAt(now);
  return nowMs < unlockMs
    ? { code: "LOCKED", remainingMs: unlockMs - nowMs, canRequestOpen: false }
    : { code: "READY", remainingMs: 0, canRequestOpen: true };
}

export function requireReady(unlockAt, now = Date.now()) {
  const state = lockState(unlockAt, now);
  if (!state.canRequestOpen) {
    const error = new Error("This letter is still sealed");
    error.code = "TOO_EARLY";
    error.remainingMs = state.remainingMs;
    throw error;
  }
  return state;
}

export function validateRecipient(address) {
  const value = String(address || "").trim();
  if (!/^qor1[0-9a-z]{20,80}$/.test(value)) {
    throw new TypeError("Enter a qorechain-diana recipient address");
  }
  return value;
}

export function envelopeContext({ id, unlockAt, recipient }) {
  const safeId = String(id || "").trim();
  if (!/^[a-zA-Z0-9_-]{6,80}$/.test(safeId)) throw new TypeError("Letter id is invalid");
  const unlockMs = normalizeUnlockAt(unlockAt);
  return {
    chainId: CHAIN_ID,
    purpose: `${PURPOSE_PREFIX}:${safeId}`,
    associatedData: JSON.stringify({
      version: 1,
      id: safeId,
      unlockAt: new Date(unlockMs).toISOString(),
      recipient: validateRecipient(recipient)
    })
  };
}

export function formatRemaining(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return days ? `${days}d ${hours}h` : hours ? `${hours}h ${minutes}m` : `${minutes}m ${rest}s`;
}
