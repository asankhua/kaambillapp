import { TodoExtractionSchema, TodoRequestSchema, unknownTodo } from "../src/rehearsal/schema.js";
import { createStructuredHandler } from "../../phase-3-understanding/server/handler.js";
import { structuredCall } from "../../phase-3-understanding/server/structured.js";

/** Phase 7 rehearsal endpoint: POST /api/rehearsal/todo. A new-domain endpoint looks exactly like this. */
export const TODO_SYSTEM_PROMPT = `You turn what a busy Indian worker says (Hinglish, Hindi or English) into to-do list actions.
Return ONLY the JSON required by the schema; use null when something was not said.
- intent: add (new tasks), complete ("ho gaya", "kar diya"), remove ("hata do"), set_due (a deadline for an existing task or an answer to "kab tak?"), approve ("haan", "save karo"), cancel, unknown.
- tasks: for add (and set_due, with the deadline in "due"): title as a short phrase in the speaker's words; due exactly as said ("kal", "shaam tak") or null; priority "high" only if they say urgent / jaldi / zaroori.
- target: for complete / remove / set_due, the existing task it refers to.
Examples:
"kal tak Sharma ji ko quotation bhejna hai aur cement order karna hai, cement urgent hai" → intent add, tasks [{title "Sharma ji ko quotation bhejna", due "kal", priority null}, {title "cement order karna", due null, priority "high"}], target null
"cement wala ho gaya" → intent complete, tasks [], target "cement order karna"
(pending question "'Plumber ko call' kab tak karna hai?") "shaam tak" → intent set_due, tasks [{title "Plumber ko call", due "shaam tak", priority null}], target "Plumber ko call"`;

export const { POST, OPTIONS } = createStructuredHandler({
  name: "rehearsal_todo",
  requestSchema: TodoRequestSchema,
  async run(req, client, opts) {
    const userMessage = [
      req.currentList.length
        ? `Current list:\n${req.currentList.map((t) => `- ${t}`).join("\n")}`
        : "Current list: (empty)",
      req.pendingQuestion ? `Pending question: "${req.pendingQuestion}"` : "",
      `Input: "${req.text}"`,
    ]
      .filter(Boolean)
      .join("\n\n");
    const r = await structuredCall(
      client,
      {
        name: "todo",
        schema: TodoExtractionSchema,
        systemPrompt: TODO_SYSTEM_PROMPT,
        userMessage,
        unknown: unknownTodo,
      },
      opts,
    );
    return {
      body: { extraction: r.value },
      log: { model: r.model, ms: r.latencyMs, intent: r.value.intent, failure: r.failure },
    };
  },
});
