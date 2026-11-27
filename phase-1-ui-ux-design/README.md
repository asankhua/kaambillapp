# Phase 1: UI/UX Design (Google Stitch)

|                |                                                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dates**      | 21–23 Nov 2026 (runs alongside Phase 0 and the start of Phase 2)                                                                                                                  |
| **Goal**       | Design every screen and state of the voice-first flow in Google Stitch, fix the design system as tokens, test it with 3 real users, and hand off components for Phases 2, 4 and 5 |
| **Builds**     | [`architecture.md` §3, §7](../docs/architecture.md) · [`problemStatement.md` → Constraints](../docs/problemStatement.md)                                                          |
| **Prompts**    | [`stitchPrompt.md`](./stitchPrompt.md) (§5 = sync-fix prompts)                                                                                                                    |
| **Export**     | [`phase-1-ui-ux-design/design/`](./design/): 16 screens + illustration + [`DESIGN.md`](./design/bharat_trades_kinetic/DESIGN.md)                                                  |
| **Status**     | 🟡 Screens generated; fixes F1–F9 pending                                                                                                                                         |
| **Depends on** | — (can start immediately)                                                                                                                                                         |
| **Owner**      | Product and design teammate                                                                                                                                                       |

---

## 1. UX Principles (non-negotiable)

| Principle                            | What it means on screen                                                                | Source                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Glance, don't read**               | Total and status readable in under 1 s at arm's length; 18px body text, 40px total     | [`problemStatement.md`](../docs/problemStatement.md) → hands-free  |
| **Voice first, touch to fix**        | Mic is the hero; every row can be tapped to edit; typing is optional                   | [`architecture.md` §5.1.2](../docs/architecture.md)                |
| **One thing at a time**              | Only one question banner ever on screen                                                | [`architecture.md` §3](../docs/architecture.md)                    |
| **Amber only means "check this"**    | Amber is used only for low-confidence items; red only for errors                       | [`architecture.md` §5.5](../docs/architecture.md)                  |
| **Nothing sent without the user**    | The share screen states clearly that the bill only goes when the worker presses Send   | [`problemStatement.md`](../docs/problemStatement.md) → Constraints |
| **Speak their language**             | Hinglish microcopy, no jargon; layouts must handle Devanagari text without overflowing | [`problemStatement.md`](../docs/problemStatement.md) → Constraints |
| **Works in sunlight with one thumb** | WCAG AA+ contrast, ≥ 48px touch targets, mic 88px at the bottom centre                 | Low-end Android constraint                                         |

## 2. Tasks

### 2.1 Design the screens in Stitch

- [x] Create a Stitch project (Mobile) and paste the **master prompt** ([`stitchPrompt.md` §1](./stitchPrompt.md)).
- [x] Generate **S1–S11** in order, using the same project so the style stays consistent (exported to `phase-1-ui-ux-design/design/`).
- [ ] **Apply sync fixes F1–F9** ([`stitchPrompt.md` §5](./stitchPrompt.md)), with **F1** (send button skips the read-back) and **F2** (wording implies an automatic send) first, then re-export.
- [ ] Apply the refinement prompts (§3) for touch size, contrast and Devanagari.
- [ ] Generate a **Hindi (Devanagari) variant** of S3 and S6 to check font support and text overflow.
- [ ] Dictate your own changes into Stitch with **Wispr Flow** and screen-record it 🎥.

### 2.2 User flows

- [ ] **Happy path:** Home → Listening → Live bill → Read-back → Share preview.
- [ ] **Clarification path:** Live bill → Question (unknown price) → Live bill → Read-back.
- [ ] **Correction path:** Read-back → "_nahi, 20 meter_" → Live bill (row updated) → Read-back.
- [ ] **Failure paths:** mic blocked → text input; offline → queued; not understood → retry.
- [x] Draw all four as a flow diagram (Mermaid) in [`flows.md`](./flows.md).

### 2.3 Design tokens → code (`phase-1-ui-ux-design/src/tokens.ts`)

- [ ] Export Stitch to Figma, then pull out the tokens:
  ```ts
  // Source: phase-1-ui-ux-design/design/bharat_trades_kinetic/DESIGN.md
  export const tokens = {
    color: {
      primary: "#005F39",
      primaryContainer: "#0B7A4B",
      primaryTint: "#E7F5EE",
      bg: "#F9F9FF",
      card: "#FFFFFF",
      border: "#E5E7EB",
      borderStrong: "#D1D5DB",
      text: "#141B2B",
      textMuted: "#3F4941",
      amber: "#F59E0B",
      amberTint: "#FFF4DB", // "needs attention" only
      danger: "#BA1A1A",
      listening: "#2563EB", // blue = listening only
    },
    font: {
      family: "'Noto Sans', 'Noto Sans Devanagari', sans-serif",
      body: 18,
      label: 16,
      total: 40,
    },
    radius: { card: 16, chip: 12, pill: 999 },
    touch: { min: 48, button: 52, input: 56, chip: 44, mic: 88 },
  } as const;
  ```
