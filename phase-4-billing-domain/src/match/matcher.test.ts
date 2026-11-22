import { describe, expect, it } from "vitest";
import type { RateCardEntry } from "@kaambill/shared";
import seed from "../../../phase-0-setup/seed/rateCard.json";
import { createMatcher } from "./matcher";
import { normalizeName, phoneticKey } from "./phonetic";

const match = createMatcher(seed as RateCardEntry[]);
const id = (heard: string) => match(heard).entry?.id ?? null;

describe("phonetic helpers", () => {
  it("collapses spelled-out letters but keeps a lone 'tee'", () => {
    expect(normalizeName("em see bee")).toBe("mcb");
    expect(normalizeName("M-C-B")).toBe("mcb");
    expect(normalizeName("cpvc tee")).toBe("cpvc tee");
  });
  it("maps Indian spellings to the same key", () => {
    expect(phoneticKey("Phenolex")).toBe(phoneticKey("Finolex"));
    expect(phoneticKey("Hevells")).toBe(phoneticKey("Havells"));
    expect(phoneticKey("Finolux")).toBe(phoneticKey("Finolex"));
  });
});

describe("matcher", () => {
  it.each([
    ["Havells MCB", "rc_mcb_16a"],
    ["Hevells MCB", "rc_mcb_16a"],
    ["M-C-B", "rc_mcb_16a"],
    ["em see bee", "rc_mcb_16a"],
    ["MCB 32 amp", "rc_mcb_32a_dp"],
    ["Finolex wire", "rc_wire_1_5"],
    ["Phenolex wire", "rc_wire_1_5"],
    ["Finolux wire", "rc_wire_1_5"],
    ["taar", "rc_wire_1_5"],
    ["wire", "rc_wire_1_5"],
    ["Roma switch", "rc_switch_6a"],
    ["sockets", "rc_socket_16a"],
    ["fan regulator", "rc_fan_regulator"],
    ["regulator", "rc_fan_regulator"],
    ["LED batten", "rc_led_batten"],
    ["tubelight", "rc_led_batten"],
    ["conduit pipe", "rc_conduit_20mm"],
    ["CPVC pipe", "rc_cpvc_pipe_half"],
    ["elbow", "rc_cpvc_elbow_half"],
    ["tee", "rc_cpvc_tee_half"],
    ["ball valve", "rc_ball_valve_half"],
    ["fan lagane", "rc_labour_fan_install"],
  ])("%s → %s", (heard, expected) => expect(id(heard)).toBe(expected));

  it("SPEC GUARD: Finolex wire 2.5mm does NOT get the 1.5mm price", () => {
    expect(match("Finolex wire 2.5mm")).toMatchObject({ entry: null, method: "none" });
  });

  it("brand only → amber-level score", () => {
    expect(match("Havells")).toMatchObject({ method: "brand_only", score: 0.7 });
  });

  it("unknown items stay unmatched", () => {
    expect(id("geyser element")).toBeNull();
    expect(id("water tank")).toBeNull();
  });
});
