import type { __PASCAL__Draft } from "./adapter";

/** Domain UI card (center canvas). Use Stitch classes: bg-surface-container-lowest, text-body-lg, … */
export function __PASCAL__Card({ draft }: { draft: __PASCAL__Draft }) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-surface-container-lowest p-4 shadow-sm" aria-label="__NAME__">
      <p className="font-headline-lg-mobile text-headline-lg-mobile">{draft.subject ?? "?"}</p>
      <ul className="mt-2 flex flex-col gap-2">
        {draft.items.map((i, k) => <li key={k} className="rounded-xl bg-surface-container-low p-3 text-body-lg">{i.label} {i.qtySpoken ? `· ${i.qtySpoken}` : ""}</li>)}
      </ul>
    </section>
  );
}
