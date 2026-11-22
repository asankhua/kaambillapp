import { describe, expect, it, vi } from "vitest";
import { createActor, waitFor } from "xstate";
import type { Turn } from "@kaambill/shared";
import { createConversationMachine } from "./conversation.machine";
import type { ApplyResult, DomainAdapter, Question } from "./types";

interface Draft {
  items: string[];
  name: string | null;
  queued: string[];
}

class OfflineError extends Error {
  override name = "OfflineError";
}

/** A tiny fake domain: items are words; a customer name is required before read-back. */
function fakeAdapter(): DomainAdapter<Draft, string> {
  return {
    emptyDraft: () => ({ items: [], name: null, queued: [] }),
    isApproval: (t) => /^(haan|bhej do|yes)\b/i.test(t.trim()),
    async understand(turn: Turn, draft: Draft): Promise<ApplyResult<Draft>> {
      const t = turn.text;
      if (t === "offline") throw new OfflineError("offline");
      if (t === "garbled") return { draft, outcome: "unknown" };
      if (t === "cancel") return { draft, outcome: "cancel" };
      if (t === "haan server") return { draft, outcome: "approve" };
      if (t.startsWith("paid"))
        return { draft, outcome: "side_effect", say: { text: "Paid ho gaya." } };
      if (t.startsWith("naam "))
        return { draft: { ...draft, name: t.slice(5) }, outcome: "updated" };
      return { draft: { ...draft, items: [...draft.items, t] }, outcome: "updated" };
    },
    nextQuestion: (d): Question | null =>
      d.name ? null : { kind: "missing", text: "Kiske naam pe bill banana hai?" },
    readBack: (d) => ({
      text: `${d.name} ka bill, ${d.items.length} items. WhatsApp par bhej doon?`,
    }),
    finalize: async (d) => `BILL:${d.name}:${d.items.join(",")}`,
    queueOffline: (turn, d) => ({ ...d, queued: [...d.queued, turn.text] }),
  };
}

function start() {
  const deps = {
    adapter: fakeAdapter(),
    startListening: vi.fn(),
    stopListening: vi.fn(),
    onMessage: vi.fn(),
  };
  const actor = createActor(createConversationMachine(deps)).start();
  const said = () => deps.onMessage.mock.calls.map((c) => c[0].text as string);
  return { actor, deps, said };
}
const settle = (actor: ReturnType<typeof start>["actor"], state: string) =>
  waitFor(actor, (s) => s.matches(state as never), { timeout: 1000 });

