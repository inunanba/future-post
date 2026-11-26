# Build Before Q-Day submission draft

Status: text prepared for the contest form, aligned with the public README as of 2026-11-26.

## Project name

Future Post / 未来の自分へのポスト

## Category

Quantum Pass

## Short description

Send a private letter to an intended QoreChain recipient for a chosen opening day. The letter is encrypted in the browser, its key is split, and only the recipient’s QoreSeal share plus the sender’s post-date release can open it.

## Description

Some words belong to a particular day: a birthday, a promise, or a note for someone beginning a new chapter.

Future Post turns that moment into a simple postal experience. The sender writes a letter, chooses an intended QoreChain recipient and an opening time, and seals it locally. The recipient sees a waiting letter, but opening needs two pieces: share A, encrypted to their reviewed recipient key with QoreSeal, and share B, kept by the sender until the opening time.

After the date, the sender releases B in a Diana transaction (the EVM lane is opened with a hybrid-signed window). The release contract rejects an earlier call and records the timing for audit. B is intentionally public after release; an observer still cannot read the letter because only the intended recipient can recover A.

The main demo uses separate sender and recipient accounts. A letter to your future self is offered as a personal commitment, not as a claim that a technically capable person who controls both local shares cannot open it early.

## How it is made

The browser creates a random AES-256 content key and encrypts the letter with AES-GCM. It creates random share A and computes share B as `contentKey XOR A`.

Share A is sealed with official `@qorechain/qoreseal@0.1.0`. The current evidence is a real local ML-KEM-1024 seal/open with matching-recipient success and outsider refusal. A QoreX-originated website attempt to register a KEM key was refused by the wallet (one attempt, no retry). Separately, a single-purpose testnet account later published an ML-KEM-1024 key with the official CLI (`MsgRegisterKEMKey`, tx `25C75479…FB10A`, height 10780940), and a local seal-to-address and open round trip against that on-chain key passed. A QoreX hybrid-signed self-transfer also committed a reviewed public-key fingerprint (tx `A6633E0F…0A0E27`, height 10719012). Chain id, letter id, recipient, and opening time are authenticated as envelope context.

`FuturePostRelease.sol` records the sender, recipient binding, opening time, ciphertext hash, and B commitment. Only the sender may release a matching 32-byte B after the opening time. The dApp never reads a mnemonic, seed, or private key; transactions are signed by the wallet or the official CLI.

Decryption stays client-side. The recipient opens A with QoreSeal, obtains public B from the release event, reconstructs the AES key, and decrypts the authenticated ciphertext.

## Honest differentiation

- **Qapsule** also combines a future date and split content key. Future Post focuses on a reader-first letter, mailbox, and calendar experience, and documents the sender-release trust boundary explicitly.
- **Tabella** includes inactivity/inheritance delivery and a Postman service that holds a share. Future Post has no dead-man feature and no service-held decryption share.
- **Last Light** focuses on inheritance and seed recovery. Future Post does not.
- **Harvest-Proof Time Capsule** uses a plaintext/hash reveal. Future Post encrypts a share to an intended recipient key; the hash is only an integrity commitment.

The idea of a time-locked letter is not claimed as new.

## Evidence fields

- Public repository: https://github.com/inunanba/future-post
- Public demo: https://inunanba.github.io/future-post/
- Featured image PNG/WebP: INCLUDED — 1200×675 source, PNG and WebP
- Diana contract address: `0x0E5e1b9d41bFCe8a19f5dA4E55Dd6459F69E2b50` (`FuturePostRelease`, tx `0x97090531c63c695af28ff1791e0cdc01800ef11439238f56aa32efb7a293281d`, block 10780460)
- Diana contract address (V2, sender must hold a proven ML-DSA-87 key via `pqcKeyStatus` `0x…0a02`): `0x475b2c0BCaE1f1Fd029A514224A86d600Fe97287` (`FuturePostReleaseV2`, tx `0x4d3eac621bbd4efecd52c9c9b1e78c5eaeecdd0a7c932cf5b9e7028aaa7c1c2e`, block 10782517)
- Sender address: `qor1rgsq0sgpww6yevnmedlqe797tc4v57u4as0w52` (Diana testnet)
- Reviewed fingerprint address: `qor1rgsq0sgpww6yevnmedlqe797tc4v57u4as0w52` (self-commitment only; not KEM registration)
- KEM registry lookup: PASS for the single-purpose testnet account `qor1w6p3pj7d0q4a5n7neadmh94ku2g78ugrr2laxq` (tx `25C7547930CB389AFA7742EFAF53D232B65DBFA38EE6B0D9CC64F82DC49FB10A`, height 10780940). The browser proof screen still uses fresh in-browser keys and does not read the registry.
- Public-key fingerprint anchor: PASS — code 0, height 10719012, tx `A6633E0F8D41F77FA8414EF62C2EE3CF1943686781E60EDC36D0FF6FC90A0E27`; exact 1 uqor self-transfer memo read back
- Early release rejection: local in-memory EVM tests PASS; on Diana a read-only simulation of an early release was refused before the opening time
- Accepted B release on Diana: a demo letter was registered (block 10782943) and released after its opening time (block 10783071) on FuturePostReleaseV2; recipient opened it afterwards (single-account demo, see README "Live letter on Diana")
- Correct-recipient open evidence: local official-QoreSeal ML-KEM proof PASS, including a local seal-to-address and open against the on-chain registered key
- Outsider refusal: local official-QoreSeal proof PASS (`NOT_A_RECIPIENT`), including the on-chain-key round trip
- Exact package: `@qorechain/qoreseal@0.1.0`
- Local tests: 41/41 PASS (`npm run check`); browser bundle build PASS
- Solidity compile: 0.8.30 PASS; deployed runtime on Diana matches `artifacts/FuturePostRelease.json` (1,560 bytes)
- V2 deployed runtime on Diana matches `artifacts/FuturePostReleaseV2.json` (2,271 bytes, contains `0x…0a02`); read-only `npm run verify:diana-v2` PASS (proven deployer passes, key-less address gets `SenderKeyNotProven`)
- Demo video URL: to be added by the owner after upload

## Security limits

QoreSeal protects payload content, not addresses, timing, envelope size, or recipient count. The release contract enforces a policy and creates an audit record; it does not create cryptographic time. Key loss can make a letter unreadable. Review so far is by the team and AI reviewers; no external audit is claimed.

Never include a mnemonic, seed, private key, wallet token, plaintext private letter, or test secret in submission materials.

## Credits

- QoreSeal and QoreChain developer kits: QoreChain Association, Apache-2.0 where applicable.
- Future Post application code and original SVG identity: MIT. Created by inunanba.
- AI-assisted development is documented in `AI_USAGE.md`.
