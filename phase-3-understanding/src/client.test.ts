import { describe, expect, it, vi } from "vitest";
import { unknownExtraction } from "@kaambill/shared";
import { extract, ExtractError } from "./client";

const ok = (extraction: unknown) => new Response(JSON.stringify({ extraction }), { status: 200 });
const turn = { text: "2 MCB", source: "text" as const };

describe("extract client", () => {
  it("normalizes the server's extraction (qty from qtySpoken)", async () => {
    const e = {
      ...unknownExtraction(),
      intent: "new_job",
      items: [
        {
          raw: "dedh sau meter",
          name: "pipe",
          qtySpoken: "dedh sau",
          qty: 15,
          unit: "meter",
          spokenUnitPrice: null,
          confidence: 0.9,
        },
      ],
    };
    const fetchImpl = vi.fn(async () => ok(e));
    const out = await extract(turn, {}, fetchImpl as unknown as typeof fetch);
    expect(out.items[0]).toMatchObject({ qty: 150, unit: "m" });
    expect(out.items[0]!.confidence).toBeLessThan(0.85); // LLM said 15 → disagreement → amber
  });

  it("retries once on 5xx, never on 4xx", async () => {
    const f5 = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 502 }))
      .mockResolvedValueOnce(ok(unknownExtraction()));
    await expect(extract(turn, {}, f5 as unknown as typeof fetch)).resolves.toMatchObject({
      intent: "unknown",
    });
    expect(f5).toHaveBeenCalledTimes(2);

    const f4 = vi.fn().mockResolvedValue(new Response("", { status: 429 }));
    await expect(extract(turn, {}, f4 as unknown as typeof fetch)).rejects.toBeInstanceOf(
      ExtractError,
    );
    expect(f4).toHaveBeenCalledTimes(1);
  });

  it("sends only names/aliases from the catalog and the last 4 turns", async () => {
    const fetchImpl = vi.fn(async () => ok(unknownExtraction()));
    const history = Array.from({ length: 6 }, (_, i) => ({
      text: `t${i}`,
      source: "stt" as const,
    }));
    await extract(
      turn,
      { history, catalog: [{ name: "MCB", aliases: ["em see bee"] }] },
      fetchImpl as unknown as typeof fetch,
    );
    const sent = JSON.parse(
      (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string,
    );
    expect(sent.history.map((h: { text: string }) => h.text)).toEqual(["t2", "t3", "t4", "t5"]);
    expect(JSON.stringify(sent.catalog)).not.toMatch(/price/);
  });
});
