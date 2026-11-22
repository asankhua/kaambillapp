# Phase 4: Billing Domain

|                |                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Dates**      | 24–25 Nov 2026                                                                                                                                               |
| **Goal**       | Plug KaamBill's domain into the voice core: rate card, fuzzy matching, the draft bill, a single clarifying question, amber chips and the on-screen read-back |
| **Builds**     | [`architecture.md` §3 (clarification order), §4.2–4.3, §5.4, §5.5, §7](../docs/architecture.md)                                                              |
| **Depends on** | Phase 1 (S3–S6, S8 designs), Phase 2 (`DomainAdapter`), Phase 3 (`Extraction`)                                                                               |

---

## 1. Tasks

### 1.1 Rate card (`src/rateCard/`)

- [ ] IndexedDB store seeded from `seed/rateCard.json` on first launch.
- [ ] `RateCardDrawer` UI: list, edit price, add an item. **Voice editing too:** "_Finolex wire ka rate 28 kar do_".
- [ ] **Learning:** when the worker states a price for an unknown item and confirms it, save it as a new entry with the spoken words as an alias ([`architecture.md` §5.4](../docs/architecture.md)).

### 1.2 Matcher (`src/match/`)

- [ ] Stage 1: exact match on name or alias (lower-cased, punctuation stripped).
- [ ] Stage 2: `fuse.js` over names and aliases **plus** a phonetic key for Indian spellings (ph→f, v↔w, double letters collapsed, spelled-out letters "em-see-bee" → "mcb").
- [ ] Return `{ entry, score }`; a score below **0.6** means `unmatched` ([`architecture.md` §5.5](../docs/architecture.md)).
- [ ] Brand-only mentions ("_2 Havells_") match the most-used item of that brand and are flagged amber.

### 1.3 Bill model and adapter (`src/bill/`)

- [ ] `DraftBill` with priced line items, labour, visiting charge and customer, following [`architecture.md` §4.3](../docs/architecture.md).
- [ ] `applyTurn()`: merge the new extraction into the draft. Handles **corrections** ("_15 nahi 20_" updates the quantity of the matching item) and **additions**.
- [ ] Combined confidence = `min(stt, extraction, match)`. Above 0.85 shows normally, 0.6–0.85 shows amber, below 0.6 counts as missing ([`architecture.md` §5.5](../docs/architecture.md)).
- [ ] Totals use **whole rupees** (integer maths, no floating-point rounding errors).
- [ ] Bill number: `KB-{yyyy}-{seq}`, with the sequence stored in IndexedDB.

### 1.4 Clarifier: one question at a time (`phase-4-billing-domain/src/clarify.ts`)

In this priority order ([`architecture.md` §3](../docs/architecture.md)):

1. [ ] An item with no saved price → "_{item} ka rate kitna hai?_"
2. [ ] No customer name → "_Kiske naam pe bill banana hai?_"
3. [ ] An amber item → "_{qty} {unit} {item}, sahi hai?_"
4. [ ] Labour → asked only if the "always ask labour" setting is on.

- [ ] Bill vs Estimate is **never asked**; it defaults to Bill.

### 1.5 Read-back (`src/clarify.ts`)

- [ ] Template: "_{customer} ka total ₹{total} bana hai, {n} items ke saath. WhatsApp par bhej doon?_"
- [x] The read-back shows amounts as ₹1,235 (Indian grouping) in the app language; nothing is spoken (canonical demo data, [`architecture.md` §7.4](../docs/architecture.md)).
- [ ] Mirrors the detected language (Hinglish first; other languages fall back to Hinglish for now).

### 1.6 Screens (`src/ui/`), ported from the Stitch export

- [ ] **S3 Live bill** (`kaambill_live_bill_assembling`): customer header, `ItemChip` states (normal / amber "Check karein" / "Abhi joda gaya" / tap to edit), material and labour subtotals, `TotalRow`, **+ Item jodein**, **Discount / Chhoot**. The main button "**Total dekhein aur bhejein →**" goes to **S6** (fix **F1**); remove "Taxes Samahit Hain" (fix **F4**).
- [ ] **S4 Question** (`kaambill_sawaal_clarifying_question`): one question, quick-reply price chips, "Likh ke", **"Baad mein tay karein" (Skip)** → item marked _Pending_, and the bill can't be finalized until it's resolved.
- [ ] **S5 Low-confidence confirmation** (`kaambill_low_confidence_confirmation`): focused amber item + **Haan, Sahi Hai** / **Badlein**.
- [ ] **S6 Read-back** (`kaambill_read_back_aur_approval`): checklist, totals, read-back panel, **Haan, bhejo** / **Badlav karein**; wording says WhatsApp _will open_ (fix **F2**); no site photos (fix **F8**).
- [ ] **S8 Rate card** (`kaambill_mera_rate_card`): tabs **Sab · Bijli · Plumbing · Mazdoori**, search with a mic, edit, "Naya ✨" tag for learned items, hint "_Bolke rate badlein_".
- [ ] **S10a quick-add chips** (`kaambill_mic_blocked_fallback`): "+ Finolex Wire", "+ Labour ₹500", "+ MCB switch", "+ Visiting ₹200".
- [ ] **S10b Offline queue** (`kaambill_offline_queue_mode`): if `/api/extract` can't be reached, save the turn as a `queued` draft ("Queue mein ⏳") and process it when the network returns (`src/offlineQueue.ts`).
- [ ] Customer header, `ItemChip` rows (tap to edit quantity or price, **amber** border when low confidence), labour/visiting rows, total row.
- [ ] Live update as each turn is processed, with a short highlight on the changed row.

## 2. Files Created

