import { createStore, get, set, type UseStore } from "idb-keyval";
import type { RateCardEntry } from "@kaambill/shared";
import seed from "../../../phase-0-setup/seed/rateCard.json";

/**
 * Rate card, stored on the device (architecture.md §4.2). Seeded with 15 items on first launch.
 * Synchronous reads from an in-memory copy; writes persist to IndexedDB in the background.
 */
export interface RateCardStore {
  list(): RateCardEntry[];
  get(id: string): RateCardEntry | undefined;
  setPrice(id: string, price: number): RateCardEntry | undefined;
  /**
   * Save a new item. From a bill (price the worker said, after approval) it is marked as learned
   * ("Naya ✨ · Voice se sikha gaya"); `{ manual: true }` (S8 "+ Naya item jodein" form) is a plain item.
   */
  learn(
    name: string,
    unit: string | null,
    price: number,
    alias?: string,
    opts?: { manual?: boolean },
  ): RateCardEntry;
  /** Ids learned from voice, shown with the "Naya ✨" tag (S8). */
  isLearned(id: string): boolean;
  /** Back to the 15 seed items (demo reset). */
  reset(): void;
  subscribe(fn: () => void): () => void;
}

const KEY = "rateCard.v1";
const LEARNED = "rateCard.learned.v1";

export function createMemoryRateCard(
  initial: RateCardEntry[] = seed as RateCardEntry[],
  persist?: (entries: RateCardEntry[], learned: string[]) => void,
  learnedIds: string[] = [],
): RateCardStore {
  let entries = initial.map((e) => ({ ...e, aliases: [...e.aliases] }));
  const learned = new Set<string>(learnedIds);
  const subs = new Set<() => void>();
  const changed = () => {
    persist?.(entries, [...learned]);
    subs.forEach((f) => f());
  };
  return {
    list: () => entries,
    get: (id) => entries.find((e) => e.id === id),
    setPrice(id, price) {
      const e = entries.find((x) => x.id === id);
      if (!e) return undefined;
      entries = entries.map((x) => (x.id === id ? { ...x, price: Math.round(price) } : x));
      changed();
      return entries.find((x) => x.id === id);
    },
    learn(name, unit, price, alias, opts) {
      const id = `rc_learned_${name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "")}`;
      const existing = entries.find((e) => e.id === id);
      const entry: RateCardEntry = {
        id,
        name,
        aliases: [
          ...new Set([
            name.toLowerCase(),
            ...(alias ? [alias.toLowerCase()] : []),
            ...(existing?.aliases ?? []),
          ]),
        ],
        unit: unit ?? "pc",
        price: Math.round(price),
        category: "other",
      };
      entries = existing ? entries.map((e) => (e.id === id ? entry : e)) : [...entries, entry];
      if (opts?.manual) learned.delete(id);
      else learned.add(id);
      changed();
      return entry;
    },
    isLearned: (id) => learned.has(id),
    reset() {
      entries = (seed as RateCardEntry[]).map((e) => ({ ...e, aliases: [...e.aliases] }));
      learned.clear();
      changed();
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

/** IndexedDB-backed store (falls back to memory if IndexedDB is unavailable). */
export async function loadRateCard(db?: UseStore): Promise<RateCardStore> {
  try {
    const store = db ?? createStore("kaambill", "kv");
    const saved = await get<RateCardEntry[]>(KEY, store);
    const learnedIds = (await get<string[]>(LEARNED, store)) ?? [];
    const persist = (entries: RateCardEntry[], learned: string[]) => {
      void set(KEY, entries, store);
      void set(LEARNED, learned, store);
    };
    const card = createMemoryRateCard(
      saved?.length ? saved : (seed as RateCardEntry[]),
      persist,
      learnedIds,
    );
    if (!saved?.length) await set(KEY, card.list(), store);
    return card;
  } catch {
    return createMemoryRateCard();
  }
}
