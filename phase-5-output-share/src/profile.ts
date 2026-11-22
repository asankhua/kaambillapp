import { createStore, get, set, type UseStore } from "idb-keyval";

/** The worker's own details (S1 onboarding, Khata tab). Stored only on the device. */
export interface WorkerProfile {
  /** Shown on bills and as the UPI payee name, e.g. "Ramesh Electricals". */
  businessName: string;
  trade: "Electrician" | "Plumber" | "Mistri" | "AC Mechanic" | "Other";
  /** UPI ID / VPA, e.g. "ramesh@okaxis". Only the FORMAT is checked (no "bank linked" claim, fix F5). */
  vpa: string;
  phone: string | null;
  city: string | null;
}

/** name@handle: 2+ chars of letters/digits/._- then @ then 2+ letters (architecture.md §5.7). */
export const VPA_RE = /^[\w.-]{2,}@[a-zA-Z]{2,}$/;
export const isValidVpa = (v: string) => VPA_RE.test(v.trim());

export interface ProfileStore {
  get(): WorkerProfile | null;
  save(p: WorkerProfile): void;
  subscribe(fn: () => void): () => void;
}

const KEY = "profile.v1";

export function createMemoryProfile(
  initial: WorkerProfile | null = null,
  persist?: (p: WorkerProfile) => void,
): ProfileStore {
  let profile = initial;
  const subs = new Set<() => void>();
  return {
    get: () => profile,
    save(p) {
      if (!p.businessName.trim()) throw new Error("businessName required");
      if (!isValidVpa(p.vpa)) throw new Error("invalid UPI ID");
      profile = { ...p, businessName: p.businessName.trim(), vpa: p.vpa.trim() };
      persist?.(profile);
      subs.forEach((f) => f());
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

export async function loadProfile(db?: UseStore): Promise<ProfileStore> {
  try {
    const store = db ?? createStore("kaambill-profile", "kv");
    const saved = (await get<WorkerProfile>(KEY, store)) ?? null;
    return createMemoryProfile(saved, (p) => void set(KEY, p, store));
  } catch {
    return createMemoryProfile();
  }
}

/** Canonical demo profile (architecture.md §7.4), used when VITE_DEMO_MODE=true. */
export const DEMO_PROFILE: WorkerProfile = {
  businessName: "Ramesh Electricals",
  trade: "Electrician",
  vpa: "ramesh@okaxis",
  phone: null,
  city: "Delhi NCR",
};