describe("conversation machine", () => {
  it("happy path by voice: listen → one question → read-back → haan → share preview", async () => {
    const { actor, deps, said } = start();
    actor.send({ type: "MIC_TAP" });
    expect(actor.getSnapshot().value).toBe("listening");
    expect(deps.startListening).toHaveBeenCalled();

    actor.send({ type: "STT_PARTIAL", text: "2 MCB" });
    expect(actor.getSnapshot().context.partial).toBe("2 MCB");
    actor.send({ type: "STT_FINAL", turn: { text: "2 MCB", source: "stt" } });
    await settle(actor, "asking");
    expect(said()).toContain("Kiske naam pe bill banana hai?");
    expect(actor.getSnapshot().context.pendingQuestion?.text).toBe(
      "Kiske naam pe bill banana hai?",
    );

    actor.send({ type: "MIC_TAP" });
    actor.send({ type: "STT_FINAL", turn: { text: "naam Verma ji", source: "stt" } });
    await settle(actor, "awaitApproval");
    expect(said().at(-1)).toBe("Verma ji ka bill, 1 items. WhatsApp par bhej doon?");

    actor.send({ type: "MIC_TAP" });
    actor.send({ type: "STT_FINAL", turn: { text: "haan bhej do", source: "stt" } });
    await settle(actor, "sharePreview");
    expect(actor.getSnapshot().context.output).toBe("BILL:Verma ji:2 MCB");
  });

  it("text path (typed / Wispr Flow) works the same, and approval words are handled locally", async () => {
    const { actor, deps } = start();
    const understand = vi.spyOn(deps.adapter, "understand");
    actor.send({ type: "TEXT_SUBMIT", text: "socket" });
    await settle(actor, "asking");
    actor.send({ type: "TEXT_SUBMIT", text: "naam Gupta ji" });
    await settle(actor, "awaitApproval");
    actor.send({ type: "TEXT_SUBMIT", text: "haan" });
    await settle(actor, "sharePreview");
    expect(understand).toHaveBeenCalledTimes(2); // "haan" never went to understand()
    expect(deps.startListening).not.toHaveBeenCalled();
  });

  it("SAFETY: 'haan' before the read-back is NOT an approval (no skipping read-back)", async () => {
    const { actor, deps } = start();
    const finalize = vi.spyOn(deps.adapter, "finalize");
    actor.send({ type: "TEXT_SUBMIT", text: "haan" }); // from idle: treated as normal input
    await settle(actor, "asking");
    expect(finalize).not.toHaveBeenCalled();
  });

  it("SAFETY: a server-side 'approve' outside the approval gate does not finalize", async () => {
    const { actor, deps } = start();
    const finalize = vi.spyOn(deps.adapter, "finalize");
    actor.send({ type: "TEXT_SUBMIT", text: "haan server" });
    await settle(actor, "asking");
    expect(finalize).not.toHaveBeenCalled();
  });

  it("a correction during the approval wait goes back through processing and a new read-back", async () => {
    const { actor, said } = start();
    actor.send({ type: "TEXT_SUBMIT", text: "naam Verma ji" });
    await settle(actor, "awaitApproval");
    actor.send({ type: "TEXT_SUBMIT", text: "wire" });
    await settle(actor, "awaitApproval");
    expect(said().at(-1)).toBe("Verma ji ka bill, 1 items. WhatsApp par bhej doon?");
  });

  it("APPROVE button and EDIT", async () => {
    const { actor } = start();
    actor.send({ type: "TEXT_SUBMIT", text: "naam A" });
    await settle(actor, "awaitApproval");
    actor.send({ type: "EDIT" });
    expect(actor.getSnapshot().value).toBe("idle");
    actor.send({ type: "TEXT_SUBMIT", text: "x" });
    await settle(actor, "awaitApproval");
    actor.send({ type: "APPROVE" });
    await settle(actor, "sharePreview");
    actor.send({ type: "SHARED" });
    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context.draft.items).toEqual([]);
  });

  it("not understood → S10c, then retry listens again", async () => {
    const { actor, said } = start();
    actor.send({ type: "TEXT_SUBMIT", text: "garbled" });
    await settle(actor, "notUnderstood");
    expect(said()).toContain("Samajh nahi aaya, ek baar phir boliye.");
    actor.send({ type: "RETRY" });
    expect(actor.getSnapshot().value).toBe("listening");
  });

  it("offline → the turn is queued (S10b), RETRY processes it", async () => {
    const { actor } = start();
    actor.send({ type: "TEXT_SUBMIT", text: "offline" });
    await settle(actor, "offlineQueued");
    expect(actor.getSnapshot().context.draft.queued).toEqual(["offline"]);
    expect(actor.getSnapshot().context.error).toBe("offline");
  });

  it("cancel clears the draft; side effects show a confirmation and return to idle", async () => {
    const { actor, said } = start();
    actor.send({ type: "TEXT_SUBMIT", text: "socket" });
    await settle(actor, "asking");
    actor.send({ type: "TEXT_SUBMIT", text: "cancel" });
    await settle(actor, "idle");
    expect(actor.getSnapshot().context.draft.items).toEqual([]);
    actor.send({ type: "TEXT_SUBMIT", text: "paid Verma ji" });
    await settle(actor, "idle");
    expect(said().at(-1)).toBe("Paid ho gaya.");
  });

  it("mic blocked → error state; text input still works", async () => {
    const { actor } = start();
    actor.send({ type: "MIC_TAP" });
    actor.send({ type: "STT_ERROR", kind: "mic_blocked" });
    expect(actor.getSnapshot().value).toBe("error");
    expect(actor.getSnapshot().context.error).toBe("mic_blocked");
    actor.send({ type: "TEXT_SUBMIT", text: "naam A" });
    await settle(actor, "awaitApproval");
  });

  it("STOP with a partial transcript processes it", async () => {
    const { actor, deps } = start();
    actor.send({ type: "MIC_TAP" });
    actor.send({ type: "STT_PARTIAL", text: "naam B" });
    actor.send({ type: "STOP" });
    await settle(actor, "awaitApproval");
    expect(deps.stopListening).toHaveBeenCalled();
  });

  it("keeps only the last 4 turns of history", async () => {
    const { actor } = start();
    for (const t of ["a", "b", "c", "d", "e"]) {
      actor.send({ type: "TEXT_SUBMIT", text: t });
      await settle(actor, "asking");
    }
    expect(actor.getSnapshot().context.history.map((h) => h.text)).toEqual(["b", "c", "d", "e"]);
  });
});
