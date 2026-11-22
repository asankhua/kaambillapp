import { describe, expect, it, vi } from "vitest";
import { createTelemetry, totalBucket } from "./telemetry";

describe("telemetry", () => {
  it("is a no-op without a PostHog key", () => {
    const send = vi.fn();
    createTelemetry(undefined, "https://x", send).track({
      event: "bill_shared",
      props: { method: "share_sheet" },
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("sends only allow-listed, non-personal properties", () => {
    const send = vi.fn();
    const t = createTelemetry("phc_test", "https://eu.posthog.com/", send, () => "dev-1");
    t.track({
      event: "bill_finalized",
      props: {
        ms_to_finalize: 18000,
        clarification_turns: 1,
        amber_confirmations: 1,
        manual_edits: 0,
        item_count: 3,
        total_bucket: totalBucket(1235),
        doc_type: "Bill",
        // a bug elsewhere must not leak personal data:
        ...({
          customerName: "Verma ji",
          phone: "9811234567",
          transcript: "Verma ji ke ghar…",
          total: 1235,
        } as object),
      } as never,
    });
    const [url, body] = send.mock.calls[0]!;
    expect(url).toBe("https://eu.posthog.com/capture/");
    const payload = JSON.parse(body);
    expect(payload).toMatchObject({
      api_key: "phc_test",
      event: "bill_finalized",
      distinct_id: "dev-1",
    });
    expect(payload.properties).toEqual({
      ms_to_finalize: 18000,
      clarification_turns: 1,
      amber_confirmations: 1,
      manual_edits: 0,
      item_count: 3,
      total_bucket: "1k-2k",
      doc_type: "Bill",
      $process_person_profile: false,
    });
    expect(body).not.toMatch(/Verma|9811|1235/);
  });

  it.each([
    [100, "<500"],
    [999, "500-1k"],
    [1235, "1k-2k"],
    [4999, "2k-5k"],
    [9000, "5k+"],
  ] as const)("bucket %d → %s", (n, b) => expect(totalBucket(n)).toBe(b));
});
