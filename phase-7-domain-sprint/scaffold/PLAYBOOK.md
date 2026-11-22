# Domain sprint playbook (27–29 Nov, 48 h)

Hour plan: [`../../phase-7-domain-sprint/README.md`](../README.md). This file is the **how**.

## What you reuse unchanged

| Layer                                                                                            | Files                                            | Proven by                                                                                                                     |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Voice core: mic, Web Speech, text box (Wispr Flow), state machine with the read-back gate        | `apps/web/src/core/**`                           | KaamBill + the to-do **rehearsal** run on it with zero core changes (`phase-7-domain-sprint/src/rehearsal/rehearsal.test.ts`) |
| Structured extraction on Groq (strict schema, fallback, `json_validate_failed` retry, `unknown`) | `phase-3-understanding/server/structured.ts`     | 17 API tests + rehearsal **3/3 on real Groq** (`npm run rehearsal:todo`)                                                      |
| Protected endpoint (origin, rate limit, caps, 429 passthrough, CORS)                             | `phase-3-understanding/server/handler.ts`        | `/api/extract`, `/api/rehearsal/todo`                                                                                         |
| Web client (timeout, retry, offline) + number normalizer                                         | `apps/web/src/understanding/{http,normalize}.ts` | 90+ tests                                                                                                                     |
| App shell + Stitch theme + banners (mic blocked, offline, not understood)                        | `apps/web/src/ui/**`, `index.css`                | 13 e2e tests                                                                                                                  |

## H0–H4: scaffold in one command

```bash
npm run domain:new -- <name>      # e.g. grievance, symptoms, quiz
```

Creates `packages/shared/src/<name>.ts` (schema), `api/<name>.ts` (endpoint + prompt), `apps/web/src/domain-<name>/{adapter.ts,Card.tsx,adapter.test.ts}` and `eval/<name>.seed.jsonl`. It typechecks and its test passes as generated.

Then:

1. **Schema** (`packages/shared/src/<name>.ts`): `z.strictObject`, `.nullable()` never `.optional()`, copy numbers as spoken.
2. **Prompt** (`api/<name>.ts`): rules + 8–10 compact examples (see `phase-3-understanding/server/prompts/extract.system.ts` for the format). Keep it byte-stable.
3. **Adapter**: `understand` → apply; `nextQuestion` = ONE question by the brief's priority; `readBack` ≤ 2 sentences; `finalize` only after approval.
4. **App.tsx**: swap `createBillingAdapter` → `create<Name>Adapter`, render `<NameCard>` in the canvas. Keep `VoiceDock`, `BottomNav`, banners.

## Rules that carry over (judges will notice)

- One question at a time; read back before any action; the user confirms.
- Nothing sent or saved without approval (the machine enforces it).
- No Wispr label on the mic dock; "Wispr Flow" in the text box.
- Free tier ≈ 3 requests/min: keep prompts compact, `LLM_MAX_TOKENS` 640, approvals on the phone.

## Before submitting

`npm run typecheck && npm run lint && npm test && npm run e2e && npm run build` · deploy · test on 2 phones · 90 s video · README · Wispr Flow clips. **Submit ≥ 4 h early.**
