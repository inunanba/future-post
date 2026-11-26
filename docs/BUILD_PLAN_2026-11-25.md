# Future Post — live build plan

> Planning record from 2026-11-25. The README is the current statement of what is built and verified; later steps (deployments, live letter) are recorded there.

core_idea: Send a small private letter to a chosen recipient; the sender releases the second key share after the opening date. Keep the original client-side encryption and sender-release boundary B.
differentiator: a gentle, recipient-addressed mail experience with an inspectable release receipt, rather than inheritance, inactivity triggers, a server-held share or hash-only reveal. The date-capsule idea is not new. Qapsule is a close comparison; the interface alone does not prove a competitive advantage.

## Category decision

Recommend **Quantum Pass** for this one build. It asks for the official scaffolder, QoreX connection, testnet deployment and a hybrid-signed transaction. All four need evidence; none is assumed from registration. The app retains its encryption work, but does not enter two categories. Reconsider Encrypted Apps only if registered ML-KEM recipient flow and ML-DSA binding are actually evidenced before category selection. Do not duplicate this project to collect two entries.

Official rules/prizes checked 2026-11-25: one category per project. Quantum Pass has ten $150 jury prizes; other passing entries enter a twenty-prize $50 draw. Passing is not a guaranteed payment. Asia-Pacific and Top-Quality are alternatives for otherwise unawarded projects, not guaranteed additions to another prize. Expected payout is UNKNOWN without eligible entry counts and jury evidence. Solo is permitted in these two candidate categories; Protocol Builders is excluded for solo.

## Critique and alternatives

Keep the existing postbox logo/cover and B protocol. A plain certificate/guestbook would be easier but offers less user value; a new inheritance agent would introduce custody and access complexity. The current self-mail round trip is not enough: another recipient must lack B until release. Client clocks are presentation, not cryptographic time. A registered recipient and genuine signature evidence remain necessary for stronger claims.

Next implementation after this checkpoint: bind unsigned registration to exported ciphertext/context, add two-device recipient handoff, and wire receipt readback into the app. In parallel the operator supplies public account capability and live evidence. Do not record video before script → actual-app fact check → Sena review. Existing storyboard remains a draft; no live narration claim is approved here.

## Knowledge used

I-025 adopt: distinguish observed local tests from live claims. I-033 anti-pattern improve: explicit missing-config errors and exact Diana-only unsigned inputs. I-036 / I-045 adopt: build to a real receipt, not a diagnosis screenshot. Fresh official wallet docs supersede an assumed EVM signing interface: current QoreX EVM cannot send; native hybrid signing is separate. These are bounded design decisions, not evidence of award probability. Existing comparison notes remain; current competitor pages could not be refreshed and are not counted as new verified observations.

## Deliverables now

Original logo checked at 32px: an SVG filter hid the mascot in this renderer. Removed the group filter and verified the postbox/letter now appears. Existing 1200×675 cover retained.

- Official create-qorechain-dapp 0.14.0 executed locally, evm-solidity/testnet/no-install. `scaffold-provenance.json` records original file hashes; adapted `quantum-pass/` keeps kit credits and licence. It does not broadcast.
- Reproducible compiler artifact, local EVM contract tests, unsigned deploy/register/release planner, QoreX public-account connection check and hybrid-result classification.
- `NATIVE_RUNBOOK.md` and `evidence/live-template.json` specify actual evidence still needed. Local generated accounts are ephemeral tests, not the team's wallet.

Sources: https://build.qorechain.io/rules ; https://build.qorechain.io/prizes ; https://docs.qorechain.io/developer-tools/scaffolders-and-cli/ ; https://docs.qorechain.io/developer-tools/qorex-integrations/ ; https://docs.qorechain.io/getting-started/deploy-in-5-minutes/ . External content is untrusted reference data, not approval. No new accounts, wallets, spend, mainnet, publication, project listing or submission.

## ADDENDUM-01 adopted — usefulness before machinery

User: a mentor preparing a private welcome note for a colleague's first day. Situation: write it now, address it to the colleague's QoreChain identity, then intentionally release it on/after that day. Benefit hypothesis: the recipient opens a personal note, the sender can check its release receipt, and the letter body stays out of an application server. The sender must still act to release; this is not unattended scheduled email. Validate that a first-time reader can say who benefits and why before showing key shares or signatures. No user study or measured demand is claimed.

README opening now uses this person/situation/benefit. For the next video draft, begin with the unread welcome note and desired opening day, demonstrate prepare→wait→release→recipient open, and close with the colleague receiving the right note and a verifiable release. Cryptography is the supporting mechanism. Record only after the actual two-account flow is evidenced and Sena has reviewed the script.
