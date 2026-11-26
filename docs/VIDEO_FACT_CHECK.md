# Demo script fact check

Checked against source, an independent browser review and Diana evidence (2026-11-25 JST; live-letter rows updated 2026-11-26). It lists what the demo video may state.

| Script statement | Source / independent evidence | State |
|---|---|---|
| First-day welcome is the central use case | `index.html` hero; independent browser review | VERIFIED |
| Official QoreSeal ML-KEM-1024 runs in the browser | `src/mlkem-proof.js`, bundled `dist/app.bundle.js`; one-click browser result | VERIFIED |
| Intended recipient opens | browser review: `OPENED`; test suite (41/41 now) | VERIFIED |
| Outsider is refused | browser review: `REFUSED`; stable `NOT_A_RECIPIENT` test | VERIFIED |
| No private key or plaintext appears on the proof screen | UI renders only states and envelope SHA-256; source review | VERIFIED |
| Diana fingerprint commitment exists | Tx `A6633E0F8D41F77FA8414EF62C2EE3CF1943686781E60EDC36D0FF6FC90A0E27` | VERIFIED |
| QoreChain hybrid verification is present | chain re-read: `PQCHybridSignature`; prior REST/RPC hybrid verification events | VERIFIED |
| Transaction succeeded | REST/RPC readback: height 10719012, code 0, exact memo, hybrid verification events | VERIFIED |
| Composer binds recipient/opening time/content context | `src/protocol.js`, `src/split-envelope.js`, tests | VERIFIED LOCALLY |
| Browser proof screen reads the on-chain KEM registry | It uses fresh in-browser keys | DO NOT CLAIM (the live letter, not this screen, used the registered key) |
| A demo letter was registered and released on Diana with a recipient open afterwards | `evidence/diana-live-letter.json`, `npm run verify:diana-letter`; register block 10782943, release block 10783071 | VERIFIED (single account) |
| Two-device release | Not run | DO NOT CLAIM |

## Review repair checklist

- Problem statement says why Future Post was made.
- QoreSeal is named as QoreChain’s post-quantum tool and ML-KEM-1024 remains explicit.
- Diana narration names QoreChain’s hybrid signature, height 10719012 and code 0.
- Closing line names QoreSeal proof and a verifiable QoreChain commitment.
- Credits begin with `Created by inunanba`.
- Proof capture begins after `OPENED` / `REFUSED`; initial UI is `READY`.
- Account 1 is used for the composer shot; only the waiting state and countdown are framed.
- **Prepare share B release** is not pressed.

## Visual pass required before recording

Run this revision against the current app and confirm shot order, captions, live link, Account 1, neutral scope labels and approximate 1:35 timing before recording.
