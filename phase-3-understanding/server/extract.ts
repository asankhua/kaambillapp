import { createStructuredHandler } from "./handler.js";
import { extract, ExtractRequestSchema, maskPhones } from "./extract-core.js";

/**
 * POST /api/extract: transcript → validated KaamBill Extraction (Groq, strict schema).
 * Protection (origin, rate limit, caps, 429 passthrough) lives in createStructuredHandler.
 */
export const { POST, OPTIONS } = createStructuredHandler({
  name: "extract",
  requestSchema: ExtractRequestSchema,
  async run(req, _client, _opts, env, llm) {
    const r = await extract(llm, req);
    return {
      body: { extraction: r.extraction, meta: { model: r.model, ms: r.latencyMs } },
      log: {
        model: r.model,
        fallback: r.usedFallback,
        ms: r.latencyMs,
        tokens: r.usage?.total_tokens,
        intent: r.extraction.intent,
        failure: r.failure,
        ...(env.LOG_LEVEL === "debug" ? { text: maskPhones(req.turn.text) } : {}),
      },
    };
  },
});
