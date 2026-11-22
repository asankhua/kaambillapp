# Phase 5: Output and Share

|                |                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Dates**      | 25 Nov 2026                                                                                                                                                        |
| **Goal**       | After a "_Haan_", fix the bill and generate the UPI link, QR code and PDF, then open the WhatsApp share. **The worker taps Send; the app never sends on its own.** |
| **Builds**     | [`architecture.md` §5.7, §6](../docs/architecture.md) · [`problemStatement.md` → Constraints](../docs/problemStatement.md)                                         |
| **Depends on** | Phase 1 (S1, S7, S9, S11 designs), Phase 4 (finalized `DraftBill`)                                                                                                 |

---

## 1. Tasks

### 1.1 Worker profile and onboarding (`src/profile.ts`, `src/ui/Onboarding.tsx`)

- [ ] **3-step onboarding** with a progress bar, Hindi/EN switch and Skip:
  - **S1a** (`onboarding_1_aapka_naam`): name by voice or text, trade chips, bill-name preview
  - **S1b** (`onboarding_2_upi_id_setup`): UPI ID by text or voice, app chooser, **format check only** (fix **F5**), live "Payment to …" preview
  - **S1c** (`onboarding_3_rate_card_setup`): review the 15 seed items, "Badlein" / "Rate bole", "+ Naya item"
- [ ] The **Khata** tab (`KhataScreen.tsx`) reopens the profile and UPI settings.
- [ ] First-run onboarding, by voice or text: name, UPI ID (VPA), optional business name and phone number.
- [ ] Check the VPA format (`^[\w.\-]{2,}@[a-zA-Z]{2,}$`) and show the worker's name on a preview.

### 1.2 UPI deep link and QR (`phase-5-output-share/src/upi.ts`)

- [ ] `upi://pay?pa={vpa}&pn={encodeURIComponent(workerName)}&am={total}.00&cu=INR&tn={encodeURIComponent("Bill " + billNo)}`.
- [ ] `pn` is the **worker's name**, not "KaamBill" ([`architecture.md` §5.7](../docs/architecture.md)).
- [ ] QR code generated from the link with `qrcode` (on the device, error correction level M).
- [ ] Test by scanning with GPay, PhonePe and Paytm: the right name and amount must be pre-filled.

### 1.3 PDF receipt (`phase-5-output-share/src/pdf.ts`)

- [ ] `jspdf`, A6 or receipt width, containing worker name/phone, bill no., date, customer, item table, labour/visiting, **total**, UPI QR, and the footer _"Bill / Estimate — not a GST tax invoice"_ ([`problemStatement.md`](../docs/problemStatement.md)).
- [ ] Use a Devanagari-capable font (e.g. Noto Sans Devanagari) so Hindi customer names render correctly.
- [ ] Target file size under 200 KB.

### 1.4 WhatsApp share (`phase-5-output-share/src/share.ts`): S7 `kaambill_share_preview`, S11 `kaambill_printable_receipt_a6`

- [ ] Share preview: "Bill taiyaar hai!", PDF + QR preview, **WhatsApp par bhejein**, **PDF download**, **Link copy**, and the note "_Aap Send dabayenge tabhi bill jayega_". The receipt preview also has **Print**; remove its onboarding header (fix **F9**).
- [ ] Main path: `navigator.share({ files: [pdf], text })` (Web Share API Level 2 on Android Chrome).
- [ ] Fallback: `https://wa.me/{customerPhone}?text={summary + upi link}` if file sharing isn't supported.
- [ ] Message text: "_Namaste {customer}, aapka bill ₹{total}. UPI se pay karein: {link}_"
- [x] Completion line shown **after** the share sheet opens (no audio): "_Bill taiyaar hai, WhatsApp khul gaya hai — bas Send dabaiye._"

### 1.5 Bill history (`phase-5-output-share/src/history.ts`): S9 `kaambill_bill_history`, **Bills** tab

- [ ] Weekly summary ("_Is hafte ki kul kamai_", collected vs pending) and filters **Sab · Baaki · Paid · Drafts**.
- [ ] `BillCard`: **Paid mark** (asks UPI or cash → `paid_via`), **Phir bhejein**, **Receipt dekhein**, "Poora karein" for drafts.
- [ ] Voice commands through the `history` intent: "_Verma ji ka bill paid mark kar do_", "_Kal ka Sharma ji wala bill bhejo_".
- [ ] Fill Home's `RecentBills` and `TodaySummary` (Phase 2 placeholders).
- [ ] Save finalized bills to IndexedDB with status `finalized → shared`; the worker can tap **Mark paid**.
- [ ] A simple list screen: date, customer, total, status (used for the "income record" story in the pitch).

## 2. Files Created

| File                                                        | Purpose                |
| ----------------------------------------------------------- | ---------------------- |
| `src/profile.ts`                                            | Worker name and UPI ID |
| `phase-5-output-share/src/upi.ts`, `qr.ts`                  | Deep link + QR         |
| `phase-5-output-share/src/pdf.ts`                           | Receipt PDF            |
| `phase-5-output-share/src/share.ts`                         | Web Share / `wa.me`    |
| `phase-5-output-share/src/history.ts`, `src/ui/History.tsx` | Bill history           |

## 3. Tests

- **Unit:** UPI link encoding (spaces, Hindi names, amounts); `pn` always comes from the profile.
- **Manual:** scan the QR with 3 UPI apps; share the PDF to WhatsApp on 2 Android phones (one low-end).
- **Offline:** with the phone in flight mode, an already-finalized bill still generates its PDF, QR and share.

