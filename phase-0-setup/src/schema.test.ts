import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ExtractionSchema, unknownExtraction } from "./schema";

type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: JsonSchema;
  anyOf?: JsonSchema[];
};

/** Walk every object in the JSON Schema and check Groq strict-mode rules. */
function assertStrict(node: JsonSchema, path = "$"): void {
  if (node.properties) {
    expect(node.additionalProperties, `${path}: additionalProperties`).toBe(false);
    expect(new Set(node.required), `${path}: all keys required`).toEqual(
      new Set(Object.keys(node.properties)),
    );
    for (const [k, v] of Object.entries(node.properties)) assertStrict(v, `${path}.${k}`);
  }
  if (node.items) assertStrict(node.items, `${path}[]`);
  node.anyOf?.forEach((n, i) => assertStrict(n, `${path}|${i}`));
}

describe("ExtractionSchema", () => {
  it("compiles to a Groq strict-mode-compatible JSON Schema", () => {
    assertStrict(z.toJSONSchema(ExtractionSchema) as JsonSchema);
  });

  it("accepts the unknown extraction and rejects extra keys", () => {
    expect(ExtractionSchema.safeParse(unknownExtraction()).success).toBe(true);
    expect(ExtractionSchema.safeParse({ ...unknownExtraction(), price: 5 }).success).toBe(false);
  });

  it("rejects a missing key (strict mode never omits fields)", () => {
    const { discount: _d, ...rest } = unknownExtraction();
    expect(ExtractionSchema.safeParse(rest).success).toBe(false);
  });
});
