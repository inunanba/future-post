import { readFile } from "node:fs/promises";
import { createPublicClient, http, defineChain, keccak256, toHex, decodeEventLog } from "viem";

// Read-only: re-reads the live demo letter on FuturePostReleaseV2 (Diana testnet) and checks it against
// the committed public bundle. Uses eth_call / getTransactionReceipt only. Sends nothing, needs no keys.
const V2 = "0x475b2c0BCaE1f1Fd029A514224A86d600Fe97287";
const REGISTER_TX = "0xe7d5a114fe884bb605bd8b89fe5627d00a9e12f35b6a148adae53ceec4fb2469";
const RELEASE_TX = "0x575d7e8a35aa97218ade2c3b0b670203f62fd30c3a44a72571fee8fe9490e09c";
const diana = defineChain({ id: 9800, name: "QoreChain Diana testnet", nativeCurrency: { name: "QOR", symbol: "QOR", decimals: 18 }, rpcUrls: { default: { http: ["https://evm-testnet.qore.host"] } } });
const pc = createPublicClient({ chain: diana, transport: http() });
const art = JSON.parse(await readFile(new URL("../artifacts/FuturePostReleaseV2.json", import.meta.url), "utf8"));
const bundle = JSON.parse(await readFile(new URL("../evidence/live-letter-bundle.json", import.meta.url), "utf8"));
const b64 = (s) => Uint8Array.from(Buffer.from(s.replaceAll("-", "+").replaceAll("_", "/"), "base64"));
function events(receipt) {
  return receipt.logs.filter((l) => l.address.toLowerCase() === V2.toLowerCase()).map((l) => decodeEventLog({ abi: art.abi, data: l.data, topics: l.topics }));
}
try {
  if ((await pc.getChainId()) !== 9800) throw Error("not Diana");
  const reg = await pc.getTransactionReceipt({ hash: REGISTER_TX });
  const rel = await pc.getTransactionReceipt({ hash: RELEASE_TX });
  const regBlock = await pc.getBlock({ blockNumber: reg.blockNumber });
  const relBlock = await pc.getBlock({ blockNumber: rel.blockNumber });
  const registered = events(reg).find((e) => e.eventName === "LetterRegistered").args;
  const released = events(rel).find((e) => e.eventName === "ShareBReleased").args;
  const letter = await pc.readContract({ address: V2, abi: art.abi, functionName: "getLetter", args: [bundle.registration.letterId] });
  const unlockAt = BigInt(Math.floor(Date.parse(bundle.unlockAt) / 1000));
  const checks = {
    registerReceiptSuccess: reg.status === "success",
    releaseReceiptSuccess: rel.status === "success",
    registerBlockBeforeUnlock: regBlock.timestamp < unlockAt,
    releaseBlockAtOrAfterUnlock: relBlock.timestamp >= unlockAt,
    letterIdMatchesBundle: registered.letterId === bundle.registration.letterId && keccak256(toHex(bundle.purpose)) === bundle.registration.letterId,
    recipientBindingMatchesBundle: registered.recipientBinding === bundle.registration.recipientBinding,
    ciphertextHashMatchesBundleCiphertext: letter.ciphertextHash === keccak256(b64(bundle.ciphertext)) && letter.ciphertextHash === bundle.registration.ciphertextHash,
    shareBCommitmentMatchesReleasedShareB: letter.shareBCommitment === keccak256(released.shareB) && letter.shareBCommitment === bundle.registration.shareBCommitment,
    unlockAtMatchesBundle: letter.unlockAt === unlockAt,
    releasedFlag: letter.released === true,
  };
  const out = {
    contract: V2,
    letterId: bundle.registration.letterId,
    sender: letter.sender,
    register: { tx: REGISTER_TX, block: reg.blockNumber.toString(), blockTimeUtc: new Date(Number(regBlock.timestamp) * 1000).toISOString() },
    release: { tx: RELEASE_TX, block: rel.blockNumber.toString(), blockTimeUtc: new Date(Number(relBlock.timestamp) * 1000).toISOString(), shareB: released.shareB },
    unlockAtUtc: bundle.unlockAt,
    checks,
  };
  console.log(JSON.stringify(out, null, 2));
  if (!Object.values(checks).every(Boolean)) process.exitCode = 1;
} catch (e) { console.error("NOT_VERIFIED:", e.message); process.exitCode = 1; }
