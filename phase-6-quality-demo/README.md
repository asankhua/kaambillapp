# Phase 6: Quality, Demo and Evidence

|                |                                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Dates**      | 26 Nov 2026 (**submission closes today**)                                                                                                 |
| **Goal**       | Measure against the success metrics, fix the worst failures, record the demo, and gather the Wispr Flow evidence                          |
| **Builds**     | [`architecture.md` §8, §9, §12](../docs/architecture.md) · [`problemStatement.md` → What Success Looks Like](../docs/problemStatement.md) |
| **Depends on** | Phases 2–5                                                                                                                                |

---

## 1. Tasks

### 1.1 Accuracy test set (`eval/`)

- [ ] Grow `utterances.seed.jsonl` to **≥ 100 utterances** (the 200+ target in [`architecture.md` §8](../docs/architecture.md) is for Phase 8). Each team member records ~30 in real conditions: fan on, street noise, a drill sound played from another phone.
- [ ] Save both the **audio** (`eval/audio/*.webm`) and the expected `Extraction` + final total.
- [ ] `eval/score.ts` reports:
  - field-level accuracy (customer, item, quantity, unit)
  - **bill total exact-match rate**
  - number of clarifying questions per bill
  - p50 and p90 latency

### 1.2 Fix loop

- [ ] Sort failures into: speech-to-text mishearing / LLM extraction / normalizer / matcher.
- [ ] Fix by adding aliases, normalizer rules, few-shot examples or clarifier tweaks, then re-run the scorer and record the result in `eval/results/phase5.md`.
- [ ] Target: **> 90% field accuracy** and 100% of bills correct after the read-back ([`problemStatement.md` metric #3](../docs/problemStatement.md)).

### 1.3 Performance and device checks

- [ ] Lighthouse on a mobile profile: PWA installable, performance ≥ 80.
- [ ] App bundle under 500 KB gzipped, excluding the VAD model ([`architecture.md` §8](../docs/architecture.md)).
- [ ] Test on a 2 GB RAM Android phone with throttled 3G.
- [ ] Latency: end of speech to read-back **< 3 s** at p50. If it misses, profile it, then compare `openai/gpt-oss-20b` against `openai/gpt-oss-120b` on the eval set before changing `LLM_MODEL` (see Phase 3).

### 1.3b UI parity with the Stitch screens

- [ ] On a 360×800 Android phone, compare each built screen with its `screen.png` in [`phase-1-ui-ux-design/design/`](../phase-1-ui-ux-design/design/), using the build map in [`implementationPlan.md` §3](../docs/implementationPlan.md).
- [ ] Confirm the safety rules from [`architecture.md` §7.3](../docs/architecture.md): S3 → S6 → S7 (no skipping the read-back), no automatic-send wording, no Wispr labels on the voice dock, no tax or bank claims.
- [ ] Confirm the canonical demo data (₹1,235, KB-2026-0042) everywhere.
- [ ] **Offline (S10b):** in flight mode, speak a bill → "Queue mein" → turn the network back on → it is processed automatically.
- [ ] Log the results in `eval/results/ui-parity.md`.

### 1.4 Telemetry (no personal data)

- [ ] Events `bill_finalized`, `bill_shared`, `bill_marked_paid`, `chip_corrected` ([`architecture.md` §9](../docs/architecture.md)), sent to a simple endpoint or PostHog with customer data removed.

### 1.5 Demo and evidence pack (`demo/`)

- [ ] **A 90-second demo video**, filmed on a real phone near real noise. Script:
  1. Problem in one line (_"89 in 100 Indians don't speak English; tradespeople bill on paper"_).
  2. Worker speaks one sentence; the bill fills in live.
  3. Amber chip → "_sahi hai?_" → "_haan_".
  4. Read-back → "_bhej do_" → WhatsApp share → UPI QR scanned.
  5. "Built hands-free with Wispr Flow" montage (clips from Phases 0–5).
- [ ] **Wispr Flow montage:** stitch together the 🎥 clips from each phase.
- [ ] Repo README: screenshots, architecture diagram, how to run, eval results, "Built with Wispr Flow".
- [ ] Put the **measured** numbers into the submission.

## 2. Acceptance Criteria

- Eval results show **> 90% field accuracy** and p50 end of speech to read-back **< 3 s**, or a documented explanation of why not and the plan to fix it.
- The demo video and evidence pack are ready.
- The submission is in **before the 26 Nov deadline**.

## 3. Exit Checklist

- [ ] ≥ 100-utterance eval run and logged
- [ ] Demo video recorded
- [ ] Wispr Flow montage done
- [ ] Submitted ✅

## 4. Progress (21 Nov)

| Item                                                                                                                                                                                                                                               | Status                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Eval grown to **208 sentences** (125 Hinglish · 43 Hindi · 40 English; was 105) (20 Wispr Flow-style, Devanagari, English, estimates, mid-bill, price answers, rate updates, history)                                                              | ✅ text; **audio recordings in real noise: you**                                |
| Consistency tests: every expected qty = normalizer output, every expected item = matcher output, every total = rate-card maths                                                                                                                     | ✅ found and fixed: "dus", "sawa meter", "fans lagaye", Hindi-script item names |
| Scorer: field accuracy, item match, **bill total exact match**, **questions per bill**, p50/p90                                                                                                                                                    | ✅ `npm run eval:extract` → `phase-6-quality-demo/eval/results/phase6.md`       |
| UI parity vs Stitch: side-by-side images + report; all 6 safety rules ✅; added S3 check badge, S9 progress bar/borders                                                                                                                            | ✅ [`ui-parity.md`](./eval/results/ui-parity.md)                                |
| Lighthouse (mobile, `/` and `/?demo=1`): **performance 97, accessibility 100, best practices 100**; LCP 2.3 s, TBT 10 ms, CLS 0. Earlier scores were measured on an **unstyled** build (Tailwind `@source` glob bug, now fixed and guarded by e2e) | ✅ [`lighthouse.md`](./eval/results/lighthouse.md) + saved report               |
| Bundle: main 120 KB gzipped (< 500 KB); jsPDF, SharePreview, History, rate card lazy-loaded                                                                                                                                                        | ✅                                                                              |
| Telemetry: `bill_finalized`, `bill_shared`, `bill_marked_paid`, `chip_corrected`; PostHog capture API, off without a key, allow-listed non-personal fields only                                                                                    | ✅ tested                                                                       |
| Demo script (90 s), recording checklist, Wispr Flow montage plan                                                                                                                                                                                   | ✅ [`phase-6-quality-demo/demo/README.md`](./demo/README.md) · recording: you   |
| Test on a 2 GB phone over throttled 3G; p50 end-of-speech → read-back < 3 s on device                                                                                                                                                              | ⬜ you                                                                          |
| Put the measured numbers in the submission, then **submit**                                                                                                                                                                                        | ⬜ after the eval finishes · submit: you                                        |

---

<!-- code-index:start -->

## Code in this folder

**Config in this folder:** [`package.json`](./package.json) · [`tsconfig.json`](./tsconfig.json) · [`vitest.config.ts`](./vitest.config.ts) · [`playwright.config.ts`](./playwright.config.ts)

Run this phase's tests: `npm run test:phase -- 6` (add `--unit` to skip the browser tests).

**Browser code (`src/`)**

- [`src/telemetry.test.ts`](./src/telemetry.test.ts) 🧪
- [`src/telemetry.ts`](./src/telemetry.ts)

**Eval data and runner**

- [`eval/results/lighthouse.md`](./eval/results/lighthouse.md) (+ saved `lighthouse.report.html/json`)
- [`eval/results/phase3.md`](./eval/results/phase3.md)
- [`eval/results/ui-parity.md`](./eval/results/ui-parity.md)
- [`eval/run-extract.ts`](./eval/run-extract.ts)
- [`eval/seed-data.test.ts`](./eval/seed-data.test.ts) 🧪
- [`eval/types.ts`](./eval/types.ts)
- [`eval/utterances.seed.jsonl`](./eval/utterances.seed.jsonl)

- [`eval/results/ui-parity/`](./eval/results/ui-parity/) (side-by-side images)

**Demo pack**

- [`demo/README.md`](./demo/README.md)

🧪 = test file.

<!-- code-index:end -->
