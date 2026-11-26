import {
  envelopeToText,
  generateSealKeys,
  open,
  recipientOf,
  seal
} from "@qorechain/qoreseal";

const CHAIN_ID = "qorechain-diana";
const PURPOSE = "future-post:v1:local-mlkem-proof";
const SCENARIO = "private welcome letter for a new colleague's first day";
const WELCOME = "Welcome to the team. Open this private letter on your first day.";

const utf8 = value => new TextEncoder().encode(value);
const hex = bytes => [...bytes].map(value => value.toString(16).padStart(2, "0")).join("");

async function sha256(value) {
  const bytes = typeof value === "string" ? utf8(value) : value;
  return hex(new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes)));
}

export async function runLocalMlkemProof() {
  const recipient = generateSealKeys();
  const outsider = generateSealKeys();
  const plaintext = utf8(WELCOME);
  const aad = utf8(JSON.stringify({ scenario: "new-colleague-first-day", version: 1 }));
  const envelope = seal({
    chainId: CHAIN_ID,
    purpose: PURPOSE,
    recipients: [recipientOf(recipient)],
    plaintext,
    aad
  });
  const opened = open({
    chainId: CHAIN_ID,
    purpose: PURPOSE,
    envelope,
    keys: recipient,
    aad
  });

  let outsiderOpen = false;
  try {
    open({ chainId: CHAIN_ID, purpose: PURPOSE, envelope, keys: outsider, aad });
    outsiderOpen = true;
  } catch (error) {
    if (error?.code !== "NOT_A_RECIPIENT") throw error;
  }

  const envelopeText = envelopeToText(envelope);
  const matchingRecipientOpen =
    opened.length === plaintext.length && opened.every((value, index) => value === plaintext[index]);
  if (!matchingRecipientOpen || outsiderOpen) throw new Error("ML-KEM proof failed");

  return {
    schema: "future-post-local-mlkem-proof/v1",
    algorithm: "ML-KEM-1024",
    scenario: SCENARIO,
    benefit: "Only the intended colleague can open the private welcome letter",
    plaintextSha256: await sha256(plaintext),
    envelopeSha256: await sha256(envelopeText),
    publicKeySha256: await sha256(recipient.mlkemPublicKey),
    publicKeyBytes: recipient.mlkemPublicKey.length,
    envelopeBytes: utf8(envelopeText).length,
    matchingRecipientOpen,
    outsiderOpen,
    evidenceBoundary: "LOCAL_FUNCTIONAL_PROOF_NOT_CHAIN_REGISTRATION"
  };
}
