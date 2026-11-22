import { z } from "zod";

/**
 * Phase 7 REHEARSAL schema: "to-do list by voice". Proves a new brief only needs a schema,
 * a prompt, an adapter and a UI card; the voice core and plumbing are reused unchanged.
 * Groq strict mode: every key required, null for unknown.
 */
export const TodoTaskSchema = z.strictObject({
  title: z.string(),
  /** Spoken deadline as said ("kal", "shaam tak", "Monday"), or null. */
  due: z.string().nullable(),
  priority: z.enum(["high", "normal"]).nullable(),
});

export const TodoExtractionSchema = z.strictObject({
  intent: z.enum(["add", "complete", "remove", "set_due", "approve", "cancel", "unknown"]),
  tasks: z.array(TodoTaskSchema),
  /** For complete / remove / set_due: which existing task, as said. */
  target: z.string().nullable(),
});
export type TodoExtraction = z.infer<typeof TodoExtractionSchema>;
export const unknownTodo = (): TodoExtraction => ({ intent: "unknown", tasks: [], target: null });

export const TodoRequestSchema = z.strictObject({
  text: z.string().min(1).max(600),
  currentList: z.array(z.string().max(120)).max(50).default([]),
  pendingQuestion: z.string().max(200).nullable().optional(),
});
