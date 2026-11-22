# Phase 0: Setup and Foundations

|                |                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Dates**      | 21–22 Nov 2026                                                                                                             |
| **Goal**       | Lock the team, and set up the repo, shared types and seed data so Phases 2 and 3 can run in parallel                       |
| **Builds**     | [`architecture.md` §1.1, §4](../docs/architecture.md) · [`problemStatement.md` → Market Size](../docs/problemStatement.md) |
| **Depends on** | —                                                                                                                          |

---

## 1. Hackathon Admin (do first)

- [ ] **Lock the team.** Invite all members on the Scaler dashboard _before_ submitting anything; the team locks after the first submission.
- [ ] Every member installs **Wispr Flow** and signs in with their registered email (claims the free month of Flow Pro).
- [ ] No Wispr API key is needed: Flow is a dictation app that types into any text box, including KaamBill's ([`architecture.md` §5.1.1](../docs/architecture.md)).
- [ ] Check the market figures against the MoSPI ASUSE 2023-24 factsheet.

## 2. Repository Setup

- [x] Repo with the phase-folder layout from [`docs/implementationPlan.md` §5](../docs/implementationPlan.md).
- [x] `app/`: Vite + React + TS, Tailwind, `vite-plugin-pwa`, XState, Vitest.
- [ ] `api/`: Vercel serverless function scaffold, `groq-sdk`, `zod` (v4).
- [x] `phase-0-setup/` is the `@kaambill/shared` package imported by every phase and the server.
- [ ] Lint and format: ESLint + Prettier, plus a pre-commit hook (`lint-staged`).
- [ ] CI: GitHub Actions running `typecheck`, `lint` and `test` on every push.
- [ ] Deploy an empty PWA to Vercel and check it installs on an Android phone over HTTPS (the mic needs HTTPS).
- [ ] **Environment:** copy [`../.env.example`](../.env.example) into the repo root and [`../.gitignore`](../.gitignore) (ignores `.env*`).
  - Local: `cp .env.example .env` (repo root) and fill in `GROQ_API_KEY` (the only required variable) (from console.groq.com/keys).
  - Vercel: add every **server** variable (`GROQ_API_KEY`, `LLM_MODEL`, `LLM_FALLBACK_MODEL`, `LLM_REASONING_EFFORT`, `ALLOWED_ORIGINS`, `RATE_LIMIT_PER_MIN`) for Production + Preview.
  - Rule: **no secret in any `VITE_` variable** (those are bundled into the browser). See [`architecture.md` §13](../docs/architecture.md).
  - Add `phase-0-setup/server/env.ts`, which checks the required variables with Zod at startup.

## 3. Shared Types (`phase-0-setup/src/types.ts`)

✅ **Implemented:** [`phase-0-setup/src/types.ts`](./src/types.ts) is the source of truth (it matches [`architecture.md` §4.1](../docs/architecture.md)). Key points:

- `Turn`: `source: "stt" | "text"` ("text" = typed or Wispr Flow dictation)
- `ExtractedItem`: `qtySpoken` (as said) + `qty` (set by the normalizer) + `spokenUnitPrice` (only when the worker says a price) + `unit` + `confidence`
- `Extraction`: every field present, `null` when unknown (Groq strict mode); `intent` ∈ new_job · add_info · correct · approve · cancel · **rate_update** · history · unknown; `historyAction` for Bills-screen voice commands
- `RateCardEntry`: categories electrical · plumbing · labour · other
- `DEMO`: the canonical demo data (₹1,235, KB-2026-0042)

## 4. Seed Data

- [ ] `phase-0-setup/seed/rateCard.json`: **15 items** (e.g. Havells MCB 16A, Finolex wire 1.5mm/2.5mm per metre, 6A/16A sockets and switches, switch board, CPVC pipe ½"/¾" per metre, CPVC elbow, tee, ball valve, PVC tape, wall-mounted tap, flush valve, ceiling fan regulator), each with 2–4 **aliases** (Hindi word, common misspelling, shorthand).
- [ ] `eval/utterances.seed.jsonl`: **30 starter utterances** dictated naturally (use Wispr Flow to draft them, then speak them for audio later) with the expected `Extraction` JSON. Cover:
  - Indian number words (_sawa, dedh, dhai, paune, hazaar_)
  - brand mispronunciations (_Phenolex, Hevells_)
  - missing customer name, unknown item, approval and correction phrases

