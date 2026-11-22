# Google Stitch Prompts — KaamBill UI/UX

> Related documents: [`problemStatement.md`](../docs/problemStatement.md) · [`architecture.md` §3, §7](../docs/architecture.md) · [`implementationPlan.md`](../docs/implementationPlan.md) · [`phase-1-ui-ux-design/`](./)
>
> **How to use:** in [Google Stitch](https://stitch.withgoogle.com), choose **Mobile**. Paste the **Master Prompt (§1)** first to set the design system and app shell. Then paste each **screen prompt (§2)** _in the same project_, one at a time, so every screen inherits the same style. Use the **refinement prompts (§3)** to adjust. Export the screens to **Figma** and **HTML/Tailwind** for Phase 2.
>
> 💡 Dictate your own changes into Stitch with **Wispr Flow**, and record that as evidence for judging.

---

## 1. Master Prompt (paste first)

```text
Design a mobile-first Android app called "KaamBill": a hands-free, voice-first billing assistant for Indian tradespeople (electricians, plumbers, AC mechanics, carpenters). The worker speaks one sentence in Hinglish, like "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do", and the app builds an itemized bill live, reads the total back by voice, and shares a PDF bill with a UPI payment QR on WhatsApp.

USERS & CONTEXT
- Blue-collar workers on job sites with dusty or wet hands, using low-end Android phones (360×800), often in bright sunlight and noise.
- Not comfortable with English or accounting software. They speak Hinglish, Hindi or simple English. They use WhatsApp and UPI daily.
- The screen is for GLANCING and FIXING, not typing. Voice is the main input.

DESIGN SYSTEM
- Style: clean, friendly, high-contrast, trustworthy, like a modern Indian fintech (simple, not corporate). Flat with soft shadows, 16px rounded corners.
- Colours:
  - Primary (brand, money, success): deep green #0B7A4B; tint #E7F5EE
  - Surface/background: warm off-white #FAFAF7; cards white #FFFFFF
  - Text: near-black #111827; secondary #4B5563
  - Amber #F59E0B with tint #FFF4DB: ONLY for "low-confidence, please check" items
  - Red #DC2626: errors only
  - Listening state accent: blue #2563EB (pulsing)
- Typography: Noto Sans (supports Devanagari). Body 18px, labels 16px, money totals 32–40px bold with tabular numbers. Show rupees as ₹1,235 with Indian digit grouping.
- Touch targets ≥ 48px; the main mic button is 88px, centered at the bottom, reachable by a thumb.
- Icons: simple outlined icons with text labels (never icon-only for important actions).
- Microcopy: short Hinglish in Latin script (e.g. "Bol ke bill banaiye", "Sun raha hoon...", "Bhej doon?"), with no accounting jargon (no "SKU", "subtotal", "ledger").

APP SHELL (on every main screen)
- Top bar: "KaamBill" wordmark on the left; on the right a language chip "Hinglish ▾" and a "Rate Card" button with a list icon.
- Center: the content area (bill card or empty state).
- Bottom dock: a large circular mic button with a waveform ring, a one-line status label above it ("Tap karke boliye" / "Sun raha hoon..." / "Rate check kar raha hoon..." / "'Haan' ka intezaar..."), a live transcript line, and a small keyboard icon to the left of the mic that opens a text input ("Likh ke ya Wispr Flow se boliye").

Generate the HOME screen first: an empty state with a friendly illustration of a worker's toolbox, the headline "Bol ke bill banaiye", an example sentence in a light grey speech bubble, the 3 most recent bills as compact cards (customer name, ₹ total, status pill "Bheja gaya" / "Paid"), and the bottom dock.
```

---

## 2. Screen Prompts (paste one at a time, same project)

### S1. Onboarding: worker profile (first launch)

```text
Create a 3-step onboarding flow using the same design system.
Step 1: "Namaste! Aapka naam?" with a big mic button and a text field below it; show a filled example "Ramesh Electricals".
Step 2: "Aapka UPI ID?" with a text field (example "ramesh@okaxis"), and a preview card showing how the customer will see it: "Payment to: Ramesh Electricals".
Step 3: "Aapke rate card mein 15 common items pehle se hain" with a scrollable preview list of items with prices (Havells MCB 16A ₹180, Finolex wire 1.5mm ₹25/m, ...) and a primary button "Shuru karein".
A progress indicator with 3 dots at the top. Big primary buttons at the bottom.
```

### S2. Listening state

```text
Create the LISTENING state of the home screen. The mic button is active: blue #2563EB, with an animated pulsing waveform ring. The status label says "Sun raha hoon...". The live transcript shows streaming text in large 20px font: "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex..." with the last word slightly faded to show it is still being heard. The content area dims slightly. A small "Ruk jaiye" (stop) text button sits below the mic.
```

### S3. Live bill building (core screen)

```text
Create the LIVE BILL screen: the most important screen. The center shows a white bill card that is filling in live:
- Header: "Bill" pill (green) + customer "Verma ji" + date "21 Nov".
- Line items as large tappable rows (chips): "Havells MCB 16A · 2 × ₹180 = ₹360", "Finolex wire 1.5mm · 15 m × ₹25 = ₹375".
- ONE row is highlighted in AMBER (#FFF4DB background, #F59E0B left border, small "Check karein" tag): "Finolex wire · 15 m?". This means low confidence.
- "Labour ₹500" row.
- A divider, then the total in large bold text: "Total ₹1,235".
- The newest row has a subtle green highlight animation.
The bottom dock shows the status "Rate check kar raha hoon..." and the transcript of what was heard. Show a small edit pencil on each row to show it can be tapped to fix.
```

### S4. Single clarifying question

```text
Create the CLARIFYING QUESTION state. Over the live bill card, a question banner slides up from above the bottom dock (not a full-screen modal). It has a speaker icon (meaning the app is saying it aloud) and one short question in 20px bold: "Finolex 2.5mm wire ka rate kitna hai?". Below it are 2–3 quick-reply chips with suggested answers: "₹25 / meter", "₹30 / meter", "Bolke bataiye". The mic is ready (green outline). Only ONE question is ever shown at a time.
```

### S5. Low-confidence confirmation

```text
Create the LOW-CONFIDENCE CONFIRMATION state. The amber row "Finolex wire · 15 m" is enlarged and focused. A compact banner says "15 meter wire, sahi hai?" with two huge buttons side by side: "Haan ✓" (green) and "Badlein ✎" (outline). A small hint below: "Ya bas 'haan' boliye".
```

### S6. Read-back and approval

```text
Create the READ-BACK / APPROVAL screen. The bill card is complete with no amber rows. A large summary panel above the dock shows: a speaker icon with "Verma ji ka total ₹1,235 bana hai, 3 items ke saath. WhatsApp par bhej doon?" and the total ₹1,235 in 40px bold green. Two big actions: primary "Haan, bhejo" with a WhatsApp icon, and secondary "Badlav karna hai". The status label reads "'Haan' ka intezaar...". The mic glows softly to show it is listening for "haan" or "bhej do".
```

### S7. Share preview (UPI QR + PDF)

```text
Create the SHARE PREVIEW screen. At the top a success tick: "Bill taiyaar hai". The center shows a preview of the PDF bill as a paper-like card with the worker name "Ramesh Electricals", bill no. "KB-2026-0042", the item table (2 × Havells MCB ₹360, 15 m Finolex wire ₹375, labour ₹500), total ₹1,235, and a large scannable UPI QR code labelled "Scan karke pay karein · Payment to Ramesh Electricals". Small footer text on the bill: "Bill / Estimate — not a GST tax invoice". Below it, a full-width WhatsApp-green button "WhatsApp par bhejein", plus secondary buttons "PDF download" and "Link copy". A note: "Aap Send dabayenge tabhi bill jayega" (the bill only goes when you press Send).
```

### S8. Rate card drawer

```text
Create the RATE CARD screen as a bottom sheet that covers 85% of the screen. Title "Mera Rate Card" with a search bar ("Item dhoondhein ya boliye") with a mic icon. Category tabs: "Sab", "Bijli", "Plumbing". A list of items, each row showing name, unit, price in bold, and an edit icon, e.g. "Havells MCB 16A · piece · ₹180", "Finolex wire 1.5mm · meter · ₹25". One row shows a small "Naya" (new) tag: "Anchor fastener · piece · ₹5" (learned from voice). A floating button "+ Item jodein" and a hint at the bottom: "Bolke rate badlein: 'MCB ka rate 200 kar do'".
```

### S9. Bill history

```text
Create the BILL HISTORY screen. A summary strip at the top: "Is hafte: ₹14,250 · 11 bills · 8 paid". Filter chips: "Sab", "Baaki" (unpaid), "Paid". A list of bill cards with customer name, date, ₹ total (bold), and a status pill (amber "Baaki", green "Paid", grey "Draft"). Each card has a "Paid mark karein" action and a "Phir bhejein" (resend) action. Bottom nav or back arrow to home.
```

### S10. Edge states

```text
Create 3 small edge-state variants of the home screen:
1) MIC BLOCKED: a banner "Mic band hai — likh ke bhi bata sakte hain"; the text input is open and focused with the placeholder "Likhein ya Wispr Flow se boliye..." and a send button.
2) OFFLINE: a grey top banner "Internet nahi hai — bill save ho gaya, baad mein process hoga"; the bill card is shown with a small "Queue mein" tag.
3) ERROR: a soft red banner "Samajh nahi aaya, ek baar phir boliye" with a "Phir se" button. The mic is ready.
```

### S11. Customer-facing PDF bill (printable)

```text
Create a printable bill/receipt layout (A6 portrait, also readable on a phone in WhatsApp). Header: worker's business name "Ramesh Electricals", phone, "Bill No. KB-2026-0042", date. "Bill to: Verma ji". An item table with columns Item | Qty | Rate | Amount. A labour row. A bold TOTAL ₹1,235. A large UPI QR code with "Scan to pay · Payment to Ramesh Electricals · ₹1,235". Footer: "Bill / Estimate — not a GST tax invoice · Made with KaamBill". Clean black-and-white friendly, with one green accent.
```

---

## 3. Refinement Prompts (use as needed)

```text
Increase all touch targets to at least 56px and the mic button to 96px; make the total text 40px.
```

```text
Check contrast: all text must meet WCAG AA in bright sunlight; darken the secondary text to #374151.
```

```text
Make the amber "check" state more obvious but not alarming: add a small "?" badge, and keep red only for errors.
```

```text
Show this screen in Hindi (Devanagari) to test font support: "बोल के बिल बनाइए", "कुल ₹1,235".
```

```text
Create a dark mode variant with the same colours adjusted for OLED (#0B0F0D background, green #34D399).
```

```text
Reduce visual clutter: remove decorative elements and keep only the bill card, the total and the mic dock.
```

---

## 4. Screen ↔ State Machine Map

Each screen matches a state in [`architecture.md` §3](../docs/architecture.md):

| Screen                         | State                          | Component(s) in [`architecture.md` §7](../docs/architecture.md) |
| ------------------------------ | ------------------------------ | --------------------------------------------------------------- |
| Home (master)                  | `idle`                         | `MicButton`, `StatusLabel`, `TextInput`                         |
| S2 Listening                   | `listening`                    | `MicButton` (active), `LiveTranscript`                          |
| S3 Live bill                   | `processing`                   | `InvoiceCard`, `ItemChip`, `TotalRow`                           |
| S4 Clarifying question         | `clarifying`                   | Question banner                                                 |
| S5 Low-confidence confirmation | `confirmingLowConf`            | Amber `ItemChip` + confirm banner                               |
| S6 Read-back                   | `readBack` → `awaitApproval`   | Summary panel                                                   |
| S7 Share preview               | `finalized` → `sharePreview`   | `UpiQr`, PDF preview, share button                              |
| S8 Rate card                   | (drawer, any state)            | `RateCardDrawer`                                                |
| S9 History                     | (separate route)               | `History`                                                       |
| S10 Edge states                | errors / offline / mic blocked | Banners, `TextInput`                                            |
| S11 PDF                        | output                         | `pdf.ts` layout                                                 |

> The full screen ↔ folder ↔ component inventory is in [`architecture.md` §7.2](../docs/architecture.md).

---

## 5. Sync-Fix Prompts (after the first Stitch export)

The first export is in [`phase-1-ui-ux-design/design/`](./design/). Reviewing it against [`architecture.md` §7.3–7.4](../docs/architecture.md) found the problems below. Open each screen in the **same Stitch project**, paste its fix prompt, and re-export `screen.png` + `code.html` into the same folder.

| #   | Screen folder                         | Problem                                                                                                                                               | Severity                |
| --- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| F1  | `kaambill_live_bill_assembling`       | "Bhejo WhatsApp par" goes straight to sharing and **skips the read-back**                                                                             | 🔴 Breaks a safety rule |
| F2  | `kaambill_read_back_aur_approval`     | "turant WhatsApp par bhej diya jayega" **implies an automatic send**                                                                                  | 🔴 Breaks a safety rule |
| F3  | Most screens (voice dock, transcript) | "Wispr AI", "Wispr Live", "Wispr Flow Active" suggest Wispr powers the mic; it doesn't. Wispr Flow is used through the text box (architecture §5.1.1) | 🟠 Misleading           |
| F4  | `kaambill_live_bill_assembling`       | "Taxes Samahit Hain" (taxes included) contradicts "not a GST tax invoice"                                                                             | 🟠 Compliance           |
| F5  | `onboarding_2_upi_id_setup`           | "Bank Linked ✓" / "Verified KaamBill Merchant" can't be verified                                                                                      | 🟠 Trust                |
| F6  | S3, S4, S5, S6, S7, S9, S10, S11      | Totals, bill numbers and labour differ (₹1,235 vs ₹1,735; KB-8842 / KB-892 / KB-2026-0042)                                                            | 🟡 Demo consistency     |
| F7  | `kaambill_bol_ke_bill_banaiye`        | Home is in Devanagari while the language chip says "Hinglish"                                                                                         | 🟡 Consistency          |
| F8  | `kaambill_read_back_aur_approval`     | "Site Photo & Meter Proof" isn't in prototype scope                                                                                                   | 🟡 Scope                |
| F9  | `kaambill_printable_receipt_a6`       | Shows the onboarding step header ("1 2 3", Skip) above the receipt                                                                                    | 🟡 Layout               |

**F1: live bill send button**

```text
On this live bill screen, replace the "Bhejo WhatsApp par →" button with a primary button "Total dekhein aur bhejein →" that leads to the read-back screen. Remove the "Grahak ko WhatsApp par bhejenge" info card. The bill must always be read back and approved before sharing.
```

**F2: read-back wording**

```text
Change the text under the final total to: "Haan bolte hi WhatsApp khulega — bill aur UPI QR ready honge. Aap Send dabayenge tabhi Verma ji ko jayega." Keep the buttons "Haan, bhejo" and "Badlav karein".
```

**F3: Wispr labels (apply to every screen with the voice dock)**

```text
In the voice dock, remove the "Wispr Flow Active" label (keep "Tap karke boliye"). In the transcript card, change "Awaz se pakda gaya (Wispr AI)" to "Awaz se pakda gaya" and "Wispr Live" to "Live". On the "Likh Ke" text input only, use the placeholder "Likhein ya Wispr Flow se boliye..." with a small mic-keyboard hint icon.
```

**F4: tax wording**

```text
Under "Kul Rashi (Grand Total)", replace "Taxes Samahit Hain" with "Bill / Estimate".
```

**F5: UPI trust badges**

```text
Remove "Bank Linked ✓" and "Verified KaamBill Merchant". Under the UPI field show "UPI ID ka format sahi hai ✓" only after it is entered. Keep the "Payment To Ramesh Electricals" preview.
```

**F6: canonical demo data (apply to each listed screen)**

```text
Use exactly this data: customer "Verma ji, Sector 4"; items "Havells MCB 16A · 2 × ₹180 = ₹360", "Finolex wire 1.5mm · 15 m × ₹25 = ₹375", "Labour ₹500"; total "₹1,235"; 3 items; bill no. "KB-2026-0042"; worker "Ramesh Electricals", UPI "ramesh@okaxis". Remove any other items, visiting charges and discounts from this bill.
```

_(Exception: S4 keeps its scenario of the "Finolex 2.5mm wire" price question; only change the bill number and customer to match.)_

**F7: Hinglish home**

```text
Regenerate this home screen in Hinglish (Latin script) to match the "Hinglish" language chip, using the same layout. Keep the Devanagari version as a separate "Hindi" variant.
```

**F8: remove site photos**

```text
Remove the "Site Photo & Meter Proof" section from this read-back screen.
```

**F9: receipt layout**

```text
Remove the onboarding header (step dots 1-2-3 and Skip) from this receipt screen; show only a simple top bar "Bill Preview" with a back arrow and the share / download / print actions.
```

---

## 6. Prompt ↔ Export Folder Map

| Prompt           | Export folder(s)                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| §1 Master (Home) | `kaambill_bol_ke_bill_banaiye`, `worker_toolbox_illustration`, `bharat_trades_kinetic/DESIGN.md`  |
| S1               | `onboarding_1_aapka_naam`, `onboarding_2_upi_id_setup`, `onboarding_3_rate_card_setup`            |
| S2               | `kaambill_sun_raha_hoon_listening_state`                                                          |
| S3               | `kaambill_live_bill_assembling`                                                                   |
| S4               | `kaambill_sawaal_clarifying_question`                                                             |
| S5               | `kaambill_low_confidence_confirmation`                                                            |
| S6               | `kaambill_read_back_aur_approval`                                                                 |
| S7               | `kaambill_share_preview`                                                                          |
| S8               | `kaambill_mera_rate_card`                                                                         |
| S9               | `kaambill_bill_history`                                                                           |
| S10              | `kaambill_mic_blocked_fallback`, `kaambill_offline_queue_mode`, `kaambill_error_samajh_nahi_aaya` |
| S11              | `kaambill_printable_receipt_a6`                                                                   |
