/** Phase 7 rehearsal smoke test on real Groq: `npm run rehearsal:todo`. */
import Groq from "groq-sdk";
import { TodoExtractionSchema, unknownTodo } from "../src/rehearsal/schema.js";
import { getEnv } from "../../phase-0-setup/server/env.js";
import { TODO_SYSTEM_PROMPT } from "../server/rehearsal-todo.js";
import {
  retryAfterSeconds,
  structuredCall,
} from "../../phase-3-understanding/server/structured.js";

const env = getEnv();
const client = new Groq({ apiKey: env.GROQ_API_KEY, maxRetries: 0 });
const cases: [string, string[], string | null, (e: ReturnType<typeof unknownTodo>) => boolean][] = [
  [
    "parso tak Gupta ji ka quotation banana hai aur sariya urgent mangwana hai",
    [],
    null,
    (e) => e.intent === "add" && e.tasks.length === 2 && e.tasks.some((t) => t.priority === "high"),
  ],
  [
    "Gupta ji wala quotation ho gaya",
    ["Gupta ji ka quotation banana", "sariya mangwana"],
    null,
    (e) => e.intent === "complete" && /quotation/i.test(e.target ?? ""),
  ],
  [
    "kal subah tak",
    ["sariya mangwana"],
    "'sariya mangwana' kab tak karna hai?",
    (e) => e.intent === "set_due" && /kal/i.test(e.tasks[0]?.due ?? ""),
  ],
];
let ok = 0;
for (const [text, list, q, check] of cases) {
  const user = [
    list.length
      ? `Current list:\n${list.map((t) => `- ${t}`).join("\n")}`
      : "Current list: (empty)",
    q ? `Pending question: "${q}"` : "",
    `Input: "${text}"`,
  ]
    .filter(Boolean)
    .join("\n\n");
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await structuredCall(
        client,
        {
          name: "todo",
          schema: TodoExtractionSchema,
          systemPrompt: TODO_SYSTEM_PROMPT,
          userMessage: user,
          unknown: unknownTodo,
        },
        {
          model: env.LLM_MODEL,
          fallbackModel: env.LLM_MODEL,
          reasoningEffort: env.LLM_REASONING_EFFORT,
          maxTokens: env.LLM_MAX_TOKENS,
          timeoutMs: 20000,
        },
      );
      const pass = check(r.value);
      ok += pass ? 1 : 0;
      console.log(`${pass ? "✅" : "❌"} ${r.latencyMs}ms "${text}" → ${JSON.stringify(r.value)}`);
      break;
    } catch (err) {
      const w = retryAfterSeconds(err);
      if (w === null || attempt > 6) throw err;
      await new Promise((res) => setTimeout(res, (w + 1) * 1000));
    }
  }
}
console.log(`Rehearsal on Groq: ${ok}/${cases.length}`);