- [ ] Map them into `tailwind.config.ts` (`theme.extend.colors`, etc.).

### 2.4 Component handoff

Export the Stitch HTML/Tailwind for reference and list each component with its states:

| Component                             | States                                                                              | Built in       |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------- |
| `MicButton`                           | idle · listening (pulse) · processing (spinner) · awaiting "haan" (glow) · disabled | Phase 2        |
| `StatusLabel`, `LiveTranscript`       | streaming · final · error                                                           | Phase 2        |
| `TextInput`                           | collapsed · open · sending                                                          | Phase 2        |
| `QuestionBanner`                      | question + quick replies                                                            | Phase 4        |
| `InvoiceCard`, `ItemChip`             | normal · **amber** · editing · just added (highlight)                               | Phase 4        |
| `TotalRow`, `ReadBackPanel`           | building · final                                                                    | Phase 4        |
| `RateCardDrawer`                      | list · search · edit · new item                                                     | Phase 4        |
| `SharePreview`, `UpiQr`, `PdfPreview` | ready · sharing · shared                                                            | Phase 5        |
| `History`                             | all · unpaid · paid                                                                 | Phase 5        |
| Banners                               | offline · mic blocked · error                                                       | Phases 2 and 6 |

### 2.5 Clickable prototype and quick usability test

- [ ] Link the screens into a clickable prototype (Figma prototype or Stitch preview).
- [ ] Test with **3 people** (ideally 1–2 real tradespeople, or anyone non-technical), 10 minutes each. Tasks:
  1. "Make a bill for Verma ji" (narrated using a Wizard-of-Oz approach: you play the voice).
  2. "Fix the wire quantity."
  3. "Send it to the customer."
- [ ] Record: did they find the mic, did they understand the amber row, did they trust the share step. Log the results in `phase-1-ui-ux-design/usability.md`; fix the top 3 issues.

## 3. Deliverables (in this folder)

| File                                                                   | Content                                                                     |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `../stitch_kaambill_voice_invoicing_app/`                              | Stitch exports (PNG + HTML) of S1–S11, Home, edge states, the design system |
| `flows.md`                                                             | Four user flows (happy, clarify, correct, failure)                          |
| `usability.md`                                                         | Test notes and the top 3 fixes                                              |
| `handoff.md`                                                           | Component list with states + Figma link                                     |
| [`src/tokens.ts`](./src/tokens.ts), [`src/theme.css`](./src/theme.css) | Design tokens + Tailwind theme                                              |

## 4. Acceptance Criteria

- All 11 screens and edge states are designed in one consistent style.
- The Devanagari variant renders without overflow.
- Contrast checked (WCAG AA) for every text-on-colour pair.
- 3 usability sessions done and the top 3 fixes applied.
- Tokens and the component list handed to the Phase 2, 4 and 5 owners.

## 5. Wispr Flow Evidence

- 🎥 A clip of dictating Stitch prompts or refinements with Flow, with the screen changing in response.

## 6. Exit Checklist

- [ ] S1–S11 exported
- [ ] Flows + usability notes written
- [x] `tokens.ts` merged (theme generated from the Stitch config)
- [ ] Handoff done

---

<!-- code-index:start -->

## Code in this folder

**Config in this folder:** [`package.json`](./package.json) · [`tsconfig.json`](./tsconfig.json)

Run this phase's tests: `npm run test:phase -- 1` (add `--unit` to skip the browser tests).

**Browser code (`src/`)**

- [`src/Icon.tsx`](./src/Icon.tsx)
- [`src/icons.test.ts`](./src/icons.test.ts) 🧪
- [`src/theme.css`](./src/theme.css)
- [`src/tokens.ts`](./src/tokens.ts)

**Icon font subset:** [`scripts/icons.mjs`](./scripts/icons.mjs) (`npm run icons` rewrites the icon `<link>` in `app/app/index.html` with only the icons the code uses, ~27 KB instead of 1.1 MB) · valid names: [`icons/material-symbols-names.txt`](./icons/material-symbols-names.txt)

**Stitch export:** [`design/`](./design/), 18 folders (one per screen: `screen.png` + `code.html`, plus `bharat_trades_kinetic/DESIGN.md`).

🧪 = test file.

<!-- code-index:end -->