## 5. Files Created in This Phase

| File                               | Purpose                                             |
| ---------------------------------- | --------------------------------------------------- |
| `phase-0-setup/src/types.ts`       | Contracts above                                     |
| `phase-0-setup/seed/rateCard.json` | 15 seed items                                       |
| `eval/utterances.seed.jsonl`       | Starter test set                                    |
| `.github/workflows/ci.yml`         | CI                                                  |
| `README.md` (repo)                 | Setup, "Built with Wispr Flow" badge, links to docs |

## 6. Acceptance Criteria

- The empty PWA installs on a real Android phone from the Vercel URL.
- `npm run typecheck && npm test` passes in CI.

## 7. Wispr Flow Evidence

- 🎥 A 30–60 s clip of dictating the shared types or seed rate card in Hinglish with Flow.

## 8. Progress (21 Nov)

| Item                                                                                                                          | Status                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Repo with phase folders (`phase-0-setup` = `@kaambill/shared` workspace; `app/`; `api/`)                                      | ✅                                                                                             |
| ESLint (incl. **core → domain import ban**, verified) + Prettier + lint-staged pre-commit + GitHub Actions CI                 | ✅                                                                                             |
| Empty PWA builds (69 KB gzipped JS, manifest, service worker, icons)                                                          | ✅                                                                                             |
| `.env` → symlink to `r2/.env`; `phase-0-setup/server/env.ts` Zod check; `phase-0-setup/server/health.ts`; `npm run check:env` | ✅ Groq key verified; `openai/gpt-oss-120b`, `gpt-oss-20b`, `whisper-large-v3-turbo` available |
| Shared types, seed rate card (15), seed eval (30) + 14 tests                                                                  | ✅                                                                                             |
| Stitch export in `phase-1-ui-ux-design/design/` (single copy); Home imports the toolbox illustration from it                  | ✅                                                                                             |
| **Team locked on Scaler dashboard**                                                                                           | ⬜ you                                                                                         |
| **Vercel deploy + install on an Android phone**                                                                               | ⬜ you (`npx vercel`, then add server env vars)                                                |
| **Push to GitHub** (CI runs on push)                                                                                          | ⬜ you                                                                                         |
| Wispr Flow 🎥 clip                                                                                                            | ⬜ you                                                                                         |

## 9. Exit Checklist

- [ ] Team locked, everyone on Wispr Flow
- [ ] Repo, CI and deploy working
- [ ] Shared types merged; seed data committed

---

<!-- code-index:start -->

## Code in this folder

**Config in this folder:** [`package.json`](./package.json) · [`tsconfig.json`](./tsconfig.json) · [`tsconfig.server.json`](./tsconfig.server.json) · [`tsconfig.base.json`](./tsconfig.base.json) · [`eslint.rules.js`](./eslint.rules.js)

Run this phase's tests: `npm run test:phase -- 0` (add `--unit` to skip the browser tests).
Endpoint: `GET /api/health` (entry file in [`../api/`](../api/)).

**Browser code (`src/`)**

- [`src/index.ts`](./src/index.ts)
- [`src/schema.test.ts`](./src/schema.test.ts) 🧪
- [`src/schema.ts`](./src/schema.ts)
- [`src/types.ts`](./src/types.ts)

**Server code (`server/`, served via `api/`)**

- [`server/env.test.ts`](./server/env.test.ts) 🧪
- [`server/env.ts`](./server/env.ts)
- [`server/health.ts`](./server/health.ts)

**Scripts**

- [`scripts/check-env.ts`](./scripts/check-env.ts)
- [`scripts/dev-api.ts`](./scripts/dev-api.ts) (local API for `npm run dev`)
- [`scripts/dev.mjs`](./scripts/dev.mjs)
- [`scripts/test-phase.mjs`](./scripts/test-phase.mjs)
- [`scripts/typecheck.mjs`](./scripts/typecheck.mjs)

**Seed data**

- [`seed/rateCard.json`](./seed/rateCard.json)

**Test helpers**

- [`testing/fixtures.ts`](./testing/fixtures.ts)

🧪 = test file.

<!-- code-index:end -->
