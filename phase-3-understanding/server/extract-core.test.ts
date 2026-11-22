import { AuthenticationError, BadRequestError, RateLimitError } from "groq-sdk";
import { describe, expect, it, vi } from "vitest";
import { unknownExtraction } from "../../phase-0-setup/src/index.js";
import {
  buildUserMessage,
  EXTRACTION_JSON_SCHEMA,
  extractWithGroq,
  ExtractRequestSchema,
  maskPhones,
  type ChatClient,
} from "./extract-core.js";
import { allowRequest, resetRateLimitForTests } from "./rate-limit.js";

const opts = {
  model: "main",
  fallbackModel: "fallback",
  reasoningEffort: "low" as const,
  maxTokens: 512,
  timeoutMs: 1000,
};
const req = ExtractRequestSchema.parse({ turn: { text: "haan bhej do", source: "text" } });
const good = { ...unknownExtraction(), intent: "approve" };
const reply = (content: string | null, finish_reason = "stop") => ({
  choices: [{ finish_reason, message: { content } }],
  usage: { total_tokens: 10 },
});
const fake = (...impls: Array<() => unknown>) => {
  const create = vi.fn();
  for (const impl of impls) create.mockImplementationOnce(async () => impl());
  return { client: { chat: { completions: { create } } } as unknown as ChatClient, create };
};

describe("extractWithGroq", () => {
  it("returns the validated extraction and sends strict json_schema + low reasoning", async () => {
    const { client, create } = fake(() => reply(JSON.stringify(good)));
    const r = await extractWithGroq(client, req, opts);
    expect(r.extraction.intent).toBe("approve");
    expect(r.usedFallback).toBe(false);
    const body = create.mock.calls[0]![0];
    expect(body).toMatchObject({
      model: "main",
      reasoning_effort: "low",
      include_reasoning: false,
      temperature: 0,
      response_format: { type: "json_schema", json_schema: { name: "extraction", strict: true } },
    });
    expect(body.response_format.json_schema.schema).toBe(EXTRACTION_JSON_SCHEMA);
    expect(JSON.stringify(EXTRACTION_JSON_SCHEMA)).not.toContain("$schema");
  });

  it("retries once on the fallback model after a 429", async () => {
    const { client, create } = fake(
      () => {
        throw new RateLimitError(429, undefined, "rate limited", new Headers());
      },
      () => reply(JSON.stringify(good)),
    );
    const r = await extractWithGroq(client, req, opts);
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1]![0].model).toBe("fallback");
    expect(r).toMatchObject({ usedFallback: true, model: "fallback" });
  });

  it("retries once after Groq's 400 json_validate_failed, then returns unknown", async () => {
    const schemaErr = () =>
      new BadRequestError(
        400,
        { error: { code: "json_validate_failed" } },
        "Generated JSON does not match the expected schema",
        new Headers(),
      );
    const recovered = fake(
      () => {
        throw schemaErr();
      },
      () => reply(JSON.stringify(good)),
    );
    expect((await extractWithGroq(recovered.client, req, opts)).extraction.intent).toBe("approve");

    const failing = fake(
      () => {
        throw schemaErr();
      },
      () => {
        throw schemaErr();
      },
    );
    const r = await extractWithGroq(failing.client, req, opts);
    expect(r).toMatchObject({ failure: "schema_mismatch", extraction: { intent: "unknown" } });
    expect(failing.create).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-retryable errors (e.g. bad key)", async () => {
    const { client, create } = fake(() => {
      throw new AuthenticationError(401, undefined, "bad key", new Headers());
    });
    await expect(extractWithGroq(client, req, opts)).rejects.toBeInstanceOf(AuthenticationError);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["truncated", reply('{"docType":', "length")],
    ["invalid_json", reply("not json")],
    ["schema_mismatch", reply(JSON.stringify({ ...good, price: 5 }))],
    ["empty", reply(null)],
  ])("returns intent unknown when the reply is %s", async (failure, res) => {
    const { client } = fake(() => res);
    const r = await extractWithGroq(client, req, opts);
    expect(r).toMatchObject({ failure, extraction: { intent: "unknown", items: [] } });
  });

  it("clamps confidence into 0..1", async () => {
    const withItem = {
      ...good,
      items: [
        {
          raw: "x",
          name: "x",
          qtySpoken: "1",
          qty: 1,
          unit: null,
          spokenUnitPrice: null,
          confidence: 7,
        },
      ],
    };
    const { client } = fake(() => reply(JSON.stringify(withItem)));
    expect((await extractWithGroq(client, req, opts)).extraction.items[0]!.confidence).toBe(1);
  });
});

describe("request handling", () => {
  it("caps input sizes (abuse protection)", () => {
    expect(
      ExtractRequestSchema.safeParse({ turn: { text: "x".repeat(1001), source: "text" } }).success,
    ).toBe(false);
    expect(
      ExtractRequestSchema.safeParse({
        turn: { text: "ok", source: "text" },
        history: Array(5).fill({ text: "a", source: "text" }),
      }).success,
    ).toBe(false);
  });

  it("masks phone numbers", () => {
    expect(maskPhones("Verma ji 98112 34567 ka bill")).toBe("Verma ji [phone] ka bill");
    expect(maskPhones("call +91-9876543210")).toBe("call [phone]");
    expect(maskPhones("2 MCB 15 meter")).toBe("2 MCB 15 meter");
  });

  it("puts catalog names and the pending question in the user message, never prices", () => {
    const msg = buildUserMessage(
      ExtractRequestSchema.parse({
        turn: { text: "pachees rupaye meter", source: "text" },
        catalog: [{ name: "Finolex Wire 1.5 sq mm", aliases: ["taar"] }],
        pendingQuestion: "Finolex 2.5mm wire ka rate kitna hai?",
      }),
    );
    expect(msg).toContain("Finolex Wire 1.5 sq mm (taar)");
    expect(msg).toContain(
      'Pending question the app asked: "Finolex 2.5mm wire ka rate kitna hai?"',
    );
    expect(msg).not.toMatch(/₹|price:/i);
  });
});

describe("rate limit (in-memory)", () => {
  it("allows N per minute, then blocks, then resets next window", async () => {
    resetRateLimitForTests();
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) expect(await allowRequest("ip", 3, undefined, t + i)).toBe(true);
    expect(await allowRequest("ip", 3, undefined, t + 10)).toBe(false);
    expect(await allowRequest("ip", 3, undefined, t + 61_000)).toBe(true);
  });
});

import { extract } from "./extract-core.js";
import type { LlmProvider } from "./structured.js";

describe("LlmProvider interface (architecture.md §5.2)", () => {
  it("extract() works with any provider: a fake one needs no Groq at all", async () => {
    const fakeProvider: LlmProvider = {
      id: "fake",
      structured: async (args) => ({
        value: args.post ? args.post(good as never) : (good as never),
        model: "fake-model",
        usedFallback: false,
        latencyMs: 1,
        usage: null,
      }),
    };
    const r = await extract(fakeProvider, req);
    expect(r).toMatchObject({ model: "fake-model", extraction: { intent: "approve" } });
  });
});
