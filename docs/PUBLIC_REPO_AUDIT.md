# Public repository readiness audit

Audit date: 2026-11-26 JST (refreshed after the live letter and native swap)  
Initially audited public tip: `a0352b3ef4b29219a0e9ced2d4ed477b2557df18`  
Scope: Future Post project tree  
Status: **PUBLIC REPOSITORY PUBLISHED**

## Judge path

- Intended repository source: this public repository, published from the reviewed project tree with a fresh history.
- Current GitHub visibility: **public** at [https://github.com/inunanba/future-post](https://github.com/inunanba/future-post).
- Public repository URL: [https://github.com/inunanba/future-post](https://github.com/inunanba/future-post).
- Public demo URL: [https://inunanba.github.io/future-post/](https://inunanba.github.io/future-post/) (static GitHub Pages; no secrets required for the in-browser proof).
- Live Diana evidence: [fingerprint commitment transaction](https://api-testnet.qore.host/cosmos/tx/v1beta1/txs/A6633E0F8D41F77FA8414EF62C2EE3CF1943686781E60EDC36D0FF6FC90A0E27), height 10719012, code 0.

## Required artifacts

The source tree contains README, MIT LICENSE, AI usage disclosure, package and lock file, index and compiled browser bundle, 1200×675 cover source/PNG/WebP, logo, submission draft, video storyboard, tests, credits and testnet addresses. README relative links resolve within the project tree.

## Evidence and content checks

- Required-artifact check (`npm run audit:public`): all required files present.
- README relative links: all targets present.
- Secret-like filenames: 0.
- High-confidence secret patterns: 0 matches (private PEM, common API/token prefixes, assigned 64-hex EVM private key).
- Browser proof: independently observed on 2026-11-25 19:16 JST — intended `OPENED`, outsider `REFUSED`, no console error and no wallet popup.
- Test suite: 41/41 PASS (`npm run check`), also from a fresh clone with `npm ci --ignore-scripts`.
- Dependency audit: runtime (`npm audit --omit=dev`) reports 0 vulnerabilities. Including development tooling (ganache/solc chain), `npm audit` reports 10 advisories (low 1, moderate 2, high 6, critical 1); these are dev-tooling only, are not shipped in the public browser bundle or GitHub Pages site, and are not fixed in this release.
- Live-chain evidence: the fingerprint commitment, the ML-KEM-1024 registry key, two release contracts, the demo letter register/release on V2, and a native AMM swap, each with hashes in the README and `evidence/`. Claims are limited to single-account demonstrations; two-device release is not claimed.

The pattern scan is a repository-content guard; gitleaks is also run on each change before it is pushed.

## Reproduce

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
```

`npm run audit:public` verifies required files, README relative links, the PNG cover dimensions, stale public claims, secret-like filenames and high-confidence secret patterns. It prints JSON and exits nonzero on failure.

## Publication baton

The owner authorized creation of this public repository on 2026-11-26. Gitleaks is run on the staged tree before each push.
