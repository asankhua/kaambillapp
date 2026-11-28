# KaamBill: Bol ke bill banaiye 🎙️₹

**Voice billing for Indian tradespeople.** An electrician says (or dictates) one sentence:

> _"Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do"_

KaamBill builds the itemized bill (**₹1,235**), asks at most one question at a time, shows the total for a final "_haan_", takes the payment details, shows the UPI QR, and opens WhatsApp with the PDF bill. **The worker always presses Send.**

Built for **India Runs on Voice** (Scaler × Wispr Flow), Small business track. 🗣️ **Built hands-free with [Wispr Flow](https://wisprflow.ai)**: specs, prompts and code were dictated with Flow.

## Live demo

| What                 | URL                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Landing page         | [kaambillapp.onrender.com](https://kaambillapp.onrender.com/)                                       |
| The app              | [kaambillapp.onrender.com/app/](https://kaambillapp.onrender.com/app/)                              |
| The app in demo mode | [kaambillapp.onrender.com/app/?demo=1](https://kaambillapp.onrender.com/app/?demo=1) (skips set-up) |
| Health check         | [kaambillapp.onrender.com/api/health](https://kaambillapp.onrender.com/api/health)                  |
| Demo video (3 min)   | [youtu.be/wO_zYQ81DLk](https://youtu.be/wO_zYQ81DLk)                                                |
| Pitch deck (PDF)     | [`docs/KaamBill-pitch-deck.pdf`](./docs/KaamBill-pitch-deck.pdf)                                    |

Hosted on Render's free plan, which puts an idle service to sleep: the first visit after a quiet spell can take a while to load.

## See it working

![KaamBill working prototype: a job is typed, the itemized bill is checked, payment details are filled in and the bill is ready to send on WhatsApp](app/public/kaambill-demo-english.gif)

A screen recording of the real app in demo mode, from job to bill. Also available in [हिंदी](app/public/kaambill-demo-hindi.gif) and [Hinglish](app/public/kaambill-demo-hinglish.gif).

---

## How it works

**Customer journey** (a step bar shows where the bill is):

| #   | Step               | What the worker does                                                                                                                                                      |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Saaman** (items) | Dictates with **Wispr Flow** into the text box (open from the start), or types. The mic button is the optional alternative                                                |
| 2   | **Jaanch** (check) | Answers one question at a time (a missing price, an unsure quantity), then confirms the total with "haan"                                                                 |
| 3   | **Details**        | Checks the amount and their UPI ID, adds the customer's WhatsApp number, picks UPI / Cash / Baad mein (later)                                                             |
| 4   | **Payment**        | The customer scans the QR (amount filled in) → the worker taps "Paisa mil gaya ✓" (or "Cash mila ✓"). KaamBill can't see payments, so "paid" is the worker's confirmation |
| 5   | **Bill**           | The bill/PDF says **PAID** or **DUE**; WhatsApp opens with it and the worker presses Send                                                                                 |

**Voice in, screen out:**

- **Wispr Flow is the default.** The app opens with its text box focused, so Flow (sign in to the Wispr Flow app) dictates straight into it. A web page can't launch Wispr Flow itself (no API or link exists), so Flow is used from its own keyboard / shortcut inside the box. Typing works the same way.
- **Browser mic is optional.** The mic button under the box listens with the phone browser's speech recognition (live transcript). Pauses are fine: the turn ends after **4 s** without new words or on **"Ruk jaiye"**. On the landing page choose **Browser mic (optional)** (the app then opens with `?box=mic`, box closed until "Likh ke daalein").
- **No text-to-speech:** the app never speaks; questions and the read-back are on screen.

**App language:** Hinglish (default) · हिंदी · English, chosen in the top bar. It switches every screen text, the mic language and the app's messages together. Only these three languages are supported.

**Phone-only layout:** designed for 360–430 px screens; on a computer it shows as a phone-width column.

## What you need

|                                   | Needed?                              | Why                                                                                                                                                                                                                                                                                              |
| --------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Node.js 22+ and npm**           | ✅ To run it locally                 | CI uses Node 22. Install from [nodejs.org](https://nodejs.org)                                                                                                                                                                                                                                   |
| **Groq API key** (`GROQ_API_KEY`) | ✅ **The only key** (to build bills) | The Groq LLM (`openai/gpt-oss-120b`, strict JSON) turns the spoken / typed words into the bill: customer, items, quantities, labour, intent. The app **starts and shows its screens without it**; building a bill then shows a "key not set" message. Only the text is sent to Groq, never audio |
| **Docker** (optional)             | Alternative to Node                  | `docker compose up --build` runs everything on http://localhost:3000, no Node install needed                                                                                                                                                                                                     |
| **Wispr Flow app**                | Default, no key                      | Dictates into the text box (sign in to the Wispr Flow app). The app and the landing page's **Wispr Flow (default)** choice open the box focused straight away                                                                                                                                    |
| Browser speech recognition        | Optional, built in, no key           | The mic button (Chrome on Android / desktop). Choose **Browser mic (optional)** on the landing page                                                                                                                                                                                              |
| Text-to-speech                    | ❌ Not used                          | The app never speaks                                                                                                                                                                                                                                                                             |
| Render account                    | For hosting                          | Runs the one Node service (`npm start`): landing page, app and `/api`                                                                                                                                                                                                                            |

## Quick start

### Run it with Docker (one command, no key needed)

```bash
docker compose up --build   # then open http://localhost:3000
```

The landing page is at http://localhost:3000/ and the live app at http://localhost:3000/app/ (add `?demo=1` to skip set-up). **No `.env` and no secret key are needed to start.** Without a Groq key every screen works, and building a bill shows a "Groq key not set" message. To turn bill extraction on, copy `.env.example` to `.env` and set `GROQ_API_KEY` (free key at [console.groq.com/keys](https://console.groq.com/keys)), then run the same command. The port is set in [`docker-compose.yml`](./docker-compose.yml) (`3000:3000`).

### Run it with Node

```bash
npm install
cp .env.example .env       # then set GROQ_API_KEY (needed to build bills; the app starts without it)
npm run check:env          # validates the env and confirms the Groq key works (prints no secrets)
npm run dev                # landing page on http://localhost:5173, app on /app/ + local API on :3000 (real Groq)
```

Try it: open http://localhost:5173/app/?demo=1 → type (or dictate with Wispr Flow into) the box → the sentence above → "Haan, sahi hai" → "Haan, bhejo" → UPI → "Paisa mil gaya ✓".

### Run it locally with an AI coding assistant

Not comfortable with the terminal? Paste this prompt into Cursor (or any coding assistant) to set up and run KaamBill on your computer:

```text
Set up and run the KaamBill app on my computer.

1. Clone https://github.com/asankhua/kaambillapp and open the folder (or use it if I already have it).
2. Run `npm install`.
3. Create `.env` by copying `.env.example`. Set `GROQ_API_KEY` to my Groq key (free key at https://console.groq.com). Do not print the key or commit it.
4. Run `npm run check:env` and fix anything it reports.
5. Run `npm run dev` and leave it running.
6. Tell me these links when it is up:
   - Landing page: http://localhost:5173/
   - Live app (demo, skips set-up): http://localhost:5173/app/?demo=1
```

## Read first

| Doc                                                                              | What it covers                                                                                                                                                              |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/problemStatement.md`](./docs/problemStatement.md)                         | Problem, users, market size, constraints, success metrics                                                                                                                   |
| [`docs/architecture.md`](./docs/architecture.md)                                 | System design: customer journey (§3.0), state machine, speech-to-text and Wispr Flow (§5.1), Groq extraction (§5.2), app language (§5.6), screens (§7), configuration (§13) |
| [`docs/implementationPlan.md`](./docs/implementationPlan.md)                     | Phases 0–8 with status, screen build map, accounts and keys                                                                                                                 |
| [`phase-1-ui-ux-design/stitchPrompt.md`](./phase-1-ui-ux-design/stitchPrompt.md) | Google Stitch prompts + fix prompts F1–F9                                                                                                                                   |
| [`phase-6-quality-demo/eval/results/`](./phase-6-quality-demo/eval/results/)     | Eval, UI parity and Lighthouse results                                                                                                                                      |

## The code is organised by phase

Each phase folder holds its **plan** (`README.md`) **and its code + tests**. `app/` wires the phases into one app; `api/` holds the one-line entry point of each endpoint. **A phase may import earlier phases, never later ones** (enforced by ESLint).

| Folder                                                 | Code                                                                                                                                                                               | Tests                                                   |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| [`phase-0-setup/`](./phase-0-setup/)                   | `@kaambill/shared` (types, Zod schema), seed rate card, server env + `/api/health`, local dev API, test helpers                                                                    | schema, env                                             |
| [`phase-1-ui-ux-design/`](./phase-1-ui-ux-design/)     | Stitch export (`design/`), theme CSS generated from it, tokens, `Icon`, icon-font subset                                                                                           | icons · e2e                                             |
| [`phase-2-voice-core/`](./phase-2-voice-core/)         | Conversation machine (read-back gate), Web Speech (4 s pauses, auto-restart), text box, app language (`useT`), shell (top bar, dock, 4-tab nav, banners)                           | machine, STT · e2e                                      |
| [`phase-3-understanding/`](./phase-3-understanding/)   | Normalizer (Indian numbers, Devanagari 1–100), `/api/extract` client, Groq strict-schema extraction (`LlmProvider`), rate limit, prompt                                            | normalizer, client, API                                 |
| [`phase-4-billing-domain/`](./phase-4-billing-domain/) | Matcher, rate card, bill model, clarifier, messages in 3 languages, billing adapter, journey step bar, S3–S6/S8 screens                                                            | domain, matcher · e2e                                   |
| [`phase-5-output-share/`](./phase-5-output-share/)     | Payment details → payment → invoice (PAID/DUE), UPI link + QR, A6 PDF, share, history, drafts, profile, Home, S1/S7/S9 screens                                                     | output, PDF · e2e (incl. offline)                       |
| [`phase-6-quality-demo/`](./phase-6-quality-demo/)     | Telemetry, 208-sentence eval + resumable runner + results, UI-parity capture, demo pack                                                                                            | telemetry, eval data                                    |
| [`phase-7-domain-sprint/`](./phase-7-domain-sprint/)   | To-do rehearsal (schema, adapter, endpoint), new-domain scaffold + playbook                                                                                                        | rehearsal                                               |
| [`phase-8-finale/`](./phase-8-finale/)                 | Demo mode (`?demo=1`), finale scripts, pitch                                                                                                                                       | e2e (browser mic, Wispr Flow box), landing translations |
| [`app/`](./app/)                                       | `index.html` (landing page at `/`), `landing/` (its CSS + script), `app/index.html` (the app at `/app/`), Vite/PWA config, `main.tsx`, `App.tsx` (wires all phases), static assets | e2e                                                     |
| [`api/`](./api/)                                       | Entry files re-exporting each phase's endpoint (served by `npm start` and `npm run dev:api`)                                                                                       | —                                                       |

TypeScript: `phase-0-setup/tsconfig.base.json` + a `tsconfig.json` **in every phase folder**, `app/` and `api/` (plus a `tsconfig.server.json` in phases 0, 3 and 7, which have server code). `npm run typecheck` checks them all, or `-- 4` for one phase. Tests: Vitest and Playwright configs in `phase-6-quality-demo/`.

## Tech stack

| Layer               | What is used                                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Understanding (LLM) | [Groq](https://groq.com) `openai/gpt-oss-120b` (fallback `openai/gpt-oss-20b`), strict JSON schema, via `groq-sdk`     |
| Voice in            | [Wispr Flow](https://wisprflow.ai) dictating into the text box (default), or the browser Web Speech API (optional mic) |
| Voice out           | None: the app never speaks                                                                                             |
| App                 | React 19 · TypeScript · Vite 8 · Tailwind 4 · XState 5 (conversation machine) · PWA (works offline)                    |
| Billing and output  | `fuse.js` (item matching) · `zod` (schemas) · IndexedDB via `idb-keyval` · `qrcode` (UPI QR) · `jspdf` (PDF bill)      |
| Sharing             | WhatsApp link and Web Share API (the worker always presses Send)                                                       |
| Server              | One Node process (`npm start`) serving the built landing page, the app and `/api/*`                                    |
| Hosting             | [Render](https://render.com) web service (free plan) at `kaambillapp.onrender.com`                                     |
| Design              | Google Stitch export, Material Symbols icon subset                                                                     |
| Quality             | Vitest (unit) · Playwright (end-to-end, including the browser mic and Wispr Flow paths) · ESLint · Prettier · CI       |

**Not used any more:** Sarvam and Groq Whisper speech-to-text (removed 28 Nov; Wispr Flow is the default and the browser mic is optional).

## License

[MIT](./LICENSE), © 2026 Ashish Kumar Sankhua. The landing page footer links to the same file (`app/public/LICENSE.txt`) as a download.
