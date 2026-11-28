/**
 * Local check: `npm run check:env`
 * 1. Validates the server env (names only, no values printed).
 * 2. Confirms GROQ_API_KEY works with a free call (GET /models) and that the
 *    configured models exist on the account.
 */
import { describeEnv, getEnv } from "../server/env.js";

const env = getEnv();
console.log("Server env OK:", describeEnv(env));

const res = await fetch("https://api.groq.com/openai/v1/models", {
  headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
});
if (!res.ok) {
  console.error(`Groq key check FAILED: HTTP ${res.status}`);
  process.exit(1);
}
const body = (await res.json()) as { data: { id: string }[] };
const ids = new Set(body.data.map((m) => m.id));
for (const model of [env.LLM_MODEL, env.LLM_FALLBACK_MODEL]) {
  console.log(`${ids.has(model) ? "✅" : "❌"} model available: ${model}`);
}
console.log("Groq key check OK.");
