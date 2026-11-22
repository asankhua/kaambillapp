# Phase 2: Voice Core (Reusable)

|                |                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dates**      | 22–23 Nov 2026                                                                                                                                                |
| **Goal**       | A domain-agnostic voice loop: mic → transcript (or text) → state machine → on-screen reply (no spoken output). **Reused as is for any new domain (Phase 7).** |
| **Builds**     | [`architecture.md` §3, §5.1, §5.1.2, §5.6, §7](../docs/architecture.md)                                                                                       |
| **Depends on** | Phase 0 (shared `Turn` type, deployed PWA) · Phase 1 (design tokens, `MicButton` / dock designs)                                                              |
| **Rule**       | This phase may not import later phases (ESLint boundary rule)                                                                                                 |

---

## 1. Tasks

### 1.1 Audio capture and voice-activity detection (Web Speech end-of-speech here; the energy VAD for Whisper is in `phase-8-finale/src/audio/`)

- [ ] `getUserMedia({ audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true } })`.
- [ ] Silero VAD via `@ricky0123/vad-web`, with the end-of-speech silence set to **1500 ms** ([`architecture.md` §5.1](../docs/architecture.md)).
- [ ] Emit `speechStart`, `speechEnd` and live `level` (for the waveform).
- [ ] Handle mic permission denied: show the text box, and say _"Mic band hai, aap likh ke bhi bata sakte hain."_

### 1.2 Speech-to-text, swappable (`src/stt/`)

- [ ] `SttProvider` interface:
  ```ts
  interface SttProvider {
    start(lang: Lang): void;
    stop(): void;
    onPartial(cb: (text: string) => void): void;
    onFinal(cb: (turn: Turn) => void): void; // source: "stt"
  }
  ```
- [ ] `WebSpeechProvider`: `webkitSpeechRecognition`, `lang = "hi-IN"`, `interimResults = true`, `continuous = true`; map `confidence` to `sttConfidence`.
- [ ] Brand-name hints: pass the rate card names in as a list the provider can use (a no-op for Web Speech; used by Whisper later).
- [ ] Stub classes `GroqWhisperProvider` and `SarvamProvider` (only if needed) that throw `NotImplemented` (Phase 8).

### 1.3 Text input path (`src/text/`)

- [ ] `TextInput` component in the mic dock. On submit it emits `Turn { source: "text" }` and **skips speech-to-text** ([`architecture.md` §5.1.2](../docs/architecture.md)).
- [ ] Autofocus when the mic is unavailable, so a **Wispr Flow** user can dictate straight into it.

### 1.4 Reply templates (on screen only)

- [x] ~~TTS~~ **removed on 21 Nov** (user decision): KaamBill shows questions and the read-back on screen; it never speaks. Wispr Flow covers dictation.
- [x] Replies come from templates and stay **at most 2 sentences** ([`architecture.md` §5.6](../docs/architecture.md)).

### 1.5 Conversation state machine (`src/machine/`)

- [ ] An XState machine with these states: `idle → listening → processing → clarifying | confirmingLowConf | readBack → awaitApproval → finalized → sharePreview → idle` ([`architecture.md` §3](../docs/architecture.md)).
- [ ] Domain logic is **injected** as services, so the machine stays generic:
  ```ts
  interface DomainAdapter<TDraft> {
    applyTurn(draft: TDraft, extraction: Extraction): TDraft;
    nextQuestion(draft: TDraft): Question | null; // at most ONE
    lowConfidenceItem(draft: TDraft): Question | null;
    readBack(draft: TDraft): Utterance;
    finalize(draft: TDraft): Promise<FinalOutput>;
  }
  ```
- [ ] Approval words (_haan, ha, bhej do, yes, send, theek hai_) are recognised **locally** as a shortcut, before the LLM is called.
- [ ] A status label for each state: "Listening...", "Checking prices...", "Waiting for 'Yes'..." ([`architecture.md` §3 table](../docs/architecture.md)).

### 1.6 UI shell and screens (`src/ui/`)

