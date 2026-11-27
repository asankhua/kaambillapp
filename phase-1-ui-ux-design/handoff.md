# Component Handoff

Port markup from each screen's `code.html` in [`../stitch_kaambill_voice_invoicing_app/`](./design/). The Tailwind theme in `phase-1-ui-ux-design/src/theme.css` is **generated from the same Stitch config**, so class names (`bg-primary-container`, `text-body-lg`, `px-margin`, `rounded-xl`…) work as-is. Icons: Material Symbols Outlined (loaded in `app/app/index.html`).

## App shell (Phase 2)

| Component                                                        | States                                                                                                    | Source screen                                             |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `TopBar`                                                         | default                                                                                                   | all (`<header>`)                                          |
| `LanguageBadge`                                                  | Hinglish · Hindi · English                                                                                | all                                                       |
| `VoiceDock` → `StatusLabel`, `MicButton`, `LiveTranscript`       | idle (green) · listening (**blue** pulse ring) · processing (spinner) · awaiting "haan" (glow) · disabled | S2, S3, S6                                                |
| `BottomNav`                                                      | 5 tabs: **Boliye · Likh Ke · Bills · Rates · Khata**; active tab                                          | all                                                       |
| `TextInput` (Likh Ke)                                            | collapsed · open · sending; placeholder "Likhein ya Wispr Flow se boliye…"                                | S10a                                                      |
| `Home` → `TodaySummary`, `ExampleBubble`, `RecentBills`          | empty (illustration) · with bills                                                                         | `kaambill_bol_ke_bill_banaiye` (Hinglish version, fix F7) |
| `ListeningView`                                                  | streaming · stopped                                                                                       | S2                                                        |
| `banners/MicBlocked`, `banners/NotUnderstood`, `banners/Offline` | —                                                                                                         | S10a/c/b                                                  |

## Bill building (Phase 4)

| Component            | States                                                                                          | Source screen     |
| -------------------- | ----------------------------------------------------------------------------------------------- | ----------------- |
| `InvoiceCard` header | customer known / missing                                                                        | S3                |
| `ItemChip`           | normal ✓ · **amber "Check karein"** · just added ("Abhi joda gaya") · editing · pending (₹ ---) | S3, S4, S5        |
| `TotalRow`           | building ("Kaccha total") · final                                                               | S3, S6            |
| `QuestionBanner`     | question + quick replies + Likh ke + Skip                                                       | S4                |
| `LowConfConfirm`     | Haan, Sahi Hai / Badlein                                                                        | S5                |
| `ReadBackPanel`      | shown · waiting for haan                                                                        | S6 (fixes F2, F8) |
| `QuickAddChips`      | —                                                                                               | S10a              |
| `RateCardScreen`     | list · search · edit · Naya ✨                                                                  | S8                |

## Output, onboarding, history (Phase 5)

| Component                               | States                                                 | Source screen  |
| --------------------------------------- | ------------------------------------------------------ | -------------- |
| `Onboarding` (3 steps)                  | name · UPI (format ✓ only, fix F5) · rate card         | S1a–c          |
| `SharePreview` → `PdfPreview`, `UpiQr`  | ready · sharing                                        | S7             |
| `ReceiptPreview` (A6)                   | —                                                      | S11 (fix F9)   |
| `History` → `WeeklySummary`, `BillCard` | filters Sab · Baaki · Paid · Drafts; paid via UPI/cash | S9             |
| `KhataScreen`                           | profile + UPI settings                                 | (reuses S1a/b) |

## Rules (from architecture.md §7.3)

1. S3's main button goes to **S6**, never S7. 2. No auto-send wording. 3. No Wispr label on the voice dock. 4. No "taxes included". 5. No "Bank linked". 6. Canonical demo data everywhere.
