import { Icon } from "../../../phase-1-ui-ux-design/src/Icon";
import { useT, type UiLangId } from "./lang";

export type Tab = "boliye" | "bills" | "rates" | "khata";
const ICONS: Record<Tab, string> = {
  boliye: "mic",
  bills: "receipt",
  rates: "calculate",
  khata: "badge",
};
const T: Record<UiLangId, { nav: string; tabs: Record<Tab, string> }> = {
  hinglish: {
    nav: "Main",
    tabs: { boliye: "Boliye", bills: "Bills", rates: "Rates", khata: "Khata" },
  },
  hindi: { nav: "मुख्य", tabs: { boliye: "बोलिए", bills: "बिल", rates: "रेट", khata: "खाता" } },
  english: {
    nav: "Main",
    tabs: { boliye: "Speak", bills: "Bills", rates: "Rates", khata: "Account" },
  },
};
const TAB_IDS: Tab[] = ["boliye", "bills", "rates", "khata"];

/** 5-tab nav from the Stitch export (architecture.md §7.1). */
export function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tr = useT(T);
  const tabs = TAB_IDS.map((id) => ({ id, icon: ICONS[id], label: tr.tabs[id] }));
  return (
    <nav
      className="flex h-16 items-center justify-around border-t border-surface-container px-space-md py-1"
      aria-label={tr.nav}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          aria-current={active === t.id ? "page" : undefined}
          className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 px-3 ${active === t.id ? "font-bold text-primary-container" : "text-on-surface-variant"}`}
        >
          <Icon name={t.icon} className="text-[24px]" />
          <span className="font-caption text-caption">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