- [ ] Port from the Stitch `code.html` files in [`phase-1-ui-ux-design/design/`](../phase-1-ui-ux-design/design/) using `phase-1-ui-ux-design/src/tokens.ts` (inventory: [`architecture.md` §7.2](../docs/architecture.md)).
- [ ] **Shell:** `TopBar` (brand, Hinglish chip, Rate Card), `VoiceDock` (status, 88px mic: green idle → blue pulsing while listening, transcript), `BottomNav` with **Boliye · Likh Ke · Bills · Rates · Khata**.
- [ ] **Home** (`kaambill_bol_ke_bill_banaiye`): greeting, `TodaySummary` (today's earnings), example bubble, "Likh ke daalein", "Kaise use karein", `RecentBills` placeholder, toolbox illustration (`worker_toolbox_illustration`).
- [ ] **S2 Listening** (`kaambill_sun_raha_hoon_listening_state`): live transcript, **Ruk jaiye** / **Radd karein**, tip line.
- [ ] **S10a Mic blocked** (`kaambill_mic_blocked_fallback`): banner + "Theek karein" permission help + the text input opened.
- [ ] **S10c Not understood** (`kaambill_error_samajh_nahi_aaya`): "Phir se", a relative noise-level indicator (from the VAD `level`), 3 tap-to-insert example phrases.
- [ ] Apply fix **F3**: no "Wispr AI / Wispr Live / Wispr Flow Active" on the voice dock; the text-input placeholder is "Likhein ya Wispr Flow se boliye..." (users dictate into it with the Flow app, no key).
- [ ] `TopBar` (language badge + rate card button placeholder), `MicDock` (large mic button, waveform, live transcript, status, text box), `Canvas` (empty slot for the domain card).
- [ ] Thumb-friendly layout: mic button **≥ 72 px**, high contrast, works one-handed.

## 2. Files Created

| File                                                                | Purpose                                        |
| ------------------------------------------------------------------- | ---------------------------------------------- |
| `src/audio/capture.ts`, `vad.ts`                                    | Mic and end-of-speech detection                |
| `phase-2-voice-core/src/stt/SttProvider.ts`, `WebSpeechProvider.ts` | Speech-to-text interface and prototype adapter |
| `phase-2-voice-core/src/text/TextInput.tsx`                         | Text path (Wispr Flow)                         |
| `phase-2-voice-core/src/machine/conversation.machine.ts`            | XState machine + `DomainAdapter` type          |
| `phase-2-voice-core/src/ui/TopBar.tsx`, `MicDock.tsx`, `Canvas.tsx` | UI shell                                       |

## 3. Tests

- **Unit (Vitest):** every machine transition, using a fake `DomainAdapter` and fake speech-to-text; approval-word shortcut.
- **Manual on device:** speak in a room with a fan running and check that end of speech is detected within about 1.5 s and that the transcript appears live.

## 4. Acceptance Criteria

- Using an **echo** domain adapter, which repeats back what it heard, the full loop works on an Android phone: speak → live transcript → on-screen reply → "haan" → done.
- The same loop works via the text box (dictated with Wispr Flow).
- `phase-2-voice-core` has **zero imports** from later phases (enforced by the ESLint boundary rule).

## 5. Wispr Flow Evidence

- 🎥 A clip of dictating the XState machine definition (or a prompt that generates it) with Flow.

## 6. Exit Checklist

- [ ] Voice loop and text loop both working on a real device
- [ ] Machine unit tests are green
- [ ] Import-boundary lint rule is active

## 7. Progress (21 Nov)

| Item                                                                                                                                                                                                                                                                                                                                                  | Status                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `core/machine/conversation.machine.ts` (XState v5, `DomainAdapter`, read-back gate)                                                                                                                                                                                                                                                                   | ✅ 12 tests, incl. "haan before read-back never finalizes"                   |
| `core/stt/WebSpeechProvider.ts` (hi-IN, 1.5 s no-new-words end of speech, error mapping) + stubs                                                                                                                                                                                                                                                      | ✅ 6 tests                                                                   |
| ~~`TtsProvider`~~ removed 21 Nov: no spoken output (questions and read-back on screen)                                                                                                                                                                                                                                                                | ✅                                                                           |
| **Inputs (21 Nov):** the mic = KaamBill's own speech recognition (a web page can't launch Wispr Flow: no URL scheme or API); the text box above the mic = typing or Wispr Flow (one-line hint). Bottom nav has **4 tabs** (Boliye · Bills · Rates · Khata; the Likh Ke tab was removed). Page padding follows the dock's real height                  | ✅ e2e (two inputs, nothing hidden under the dock in 3 languages)            |
| **Mic gives time to speak (21 Nov):** was closing after 3–4 words (1.5 s pause timer + browser auto-stop). Now the turn ends after **4 s** without new words or on "Ruk jaiye"; when the browser stops by itself the recognizer restarts and keeps the words; 10 s to start, 90 s cap; listening card says "Ruk ruk ke boliye · ho jaye to Ruk jaiye" | ✅ unit (pause, restart, first word, cap)                                    |
| **App language (21 Nov):** Hinglish · हिंदी · English switches all screen text, mic language and app messages (`src/ui/lang.tsx`, `useT()` dictionaries); mobile-only layout (phone-width column on big screens)                                                                                                                                       | ✅ e2e (Hindi, English)                                                      |
| `core/text/TextInput.tsx` (Likh Ke, Wispr Flow placeholder) · `core/voiceRuntime.ts`                                                                                                                                                                                                                                                                  | ✅                                                                           |
| Shell: `TopBar`, `VoiceDock`, `BottomNav`, `Home`, banners S10a/b/c (Stitch classes)                                                                                                                                                                                                                                                                  | ✅ fits 360 px even when icon fonts fail                                     |
| Echo adapter + Playwright e2e (text loop, PWA manifest/SW, layout)                                                                                                                                                                                                                                                                                    | ✅ (echo adapter removed after Phase 4 replaced it with the billing adapter) |
| **Change:** Silero VAD replaced by "1.5 s with no new words" (bundle size, Android mic contention), see architecture §5.1                                                                                                                                                                                                                             | ℹ️                                                                           |
| Voice loop on a real Android phone                                                                                                                                                                                                                                                                                                                    | ⬜ you (`npm run dev -- --host`, open on the phone over HTTPS / Vercel)      |

