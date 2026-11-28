# Phase 3 eval: the 30 seed sentences (2026-11-28)

- ⚠️ **Partial: 12 of 30 cases scored so far** (Groq free-tier quota). Re-run `npm run eval:extract` to continue; finished cases are cached.
- Model: `openai/gpt-oss-120b`, reasoning_effort `low`, strict JSON schema; main model only (no fallback while scoring)
- **Field accuracy: 100.0%** (156/156 fields) · fully correct cases: 12/12
- **Bill total exact match (Groq → normalizer → matcher → bill): 8/8**
- **Clarifying questions per new bill (before read-back): avg 0.11** over 9 bills
- **Latency (server call): p50 1811 ms · p90 5588 ms** · tokens per request avg 2779
- Target: ≥ 85% field accuracy, p50 < 1.5 s (phase-3 acceptance)

| Case | Lang    | Score | ms   | Misses |
| ---- | ------- | ----- | ---- | ------ |
| u001 | hi-Latn | 16/16 | 1800 | ✓      |
| u002 | hi-Latn | 16/16 | 1567 | ✓      |
| u003 | hi-Latn | 12/12 | 1811 | ✓      |
| u005 | hi-Latn | 16/16 | 4404 | ✓      |
| u006 | hi-Latn | 12/12 | 1280 | ✓      |
| u007 | hi-Latn | 16/16 | 8146 | ✓      |
| u008 | hi-Latn | 16/16 | 1709 | ✓      |
| u009 | hi-Latn | 16/16 | 1874 | ✓      |
| u013 | hi-Latn | 12/12 | 5588 | ✓      |
| u014 | hi-Latn | 8/8   | 894  | ✓      |
| u015 | hi-Latn | 8/8   | 1030 | ✓      |
| u030 | hi-Latn | 8/8   | 2383 | ✓      |

Item matches and bill totals use the on-device matcher and bill model (Phase 4).
