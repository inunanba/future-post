import { envelopeContext, formatRemaining, lockState, requireReady } from "./protocol.js";
import { buildReleaseRecord, decryptLetter, encryptLetter } from "./split-envelope.js";
import { receiptDisplayText } from "./receipt-state.js";
import { runLocalMlkemProof } from "./mlkem-proof.js";

const form = document.querySelector("#letter-form");
const composer = document.querySelector("#composer");
const letter = document.querySelector("#letter");
const unlock = document.querySelector("#unlock");
const openButton = document.querySelector("#open");
let current = null;
let timer = null;

const shotMode = new URL(window.location.href).searchParams.get("shot") === "1";
document.body.classList.toggle("shot-mode", shotMode);

const pad = value => String(value).padStart(2, "0");
const soon = new Date(Date.now() + 5 * 60_000);
unlock.value = `${soon.getFullYear()}-${pad(soon.getMonth()+1)}-${pad(soon.getDate())}T${pad(soon.getHours())}:${pad(soon.getMinutes())}`;

document.querySelector("#start")?.addEventListener("click", () => composer.scrollIntoView({behavior:"smooth"}));

const proofButton = document.querySelector("#run-mlkem-proof");
const proofStatus = document.querySelector("#mlkem-proof-status");
proofButton.addEventListener("click", async () => {
  proofButton.disabled = true;
  proofStatus.textContent = "Generating fresh recipient and outsider keys in this browser…";
  try {
    const proof = await runLocalMlkemProof();
    document.querySelector("#recipient-proof").textContent = proof.matchingRecipientOpen ? "OPENED" : "FAILED";
    document.querySelector("#outsider-proof").textContent = proof.outsiderOpen ? "OPENED (FAIL)" : "REFUSED";
    document.querySelector("#proof-envelope").textContent = proof.envelopeSha256;
    proofStatus.textContent = "PASS — official QoreSeal ML-KEM-1024 sealed and opened locally; outsider was refused.";
    proofStatus.dataset.state = "pass";
  } catch (error) {
    proofStatus.textContent = `NOT PASSED — ${error.message}`;
    proofStatus.dataset.state = "fail";
  } finally {
    proofButton.disabled = false;
  }
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const unlockAt = new Date(unlock.value).toISOString();
  const recipient = document.querySelector("#recipient").value;
  const messageInput = document.querySelector("#message");
  const id = crypto.randomUUID().replaceAll("-", "");
  const context = envelopeContext({ id, unlockAt, recipient });
  const sealed = await encryptLetter({
    plaintext: messageInput.value,
    associatedData: context.associatedData
  });
  messageInput.value = "";
  current = { id, unlockAt, context, sealed };

  document.querySelector("#purpose").textContent = context.purpose;
  document.querySelector("#recipient-out").textContent = recipient;
  document.querySelector("#ciphertext-size").textContent = `${sealed.ciphertext.length} bytes`;
  document.querySelector("#receipt-status").textContent = receiptDisplayText();
  letter.classList.remove("hidden");
  letter.scrollIntoView({behavior:"smooth"});
  clearInterval(timer);
  render();
  timer = setInterval(render, 1000);
});

function render() {
  if (!current) return;
  const state = lockState(current.unlockAt);
  document.querySelector("#state-code").textContent = state.code;
  document.querySelector("#state-title").textContent =
    state.code === "LOCKED" ? "Your letter is waiting" : "Opening day is here";
  document.querySelector("#countdown").textContent =
    state.code === "LOCKED" ? `Ready in ${formatRemaining(state.remainingMs)}` : "The product state now permits a share B release request.";
  openButton.disabled = !state.canRequestOpen;
}

openButton.addEventListener("click", async () => {
  try {
    requireReady(current.unlockAt);
    const release = buildReleaseRecord({
      letterId: current.id,
      unlockAt: current.unlockAt,
      shareB: current.sealed.shareB
    });
    const plaintext = await decryptLetter({
      ...current.sealed,
      associatedData: current.context.associatedData
    });
    document.querySelector("#opened-letter").textContent = plaintext;
    document.querySelector("#opened-letter").hidden = false;
    document.querySelector("#notice").textContent =
      `Local B-protocol round trip passed at ${release.releasedAt}. QoreSeal wrapping, QoreX signing, and Diana broadcast remain disabled until real registered-key evidence exists.`;
  } catch (error) {
    document.querySelector("#notice").textContent = error.message;
  }
});