| File                                                                                                         | Purpose                                      |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `phase-4-billing-domain/src/rateCard/store.ts`, `RateCardDrawer.tsx`                                         | Rate card storage and UI                     |
| `phase-4-billing-domain/src/match/matcher.ts`, `phonetic.ts`                                                 | Two-stage matcher                            |
| `phase-4-billing-domain/src/bill/model.ts`, `adapter.ts`                                                     | `DraftBill` + `DomainAdapter` implementation |
| `phase-4-billing-domain/src/clarify.ts`, `readBack.ts`                                                       | One question at a time, read-back            |
| `src/ui/InvoiceCard.tsx`, `src/ui/Panels.tsx` (QuestionBanner, LowConfConfirm, ReadBackPanel, QuickAddChips) | S3–S6, S10a                                  |
| `src/adapter.ts` (`queueOffline`) + machine `offlineQueued`                                                  | S10b queue + retry                           |
| `src/ui/RateCardScreen.tsx`                                                                                  | S8                                           |

## 3. Tests

- **Matcher:** Phenolex→Finolex, Hevells→Havells, M-C-B→MCB, "_taar_"→wire, and unknown items correctly left unmatched.
- **Adapter:** additions, corrections, removal ("_socket hata do_"), totals with labour and visiting charges.
- **Clarifier:** never returns more than one question; follows the priority order.
- **End-to-end (Playwright, mobile viewport, text path):** the definition-of-done sentence results in a correct total.

## 4. Acceptance Criteria

- The definition-of-done utterance ([`../implementationPlan.md` §8](../docs/implementationPlan.md)) produces the correct bill, either directly or after one clarifying question.
- Editing a chip by tapping, or by voice, recalculates the total immediately.
- A price taught by voice is remembered on the next bill.

## 5. Wispr Flow Evidence

- 🎥 A clip of dictating new rate card entries or matcher test cases with Flow.

## 6. Exit Checklist

- [ ] Full bill flow works up to the read-back on a real phone
- [ ] Domain tests green
- [x] Earlier phases (2, 3) don't import this phase (ESLint boundary rule)

## 7. Progress (21 Nov)

| Item                                                                                                                                                                     | Status                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `domain/match/matcher.ts` + `phonetic.ts`: exact → word-set alias → brand-only (amber) → fuzzy/phonetic, **spec guard** (2.5mm ≠ 1.5mm)                                  | ✅ 27 tests                                       |
| `domain/rateCard/store.ts`: IndexedDB, 15 seed items, voice/hand price edits, learned items ("Naya ✨")                                                                  | ✅                                                |
| `domain/bill/model.ts` (merge rules, integer rupees, item count) + `final.ts` (lock, KB-yyyy-seq)                                                                        | ✅                                                |
| `domain/clarify.ts` (ONE question by priority, skip semantics) + on-screen read-back                                                                                     | ✅                                                |
| `domain/adapter.ts`: confirm/skip answered on the phone, price answers bind to the asked item, `rate_update`, `history` hook (Phase 5), learn on approval, offline queue | ✅                                                |
| Machine `DRAFT_EDIT` (tap-to-fix → new read-back)                                                                                                                        | ✅                                                |
| Bill record keeps the **transcript** (every utterance that changed the bill) and **customer phone** (`DraftBill` → `FinalBill`)                                          | ✅ tested                                         |
| Screens: S3 `InvoiceCard`/`ItemChip`, S4 `QuestionBanner`, S5 `LowConfConfirm`, S6 `ReadBackPanel` (F1/F2/F4/F8 applied), S8 `RateCardScreen`, S10a `QuickAddChips`      | ✅                                                |
| Playwright: canonical demo ₹1,235 (S3→S5→S6→locked bill), unknown price (S4), tap-to-fix new read-back, rate card edit                                                   | ✅ 4 passing                                      |
| Fixed: Devanagari approval ("हाँ भेज दो") wasn't recognised (`\b` doesn't work for Hindi script)                                                                           | ✅                                                |
| Bill totals on real Groq (eval)                                                                                                                                          | see `phase-6-quality-demo/eval/results/phase3.md` |
| On a real phone, by voice                                                                                                                                                | ⬜ you                                            |

---

<!-- code-index:start -->

## Code in this folder

**Config in this folder:** [`package.json`](./package.json) · [`tsconfig.json`](./tsconfig.json)

Run this phase's tests: `npm run test:phase -- 4` (add `--unit` to skip the browser tests).

**Browser code (`src/`)**

- [`src/adapter.ts`](./src/adapter.ts)
- [`src/bill/final.ts`](./src/bill/final.ts)
- [`src/bill/model.ts`](./src/bill/model.ts)
- [`src/clarify.ts`](./src/clarify.ts)
- [`src/domain.test.ts`](./src/domain.test.ts) 🧪
- [`src/i18n.ts`](./src/i18n.ts)
- [`src/match/matcher.test.ts`](./src/match/matcher.test.ts) 🧪
- [`src/match/matcher.ts`](./src/match/matcher.ts)
- [`src/match/phonetic.ts`](./src/match/phonetic.ts)
- [`src/rateCard/store.ts`](./src/rateCard/store.ts)
- [`src/speech.ts`](./src/speech.ts)
- [`src/ui/InvoiceCard.tsx`](./src/ui/InvoiceCard.tsx)
- [`src/ui/Panels.tsx`](./src/ui/Panels.tsx)
- [`src/ui/RateCardScreen.tsx`](./src/ui/RateCardScreen.tsx)

**End-to-end tests**

- [`e2e/billing.spec.ts`](./e2e/billing.spec.ts) 🧪

🧪 = test file.

<!-- code-index:end -->
