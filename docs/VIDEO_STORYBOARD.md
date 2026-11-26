# Video storyboard (maximum 3 minutes)

Target: about 1:35, screen-only, no face or owner voice. The review repairs are applied to this revision.

| Time | Screen | Narration / caption | Evidence shown |
|---|---|---|---|
| 0:00–0:10 | Empty desk, Future Post mailbox and unopened welcome | “A welcome for day one should be personal — and stay private. That’s why we made Future Post.” | Product problem and self-made mascot |
| 0:10–0:23 | Main page hero: private first-day welcome | “Future Post lets a team prepare a welcome letter for the day a colleague arrives.” | Real `index.html` hero |
| 0:23–0:42 | Press **Run the private welcome proof** once; begin the usable shot after the result appears | “We wanted a lock only the intended colleague could open. Official QoreSeal — QoreChain’s post-quantum tool — seals the welcome in the browser with ML-KEM-1024.” | Real in-browser operation; no wallet popup |
| 0:42–0:53 | Intended `OPENED`, outsider `REFUSED`, safe envelope hash | “The intended colleague opens it. An outsider is refused. Private keys and plaintext never appear on screen.” | Box browser result; favicon supplied; no console error beyond any environment noise |
| 0:53–1:08 | Diana fingerprint card and live transaction link | “We wanted a public record, without publishing the letter. QoreChain’s hybrid signature placed the reviewed public-key fingerprint on Diana — confirmed at height 10719012, code 0.” | Tx `A6633E…A0E27`, height 10719012, code 0, hybrid verification |
| 1:08–1:23 | Enter Account 1 `qor1rgsq0sgpww6yevnmedlqe797tc4v57u4as0w52`, compose a short welcome, then frame only **Your letter is waiting** and the countdown | “The composer brings the recipient, opening time and encrypted content into one clear waiting experience.” | Real local composer and countdown |
| 1:23–1:35 | Mailbox closing view with proof and commitment cards | “Future Post turns a first-day welcome into a private moment, with QoreSeal’s post-quantum proof and a verifiable QoreChain commitment.” | Solved close with QoreSeal and QoreChain named |

## Recording gate

Use the real app and the exact evidence above. Capture the proof card only after `OPENED` / `REFUSED` appears. The initial UI now says `READY`, and the scope labels use neutral achieved wording. Keep the local ML-KEM proof and the Diana fingerprint commitment as separate evidence.

For the composer shot, open `index.html?shot=1` and use Account 1 `qor1rgsq0sgpww6yevnmedlqe797tc4v57u4as0w52`. Shot mode hides only the local receipt row, opening-day control and lower note; the normal app keeps them. After submitting, frame **Your letter is waiting**, LOCKED, the countdown and Recipient. Do not press **Prepare share B release**.

Do not show a wallet signature or key registration flow. Use the live transaction URL already linked by the app. Optional closing shot (within the 3-minute limit): the explorer page of the live letter's release transaction.

Credits caption: `Created by inunanba · QoreSeal and QoreChain developer kits · Future Post original UI and artwork · AI-assisted development disclosed in the repository`

If synthetic narration is used, name and credit the tool and voice in the final video description. Silence plus captions is acceptable.
