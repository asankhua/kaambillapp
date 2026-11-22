/**
 * Privacy-safe telemetry (architecture.md §9). PostHog capture API via fetch (no SDK).
 * - Off unless VITE_POSTHOG_KEY is set.
 * - Anonymous random device id; NO names, phone numbers, UPI IDs, transcripts or exact amounts.
 *   Only the allow-listed numeric/enum properties below are ever sent.
 */
export type TelemetryEvent =
  | {
      event: "bill_finalized";
      props: {
        ms_to_finalize: number;
        clarification_turns: number;
        amber_confirmations: number;
        manual_edits: number;
        item_count: number;
        total_bucket: TotalBucket;
        doc_type: "Bill" | "Estimate";
      };
    }
  | { event: "bill_shared"; props: { method: "share_sheet" | "whatsapp_link" } }
  | {
      event: "bill_marked_paid";
      props: { hours_since_created: number; via: "upi" | "cash" | "unknown" };
    }
  | {
      event: "chip_corrected";
      props: {
        field: "qty" | "price" | "labour" | "visiting" | "discount" | "customer";
        was_amber: boolean;
      };
    };

export type TotalBucket = "<500" | "500-1k" | "1k-2k" | "2k-5k" | "5k+";
export const totalBucket = (n: number): TotalBucket =>
  n < 500 ? "<500" : n < 1000 ? "500-1k" : n < 2000 ? "1k-2k" : n < 5000 ? "2k-5k" : "5k+";

const ALLOWED = new Set([
  "ms_to_finalize",
  "clarification_turns",
  "amber_confirmations",
  "manual_edits",
  "item_count",
  "total_bucket",
  "doc_type",
  "method",
  "hours_since_created",
  "via",
  "field",
  "was_amber",
]);

export interface Telemetry {
  track(e: TelemetryEvent): void;
}

export function createTelemetry(
  key: string | undefined = import.meta.env?.VITE_POSTHOG_KEY,
  host: string = import.meta.env?.VITE_POSTHOG_HOST ?? "https://app.posthog.com",
  send: (url: string, body: string) => void = (url, body) => {
    if (typeof navigator !== "undefined" && navigator.sendBeacon)
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    else
      void fetch(url, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
  },
  deviceId: () => string = anonymousId,
): Telemetry {
  if (!key) return { track: () => {} };
  return {
    track({ event, props }) {
      const properties: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(props))
        if (
          ALLOWED.has(k) &&
          (typeof v === "number" || typeof v === "string" || typeof v === "boolean")
        )
          properties[k] = v;
      properties.$process_person_profile = false; // never build a person profile
      send(
        `${host.replace(/\/$/, "")}/capture/`,
        JSON.stringify({ api_key: key, event, distinct_id: deviceId(), properties }),
      );
    },
  };
}

function anonymousId(): string {
  try {
    const k = "kb.device";
    let id = localStorage.getItem(k);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(k, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}
