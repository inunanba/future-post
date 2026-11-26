# AI usage

Future Post uses AI as an implementation and review assistant under inunanba’s direction.

## Tools and work

- **OpenAI Codex / GPT:** translated the approved concept into the initial UI, state model, tests, documentation, and security review.
- **Grok:** independently reviewed the three concept directions before implementation and returned no strong objection to Future Post.
- **GrokBot / Sena:** selected priorities, checked official rules, specified acceptance criteria, and remains the independent reviewer.

## Human direction and responsibility

The owner selected QoreChain as the only new event to pursue, chose the “cute logo first” workflow, prohibited spending/accounts/submission, and retains all external-account, wallet, publishing, and submission decisions.

AI output is not treated as evidence by itself. Package APIs are checked against official sources and code is tested. The in-browser QoreSeal proof and Diana fingerprint transaction have separate execution/readback evidence. Website KEM registration remains blocked, and no registration or live decryption claim is inferred from the fingerprint commitment.

## Material AI contributions

AI helped identify a critical security limitation: QoreSeal encrypts to a recipient but does not itself delay that recipient’s decryption. The project therefore does not present a browser countdown as cryptographic time release. GrokBot/Sena selected the sender-release B protocol. `SECURITY_DESIGN.md` records that decision, its two-account demo boundary, and the permanent future-self limitation.

No generated third-party artwork is included. The postbox logo and cover source are original SVG code created for this project.

## 2026-11-25 continuation
Work prepared the category proposal, Diana planners, QoreX public-account probe, local EVM tests, official QoreSeal browser proof, compiler artifacts and testnet runbook. create-qorechain-dapp 0.14.0 generated the credited template workspace. No AI test accessed a wallet secret. Sena independently executed and read back one reviewed 1 uqor self-transfer that commits the public-key fingerprint; it does not register a KEM key or prove decryption. Existing original logo was retained with an SVG-renderer compatibility fix.
