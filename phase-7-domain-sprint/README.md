# Phase 7: Domain Sprint (48 Hours)

|                |                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dates**      | 27 Nov (brief goes live) → **29 Nov (submit)**                                                                                                                                        |
| **Goal**       | Answer the **common sprint problem statement** (27–29 Nov) by reusing the voice core (Phase 2) and the understanding plumbing (Phase 3), writing only a new schema and domain adapter |
| **Builds**     | [`architecture.md` §1.1](../docs/architecture.md) · [`problemStatement.md` → Reuse note](../docs/problemStatement.md)                                                                 |
| **Depends on** | Phases 2 and 3 (required), Phases 4–6 (patterns to copy)                                                                                                                              |

> The sprint brief may **not** be about billing. Treat KaamBill as the reference implementation, not the deliverable.

---

## 1. What Is Reused vs Rebuilt

| Layer                                                           | Reuse                              | Rebuild                                                              |
| --------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------- |
| `phase-2-voice-core/src/*` (speech-to-text, text path, machine) | ✅ As is                           | —                                                                    |
| `phase-3-understanding/server/extract.ts` + client + normalizer | ✅ Plumbing                        | New Zod schema + system prompt + few-shot examples                   |
| `phase-4-billing-domain/src/*`                                  | Patterns only                      | New `DomainAdapter` (apply turn, next question, read-back, finalize) |
| `phase-5-output-share/src/*`                                    | QR, PDF, share helpers if relevant | New output format                                                    |
| `eval/score.ts`                                                 | ✅ Scorer harness                  | New test utterances                                                  |

## 2. Hour-by-Hour Plan

| Window      | Work                                                                                                                                                             | Output                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **H0–H2**   | Read the brief together, by voice. Write `domain-<name>/problem.md`: user, the one sentence they'd say, the output, and why voice. Pick the **single** core flow | 1-page brief                             |
| **H2–H4**   | Define the new `Extraction` schema + 10 few-shot examples; write the clarification priority list; draft the reply templates in the user's language               | `schema.ts`, `prompt.md`, `templates.ts` |
| **H4–H12**  | New `DomainAdapter` + domain UI card, wired into the existing machine. Get a voice → output loop working end to end                                              | Working flow (rough)                     |
| **H12–H16** | 30-utterance mini eval, recorded in real conditions; fix the top failures                                                                                        | `domain-<name>/eval/results.md`          |
| **H16–H24** | Sleep / buffer. **Don't skip this.**                                                                                                                             | —                                        |
| **H24–H32** | Polish: amber chips, the one-question rule, read-back, offline fallback, text path                                                                               | Demo-ready build                         |
| **H32–H40** | Demo video (90 s), README, architecture diagram (adapted from KaamBill's), Wispr Flow clips                                                                      | Submission pack                          |
| **H40–H44** | Test on 2 real phones; final fixes                                                                                                                               | —                                        |
| **H44–H48** | **Submit early**, at least 4 h before the deadline                                                                                                               | ✅                                       |

## 3. Team Split (up to 3)

| Role                      | Owns                                                                     |
| ------------------------- | ------------------------------------------------------------------------ |
| **Voice and integration** | Machine wiring, domain adapter, device testing                           |
| **Understanding**         | Schema, prompt, few-shot examples, normalizer additions, eval            |
| **Product and demo**      | Brief, reply templates, UI card, demo video, README, Wispr Flow evidence |

Solo? Follow the same order but cut H24–H32 polish down to the read-back only.

## 4. Pre-Sprint Checklist (have ready by 26 Nov)

- [ ] `phase-2-voice-core` and the Phase 3 extraction work with a **dummy schema** (prove the swap works: build a "to-do list by voice" adapter in 1 hour as a rehearsal)
- [ ] Template repo branch `domain-starter` with the domain folder removed
- [ ] The Wispr master class attended; notes in `domain-<name>/masterclass.md`
- [ ] Screen-recording set up for capturing Wispr Flow use during the sprint

## 5. Acceptance Criteria

- One clear voice-first flow from speech to useful output, working on a real phone.
- Follows the same safety rules: one question at a time, an on-screen read-back before any action, the user confirms.
- Submission includes a demo video, README, eval numbers and Wispr Flow evidence.

## 6. Exit Checklist

- [ ] Sprint build submitted (**by 29 Nov**)
- [ ] Shortlist watched for on **2 Dec**

## 7. Prep progress (21 Nov)

| Pre-sprint item                                                                                                                                                                  | Status                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `phase-2-voice-core` + extraction work with a **different schema** (rehearsal: "to-do list by voice")                                                                            | ✅ zero changes to Phase 2; 3 machine tests; **3/3 on real Groq** (`npm run rehearsal:todo`, 0.5–1.1 s) |
| Extraction made generic: `phase-3-understanding/server/structured.ts` + `phase-3-understanding/server/handler.ts`; KaamBill `/api/extract` rebuilt on them (all tests unchanged) | ✅                                                                                                      |
| Generic web client `understanding/http.ts`                                                                                                                                       | ✅                                                                                                      |
| One-command scaffold `npm run domain:new -- <name>` (schema, endpoint, adapter, card, test)                                                                                      | ✅ generated code typechecks, lints and passes its test                                                 |
| [`phase-7-domain-sprint/scaffold/PLAYBOOK.md`](./scaffold/PLAYBOOK.md)                                                                                                           | ✅                                                                                                      |
| `domain-starter` branch with `domain/` removed                                                                                                                                   | ⬜ needs a first git commit → set your git name/email                                                   |
| Wispr master class notes (`domain-<name>/masterclass.md`)                                                                                                                        | ⬜ you                                                                                                  |
| Screen recording ready for Wispr Flow clips                                                                                                                                      | ⬜ you                                                                                                  |

---

<!-- code-index:start -->

## Code in this folder

**Config in this folder:** [`package.json`](./package.json) · [`tsconfig.json`](./tsconfig.json) · [`tsconfig.server.json`](./tsconfig.server.json)

Run this phase's tests: `npm run test:phase -- 7` (add `--unit` to skip the browser tests).
Endpoint: `POST /api/rehearsal/todo` (entry file in [`../api/`](../api/)).

**Browser code (`src/`)**

- [`src/rehearsal/adapter.ts`](./src/rehearsal/adapter.ts)
- [`src/rehearsal/rehearsal.test.ts`](./src/rehearsal/rehearsal.test.ts) 🧪
- [`src/rehearsal/schema.ts`](./src/rehearsal/schema.ts)

**Server code (`server/`, served via `api/`)**

- [`server/rehearsal-todo.ts`](./server/rehearsal-todo.ts)

**Scripts**

- [`scripts/rehearsal-todo.ts`](./scripts/rehearsal-todo.ts)

**New-domain scaffold**

- [`scaffold/PLAYBOOK.md`](./scaffold/PLAYBOOK.md)
- [`scaffold/new.mjs`](./scaffold/new.mjs)
- [`scaffold/templates/Card.tsx.tpl`](./scaffold/templates/Card.tsx.tpl)
- [`scaffold/templates/adapter.test.ts.tpl`](./scaffold/templates/adapter.test.ts.tpl)
- [`scaffold/templates/adapter.ts.tpl`](./scaffold/templates/adapter.ts.tpl)
- [`scaffold/templates/api.ts.tpl`](./scaffold/templates/api.ts.tpl)
- [`scaffold/templates/schema.ts.tpl`](./scaffold/templates/schema.ts.tpl)

🧪 = test file.

<!-- code-index:end -->
