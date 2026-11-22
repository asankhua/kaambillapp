import { __PASCAL__ExtractionSchema, __PASCAL__RequestSchema, unknown__PASCAL__ } from "../src/schema.js";
import { createStructuredHandler } from "../../phase-3-understanding/server/handler.js";
import { structuredCall } from "../../phase-3-understanding/server/structured.js";

/** POST /api/__NAME__: domain endpoint (origin / rate limit / caps / 429 handled by the factory). */
export const __UPPER___SYSTEM_PROMPT = `TODO(H2–4): one paragraph on who speaks and what to extract, the rules, then 8–10 compact examples.
Return ONLY the JSON required by the schema; use null when something was not said.`;

export const { POST, OPTIONS } = createStructuredHandler({
  name: "__NAME__",
  requestSchema: __PASCAL__RequestSchema,
  async run(req, client, opts) {
    const userMessage = [req.draftSummary ? `Current draft: ${req.draftSummary}` : "", req.pendingQuestion ? `Pending question: "${req.pendingQuestion}"` : "", `Input: "${req.text}"`].filter(Boolean).join("\n\n");
    const r = await structuredCall(client, { name: "__NAME__", schema: __PASCAL__ExtractionSchema, systemPrompt: __UPPER___SYSTEM_PROMPT, userMessage, unknown: unknown__PASCAL__ }, opts);
    return { body: { extraction: r.value }, log: { model: r.model, ms: r.latencyMs, intent: r.value.intent, failure: r.failure } };
  },
});
