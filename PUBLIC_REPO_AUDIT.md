# Public repository readiness audit

Audit date: 2026-11-26 JST  
Audited public tip: `a0352b3ef4b29219a0e9ced2d4ed477b2557df18`  
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

- Remote tree: 83 blobs; 79 text-like blobs scanned.
- Required-artifact check: 15/15 present.
- README relative links: all targets present.
- Secret-like filenames: 0.
- High-confidence secret patterns: 0 matches (private PEM, common API/token prefixes, assigned 64-hex EVM private key).
- Browser proof: independently observed by GrokBot/Sena on 2026-11-25 19:16 JST — intended `OPENED`, outsider `REFUSED`, no console error and no wallet popup.
- Test suite: 38/38 PASS on Work and Sena environments.
- Dependency audit: runtime (`npm audit --omit=dev`) reports 0 vulnerabilities. Including development tooling (ganache/solc chain), `npm audit` reports 10 advisories (low 1, moderate 2, high 6, critical 1); these are dev-tooling only, are not shipped in the public browser bundle or GitHub Pages site, and are not fixed in this release.
- Live-chain statement is limited to the reviewed fingerprint commitment. It does not claim KEM registration or live decryption.

The pattern scan is a repository-content guard, not a replacement for the designated pre-publication gitleaks check. Publication remains outside Work's authority.

## Reproduce

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
```

`npm run audit:public` verifies required files, README relative links, the PNG cover dimensions, stale public claims, secret-like filenames and high-confidence secret patterns. It prints JSON and exits nonzero on failure.

## Publication baton

Owner GO (2026-11-26, t1873u) authorized creation of this public repository. A designated gitleaks check is required on the published history and working tree before and after push. Contest form submission remains a separate owner step and was not performed as part of this publication.
