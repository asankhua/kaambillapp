import { describe, expect, it, vi } from "vitest";
import { createActor, waitFor } from "xstate";
import { createConversationMachine } from "../../phase-2-voice-core/src/machine/conversation.machine";
import { create__PASCAL__Adapter } from "./adapter";

describe("__NAME__ on the voice core", () => {
  it("input → question → read-back → haan → saved", async () => {
    const extract = vi.fn()
      .mockResolvedValueOnce({ intent: "new", items: [{ label: "example", qtySpoken: "2" }], subject: null })
      .mockResolvedValueOnce({ intent: "add_info", items: [], subject: "Example ji" });
    const speak = vi.fn();
    const actor = createActor(createConversationMachine({ adapter: create__PASCAL__Adapter(extract), startListening: vi.fn(), stopListening: vi.fn(), speak, stopSpeaking: vi.fn() })).start();
    actor.send({ type: "TEXT_SUBMIT", text: "first sentence" });
    await waitFor(actor, (s) => s.matches("asking"));
    actor.send({ type: "TEXT_SUBMIT", text: "Example ji" });
    await waitFor(actor, (s) => s.matches("awaitApproval"));
    actor.send({ type: "TEXT_SUBMIT", text: "haan" });
    await waitFor(actor, (s) => s.matches("sharePreview"));
    expect(actor.getSnapshot().context.output?.subject).toBe("Example ji");
  });
});
