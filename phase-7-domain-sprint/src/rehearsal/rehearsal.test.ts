import { describe, expect, it, vi } from "vitest";
import { createActor, waitFor } from "xstate";
import { TodoExtractionSchema, unknownTodo, type TodoExtraction } from "./schema";
import { createConversationMachine } from "../../../phase-2-voice-core/src/machine/conversation.machine";
import { createTodoAdapter } from "./adapter";

/**
 * Phase 7 rehearsal acceptance: a brand-new domain runs on the unchanged voice core
 * (same machine, same read-back gate) with only a schema + prompt + adapter.
 */
const e = (p: Partial<TodoExtraction>): TodoExtraction =>
  TodoExtractionSchema.parse({ ...unknownTodo(), ...p });

function run(responses: TodoExtraction[]) {
  const extract = vi.fn();
  for (const r of responses) extract.mockResolvedValueOnce(r);
  const speak = vi.fn();
  const actor = createActor(
    createConversationMachine({
      adapter: createTodoAdapter(extract),
      startListening: vi.fn(),
      stopListening: vi.fn(),
      onMessage: speak,
    }),
  ).start();
  const until = (s: string) => waitFor(actor, (x) => x.matches(s as never), { timeout: 1000 });
  return { actor, extract, until, said: () => speak.mock.calls.map((c) => c[0].text as string) };
}

describe("Domain-swap rehearsal: to-do list by voice on the KaamBill voice core", () => {
  it("add → ONE question (urgent task deadline) → answer → read-back → haan → saved", async () => {
    const t = run([
      e({
        intent: "add",
        tasks: [
          { title: "Sharma ji ko quotation bhejna", due: "kal", priority: null },
          { title: "cement order karna", due: null, priority: "high" },
        ],
      }),
      e({
        intent: "set_due",
        tasks: [{ title: "cement order karna", due: "shaam tak", priority: null }],
        target: "cement order karna",
      }),
    ]);
    t.actor.send({
      type: "TEXT_SUBMIT",
      text: "kal tak Sharma ji ko quotation bhejna hai aur cement order karna hai, cement urgent hai",
    });
    await t.until("asking");
    expect(t.said().at(-1)).toBe("'cement order karna' kab tak karna hai?");
    t.actor.send({ type: "TEXT_SUBMIT", text: "shaam tak" });
    await t.until("awaitApproval");
    expect(t.said().at(-1)).toBe("2 kaam list mein, 1 zaroori. Save kar doon?");
    t.actor.send({ type: "TEXT_SUBMIT", text: "haan" }); // local approval, no API call
    await t.until("sharePreview");
    expect(t.extract).toHaveBeenCalledTimes(2);
    expect(t.actor.getSnapshot().context.output?.tasks.map((x) => [x.title, x.due])).toEqual([
      ["Sharma ji ko quotation bhejna", "kal"],
      ["cement order karna", "shaam tak"],
    ]);
  });

  it("same safety gate: 'haan' before the read-back does not save", async () => {
    const t = run([e({ intent: "approve" })]);
    t.actor.send({ type: "TEXT_SUBMIT", text: "haan" });
    await t.until("asking");
    expect(t.actor.getSnapshot().context.output).toBeNull();
  });

  it("complete / remove / unknown", async () => {
    const t = run([
      e({ intent: "add", tasks: [{ title: "bijli bill bharna", due: "aaj", priority: null }] }),
      e({ intent: "complete", target: "bijli bill" }),
      e({ intent: "unknown" }),
    ]);
    t.actor.send({ type: "TEXT_SUBMIT", text: "aaj bijli bill bharna hai" });
    await t.until("awaitApproval");
    t.actor.send({ type: "TEXT_SUBMIT", text: "bijli bill wala ho gaya" });
    await t.until("awaitApproval");
    expect(t.said().at(-1)).toBe("0 kaam list mein, 0 zaroori. Save kar doon?");
    t.actor.send({ type: "TEXT_SUBMIT", text: "hmm" });
    await t.until("notUnderstood");
  });
});
