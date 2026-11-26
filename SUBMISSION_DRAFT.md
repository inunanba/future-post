# Build Before Q-Day submission draft

Status: internal draft. Do not publish or paste into the event site until the owner has registered and the live Diana evidence fields are complete.

## Project name

Future Post / 未来の自分へのポスト

## Category

Quantum Pass

## Short description

Send a private letter to an intended QoreChain recipient for a chosen opening day. The letter is encrypted in the browser, its key is split, and only the recipient’s QoreSeal share plus the sender’s post-date release can open it.

## Description

Some words belong to a particular day: a birthday, a promise, or a note for someone beginning a new chapter.

Future Post turns that moment into a simple postal experience. The sender writes a letter, chooses an intended QoreChain recipient and an opening time, and seals it locally. The recipient sees a waiting letter, but opening needs two pieces: share A, encrypted to their reviewed recipient key with QoreSeal, and share B, kept by the sender until the opening time.

After the date, the sender releases B in a QoreX hybrid-signed Diana transaction. The release contract rejects an earlier call and records the timing for audit. B is intentionally public after release; an observer still cannot read the letter because only the intended recipient can recover A.

The main demo uses separate sender and recipient accounts. A letter to your future self is offered as a personal commitment, not as a claim that a technically capable person who controls both local shares cannot open it early.

## How it is made

The browser creates a random AES-256 content key and encrypts the letter with AES-GCM. It creates random share A and computes share B as `contentKey XOR A`.

Share A is sealed with official `@qorechain/qoreseal@0.1.0`. The current evidence is a real local ML-KEM-1024 seal/open with matching-recipient success and outsider refusal. The one reviewed website-originated KEM-registration attempt was rejected before signature because QoreX manages that message itself, so no registry claim is made. A separate normal Diana self-transfer may commit the reviewed public-key fingerprint; that commitment does not prove registration or decryption. Chain id, letter id, recipient, and opening time are authenticated as envelope context.

`FuturePostRelease.sol` records the sender, recipient binding, opening time, ciphertext hash, and B commitment. Only the sender may release a matching 32-byte B after the opening time. QoreX is the transaction boundary: the dApp does not read a mnemonic, seed, or private key.

Decryption stays client-side. The recipient opens A with QoreSeal, obtains public B from the release event, reconstructs the AES key, and decrypts the authenticated ciphertext.

## Honest differentiation

- **Qapsule** also combines a future date and split content key. Future Post focuses on a reader-first letter, mailbox, and calendar experience, and documents the sender-release trust boundary explicitly.
- **Tabella** includes inactivity/inheritance delivery and a Postman service that holds a share. Future Post has no dead-man feature and no service-held decryption share.
- **Last Light** focuses on inheritance and seed recovery. Future Post does not.
- **Harvest-Proof Time Capsule** uses a plaintext/hash reveal. Future Post encrypts a share to an intended recipient key; the hash is only an integrity commitment.

The idea of a time-locked letter is not claimed as new.

## Evidence fields — complete only after live proof

- Public repository: https://github.com/inunanba/future-post
- Public demo: https://inunanba.github.io/future-post/
- Featured image PNG/WebP: INCLUDED — 1200×675 source, PNG and WebP
- Diana contract address: UNKNOWN
- Sender address: `qor1rgsq0sgpww6yevnmedlqe797tc4v57u4as0w52` (Diana testnet)
- Reviewed fingerprint address: `qor1rgsq0sgpww6yevnmedlqe797tc4v57u4as0w52` (self-commitment only; not KEM registration)
- KEM registry lookup: NOT APPLICABLE TO CURRENT PROOF; website registration BLOCKED_CAPABILITY / no retry
- Public-key fingerprint anchor: PASS — code 0, height 10719012, tx `A6633E0F8D41F77FA8414EF62C2EE3CF1943686781E60EDC36D0FF6FC90A0E27`; exact 1 uqor self-transfer memo read back
- Early release rejection transaction/call: UNKNOWN
- Accepted B release transaction: UNKNOWN
- Correct-recipient open evidence: local official-QoreSeal ML-KEM proof PASS; live reviewed-key flow UNKNOWN
- Outsider refusal: local official-QoreSeal proof PASS (`NOT_A_RECIPIENT`); live reviewed-key flow UNKNOWN
- Exact package: `@qorechain/qoreseal@0.1.0`
- Local tests: 38/38 PASS at CHECKPOINT-06; browser bundle build PASS
- Solidity compile: 0.8.30 PASS; deployed bytecode UNKNOWN
- Demo video URL: UNKNOWN

## Security limits

QoreSeal protects payload content, not addresses, timing, envelope size, or recipient count. The release contract enforces a policy and creates an audit record; it does not create cryptographic time. Key loss can make a letter unreadable. The contract and application have not been externally audited.

Never include a mnemonic, seed, private key, wallet token, plaintext private letter, or test secret in submission materials.

## Credits

- QoreSeal and QoreChain developer kits: QoreChain Association, Apache-2.0 where applicable.
- Future Post application code and original SVG identity: MIT. Created by inunanba.
- AI-assisted development is documented in `AI_USAGE.md`.
