# Phase 8: Finale (On Campus)

> **Update (28 Nov):** the cloud speech-to-text work below (Groq Whisper, the Whisper second pass, Sarvam AI, `/api/stt`, the voice detector and the engine selector) was **removed**. The mic uses the browser's speech recognition and **Wispr Flow** dictates into the text box; the only Groq call left is bill extraction. The progress table records what was built at the time. What remains in this folder: demo mode, `scripts/warmup.ts`, the landing-translation test and the e2e tests.

|                |                                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dates**      | 2 Dec (shortlist) → **13 Dec 2026 (finale)**                                                                                                       |
| **Goal**       | Strengthen the shortlisted build for a live demo in front of Wispr leadership, AI founders and investors, and add the most important roadmap items |
| **Builds**     | [`architecture.md` §5.1 / §5.1.3, §10, §11](../docs/architecture.md)                                                                               |
| **Depends on** | Phase 7 (domain-sprint build); Phase 6 (KaamBill quality pack)                                                                                     |

> If the shortlisted project is the domain-sprint build rather than KaamBill, apply the same tracks below to that build.

---

## 1. Work Tracks

### 1.1 Hindi and English polish (2–6 Dec)

KaamBill supports **only Hinglish, Hindi (Devanagari) and English**. No other language is in scope.

- [x] Eval sentences: **43 Devanagari-Hindi and 40 English** (≥ 30 each) in the 208-sentence set; per-language scores in `phase-6-quality-demo/eval/results/phase6.md`.
- [ ] Test browser speech (`hi-IN`, `en-IN`) and Groq Whisper on recorded audio of those sentences.
- [ ] **Only if both miss > 85%:** implement `SarvamProvider` behind the `SttProvider` interface ([`architecture.md` §5.1](../docs/architecture.md)) and add `SARVAM_API_KEY`.
- [ ] Native-speaker review of the Hindi (Devanagari) phrases in `phase-4-billing-domain/src/i18n.ts`.
- [ ] Target > 85% field accuracy for each of the three languages.

### 1.2 Whisper second pass (optional, 4–7 Dec)

- [ ] **Quick option:** try **Groq-hosted** `whisper-large-v3-turbo` (same `GROQ_API_KEY`) as the second pass first.
- [ ] If base Whisper struggles with Hinglish, self-host **IndicWhisper** with faster-whisper on a GPU server kept running ([`architecture.md` §5.1.3](../docs/architecture.md)).
- [ ] When the first-pass confidence is below 0.85, re-run the clip and keep the better result. Measure the drop in amber chips and clarifying questions.
- [ ] Cut this if it doesn't measurably improve accuracy; the evidence matters more than the feature.

### 1.3 Robustness (5–9 Dec)

- [x] Expand the eval to **200+ utterances** (208) ([`architecture.md` §8](../docs/architecture.md)) and re-run it.
- [ ] Offline queue for unsent drafts; retry when the network comes back.
- [ ] Test the risks in [`architecture.md` §10](../docs/architecture.md): try to make the LLM invent prices, and test noisy audio and wrong approval words.

### 1.4 Real-user validation (3–10 Dec)

- [ ] Put the app in front of **5–10 real tradespeople** (electricians, plumbers). Watch them create one real bill each.
- [ ] Record (with consent) time-to-bill, number of corrections and verbatim feedback. These are your strongest pitch slides.

### 1.5 Live demo hardening (9–12 Dec)

- [ ] **Noisy-hall plan:**
  - a directional or clip-on mic for the phone
  - the text path (Wispr Flow) as a visible backup
  - a pre-recorded video as a last resort
- [ ] Hotspot backup; warm up `/api/extract` (2–3 calls) before going on stage, and check the Groq rate-limit headroom.
- [ ] Two phones, both charged and logged in, with the rate card pre-seeded.

### 1.6 Pitch (10–13 Dec)

