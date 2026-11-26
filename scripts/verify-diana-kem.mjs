import { fetchKemKey, sealToAddresses } from "@qorechain/qoreseal/network";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

// Read-only: reads the account's ML-KEM-1024 key from the Diana registry, compares it with the
// recorded evidence and seals a short note to that address. Sends no transaction and needs no keys.
const rest = "https://api-testnet.qore.host";
const evidence = JSON.parse(await readFile(new URL("../evidence/kem-registry-roundtrip.json", import.meta.url), "utf8"));
try {
  const address = evidence.account;
  const status = await fetchKemKey({ rest, address });
  if (!status.registered) throw Error("No KEM key registered for " + address);
  const sha = createHash("sha256").update(status.publicKey).digest("hex");
  const envelope = await sealToAddresses({ rest, chainId: "qorechain-diana", purpose: "future-post-welcome", mode: "mlkem", recipients: [{ address }], plaintext: new TextEncoder().encode("verification note") });
  console.log(JSON.stringify({ address, algorithm: status.algorithmName, registeredHeight: String(status.registeredHeight), keySha256: sha, matchesEvidence: sha === evidence.registration.key_sha256, sealedEnvelopeBytes: envelope.length }, null, 2));
  if (sha !== evidence.registration.key_sha256) process.exitCode = 1;
} catch (e) { console.error("NOT_VERIFIED:", e.message); process.exitCode = 1; }
