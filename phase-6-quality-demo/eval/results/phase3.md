# Phase 3–4 eval: extraction + bill totals (2026-11-21)

- Model: `openai/gpt-oss-120b` (fallback `openai/gpt-oss-20b`), reasoning_effort `low`, strict JSON schema
- Cases: 6 (eval/utterances.seed.jsonl), text input; normalizer applied on-device
- **Field accuracy: 100.0%** (67/67 fields) · fully correct cases: 6/6
- **Bill total exact match (Groq → normalizer → matcher → bill): 2/2**
- **Latency (server call): p50 2879 ms · p90 4005 ms**
- Tokens per request (prompt + completion): avg 2625
- Target (phase-3 acceptance): ≥ 85% field accuracy, p50 < 1.5 s

| Case | Score | Model               | ms   | Misses |
| ---- | ----- | ------------------- | ---- | ------ |
| u06  | 12/12 | openai/gpt-oss-120b | 3769 | ✓      |
| u07  | 16/16 | openai/gpt-oss-120b | 4005 | ✓      |
| u16  | 12/12 | openai/gpt-oss-120b | 2879 | ✓      |
| u21  | 11/11 | openai/gpt-oss-120b | 2875 | ✓      |
| u25  | 8/8   | openai/gpt-oss-120b | 1661 | ✓      |
| u27  | 8/8   | openai/gpt-oss-120b | 957  | ✓      |

Item matches and bill totals use the on-device matcher and bill model (Phase 4).
