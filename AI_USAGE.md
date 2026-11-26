# AI usage

Future Post was built with AI agents working under the direction of its creator, **inunanba**. This file records the workflow, what the AI produced, and what the human decided. AI output is never treated as evidence by itself: package APIs were checked against official sources, code is covered by tests, and every on-chain claim in this repository has a transaction hash and a read-only check (`npm run verify:diana-v2`, `npm run verify:diana-letter`, `npm run verify:diana-kem`).

## Agents and roles

| Agent | Role in this project |
|---|---|
| **Sena (Grok Bot)** | Coordinating and executing agent. Chose priorities, checked the official rules and FAQ, specified acceptance criteria, ran the testnet steps with the official `qorechaind` CLI and viem (key registrations, EVM windows, deployments, the demo letter, the native swap), wrote `FuturePostReleaseV2`, its tests and verifier scripts, and reviews the public repository. |
| **Work (AI implementation agent)** | Prepared the category proposal, Diana planners, the QoreX public-account probe, local EVM tests, the official QoreSeal browser proof, compiler artifacts and the testnet runbook; reviewed the V2 design and required the changes listed below before it was built. |
| **Grok** | Reviewed the three early concept directions before implementation and returned no strong objection to Future Post. |
| **OpenAI Codex / GPT** | Translated the approved concept into the initial UI, state model, tests, documentation and security review. |

## Workflow

1. **Concept and fit.** Three candidate ideas were compared; Future Post was chosen and fitted to the Quantum Pass category (create-qorechain-dapp, QoreX, testnet deployment, hybrid-signed transaction).
2. **Security design.** AI review found that QoreSeal encrypts to a recipient but does not delay that recipient's decryption, so a browser countdown is not cryptographic time release. This produced the split-key design (`K = A XOR B`, A sealed to the recipient, B released on chain after the opening time) recorded in `SECURITY_DESIGN.md`.
3. **Build and local tests.** The app, planners, contracts and tests were written and run locally (`npm run check`: contracts compiled with pinned solc, 41 tests, browser bundle, public-repo audit).
4. **Testnet execution.** Sena executed the on-chain steps with a single-purpose, testnet-only account whose keys never entered the repository. Each transaction was sent once and read back from the chain; hashes are in the README and `evidence/`.
5. **V2 contract with independent review.** Work reviewed the V2 plan and required: guard registration only (so a later key change or precompile outage cannot lock a valid letter), fail closed on a missing or malformed precompile answer, a fixed `0x…0a02` address with tests that run the unchanged production bytecode, ML-DSA and ML-KEM evidence kept separate, and no recipient-check claim. Each item was implemented as specified.
6. **Live letter.** A demo letter was registered on V2, held until its opening time and released, then opened by the recipient key; a read-only script re-checks it.
7. **Rubric review.** The repository was audited against the contest rubric and official FAQ; stale wording, links and quickstart steps were corrected (see the commit history).

## Material AI contributions

- The sender-release design and its limits (see `SECURITY_DESIGN.md`).
- All contract code, tests, verifier scripts and evidence JSON, and the README.
- The V2 design review and the test strategy that places mock precompile code at `0x…0a02` on a local EVM so the production contract itself is exercised.
- No generated third-party artwork is included. The postbox logo and cover source are original SVG code created for this project.

## Human direction and responsibility

inunanba chose QoreChain's Build Before Q-Day as the event to enter and the Future Post concept and its tone, selected the "cute logo first" workflow, and approved each step that touches an external account or the chain: creating the public repository, creating a single-purpose testnet key and deploying with it, funding it through their own signed-in faucet session, and the native AMM swap. Publishing and submitting the entry, and every wallet, account and payment decision, stay with the human. No AI agent accessed a mnemonic, a QoreX wallet secret or mainnet funds.
