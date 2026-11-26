# Security design checkpoint

Status: **B protocol selected on 2026-11-23.** Implemented locally, with live Diana evidence for the fingerprint commitment, the `FuturePostRelease` deployment, an EVM window, and an ML-KEM-1024 key in the on-chain registry. A letter register/release on the deployed contract is a separate step.

## What QoreSeal proves

QoreSeal 0.1.0 can seal a payload to a registered QoreChain account with ML-KEM-1024. The TypeScript network helpers resolve the recipient from the Diana KEM registry, and the envelope can bind the chain, purpose, and associated data. The recipient who owns the matching key can open that envelope at any time.

Official sources:

- https://docs.qorechain.io/developer-tools/qoreseal/
- https://docs.qorechain.io/build-before-qday/workshop-3/
- https://github.com/qorechain/qoreseal

QoreSeal protects the payload. It does not provide a clock or delay decryption.

## Why a local-only date check is insufficient

A browser can refuse to call `open()` before `unlockAt`, and a contract can reject an early “open” transaction. Neither stops the key owner from copying the QoreSeal envelope into another client and calling `open()` directly.

For “future self,” sender and recipient are commonly the same person. If that person retains every key share, ciphertext, and secret locally, they can reconstruct the content before the date. A public smart contract cannot hide a secret share.

Therefore the following claim would be false for a client-only implementation:

> Not even the recipient can read the letter before opening day.

The current prototype tests the product state boundary. It is not cryptographic evidence of time release.

## Candidate protocols

| Design | Early-open property | Conflict / limitation |
|---|---|---|
| QoreSeal directly to recipient + timestamp check | None against the recipient | Recipient already has the decapsulation key |
| Split content key; recipient gets A; sender reveals B after the date | Recipient cannot open until B is released | For a letter to oneself, the same person controls B; requires a later manual reveal |
| Split content key; service/keyper holds B | Stronger if holder behaves | Violates the approved “no server/operator key share” boundary |
| Threshold keypers | Stronger under threshold assumptions | Adds external trust, operations, and a new protocol |
| Time-lock/VDF encryption | Potentially no custodian | No approved QoreChain kit identified; substantial cryptographic review needed |
| Secure hardware scheduled release | Depends on hardware/OS | Not portable and introduces a new trusted party |

## Safe first-version boundary

Proceed with these parts under the selected B protocol:

1. Reader-facing letter, calendar, countdown, and locked/ready states.
2. QoreSeal envelope context bound to `qorechain-diana`, letter id, recipient, and opening date.
3. Registry lookup and recipient-key validation.
4. Correct-recipient and outsider-open tests using QoreSeal.
5. ML-DSA/QoreX signing boundary for seal/open receipts.
6. Contract schema and early-call rejection as an audit trail, described as policy enforcement rather than cryptographic time.
7. No testnet-success claim until a registered owner key and transaction evidence exist.

## Decision and claim boundary

GrokBot/Sena selected **B — sender release**:

- A random AES-256 content key is split as `K = A XOR B`.
- A is sealed to the registered recipient with QoreSeal.
- B remains only on the sender device until `unlockAt`.
- The sender releases B in an ML-DSA-bound Diana transaction after `unlockAt`; the contract rejects an earlier release.
- Anyone may see B after release, but only the registered recipient can recover A.

The principal demo uses two accounts so the recipient does not control B. “Future self” remains a personal commitment and is not described as an adversarial self-lock. The contract is a policy and audit boundary, not a source of cryptographic time. VDF research and service-held/keyper shares are out of scope.
