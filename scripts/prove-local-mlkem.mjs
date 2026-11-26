import { webcrypto } from "node:crypto";
import { runLocalMlkemProof } from "../src/mlkem-proof.js";

if (!globalThis.crypto) globalThis.crypto = webcrypto;
process.stdout.write(`${JSON.stringify(await runLocalMlkemProof(), null, 2)}\n`);
