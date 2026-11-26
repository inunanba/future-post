import { readFile } from "node:fs/promises";
import { createPublicClient, http, defineChain, parseAbi, encodeFunctionData, decodeErrorResult, keccak256 } from "viem";

// Read-only: checks the deployed FuturePostReleaseV2 on Diana. Uses eth_call and getCode only.
// Sends no transaction, registers no letter and needs no keys.
const V2 = "0x475b2c0BCaE1f1Fd029A514224A86d600Fe97287";
const PROVEN_SENDER = "0x768310cBCD782BDa4fd3cf5Bbb96b6E291E3F103";
const UNREGISTERED = "0x000000000000000000000000000000000000dEaD";
const PQC = "0x0000000000000000000000000000000000000a02";
const diana = defineChain({ id: 9800, name: "QoreChain Diana testnet", nativeCurrency: { name: "QOR", symbol: "QOR", decimals: 18 }, rpcUrls: { default: { http: ["https://evm-testnet.qore.host"] } } });
const pc = createPublicClient({ chain: diana, transport: http() });
const art = JSON.parse(await readFile(new URL("../artifacts/FuturePostReleaseV2.json", import.meta.url), "utf8"));
const pqcAbi = parseAbi(["function pqcKeyStatus(address account) view returns (bool registered, uint8 algorithmId, bytes pubkey, bool possessionProven)"]);

async function call(from, data) {
  try { return { ok: true, data: await pc.request({ method: "eth_call", params: [{ from, to: V2, data }, "latest"] }) }; }
  catch (e) {
    const raw = [e?.cause?.data, e?.data, e?.details].find((x) => typeof x === "string" && /^0x[0-9a-fA-F]{8}/.test(x)) ?? String(e?.details ?? "").match(/0x[0-9a-fA-F]{8,}/)?.[0];
    let err = null; try { const d = decodeErrorResult({ abi: art.abi, data: raw }); err = { name: d.errorName, args: d.args ?? [] }; } catch {}
    return { ok: false, revert: err, raw: raw ?? null };
  }
}
try {
  if ((await pc.getChainId()) !== 9800) throw Error("not Diana");
  const code = await pc.getCode({ address: V2 });
  const status = await pc.readContract({ address: PQC, abi: pqcAbi, functionName: "pqcKeyStatus", args: [PROVEN_SENDER] });
  const block = await pc.getBlock();
  const share = "0x" + "44".repeat(32);
  const data = encodeFunctionData({ abi: art.abi, functionName: "registerLetter", args: ["0x" + "f0".repeat(32), "0x" + "22".repeat(32), block.timestamp + 3600n, "0x" + "33".repeat(32), keccak256(share)] });
  const proven = await call(PROVEN_SENDER, data);
  const unregistered = await call(UNREGISTERED, data);
  const out = {
    checkedAtBlock: block.number.toString(),
    contract: V2,
    runtimeBytes: code ? (code.length - 2) / 2 : 0,
    runtimeMatchesArtifact: code === art.deployedRuntimeBytecode,
    runtimeContainsPrecompileLiteral: !!code && code.toLowerCase().includes(PQC.slice(2)),
    PQC_KEY_STATUS: await pc.readContract({ address: V2, abi: art.abi, functionName: "PQC_KEY_STATUS" }),
    pqcKeyStatusOfSender: { account: PROVEN_SENDER, registered: status[0], algorithmId: status[1], pubkeyBytes: (status[2].length - 2) / 2, possessionProven: status[3] },
    registerLetterSimulation: {
      provenSender: { from: PROVEN_SENDER, passes: proven.ok },
      unregisteredSender: { from: UNREGISTERED, passes: unregistered.ok, revert: unregistered.revert },
    },
  };
  console.log(JSON.stringify(out, null, 2));
  const good = out.runtimeMatchesArtifact && out.runtimeContainsPrecompileLiteral && status[0] && status[1] === 1 && status[3] && proven.ok && !unregistered.ok && unregistered.revert?.name === "SenderKeyNotProven";
  if (!good) process.exitCode = 1;
} catch (e) { console.error("NOT_VERIFIED:", e.message); process.exitCode = 1; }
