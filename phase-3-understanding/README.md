# Phase 3: Understanding (LLM Extraction + Normalizer)

|                |                                                                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dates**      | 23–24 Nov 2026 (can run in parallel with Phase 2)                                                                                                                             |
| **Goal**       | Turn a transcript into a validated `Extraction` JSON, with Indian number words and units turned into exact values. **A new domain swaps the schema; the plumbing is reused.** |
| **Builds**     | [`architecture.md` §4.1, §5.2, §5.3](../docs/architecture.md)                                                                                                                 |
| **Depends on** | Phase 0 (shared `Extraction` type, `api/` scaffold)                                                                                                                           |

---

## 1. Tasks

### 1.1 Extraction endpoint (`phase-3-understanding/server/extract.ts`)

- [ ] `POST /api/extract`. Request body: `{ turn: Turn, history: Turn[] (last 4), catalog: {name, aliases}[], draftSummary?: string }`. Response: `Extraction`.
- [ ] **LLM provider: Groq** (`groq-sdk`) with **strict structured outputs** (`response_format: json_schema`, `strict: true`). Groq's constrained decoding guarantees the reply matches the schema:
  ```ts
  import Groq from "groq-sdk";
  import { z } from "zod";
  import { ExtractionSchema } from "@kaambill/shared";

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const jsonSchema = z.toJSONSchema(ExtractionSchema); // Zod v4

  const res = await groq.chat.completions.create({
    model: process.env.LLM_MODEL ?? "openai/gpt-oss-120b",
    messages: [
      { role: "system", content: SYSTEM_PROMPT }, // fixed, never changes
      { role: "user", content: buildUserMessage(turn, history, catalog) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "extraction", strict: true, schema: jsonSchema },
    },
    reasoning_effort: "low", // gpt-oss: low | medium | high
    include_reasoning: false, // don't return the reasoning text (smaller, faster)
    temperature: 0,
    max_completion_tokens: 1024,
  });

  if (res.choices[0].finish_reason === "length") return unknownIntent();
  const extraction = ExtractionSchema.parse(JSON.parse(res.choices[0].message.content!));
  ```
  _Check the parameter names against the installed `groq-sdk` types when coding; the call shape follows Groq's docs (structured outputs + reasoning)._
- [ ] **Strict-schema rules** (Groq strict mode): **every field must be `required`** and every object needs `additionalProperties: false`. Optional fields become **nullable** (`z.string().nullable()`, not `.optional()`). Groq supports only part of JSON Schema, so keep the schema flat: no `oneOf` or regex `pattern`. Still validate with Zod after parsing.
- [ ] **Model choice** (all on Groq, chosen by `LLM_MODEL`):
  | Model                                         | Why                                                                                   | When                                                                 |
  | --------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
  | `openai/gpt-oss-120b`                         | Strict mode, more accurate on Hinglish, ~500 tokens/s, $0.15/$0.60 per million tokens | **Default**                                                          |
  | `openai/gpt-oss-20b`                          | Strict mode, ~1000 tokens/s, half the price                                           | If Phase 6 latency misses **< 3 s**, after comparing on the eval set |
  | `qwen/qwen3.8-27b`                            | Strict mode, but **preview** (not for production)                                     | Experiments only                                                     |
  | Don't switch models without running the eval. |