## 4. Acceptance Criteria

- The full definition-of-done flow ([`../implementationPlan.md` §8](../docs/implementationPlan.md)) works end to end on a real phone in **under 25 s**.
- The UPI apps show the **worker's name** and the correct amount.
- Nothing is sent without the worker tapping Send.

## 5. Wispr Flow Evidence

- 🎥 A clip of dictating the PDF layout or share-message template with Flow.

## 6. Exit Checklist

- [ ] UPI QR checked on 3 apps
- [ ] PDF share works on 2 devices
- [ ] Bill history saved

## 7. Progress (21 Nov)

| Item                                                                                                                                                                                                                                                                                                                                                                                                      | Status                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Profile store + 3-step onboarding (S1a–c), Khata tab; UPI **format check only** (F5)                                                                                                                                                                                                                                                                                                                      | ✅                                                                 |
| `output/upi.ts`: `pn` = worker, `am` 2 decimals, `cu=INR`, `tn=Bill KB-…`; never "KaamBill"                                                                                                                                                                                                                                                                                                               | ✅ tested                                                          |
| `output/qr.ts` (error correction M) · `output/pdf.ts` (A6, Noto subsets with ₹, GST footer, **19.5 KB**)                                                                                                                                                                                                                                                                                                  | ✅ rendered and checked                                            |
| `output/share.ts`: Web Share with the PDF file → fallback `wa.me/91…`; cancel = nothing sent                                                                                                                                                                                                                                                                                                              | ✅ both paths tested                                               |
| S7 `SharePreview` (QR + PDF pre-built on open; download / copy / print; completion line shown after the share opens)                                                                                                                                                                                                                                                                                      | ✅                                                                 |
| `domain/bill/history.ts` + S9 `History` (weekly summary, filters, Paid via UPI/cash, Phir bhejein) + voice commands (mark paid / resend, "aaj"/"kal")                                                                                                                                                                                                                                                     | ✅                                                                 |
| Home: "Aaj ki kamai" + recent bills                                                                                                                                                                                                                                                                                                                                                                       | ✅                                                                 |
| **Customer journey (21 Nov):** step indicator Saaman → Jaanch → Details → Payment → Bill; **S7a Payment details** (total, payee UPI ID + Badlein, customer number, UPI / Cash / Baad mein), **S7b Payment** (UPI QR with amount → "Paisa mil gaya ✓", cash confirm; paid = the worker's confirmation, KaamBill can't see payments), **S7c Invoice** with PAID / DUE badge; PDF and WhatsApp message match | ✅ unit (`pdf.test.ts`) + e2e (UPI paid, cash, baad mein, Badlein) |
| **Saved drafts** (`drafts.ts`, IndexedDB `draft.v1`, `draft`/`queued`): S9 **Drafts** filter, "Poora karein" (resume) / "Hata dein"; cleared on finalize                                                                                                                                                                                                                                                  | ✅ unit + e2e                                                      |
| S9 **search** (customer, bill no., items, transcript) + "Suna gaya" transcript and 📱 phone on each bill; phone prefilled on S7 and saved on share                                                                                                                                                                                                                                                        | ✅ unit + e2e                                                      |
| Offline: service worker precaches app + jsPDF + fonts; app opens offline; turn queued (S10b) → processed online                                                                                                                                                                                                                                                                                           | ✅ e2e                                                             |
| Scan the QR with GPay / PhonePe / Paytm; share the PDF to WhatsApp on 2 Android phones                                                                                                                                                                                                                                                                                                                    | ⬜ you                                                             |

---

<!-- code-index:start -->

## Code in this folder

**Config in this folder:** [`package.json`](./package.json) · [`tsconfig.json`](./tsconfig.json)

Run this phase's tests: `npm run test:phase -- 5` (add `--unit` to skip the browser tests).

**Browser code (`src/`)**

- [`src/drafts.test.ts`](./src/drafts.test.ts) 🧪
- [`src/drafts.ts`](./src/drafts.ts)
- [`src/history.ts`](./src/history.ts)
- [`src/output.test.ts`](./src/output.test.ts) 🧪
- [`src/pdf.ts`](./src/pdf.ts)
- [`src/profile.ts`](./src/profile.ts)
- [`src/qr.ts`](./src/qr.ts)
- [`src/share.ts`](./src/share.ts)
- [`src/ui/History.tsx`](./src/ui/History.tsx)
- [`src/ui/Home.tsx`](./src/ui/Home.tsx)
- [`src/ui/Onboarding.tsx`](./src/ui/Onboarding.tsx)
- [`src/ui/SharePreview.tsx`](./src/ui/SharePreview.tsx)
- [`src/upi.ts`](./src/upi.ts)

**PDF fonts**

- [`fonts/LICENSE-OFL.txt`](./fonts/LICENSE-OFL.txt)
- [`fonts/NotoSans-Bold.subset.ttf`](./fonts/NotoSans-Bold.subset.ttf)
- [`fonts/NotoSans-Regular.subset.ttf`](./fonts/NotoSans-Regular.subset.ttf)
- [`fonts/NotoSansDevanagari-Regular.subset.ttf`](./fonts/NotoSansDevanagari-Regular.subset.ttf)

**End-to-end tests**

- [`e2e/offline.spec.ts`](./e2e/offline.spec.ts) 🧪
- [`e2e/output.spec.ts`](./e2e/output.spec.ts) 🧪

🧪 = test file.

<!-- code-index:end -->