---

<!-- code-index:start -->

## Code in this folder

**Config in this folder:** [`package.json`](./package.json) · [`tsconfig.json`](./tsconfig.json)

Run this phase's tests: `npm run test:phase -- 2` (add `--unit` to skip the browser tests).

**Browser code (`src/`)**

- [`src/machine/conversation.machine.test.ts`](./src/machine/conversation.machine.test.ts) 🧪
- [`src/machine/conversation.machine.ts`](./src/machine/conversation.machine.ts)
- [`src/machine/types.ts`](./src/machine/types.ts)
- [`src/stt/SttProvider.ts`](./src/stt/SttProvider.ts)
- [`src/stt/WebSpeechProvider.test.ts`](./src/stt/WebSpeechProvider.test.ts) 🧪
- [`src/stt/WebSpeechProvider.ts`](./src/stt/WebSpeechProvider.ts)
- [`src/text/TextInput.tsx`](./src/text/TextInput.tsx)
- [`src/ui/Banners.tsx`](./src/ui/Banners.tsx)
- [`src/ui/BottomNav.tsx`](./src/ui/BottomNav.tsx)
- [`src/ui/TopBar.tsx`](./src/ui/TopBar.tsx)
- [`src/ui/VoiceDock.tsx`](./src/ui/VoiceDock.tsx)
- [`src/voiceRuntime.ts`](./src/voiceRuntime.ts)

**End-to-end tests**

- [`e2e/voice-core.spec.ts`](./e2e/voice-core.spec.ts) 🧪

🧪 = test file.

<!-- code-index:end -->
