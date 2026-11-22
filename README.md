# KaamBill: Bol ke bill banaiye 🎙️₹

**Voice billing for Indian tradespeople.** An electrician says (or dictates) one sentence:

> _"Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do"_

KaamBill builds the itemized bill (**₹1,235**), asks at most one question at a time, shows the total for a final "_haan_", takes the payment details, shows the UPI QR, and opens WhatsApp with the PDF bill. **The worker always presses Send.**

Built for **India Runs on Voice** (Scaler × Wispr Flow), Small business track. 🗣️ **Built hands-free with [Wispr Flow](https://wisprflow.ai)**: specs, prompts and code were dictated with Flow.

---

## How it works

**Customer journey** (a step bar shows where the bill is):

| #   | Step               | What the worker does                                                                                                                                                      |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Saaman** (items) | Taps the mic and speaks, or taps **"Likh ke daalein"** to type / dictate with Wispr Flow                                                                                  |
| 2   | **Jaanch** (check) | Answers one question at a time (a missing price, an unsure quantity), then confirms the total with "haan"                                                                 |
| 3   | **Details**        | Checks the amount and their UPI ID, adds the customer's WhatsApp number, picks UPI / Cash / Baad mein (later)                                                             |
| 4   | **Payment**        | The customer scans the QR (amount filled in) → the worker taps "Paisa mil gaya ✓" (or "Cash mila ✓"). KaamBill can't see payments, so "paid" is the worker's confirmation |
| 5   | **Bill**           | The bill/PDF says **PAID** or **DUE**; WhatsApp opens with it and the worker presses Send                                                                                 |

**Voice in, screen out:**

- **Mic button = KaamBill listens** (the phone browser's speech recognition, live transcript). Pauses are fine: the turn ends after **4 s** without new words or on **"Ruk jaiye"**.
- **Text box = typing or Wispr Flow.** Hidden until "Likh ke daalein" is tapped. A web page can't launch Wispr Flow itself (no API or link exists), so Flow is used from its own keyboard / shortcut inside the box.
- **No text-to-speech:** the app never speaks; questions and the read-back are on screen.

**App language:** Hinglish (default) · हिंदी · English, chosen in the top bar. It switches every screen text, the mic language and the app's messages together. Only these three languages are supported.

**Phone-only layout:** designed for 360–430 px screens; on a computer it shows as a phone-width column.

## What you need

|                                   | Needed?                       | Why                                                                                                                                                                                                                                                  |
| --------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Groq API key** (`GROQ_API_KEY`) | ✅ **Required, the only key** | The Groq LLM (`openai/gpt-oss-120b`, strict JSON) turns the spoken / typed words into the bill: customer, items, quantities, labour, intent. Without it the app can hear but not build bills. Also used (optionally) for Groq Whisper speech-to-text |
| Wispr Flow app                    | Optional, no key              | For dictating into the text box (sign in to the app)                                                                                                                                                                                                 |
| Browser speech recognition        | Built in, no key              | The mic button (Chrome on Android / desktop)                                                                                                                                                                                                         |
| Text-to-speech                    | ❌ Not used                   | The app never speaks                                                                                                                                                                                                                                 |
| Vercel account                    | For deploying                 | Hosting + the `/api` functions                                                                                                                                                                                                                       |

## Quick start

```bash
npm install
cp .env.example .env       # then set GROQ_API_KEY (the only required variable)
npm run check:env          # validates the env and confirms the Groq key works (prints no secrets)
npm run dev                # app on http://localhost:5173 + local API on :3000 (real Groq)
```

Try it: open http://localhost:5173/?demo=1 → **Likh ke daalein** → type the sentence above → "Haan, sahi hai" → "Haan, bhejo" → UPI → "Paisa mil gaya ✓".

| Command                                                          | What it does                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev:web` / `npm run dev:api`                            | Only the app (Vite) / only the local API (serves `api/*.ts` like `vercel dev`, no Vercel login)                                                                                                                                                                                                          |
| `npm run typecheck && npm run lint && npm test && npm run build` | Everything CI runs (typecheck = every folder's own tsconfig)                                                                                                                                                                                                                                             |
| `npm run test:phase -- 4`                                        | One phase's unit tests, then its e2e tests (`--unit` to skip e2e)                                                                                                                                                                                                                                        |
| `npm run e2e`                                                    | All end-to-end tests on a 360×800 phone viewport                                                                                                                                                                                                                                                         |
| `npm run ui:parity`                                              | Screenshot every screen next to its Stitch design → `phase-6-quality-demo/eval/results/ui-parity/`                                                                                                                                                                                                       |
| `npm run icons`                                                  | Rebuild the icon-font subset in `app/index.html` (only the icons the code uses, ~27 KB) and check each renders                                                                                                                                                                                           |
| `npm run eval:extract`                                           | 208-sentence eval (125 Hinglish · 43 Hindi · 40 English) on real Groq → `results/phase6.md` (all, by language) + `results/phase3.md` (30 seed). **Resumable**: each scored sentence is cached, so a re-run continues after the free-tier quota resets; `-- --report` rebuilds the reports from the cache |
| `npm run stt:smoke -- <audio dir>`                               | Real audio → Groq Whisper → bill total                                                                                                                                                                                                                                                                   |
| `npm run rehearsal:todo`                                         | To-do rehearsal (new-domain swap) on real Groq                                                                                                                                                                                                                                                           |
| `npm run domain:new -- <name>`                                   | Scaffold a new voice domain in `domain-<name>/`                                                                                                                                                                                                                                                          |
| `npm run warmup -- <url>`                                        | Before going on stage: health check + one real extraction                                                                                                                                                                                                                                                |

**Environment:** `.env` at the repo root (git-ignored) needs only `GROQ_API_KEY`; everything else has a default (see the commented template [`.env.example`](.env.example)). Never put a key in a `VITE_*` variable (those are bundled into the browser). In production set `GROQ_API_KEY` and `ALLOWED_ORIGINS` in **Vercel → Settings → Environment Variables**.

## Read first

| Doc                                                                              | What it covers                                                                                                                                                              |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/problemStatement.md`](./docs/problemStatement.md)                         | Problem, users, market size, constraints, success metrics                                                                                                                   |
| [`docs/architecture.md`](./docs/architecture.md)                                 | System design: customer journey (§3.0), state machine, speech-to-text and Wispr Flow (§5.1), Groq extraction (§5.2), app language (§5.6), screens (§7), configuration (§13) |
| [`docs/implementationPlan.md`](./docs/implementationPlan.md)                     | Phases 0–8 with status, screen build map, accounts and keys                                                                                                                 |
| [`phase-1-ui-ux-design/stitchPrompt.md`](./phase-1-ui-ux-design/stitchPrompt.md) | Google Stitch prompts + fix prompts F1–F9                                                                                                                                   |
| [`phase-6-quality-demo/eval/results/`](./phase-6-quality-demo/eval/results/)     | Eval, UI parity and Lighthouse results                                                                                                                                      |

## The code is organised by phase

Each phase folder holds its **plan** (`README.md`) **and its code + tests**. `app/` wires the phases into one app; `api/` holds the one-line Vercel entry points. **A phase may import earlier phases, never later ones** (enforced by ESLint).

| Folder                                                 | Code                                                                                                                                                     | Tests                             |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| [`phase-0-setup/`](./phase-0-setup/)                   | `@kaambill/shared` (types, Zod schema), seed rate card, server env + `/api/health`, local dev API, test helpers                                          | schema, env                       |
| [`phase-1-ui-ux-design/`](./phase-1-ui-ux-design/)     | Stitch export (`design/`), theme CSS generated from it, tokens, `Icon`, icon-font subset                                                                 | icons · e2e                       |
| [`phase-2-voice-core/`](./phase-2-voice-core/)         | Conversation machine (read-back gate), Web Speech (4 s pauses, auto-restart), text box, app language (`useT`), shell (top bar, dock, 4-tab nav, banners) | machine, STT · e2e                |
| [`phase-3-understanding/`](./phase-3-understanding/)   | Normalizer (Indian numbers, Devanagari 1–100), `/api/extract` client, Groq strict-schema extraction (`LlmProvider`), rate limit, prompt                  | normalizer, client, API           |
| [`phase-4-billing-domain/`](./phase-4-billing-domain/) | Matcher, rate card, bill model, clarifier, messages in 3 languages, billing adapter, journey step bar, S3–S6/S8 screens                                  | domain, matcher · e2e             |
| [`phase-5-output-share/`](./phase-5-output-share/)     | Payment details → payment → invoice (PAID/DUE), UPI link + QR, A6 PDF, share, history, drafts, profile, Home, S1/S7/S9 screens                           | output, PDF · e2e (incl. offline) |
| [`phase-6-quality-demo/`](./phase-6-quality-demo/)     | Telemetry, 208-sentence eval + resumable runner + results, UI-parity capture, demo pack                                                                  | telemetry, eval data              |
| [`phase-7-domain-sprint/`](./phase-7-domain-sprint/)   | To-do rehearsal (schema, adapter, endpoint), new-domain scaffold + playbook                                                                              | rehearsal                         |
| [`phase-8-finale/`](./phase-8-finale/)                 | Groq Whisper (`/api/stt` + provider), second pass, voice detector, engine selector, demo mode, scripts, pitch                                            | VAD, Whisper, second pass · e2e   |
| [`app/`](./app/)                                       | `index.html`, Vite/PWA config, `main.tsx`, `App.tsx` (wires all phases), static assets                                                                   | e2e                               |
| [`api/`](./api/)                                       | Vercel entry files re-exporting each phase's endpoint                                                                                                    | —                                 |

### What stays at the repo root (and why)

| File                                            | Why it can't move                                                                                                                                                     |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`, `package-lock.json`             | npm installs and links the workspaces from the root. It holds the scripts and shared tooling; **each phase has its own `package.json`** with its runtime dependencies |
| `vercel.json`                                   | Vercel reads it from the project root                                                                                                                                 |
| `eslint.config.js`                              | ESLint and editors look for it at the root. It's a one-line re-export of `phase-0-setup/eslint.rules.js`                                                              |
| `README.md`                                     | Entry point; the project-wide docs live in [`docs/`](./docs/)                                                                                                         |
| `.env`, `.env.example`, `.gitignore`, `.husky/` | Read from the root by Vite, Node, git                                                                                                                                 |

TypeScript: `phase-0-setup/tsconfig.base.json` + a `tsconfig.json` (and `tsconfig.server.json`) **in every phase folder**, `app/` and `api/` (`npm run typecheck` checks them all, or `-- 4` for one phase). Tests: Vitest and Playwright configs in `phase-6-quality-demo/`.

## Stack

Groq (`openai/gpt-oss-120b`, strict JSON schema; optional `whisper-large-v3-turbo`) · browser Web Speech (input only) · Wispr Flow (dictation into the text box) · XState · IndexedDB · `qrcode` + `jspdf` + Web Share API · Vite + React + Tailwind (theme from the Stitch export) · Vitest + Playwright.
