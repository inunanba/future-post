# Post-quantum design notes

Where Future Post uses QoreChain's post-quantum features, what each use protects, and which tests cover it.

## `pqcKeyStatus` (precompile `0x0000000000000000000000000000000000000a02`)

| Where | What it protects | Tests |
|---|---|---|
| `FuturePostReleaseV2.registerLetter` calls `_requireProvenMldsa87(msg.sender)` | A letter can be registered only by a sender whose account has a registered ML-DSA-87 key (`algorithmId == 1`) with proof of possession (`possessionProven`). A classical key alone cannot register a letter. | `test/contract-v2.test.js`: unregistered, registered-not-proven, wrong algorithm, proven sender; live read-only checks in `npm run verify:diana-v2` |
| Fail-closed handling | A reverting, empty, short or malformed precompile answer stops registration with `PrecompileInactiveOrMalformed()`. | `test/contract-v2.test.js`: no code at the address, mock revert, empty, short and non-boolean answers |
| No key check in `releaseShareB` | A letter that was valid when registered can always be released by its sender on time, even after a key rotation or a precompile outage. | `test/contract-v2.test.js`: release after the key and the precompile code are removed; source test that the check has a single call site |
| Fixed address | The precompile address is fixed in source (no constructor argument, no setter) and appears as a 20-byte literal in the deployed runtime. | `test/contract-v2.test.js`; runtime comparison on Diana in `npm run verify:diana-v2` |

The call is a read-only `staticcall` with no value. Tests run the unchanged production artifact on a local EVM with test code placed at `0x…0a02` (`test/fixtures/MockPqcKeyStatus.sol`, never deployed anywhere).

## ML-KEM-1024 (QoreSeal)

Share A of each letter is sealed to the recipient's ML-KEM-1024 key with `@qorechain/qoreseal@0.1.0`. Chain id, letter id, opening time and recipient are authenticated as associated data. Tests: `test/qoreseal.test.js`, `test/mlkem-proof.test.js`; live: the registry key and round trip in `evidence/kem-registry-roundtrip.json`, and the live letter's open after release in `evidence/diana-live-letter.json`. ML-DSA key status (above) and ML-KEM registration are separate pieces of evidence.

## What V2 does not check

The recipient binding is an opaque hash; V2 checks the sender's key only, and does not call `pqcVerify`.