- [ ] 3-minute pitch:
  1. problem (89/100 don't speak English; paper bills)
  2. live demo
  3. evidence: eval numbers + real users
  4. market (≈ 7.3 crore establishments → ≈ 1–1.5 crore addressable)
  5. how it makes money (freemium; paid tier for GST mode and income summary exports)
  6. built hands-free with Wispr Flow
- [ ] A Q&A prep sheet: privacy, accuracy, competition (Vyapar, Khatabook), distribution (trade associations, hardware shops), GST.

## 2. Acceptance Criteria

- A live demo that survives a noisy hall, with backup paths rehearsed.
- Hinglish, Hindi and English each working end to end (> 85% field accuracy).
- Real-user evidence from at least 5 tradespeople.

## 3. Exit Checklist

- [ ] Hindi + English speech-to-text verified
- [ ] 200+ utterance eval logged
- [ ] User-test notes and clips ready
- [ ] Pitch rehearsed ×3 with a timer
- [ ] Finale 🎤 **13 Dec**

## 4. Progress (21 Nov, code parts)

| Item                                                                                                                                                                                                                                                                                                                                            | Status                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Groq Whisper** mic engine: `phase-8-finale/server/stt.ts` + `phase-8-finale/server/whisper.ts` (brand hints, confidence, no-speech) and `GroqWhisperProvider` (MediaRecorder + energy VAD, 1.5 s, noise-floor adaptive); `?stt=groq-whisper`                                                                                                  | ✅ 8 unit tests; **real audio → ₹1,235 / ₹890 exact** (`npm run stt:smoke`)                                            |
| Found with real audio: speech-to-text drops commas → items merged → prompt fixed                                                                                                                                                                                                                                                                | ✅                                                                                                                     |
| **Whisper second pass** (`SecondPassProvider`): records alongside Web Speech; if confidence < 0.85 (or unknown) re-runs the clip on Groq Whisper and keeps the more confident result; recorder/upload failure → Web Speech result. `?stt=webspeech+whisper`                                                                                     | ✅ unit tests · measuring fewer amber chips/questions on real recordings: ⬜                                           |
| **Languages (only three):** the top-bar menu Hinglish · हिंदी · English (remembered) switches **every screen text** (per-component dictionaries, `phase-2-voice-core/src/ui/lang.tsx`), the **mic language** (`hi-IN` / `en-IN`) and the **app messages** (questions, read-back, confirmations), whatever language was spoken. No text-to-speech | ✅ e2e: menu has exactly 3 options; Hindi and English each switch Home, nav, text box, question and read-back (₹1,235) |
| Hindi number words 1–100 in Devanagari (पंद्रह, ढाई सौ, …) + Hindi/English approval words; other languages' number words rejected                                                                                                                                                                                                                 | ✅ tested                                                                                                              |
| Demo hardening: `?demo=1`, Khata → Demo reset, `npm run warmup -- <url>`, backup order                                                                                                                                                                                                                                                          | ✅ e2e                                                                                                                 |
| Pitch (3 min) + Q&A: [`pitch.md`](./pitch.md) · real-user kit: [`user-tests.md`](./user-tests.md)                                                                                                                                                                                                                                               | ✅ drafts                                                                                                              |
| Native-speaker review of the Hindi (Devanagari) phrases                                                                                                                                                                                                                                                                                         | ⬜ you                                                                                                                 |
| Self-hosted IndicWhisper                                                                                                                                                                                                                                                                                                                        | ⬜ only if Groq Whisper struggles on real recordings                                                                   |
| Sarvam                                                                                                                                                                                                                                                                                                                                          | ⬜ only if the Hinglish/Hindi eval misses 85%                                                                          |
| 5–10 real tradespeople, demo rehearsals ×3, finale 13 Dec                                                                                                                                                                                                                                                                                       | ⬜ you                                                                                                                 |

---

<!-- code-index:start -->

## Code in this folder

**Config in this folder:** [`package.json`](./package.json) · [`tsconfig.json`](./tsconfig.json)

Run this phase's tests: `npm run test:phase -- 8` (add `--unit` to skip the browser tests).

**Browser code (`src/`)**

- [`src/demo.ts`](./src/demo.ts)
- [`src/landingTranslations.test.ts`](./src/landingTranslations.test.ts) 🧪

**Browser tests (`e2e/`)**

- [`e2e/languages.spec.ts`](./e2e/languages.spec.ts) 🧪
- [`e2e/wispr.spec.ts`](./e2e/wispr.spec.ts) 🧪

**Scripts**

- [`scripts/warmup.ts`](./scripts/warmup.ts)

<!-- code-index:end -->