- [ ] **Keep the prompt stable:** keep `SYSTEM_PROMPT` byte-for-byte identical across calls (no timestamps or IDs), and put everything that changes in the user message. This keeps behaviour consistent, and lets prompt caching help wherever Groq offers it for the model (check Groq's prompt-caching docs; don't rely on it for the latency target).
- [ ] **Error handling:**
  - `finish_reason === "length"` → return `{ intent: "unknown" }` so the app asks the worker to repeat.
  - Catch the SDK's typed errors (e.g. rate limit 429 → retry once with backoff, then fall back to `LLM_FALLBACK_MODEL`); network or timeout → tell the client "_Network slow hai, ek baar phir boliye._"
  - Zod validation failure (shouldn't happen in strict mode) → log it and return `unknown`.
- [ ] **Free-tier limits:** the Groq developer plan has per-minute token and request limits. Keep the request small (the catalog sends names and aliases only) and watch for 429s during the demo.
- [ ] Remove customer phone numbers from logs; log only the transcript, latency and token usage ([`architecture.md` §8](../docs/architecture.md)).
- [ ] **Config and protection** ([`architecture.md` §13](../docs/architecture.md), [`.env.example`](../.env.example)): read `GROQ_API_KEY`, `LLM_MODEL`, `LLM_FALLBACK_MODEL`, `LLM_REASONING_EFFORT`, `LLM_MAX_TOKENS` and `EXTRACT_TIMEOUT_MS` from env (never hard-code the key). Enforce the `ALLOWED_ORIGINS` check, `RATE_LIMIT_PER_MIN`, and input caps (transcript ≤ 1,000 characters, catalog ≤ 300 items).

### 1.2 System prompt (`api/prompts/extract.system.md`)

- [ ] Role: _"You extract job details from Indian tradespeople's spoken bill requests."_
- [ ] Rules:
  - Output only the schema fields; **never invent prices** (there is no price field in the schema).
  - Copy quantities exactly as spoken, e.g. `"dedh"`, and let the normalizer convert them (see 1.3).
  - `docType` = "Estimate" only if the speaker says _quote, estimate, andaza, kharcha batao_; otherwise "Bill".
  - `intent` covers approve, correct, add info, cancel and **history** (S9 voice commands such as "_Verma ji ka bill paid mark kar do_" → `historyAction`).
  - Capture an optional **discount** ("_100 ka discount de do_").
- [ ] **12–15 few-shot examples** covering Hinglish, Indian number words, misheard brand names, corrections ("_nahi, 15 nahi 20 meter_") and approvals.

### 1.3 Normalizer (`phase-3-understanding/src/normalize.ts`), deterministic

The LLM copies the spoken quantity text; a pure function turns it into numbers ([`architecture.md` §5.3](../docs/architecture.md)):

- [ ] Fractions: _sawa_ ×1.25, _dedh_ 1.5, _dhai_ 2.5, _paune X_ = X − 0.25, _saadhe X_ = X + 0.5.
- [ ] Multipliers: _sau_ 100, _hazaar_ 1,000, _lakh_ 1,00,000 (e.g. "_dedh hazaar_" → 1500, "_paanch sau_" → 500).
- [ ] Hindi number words 1–100 (_ek, do, teen … pachaas … sau_) plus English digits and words.
- [ ] Units: m / meter / mtr / metre → `m`; pc / piece / nag / pcs → `pc`; inch / " / suta → `in`; ft / foot / feet → `ft`.
- [ ] If the result is ambiguous, lower that item's confidence to below 0.85 so it shows as an amber chip.

### 1.4 Client (`phase-3-understanding/src/client.ts`)

- [ ] `extract(turn, ctx): Promise<Extraction>`, with a 6 s timeout and one retry.
- [ ] Approval words are recognised **locally** (Phase 2) and never sent to the API.

## 2. Files Created

| File                                      | Purpose                                                                 |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| `phase-0-setup/src/schema.ts`             | Zod `ExtractionSchema` (one source of truth for both types and the API) |
| `phase-3-understanding/server/extract.ts` | Serverless endpoint                                                     |
| `api/prompts/extract.system.md`           | Fixed system prompt + few-shot examples                                 |
| `phase-3-understanding/src/normalize.ts`  | Indian number and unit normalizer                                       |
| `phase-3-understanding/src/client.ts`     | Fetch wrapper                                                           |

## 3. Tests

- **Normalizer:** table-driven Vitest tests, **≥ 40 cases** (every number word, combinations, units, edge cases like "_dedh sau_" = 150).
- **Extraction:** run `eval/utterances.seed.jsonl` against `/api/extract` and report field-level accuracy (this script becomes the Phase 6 scorer).
- **Contract:** the endpoint always returns schema-valid JSON, including for empty or noise transcripts.

## 4. Acceptance Criteria

- At least **85% field-level accuracy** on the 30 seed utterances (raised to 90% in Phase 6).
- Normalizer tests: 100% passing.
- p50 latency for `/api/extract` **< 1.5 s** (Groq `usage` timings logged).

## 5. Wispr Flow Evidence

- 🎥 A clip of dictating few-shot examples in Hinglish into the prompt file. This shows Flow handling mixed languages as you speak.

## 6. Exit Checklist

- [ ] Endpoint deployed; key only in Vercel environment variables
- [ ] Normalizer fully tested
- [ ] Seed eval run, accuracy recorded in `eval/results/phase2.md`

## 7. Progress (21 Nov)

| Item                                                                                                                                                                                       | Status                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `phase-0-setup/src/schema.ts` (Zod, strict-mode JSON Schema, type-equality check)                                                                                                          | ✅ 3 tests                                             |
| `phase-3-understanding/server/extract.ts` + `phase-3-understanding/server/extract-core.ts` (Groq, retry → fallback, `json_validate_failed` retry, origin/rate-limit/caps, 429 passthrough) | ✅ 17 tests                                            |
| `phase-3-understanding/server/prompts/extract.system.ts` (rules + 12 compact few-shot examples, distinct from eval)                                                                        | ✅ (TS module instead of `.md` so Vercel bundles it)   |
| `phase-3-understanding/src/normalize.ts` (85 tests) + `client.ts` (3 tests)                                                                                                                | ✅                                                     |
| Seed eval on real Groq: **99.0% field accuracy (310/313), 27/30 perfect, p50 1.33 s**                                                                                                      | ✅ target ≥ 85%, < 1.5 s                               |
| Findings: free tier ≈ 3 req/min (8k TPM per model) → `LLM_MAX_TOKENS` 640; Groq strict can return 400 `json_validate_failed` → handled                                                     | ℹ️                                                     |
| `LlmProvider` interface + `GroqProvider` (`server/structured.ts`); `extract(llm, req)` and the endpoint take any provider                                                                  | ✅ tested with a fake provider                         |
| `eval/results/phase3.md` was overwritten by a partial re-run (free-tier daily cap)                                                                                                         | ⬜ re-run `npm run eval:extract` when the quota resets |
| Deploy `/api/extract` to Vercel                                                                                                                                                            | ⬜ you                                                 |

---

<!-- code-index:start -->

## Code in this folder

**Config in this folder:** [`package.json`](./package.json) · [`tsconfig.json`](./tsconfig.json) · [`tsconfig.server.json`](./tsconfig.server.json)

Run this phase's tests: `npm run test:phase -- 3` (add `--unit` to skip the browser tests).
Endpoint: `POST /api/extract` (entry file in [`../api/`](../api/)).

**Browser code (`src/`)**

- [`src/client.test.ts`](./src/client.test.ts) 🧪
- [`src/client.ts`](./src/client.ts)
- [`src/http.ts`](./src/http.ts)
- [`src/normalize.test.ts`](./src/normalize.test.ts) 🧪
- [`src/normalize.ts`](./src/normalize.ts)

**Server code (`server/`, served via `api/`)**

- [`server/extract-core.test.ts`](./server/extract-core.test.ts) 🧪
- [`server/extract-core.ts`](./server/extract-core.ts)
- [`server/extract.ts`](./server/extract.ts)
- [`server/handler.ts`](./server/handler.ts)
- [`server/prompts/extract.system.ts`](./server/prompts/extract.system.ts)
- [`server/rate-limit.ts`](./server/rate-limit.ts)
- [`server/structured.ts`](./server/structured.ts)

🧪 = test file.

<!-- code-index:end -->
