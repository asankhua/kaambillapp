import type { Turn } from "@kaambill/shared";
import type { TodoExtraction } from "./schema";
import type {
  ApplyResult,
  DomainAdapter,
  Question,
} from "../../../phase-2-voice-core/src/machine/types";
import { postStructured } from "../../../phase-3-understanding/src/http";

/**
 * Phase 7 REHEARSAL domain: "to-do list by voice" on the UNCHANGED voice core.
 * The pattern a new domain copies: draft type, understand() via an endpoint, ONE question
 * at a time, a read-back, and an approval gate before finalize().
 */
export interface TodoTask {
  id: string;
  title: string;
  due: string | null;
  priority: "high" | "normal";
  done: boolean;
  /** "Koi jaldi nahi": don't ask for a deadline again. */
  noDeadline: boolean;
}
export interface TodoDraft {
  tasks: TodoTask[];
}
export interface TodoOutput {
  savedAt: string;
  tasks: TodoTask[];
}

let n = 0;
const id = () => `t${Date.now().toString(36)}${(n++).toString(36)}`;
const norm = (s: string) => s.toLowerCase().trim();
const find = (d: TodoDraft, target: string | null) =>
  target
    ? d.tasks.find(
        (t) =>
          norm(t.title) === norm(target) ||
          norm(t.title).includes(norm(target)) ||
          norm(target).includes(norm(t.title)),
      )
    : undefined;

export type TodoExtract = (
  text: string,
  currentList: string[],
  pendingQuestion: string | null,
) => Promise<TodoExtraction>;
export const fetchTodo: TodoExtract = async (text, currentList, pendingQuestion) =>
  (
    await postStructured<{ extraction: TodoExtraction }>("/rehearsal/todo", {
      text,
      currentList,
      pendingQuestion,
    })
  ).extraction;

export function createTodoAdapter(
  extract: TodoExtract = fetchTodo,
): DomainAdapter<TodoDraft, TodoOutput> {
  const isApproval = (t: string) =>
    /^\s*(haan|ha|yes|ok|theek hai|save karo|save kar do|हाँ)(?=$|[\s.!,?।])/i.test(
      t.normalize("NFC"),
    );
  return {
    emptyDraft: () => ({ tasks: [] }),
    isApproval,
    async understand(turn: Turn, draft, ctx): Promise<ApplyResult<TodoDraft>> {
      const q = ctx.pendingQuestion;
      if (q?.targetId && /^\s*(koi jaldi nahi|kabhi bhi|no deadline|baad mein)/i.test(turn.text))
        return {
          draft: {
            tasks: draft.tasks.map((t) => (t.id === q.targetId ? { ...t, noDeadline: true } : t)),
          },
          outcome: "updated",
        };
      const e = await extract(
        turn.text,
        draft.tasks.map((t) => t.title),
        q?.text ?? null,
      );
      switch (e.intent) {
        case "unknown":
          return { draft, outcome: "unknown" };
        case "cancel":
          return { draft: { tasks: [] }, outcome: "cancel" };
        case "approve":
          return { draft, outcome: "approve" };
        case "complete":
        case "remove": {
          const t = find(draft, e.target);
          if (!t) return { draft, outcome: "unknown" };
          const tasks =
            e.intent === "remove"
              ? draft.tasks.filter((x) => x.id !== t.id)
              : draft.tasks.map((x) => (x.id === t.id ? { ...x, done: true } : x));
          return { draft: { tasks }, outcome: "updated" };
        }
        case "set_due": {
          const t =
            find(draft, e.target) ??
            (q?.targetId ? draft.tasks.find((x) => x.id === q.targetId) : undefined);
          const due = e.tasks[0]?.due ?? null;
          if (!t || !due) return { draft, outcome: "unknown" };
          return {
            draft: { tasks: draft.tasks.map((x) => (x.id === t.id ? { ...x, due } : x)) },
            outcome: "updated",
          };
        }
        default:
          return {
            draft: {
              tasks: [
                ...draft.tasks,
                ...e.tasks.map((t) => ({
                  id: id(),
                  title: t.title,
                  due: t.due,
                  priority: t.priority ?? "normal",
                  done: false,
                  noDeadline: false,
                })),
              ],
            },
            outcome: "updated",
          };
      }
    },
    nextQuestion(d): Question | null {
      if (d.tasks.length === 0)
        return { kind: "missing", text: "Kya kaam yaad rakhna hai, boliye?" };
      const noDue = d.tasks.find(
        (t) => !t.done && !t.due && !t.noDeadline && t.priority === "high",
      );
      return noDue
        ? { kind: "missing", text: `'${noDue.title}' kab tak karna hai?`, targetId: noDue.id }
        : null;
    },
    readBack(d) {
      const open = d.tasks.filter((t) => !t.done);
      return {
        text: `${open.length} kaam list mein, ${open.filter((t) => t.priority === "high").length} zaroori. Save kar doon?`,
      };
    },
    async finalize(d) {
      return { savedAt: new Date().toISOString(), tasks: d.tasks };
    },
  };
}
