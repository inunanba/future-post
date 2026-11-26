# Future Post — Diana Native hybrid evidence runbook

This route follows the one-attempt QoreX rejection of `/qorechain.pqc.v1.MsgRegisterKEMKey`. That message is wallet-managed and must not be retried or routed around. Future Post now keeps two evidence layers separate: official QoreSeal local ML-KEM seal/open proves recipient encryption, while a normal QoreX hybrid `MsgSend` may commit the reviewed public-key fingerprint on Diana. The transfer does not register a KEM key and does not prove decryption.

## Evidence boundary

- QoreX Native hybrid transaction plus receipt/readback proves the fingerprint commitment and hybrid transaction only.
- Official QoreSeal local seal/open plus outsider refusal proves ML-KEM recipient behavior. A local ephemeral proof is not the live reviewed-key proof.
- A prepare anchor and a release anchor are auditable native transfers. They do not prevent a sender from releasing early; the release builder only prepares a release after a fresh observed chain time reaches the unlock time.
- A signature prompt, a hash, a pending receipt and a confirmed receipt are different states. Only a successful receipt plus matching readback is accepted.
- All files produced by these commands are public plans. Seeds, mnemonics, private keys, share A and plaintext must stay outside the repository.

## 1. Preserve the blocked registry result

The single reviewed attempt was rejected by QoreX before any signature prompt: `MsgRegisterKEMKey is managed by the wallet itself, not by a website`. Record `BLOCKED_CAPABILITY / REJECTED_OR_FAILED_NO_RETRY`. Do not retry, change message id, use another wallet, or claim registration.

## 2. Run the local ML-KEM functional proof

Run `npm run prove:mlkem`. The safe JSON output contains hashes, byte counts, `matchingRecipientOpen=true`, `outsiderOpen=false`, and the boundary `LOCAL_FUNCTIONAL_PROOF_NOT_CHAIN_REGISTRATION`. It contains no plaintext, seed, mnemonic, private key, or share.

## 3. Prepare the reviewed fingerprint anchor

Prepare a public-only input with exactly:

```json
{
  "address": "qor1rgsq0sgpww6yevnmedlqe797tc4v57u4as0w52",
  "publicKeySha256": "3f6cffdb4cd083ae855a3f5cc074eac70fa92b7c4fc8b565d95e520a80c6a358"
}
```

Run `npm run prepare:hybrid-proof -- reviewed-public-kem-fingerprint.json`. Review the generated plan:

- `chainId` is `qorechain-diana`.
- signer is the coin-118 recipient above.
- the only message is `/cosmos.bank.v1beta1.MsgSend`.
- it is a `1 uqor` Account 1 self-transfer.
- the memo is `future-post:v1|kem-fp|<reviewed fingerprint>`.
- status is `UNSIGNED_NOT_SENT`.

Save that public plan outside the repository, then open `http://127.0.0.1:8765/hybrid-proof.html` in the existing QoreX browser. The page re-decodes the MsgSend protobuf and requires the exact signer, self-recipient, `uqor`, amount, memo fingerprint, gas, and explicit non-registration boundary.

On the existing QoreX box, confirm the active Native account exactly matches the signer, tick the review checkbox, and press **Connect QoreX and request one signature**. The page disables itself before `signAndBroadcast` and never retries automatically. After wallet-reported success, require receipt and transaction readback with the exact memo before accepting the on-chain commitment.

The QoreX approval popup can show only a **TESTNET** badge and omit the chain name. That is acceptable only when both the originating page and the reviewed plan say `qorechain-diana`; otherwise stop.

## 4. Product demo boundary

The user benefit is a private welcome letter waiting for a new colleague on their first day. The local proof demonstrates intended-recipient seal/open and outsider refusal. The fingerprint anchor provides an auditable Diana commitment to the reviewed public key. Present both facts together, while keeping them as separate evidence.

## 5. Prepare release anchor

Prepare a public input containing `kind=prepare`, coin-60 sender, coin-118 recipient, the rebuilt bundle digest, unlock Unix time, and share B commitment. Run `npm run prepare:native-anchor -- reviewed-public-anchor.json`.

Review and request one QoreX Native transaction. It transfers exactly `1 uqor` and places the digest, unlock time and commitment in the memo. Require a successful receipt and read the transaction back by hash. Do not treat the anchor as time enforcement.

## 6. Release anchor

At or after unlock, obtain a fresh Diana chain time. Prepare the release input with:

- `kind=release`
- the same sender, recipient, digest, unlock Unix time and share B commitment
- `observedChainTime` from the fresh chain block
- the 32-byte base64url share B

The builder rejects an early chain time or a share that does not match the commitment. Review and request exactly one QoreX Native transaction, then require receipt success and hash readback. Share B becomes public at this step; share A, content key and plaintext remain private.

## 7. Recipient proof

On the recipient device, use the reviewed recipient key material and public bundle plus confirmed prepare/release anchors and share B. Open sealed share A with the recipient private KEM key, recombine the two shares, and decrypt with the immutable associated data. Record device identity, bundle digest, tx hashes, heights, receipt codes and plaintext digest. Do not record private keys or plaintext. Website KEM registration remains `BLOCKED_CAPABILITY`; do not describe this step as reading a registered KEM entry.

## Stop conditions

Stop without retrying when the network or signer differs, QoreX lacks `signAndBroadcast`, the message is refused, a receipt fails or remains unknown, registry/readback differs, chain time is unavailable, the share commitment differs, or any prompt requests mainnet, key export, a different account or an additional transaction.
