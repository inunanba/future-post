# Future Post / 未来の自分へのポスト

A personal note for someone’s first day. Write it ahead of time, address it to their QoreChain identity, and release it when the day arrives. The recipient opens the note; the sender can check the release record.

The design keeps the letter body on the client and uses recipient encryption to support that experience. The sender actively releases the second share; it is not an unattended email scheduler.

Created by **inunanba**. License: [MIT](LICENSE).

> Current evidence level: **working product prototype with live Diana evidence**. The main screen runs official QoreSeal ML-KEM-1024 seal/open with intended-recipient success and outsider refusal in the browser. On the QoreChain Diana testnet there are QoreX hybrid-signed transactions, the `FuturePostRelease` contract deployment, an EVM window opened and closed, and an ML-KEM-1024 key published in the on-chain KEM key registry with a local seal-to-address and open round trip. See [Testnet addresses and transactions](#testnet-addresses-and-transactions).

![Future Post mascot](assets/logo.svg)

## Run

Build the browser bundle, serve the directory, then open the local URL. The proof creates fresh ephemeral keys locally and requests no wallet connection. Its only network link is the explicit Diana evidence link.

```bash
npm install
npm test
npm run check
python -m http.server 8765
```

A static live demo, which needs no secrets or wallet connection for the in-browser proof, is at [https://inunanba.github.io/future-post/](https://inunanba.github.io/future-post/).

## Verify on QoreChain testnet

The reviewed Diana fingerprint commitment can be read back on QoreChain testnet:

[https://api-testnet.qore.host/cosmos/tx/v1beta1/txs/A6633E0F8D41F77FA8414EF62C2EE3CF1943686781E60EDC36D0FF6FC90A0E27](https://api-testnet.qore.host/cosmos/tx/v1beta1/txs/A6633E0F8D41F77FA8414EF62C2EE3CF1943686781E60EDC36D0FF6FC90A0E27)

The independent readback is height **10719012**, code **0**. The memo is `future-post:v1|kem-fp|3f6cffdb4cd083ae855a3f5cc074eac70fa92b7c4fc8b565d95e520a80c6a358` (one `1 uqor` self-transfer). This transaction is a public-key fingerprint commitment, not KEM registration or live decryption proof.

## Deployed on QoreChain Diana testnet

The `FuturePostRelease` contract is deployed on the QoreChain Diana testnet (EVM chain 9800).

| | |
|---|---|
| Contract address | `0x0E5e1b9d41bFCe8a19f5dA4E55Dd6459F69E2b50` |
| Deploy transaction | `0x97090531c63c695af28ff1791e0cdc01800ef11439238f56aa32efb7a293281d` |
| Block | 10780460 (2026-11-26 09:22:04 UTC), receipt status success |
| Explorer | [transaction](https://explore.qore.network/tx/0x97090531c63c695af28ff1791e0cdc01800ef11439238f56aa32efb7a293281d) / [contract](https://explore.qore.network/address/0x0E5e1b9d41bFCe8a19f5dA4E55Dd6459F69E2b50) (switch the explorer to Testnet) |

Check it yourself with any EVM JSON-RPC client:

```bash
curl -s -X POST -H 'content-type: application/json' https://evm-testnet.qore.host \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_getCode","params":["0x0E5e1b9d41bFCe8a19f5dA4E55Dd6459F69E2b50","latest"]}'
```

The returned code is the 1,560-byte runtime of `artifacts/FuturePostRelease.json`. Reading a letter id that does not exist returns the contract's own `LetterMissing()` error, as designed. Details are in [evidence/diana-contract-deploy.json](evidence/diana-contract-deploy.json). The deployer is a single-purpose testnet-only account funded from the official Diana faucet. This entry covers the contract deployment; registering and releasing a letter on this contract is the next step.

## What works now

- Responsive letter composer and locked/ready states.
- Diana recipient-address validation.
- Envelope context bound to chain, letter id, opening date, and recipient.
- Exact boundary behavior: share B release refused before the date and enabled at the date.
- Client-side AES-256-GCM ciphertext; 256-bit content key split as A XOR B.
- Decryption fails with a wrong B share or changed authenticated date/context.
- Self-made mascot/logo plus 1200×675 SVG, PNG, and WebP cover assets.
- Unit tests for early refusal, boundary opening, binding, address rejection, countdown formatting, and official QoreSeal intended-recipient/outsider behavior.
- Reader-first browser proof for a private first-day welcome, with the live Diana fingerprint transaction linked separately.

## Requirements and evidence

Future Post is a first-day welcome letter for a new colleague: it is sealed to the recipient's post-quantum key and released on the first day.

| Requirement | Planned implementation | Current evidence |
|---|---|---|
| ML-KEM-1024 | `@qorechain/qoreseal@0.1.0` using `sealToAddresses` / `open` | Official browser seal/open + outsider refusal tested. A testnet account has an ML-KEM-1024 key in the Diana KEM key registry (tx `25C75479…FB10A`, height 10780940), and a local seal-to-address and open round trip against that on-chain key passed ([evidence](evidence/kem-registry-roundtrip.json), read-only check: `npm run verify:diana-kem`) |
| Reviewed recipient key | Local QoreSeal key plus public SHA-256 fingerprint | Local browser seal/open passes; Diana fingerprint anchor code 0 at height 10719012 |
| ML-DSA binding | QoreX builds, hybrid-signs, and broadcasts the reviewed fingerprint commitment and later release messages | QoreX hybrid-signed fingerprint commitment and transfers read back on Diana; the full release flow on the deployed contract is the next step |
| Client-side encryption/decryption | QoreSeal runs in the browser; plaintext and secret keys never go to an app server | Official local browser proof implemented; full reviewed-key/two-device integration is the next step |
| Date lock | Sender device retains B; contract rejects publication before `unlockAt`; recipient combines QoreSeal-opened A with public B | B protocol selected; local round trip tested; `FuturePostRelease` deployed on Diana (see above) |
| Testnet proof | Local seal/open + Diana fingerprint commitment + contract deployment + receipt readback | Local matching-recipient open and outsider refusal pass; fingerprint tx code 0, height 10719012; contract deployed at block 10780460 |
| Licence | MIT | Included |
| Cover | Self-made 1200×675 SVG source | PNG 68,191 bytes and WebP 23,154 bytes; dimensions verified |
| AI disclosure | `AI_USAGE.md` | Included |

### Quantum Pass requirements

| Quantum Pass requirement | Evidence |
|---|---|
| Built with create-qorechain-dapp | [scaffold-provenance.json](scaffold-provenance.json): create-qorechain-dapp 0.14.0, template `evm-solidity`, network `testnet` |
| Connect QoreX | QoreX account `qor1rgsq0sgpww6yevnmedlqe797tc4v57u4as0w52`: post-quantum key registration (tx `D7C896FC…33118`) and the site-link transaction (tx `66D1DA41…ABB73`) |
| Deploy on testnet | `FuturePostRelease` at `0x0E5e1b9d41bFCe8a19f5dA4E55Dd6459F69E2b50`, tx `0x97090531…3281d`, block 10780460 |
| One hybrid-signed transaction | Several, each carrying a `PQCHybridSignature`: `9089AF34…C75A04`, `A6633E0F…0A0E27`, `66D1DA41…ABB73` (QoreX) and `4E6A1BA6…20672`, `EDE2074C…18A79`, `25C75479…FB10A` |

### Testnet addresses and transactions

All on QoreChain Diana (`qorechain-diana`, EVM chain 9800). Machine-readable copy: [evidence/diana-testnet-activity.json](evidence/diana-testnet-activity.json).

| Address | What it did |
|---|---|
| `qor1rgsq0sgpww6yevnmedlqe797tc4v57u4as0w52` | Team QoreX account: registered its hybrid post-quantum key, linked to the Build Before Q-Day site, sent the fingerprint commitment and a transfer |
| `qor1r274urptm66u0kn6eujalcl0v7sz5tj0tus05t` | QoreX Ethereum-type (coin 60) account of the same wallet: received a 10 QOR test transfer |
| `qor1w6p3pj7d0q4a5n7neadmh94ku2g78ugrr2laxq` (`0x768310cBCD782BDa4fd3cf5Bbb96b6E291E3F103`) | Single-purpose testnet deployer: registered its post-quantum key, opened and closed an EVM window, deployed the contract, published its ML-KEM-1024 key |
| `0x0E5e1b9d41bFCe8a19f5dA4E55Dd6459F69E2b50` | `FuturePostRelease` contract |

| Transaction | Height | What |
|---|---|---|
| `D7C896FCB667982525BD3A10BAABD2E60674ED773827C362C322967C4F333118` | 10704698 | Team account: post-quantum key registration with proof of possession |
| `66D1DA417741F8FA9142C7AF8279AA48A7CC164189D98969B80C896F5F6ABB73` | 10704701 | Team account: hybrid-signed site-link transaction |
| `9089AF34B30B6D863148048F7036E329248216F5FA1D42C56D6EBBDE40C75A04` | 10706200 | Team account: hybrid-signed 10 QOR transfer to the coin-60 account |
| `A6633E0F8D41F77FA8414EF62C2EE3CF1943686781E60EDC36D0FF6FC90A0E27` | 10719012 | Team account: hybrid-signed fingerprint commitment |
| `C522F36AD4EF67A1AE572FB3B831A6CF141E3E47A9FE95A65A02B839AC3ACB16` | 10780413 | Official faucet payment to the deployer |
| `C48AB7252E742E4E479F8CDA07976760DA0DFEAF8BBB904E22CEEA53A9DB14CD` | 10780438 | Deployer: post-quantum key registration with proof of possession |
| `4E6A1BA6B69EE4DA1812F0F5369F5635291C5136DF0D76D08798C2542BB20672` | 10780449 | Deployer: EVM window opened (300 blocks, 3 transactions, 1 QOR cap) |
| `0x97090531c63c695af28ff1791e0cdc01800ef11439238f56aa32efb7a293281d` | 10780460 | Deployer: `FuturePostRelease` deployment |
| `EDE2074CDD0D1A5A2D73B6DD2394D9F1A9190D9F8C5464486235E5A4C9108A79` | 10780475 | Deployer: EVM window closed |
| `25C7547930CB389AFA7742EFAF53D232B65DBFA38EE6B0D9CC64F82DC49FB10A` | 10780940 | Deployer: ML-KEM-1024 key published in the KEM key registry |

Read any Cosmos transaction at `https://api-testnet.qore.host/cosmos/tx/v1beta1/txs/<HASH>`; the EVM deployment is read through the EVM RPC (see above).

## Selected B protocol

1. The browser creates a random AES-256 content key and encrypts the letter with AES-GCM.
2. It creates random share A and computes share B as `contentKey XOR shareA`.
3. Share A is sealed to the intended recipient with official QoreSeal. Share B stays only on the sender device. The current local proof uses ephemeral recipient keys and does not claim a Diana registry entry.
4. At or after `unlockAt`, the sender asks QoreX to hybrid-sign and broadcast a release transaction containing B. The contract refuses an earlier release.
5. The recipient opens A with their QoreSeal keys and combines A with the public B. An outsider who sees B still lacks A.

The contract records policy and timing. It does not create cryptographic time by itself. A letter to another person demonstrates the intended recipient property. A letter to oneself is a personal commitment because the same person may be able to recover both local shares.

## Release contract

`contracts/FuturePostRelease.sol` records the sender, hashed recipient binding, opening time, ciphertext hash, and B commitment. Only the sender can publish a 32-byte B after the opening time; an early call, wrong sender, duplicate release, or commitment mismatch reverts. The contract compiled with Solidity 0.8.30. It is not deployed and has not been externally audited.

## QoreSeal integration boundary

The official TypeScript package exposes offline `seal` / `open` and network helpers including `fetchKemKey`, `resolveRecipient`, and `sealToAddresses`. Future Post uses:

- chain id: `qorechain-diana`
- purpose: `future-post:v1:<letter-id>`
- associated data: version, letter id, UTC opening time, recipient address
- hybrid mode by default; no silent downgrade
- no testing entropy helpers for real data

QoreSeal protects content, while sender/recipient addresses, timing, sizes, and recipient count remain public.

## Security boundary

A QoreSeal envelope sent directly to a recipient is immediately decryptable by that key owner. A UI countdown or contract timestamp does not change that cryptographic fact. See [SECURITY_DESIGN.md](SECURITY_DESIGN.md) for the selected sender-release protocol and its limits.

Future Post does not make an unconditional “not even the recipient can open early” claim. For the principal two-account demo, the recipient lacks sender-held B until release. For a letter to oneself, the same person may recover both local shares, so the product is described as a personal commitment.

## Similar projects

- **Qapsule:** also uses a future-date capsule and a split content key. Future Post’s intended distinction is the personal mail/calendar experience and official QoreSeal browser proof plus a separate reviewed fingerprint commitment. The time-locked-letter idea itself is not new.
- **Tabella:** adds inactivity/inheritance delivery and a Postman that holds a share. Future Post has no dead-man feature and no service-held decryption share.
- **Last Light:** focuses on inheritance and seed recovery. Future Post does not.
- **Harvest-Proof Time Capsule:** anchors a hash and later matches plaintext. Future Post is designed around recipient-key encryption rather than a hash-only reveal.

## Threat model

Protect against public observers, storage providers, wrong recipients, ciphertext tampering, and a classical-key-only attacker. Do not promise address/timing privacy, key recovery, protection after recipient-key compromise, or custodian-free adversarial time release. Live evidence can validate the selected two-account flow, but it does not remove the self-mail limitation.

Never log a seed, mnemonic, secret key, plaintext letter, or wallet token. Testnet only.

## Official sources

- https://docs.qorechain.io/developer-tools/qoreseal/
- https://docs.qorechain.io/build-before-qday/workshop-3/
- https://github.com/qorechain/qoreseal

QoreSeal 0.1.0 is pre-1.0 and its construction is pending external review, so API and security claims must be rechecked before submission.

## 2026-11-25 live-build checkpoint

Category proposal: **Quantum Pass**, one category for this project. See [build strategy](BUILD_PLAN_2026-11-25.md). The reviewed KEM-registration call was rejected by QoreX before signature and must not be retried. Local ML-KEM seal/open passes in the browser. The normal-transfer public-key fingerprint anchor passed independent REST/RPC readback: code 0 at height 10719012. This is a fingerprint commitment, not KEM registration or decryption proof. This checkpoint does not claim qualification or payout.

| Quantum Pass requirement | Artifact / verification | Current state |
|---|---|---|
| Official scaffolder | create-qorechain-dapp 0.14.0 / evm-solidity / testnet; scaffold-provenance.json and quantum-pass/ | Generated and adapted locally, credited |
| QoreX connection | hybrid-proof.html / src/qorex-session.js | One reviewed Diana fingerprint transaction signed once and read back; full release connection NOT_RUN |
| Testnet deployment | artifacts/FuturePostRelease.json and unsigned planner | Local EVM deployed/tested; Diana NOT_RUN |
| Hybrid transaction | wallet receipt classification and independent chain-readback runbook | PASS for fingerprint commitment: code 0, height 10719012, hybrid verify events; EVM receipt is not hybrid proof |
| Regional / Top-Quality | Official prize rules | Conditional alternatives for otherwise unawarded projects, no guarantee |

### Reproduce the current checkpoint

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
```

The test command compiles the contract with pinned solc 0.8.30 before testing. Thirty-eight test cases pass, including the official QoreSeal browser-proof core, an in-memory EVM deployment/registration/release path, and negative calls. Ganache runs without a listening server; its ephemeral accounts are unrelated to Diana. Its optional native µWS module may fall back to JavaScript.

See the [Native evidence runbook](NATIVE_RUNBOOK.md). `npm run prepare:diana -- reviewed-public-input.json` creates an unsigned plan only. It never connects a signer or broadcasts. `wallet-check.html` asks the installed QoreX native provider for a Diana public account only; real extension/browser behavior remains to be verified. The main screen now centers the private first-day welcome and runs the bundled official QoreSeal ML-KEM proof. The timed A/B composer remains a local prototype; full Diana release is NOT_RUN.

### Public two-device handoff and receipt states

After share A has been sealed to an intended recipient, `npm run export:bundle -- private-local-input.json` emits a public JSON handoff. The output contains the ciphertext, IV, recipient-only QoreSeal envelope, authenticated context, contract registration hashes, and a bundle digest. It deliberately omits plaintext, A, B, the content key, wallet credentials, and private keys. Changing the ciphertext, recipient, opening time, or registration values makes validation fail.

`npm run prepare:registration -- reviewed-public-registration.json` validates that bundle again and produces the existing Diana-only unsigned registration plan. The plan remains `UNSIGNED_NOT_SENT`; Sena must still check the live chain, account, gas, EVM window, simulation, and receipt.

The letter view reports evidence-safe states: `PLANNED`, `WALLET_SIGNATURE_REQUESTED`, `BROADCAST_UNKNOWN`, `TX_PENDING`, `CONFIRMED_SUCCESS`, `CONFIRMED_REVERT`, `UNSUPPORTED`, or `UNKNOWN`. A wallet prompt, wallet acknowledgement, or transaction hash is never displayed as confirmed chain success.

### Credits

The implemented browser proof directly uses official @qorechain/qoreseal 0.1.0. The repository includes and credits the create-qorechain-dapp 0.14.0 scaffold (Apache-2.0 template workspace, licence included in quantum-pass/). @qorechain/qorex-types 0.1.0 is pinned as a declared dependency and is not claimed as an implemented integration. viem 2.40.0, solc 0.8.30 and Ganache 7.9.2 are used for local development/tests only. Generated Counter example is credited upstream code, not Future Post novelty. No private keys, mnemonic, password, wallet export or real-network transaction is used in these tests.


### Checkpoint 05: honest hybrid proof boundary

The product benefit is a private welcome letter waiting for a new colleague on their first day. `npm run prove:mlkem` demonstrates official ML-KEM-1024 seal/open for the intended recipient and `NOT_A_RECIPIENT` refusal for an outsider without printing plaintext or private material. `npm run prepare:hybrid-proof -- reviewed-public-kem-fingerprint.json` creates an unsigned Diana plan for one `1 uqor` Account 1 self-transfer whose memo commits the reviewed public-key fingerprint. The guarded `hybrid-proof.html` page decodes and checks that exact MsgSend before allowing one wallet request. This transaction is a fingerprint commitment, not KEM registration or decryption proof. GROKBOT-08 records the one-attempt chain result: code 0 at height 10719012, exact memo and one 1 uqor self-transfer read back, with QoreChain hybrid verification events. Website KEM registration remains `BLOCKED_CAPABILITY`; full live decryption remains `NOT_RUN`.


### Checkpoint 06: reader-first browser proof

`index.html` now centers a private welcome letter for a new colleague's first day. `npm run build:browser` bundles official `@qorechain/qoreseal@0.1.0` into `dist/app.bundle.js`; the in-page action generates fresh ephemeral recipient and outsider keys, seals and opens locally, and displays only safe hashes and pass/refusal states. The live evidence link points to Diana transaction `A6633E0F8D41F77FA8414EF62C2EE3CF1943686781E60EDC36D0FF6FC90A0E27` (height 10719012, code 0). These are deliberately separate evidence layers.
