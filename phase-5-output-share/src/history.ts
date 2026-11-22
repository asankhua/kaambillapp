import { createStore, get, set, type UseStore } from "idb-keyval";
import type { HistoryAction } from "@kaambill/shared";
import type { Lang } from "@kaambill/shared/types";
import type { FinalBill } from "../../phase-4-billing-domain/src/bill/final";

/** Bill history on the device (S9 Bills tab, Home recent bills). */
export interface HistoryStore {
  list(): FinalBill[];
  add(bill: FinalBill): void;
  /** Mark shared; remembers the customer's WhatsApp number if one was typed (on device only). */
  markShared(billNo: string, customerPhone?: string | null): void;
  markPaid(billNo: string, via: "upi" | "cash" | null): void;
  /** Bill a voice command refers to: by customer name (+ "aaj" / "kal"), most recent first. */
  find(customer: string, when?: string | null, now?: Date): FinalBill | undefined;
  /** Demo reset (rehearsals only). */
  clear(): void;
  subscribe(fn: () => void): () => void;
}

const KEY = "bills.v1";
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFC")
    .replace(/\b(ji|sahab|sir|madam|bhai|didi)\b/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const dayDiff = (a: Date, b: Date) =>
  Math.round(
    (new Date(a.toDateString()).getTime() - new Date(b.toDateString()).getTime()) / 86_400_000,
  );

export function createMemoryHistory(
  initial: FinalBill[] = [],
  persist?: (bills: FinalBill[]) => void,
): HistoryStore {
  let bills = [...initial];
  const subs = new Set<() => void>();
  const changed = () => {
    persist?.(bills);
    subs.forEach((f) => f());
  };
  const update = (billNo: string, patch: Partial<FinalBill>) => {
    bills = bills.map((b) => (b.billNo === billNo ? { ...b, ...patch } : b));
    changed();
  };
  return {
    list: () => bills,
    add(bill) {
      bills = [bill, ...bills.filter((b) => b.billNo !== bill.billNo)];
      changed();
    },
    markShared: (billNo, customerPhone) => {
      const b = bills.find((x) => x.billNo === billNo);
      update(billNo, {
        status: b?.status === "paid" ? "paid" : "shared",
        customerPhone: customerPhone?.trim() || b?.customerPhone || null,
      });
    },
    markPaid: (billNo, via) => update(billNo, { status: "paid", paidVia: via }),
    clear() {
      bills = [];
      changed();
    },
    find(customer, when, now = new Date()) {
      const c = norm(customer);
      const want =
        when === "aaj" || when === "today" ? 0 : when === "kal" || when === "yesterday" ? -1 : null;
      return bills.find((b) => {
        const name = norm(b.customerName);
        if (!c || !(name === c || name.includes(c) || c.includes(name))) return false;
        return want === null || dayDiff(new Date(b.createdAt), now) === want;
      });
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

export async function loadHistory(db?: UseStore): Promise<HistoryStore> {
  try {
    const store = db ?? createStore("kaambill-bills", "kv");
    const saved = (await get<FinalBill[]>(KEY, store)) ?? [];
    return createMemoryHistory(saved, (b) => void set(KEY, b, store));
  } catch {
    return createMemoryHistory();
  }
}

export interface Summary {
  total: number;
  count: number;
  paid: number;
  paidCount: number;
  pending: number;
  pendingCount: number;
}

/** Totals for bills since `since` (Home "Aaj ki kamai", S9 "Is hafte ki kul kamai"). Estimates excluded. */
export function summarize(bills: FinalBill[], since: Date): Summary {
  const s: Summary = { total: 0, count: 0, paid: 0, paidCount: 0, pending: 0, pendingCount: 0 };
  for (const b of bills) {
    if (b.docType === "Estimate" || new Date(b.createdAt) < since) continue;
    s.total += b.total;
    s.count++;
    if (b.status === "paid") {
      s.paid += b.total;
      s.paidCount++;
    } else {
      s.pending += b.total;
      s.pendingCount++;
    }
  }
  return s;
}
export const startOfToday = (now = new Date()) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate());
export const startOfWeek = (now = new Date()) => {
  const d = startOfToday(now);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d;
};

/**
 * Voice commands on the Bills screen (intent "history", architecture.md §5.2).
 * Returns what to say; `onResend` lets the UI open the share preview for that bill.
 */
const HISTORY_TEXT: Record<
  Lang,
  {
    notFound: (c: string) => string;
    paid: (c: string, via: "upi" | "cash" | null) => string;
    reopened: (c: string) => string;
  }
> = {
  "hi-Latn": {
    notFound: (c) => `${c} ka koi bill nahi mila.`,
    paid: (c, via) =>
      `${c} ka bill paid mark ho gaya${via ? ` (${via === "cash" ? "cash" : "UPI"})` : ""}.`,
    reopened: (c) => `${c} ka bill khol diya — WhatsApp par Send dabaiye.`,
  },
  hi: {
    notFound: (c) => `${c} का कोई बिल नहीं मिला।`,
    paid: (c, via) =>
      `${c} का बिल पेड मार्क हो गया${via ? ` (${via === "cash" ? "कैश" : "UPI"})` : ""}।`,
    reopened: (c) => `${c} का बिल खोल दिया — WhatsApp पर Send दबाइए।`,
  },
  "en-IN": {
    notFound: (c) => `No bill found for ${c}.`,
    paid: (c, via) =>
      `${c}'s bill marked paid${via ? ` (${via === "cash" ? "cash" : "UPI"})` : ""}.`,
    reopened: (c) => `${c}'s bill is open — tap Send in WhatsApp.`,
  },
};

export function handleHistoryCommand(
  history: HistoryStore,
  a: HistoryAction,
  onResend?: (b: FinalBill) => void,
  lang: Lang = "hi-Latn",
) {
  const tx = HISTORY_TEXT[lang] ?? HISTORY_TEXT["hi-Latn"];
  const bill = history.find(a.customer, a.when);
  if (!bill) return { text: tx.notFound(a.customer) };
  if (a.action === "mark_paid") {
    history.markPaid(bill.billNo, a.paidVia);
    return { text: tx.paid(bill.customerName, a.paidVia) };
  }
  onResend?.(bill);
  return { text: tx.reopened(bill.customerName) };
}
