import { createStore, del, get, set, type UseStore } from "idb-keyval";
import type { DraftBill } from "../../phase-4-billing-domain/src/bill/model";
import { isEmpty } from "../../phase-4-billing-domain/src/bill/model";

/**
 * The unfinished bill, saved on the device (architecture.md §4.3 statuses draft → queued).
 * Survives a reload or a closed tab; shown under S9 "Drafts" with "Poora karein" to resume.
 */
export interface SavedDraft {
  draft: DraftBill;
  savedAt: string;
  /** "queued" = has turns waiting for the network (S10b). */
  status: "draft" | "queued";
}

export interface DraftStore {
  get(): SavedDraft | null;
  save(d: DraftBill): void;
  clear(): void;
  subscribe(fn: () => void): () => void;
}

const KEY = "draft.v1";

export function createMemoryDrafts(
  initial: SavedDraft | null = null,
  persist?: (d: SavedDraft | null) => void,
  now = () => new Date(),
): DraftStore {
  let current = initial;
  const subs = new Set<() => void>();
  const changed = () => {
    persist?.(current);
    subs.forEach((f) => f());
  };
  return {
    get: () => current,
    save(d) {
      if (isEmpty(d) && d.queued.length === 0) {
        if (current) {
          current = null;
          changed();
        }
        return;
      }
      current = {
        draft: d,
        savedAt: now().toISOString(),
        status: d.queued.length ? "queued" : "draft",
      };
      changed();
    },
    clear() {
      if (!current) return;
      current = null;
      changed();
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

export async function loadDrafts(db?: UseStore): Promise<DraftStore> {
  try {
    const store = db ?? createStore("kaambill-drafts", "kv");
    const saved = (await get<SavedDraft>(KEY, store)) ?? null;
    return createMemoryDrafts(saved, (d) => void (d ? set(KEY, d, store) : del(KEY, store)));
  } catch {
    return createMemoryDrafts();
  }
}

/** Search bills/drafts by customer, item, bill number or what was said. */
export function matchesSearch(q: string, fields: (string | null | undefined)[]): boolean {
  const needle = q.trim().toLowerCase();
  return !needle || fields.some((f) => (f ?? "").toLowerCase().includes(needle));
}
