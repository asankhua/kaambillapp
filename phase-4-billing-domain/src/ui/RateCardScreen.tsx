import { useState, useSyncExternalStore } from "react";
import type { RateCardCategory, RateCardEntry } from "@kaambill/shared";
import type { RateCardStore } from "../rateCard/store";
import { formatRupees } from "../speech";
import { Icon } from "../../../phase-1-ui-ux-design/src/Icon";
import { useT } from "../../../phase-2-voice-core/src/ui/lang";

const TABS: { id: RateCardCategory | "all"; icon?: string }[] = [
  { id: "all", icon: "select_all" },
  { id: "electrical" },
  { id: "plumbing" },
  { id: "labour" },
];

const T = {
  hinglish: {
    aria: "Rate card",
    title: "Mera Rate Card",
    items: (n: number) => `${n} items`,
    subtitle: "Aapke standard rates jo bolne par auto-fill hote hain",
    searchVoice: "Item dhoondhein ya boliye...",
    search: "Item dhoondhein...",
    speak: "Boliye",
    tabs: {
      all: "Sab (All)",
      electrical: "⚡ Bijli (Electrical)",
      plumbing: "🚰 Plumbing",
      labour: "🛠 Mazdoori (Labour)",
    } as Record<RateCardCategory | "all", string>,
    unit: { pc: "piece / nag", m: "meter", fan: "per fan" } as Record<string, string>,
    unitShort: { pc: "piece", m: "meter", fan: "fan" } as Record<string, string>,
    newBadge: "Naya ✨",
    learned: "Voice se sikha gaya",
    editAria: (name: string) => `${name} ka rate badlein`,
    newRate: "Naya rate",
    ok: "Theek",
    none: "Koi item nahi mila",
    tipTitle: "Bolke rate badlein:",
    tipPhrase: "“MCB ka rate 200 kar do”",
    tipHelp: "Mic dabakar boliye, rate card turant update ho jayega",
    addAria: "Naya item",
    nameAria: "Item ka naam",
    namePh: "Item ka naam (jaise Anchor Fastener 10mm)",
    priceAria: "Item ka rate (₹)",
    pricePh: "Rate ₹",
    unitAria: "Unit",
    cancel: "Rehne dein",
    add: "Jodein",
    addBtn: "Naya item jodein",
  },
  hindi: {
    aria: "रेट कार्ड",
    title: "मेरा रेट कार्ड",
    items: (n: number) => `${n} आइटम`,
    subtitle: "आपके स्टैंडर्ड रेट, जो बोलते ही अपने-आप भर जाते हैं",
    searchVoice: "आइटम खोजें या बोलें...",
    search: "आइटम खोजें...",
    speak: "बोलें",
    tabs: { all: "सब", electrical: "⚡ बिजली", plumbing: "🚰 प्लंबिंग", labour: "🛠 मज़दूरी" } as Record<
      RateCardCategory | "all",
      string
    >,
    unit: { pc: "पीस / नग", m: "मीटर", fan: "प्रति पंखा" } as Record<string, string>,
    unitShort: { pc: "पीस", m: "मीटर", fan: "पंखा" } as Record<string, string>,
    newBadge: "नया ✨",
    learned: "आवाज़ से सीखा गया",
    editAria: (name: string) => `${name} का रेट बदलें`,
    newRate: "नया रेट",
    ok: "ठीक",
    none: "कोई आइटम नहीं मिला",
    tipTitle: "बोलकर रेट बदलें:",
    tipPhrase: "“MCB का रेट 200 कर दो”",
    tipHelp: "माइक दबाकर बोलें, रेट कार्ड तुरंत अपडेट हो जाएगा",
    addAria: "नया आइटम",
    nameAria: "आइटम का नाम",
    namePh: "आइटम का नाम (जैसे Anchor Fastener 10mm)",
    priceAria: "आइटम का रेट (₹)",
    pricePh: "रेट ₹",
    unitAria: "इकाई",
    cancel: "रहने दें",
    add: "जोड़ें",
    addBtn: "नया आइटम जोड़ें",
  },
  english: {
    aria: "Rate card",
    title: "My Rate Card",
    items: (n: number) => `${n} items`,
    subtitle: "Your standard rates, filled in automatically when you speak",
    searchVoice: "Search items or speak...",
    search: "Search items...",
    speak: "Speak",
    tabs: {
      all: "All",
      electrical: "⚡ Electrical",
      plumbing: "🚰 Plumbing",
      labour: "🛠 Labour",
    } as Record<RateCardCategory | "all", string>,
    unit: { pc: "piece", m: "meter", fan: "per fan" } as Record<string, string>,
    unitShort: { pc: "piece", m: "meter", fan: "fan" } as Record<string, string>,
    newBadge: "New ✨",
    learned: "Learned from voice",
    editAria: (name: string) => `Change rate of ${name}`,
    newRate: "New rate",
    ok: "OK",
    none: "No items found",
    tipTitle: "Change rates by speaking:",
    tipPhrase: "“Make MCB rate 200”",
    tipHelp: "Press the mic and speak; the rate card updates instantly",
    addAria: "New item",
    nameAria: "Item name",
    namePh: "Item name (e.g. Anchor Fastener 10mm)",
    priceAria: "Item rate (₹)",
    pricePh: "Rate ₹",
    unitAria: "Unit",
    cancel: "Cancel",
    add: "Add",
    addBtn: "Add new item",
  },
};

/** Category icon tile for a row (same Material Symbols as Stitch). */
function itemIcon(e: RateCardEntry): string {
  const s = `${e.id} ${e.name}`.toLowerCase();
  if (e.category === "labour") return "construction";
  if (s.includes("mcb") || s.includes("switch")) return "toggle_on";
  if (s.includes("wire")) return "cable";
  if (s.includes("socket")) return "power";
  if (s.includes("fan")) return "mode_fan";
  if (s.includes("led") || s.includes("batten")) return "light";
  if (s.includes("conduit")) return "view_column";
  if (s.includes("tape")) return "healing";
  if (e.category === "plumbing") return "plumbing";
  return "hardware";
}

/**
 * S8 Mera Rate Card (kaambill_mera_rate_card). Voice edits ("MCB ka rate 200 kar do") work from the mic too.
 * `onVoice` (optional) starts the mic from the search bar; without it the "Boliye" button is hidden.
 */
export function RateCardScreen({ store, onVoice }: { store: RateCardStore; onVoice?: () => void }) {
  const t = useT(T);
  const entries = useSyncExternalStore(store.subscribe, store.list);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const shown = entries.filter(
    (e) =>
      (tab === "all" || e.category === tab) &&
      (!q || [e.name, ...e.aliases].some((t) => t.toLowerCase().includes(q.toLowerCase()))),
  );
  return (
    <section
      className="flex flex-col rounded-[32px] bg-surface-container-lowest pb-6 pt-4 shadow-2xl"
      aria-label={t.aria}
    >
      <div className="px-space-md pb-3">
        <div className="flex items-center gap-2">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
            {t.title}
          </h1>
          <span className="rounded-full bg-primary-container/10 px-2.5 py-0.5 font-label-md text-label-md font-bold text-primary-container">
            {t.items(entries.length)}
          </span>
        </div>
        <p className="mt-0.5 font-caption text-caption text-on-surface-variant">{t.subtitle}</p>
      </div>

      <div className="mb-3 px-space-md">
        <label className="flex h-14 w-full items-center gap-2 rounded-2xl bg-surface-container-low px-3">
          <Icon name="search" className="text-[22px] text-on-surface-variant" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={onVoice ? t.searchVoice : t.search}
            className="w-full min-w-0 bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-on-surface-variant/80"
          />
          {onVoice && (
            <button
              type="button"
              onClick={onVoice}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary-container px-3 text-on-primary shadow-sm active:scale-95"
            >
              <Icon name="mic" className="text-[18px]" />
              <span className="font-caption text-caption font-bold">{t.speak}</span>
            </button>
          )}
        </label>
      </div>

      <div className="mb-3 flex items-center gap-2 overflow-x-auto px-space-md pb-1">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            type="button"
            aria-pressed={tab === tb.id}
            onClick={() => setTab(tb.id)}
            className={`flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 font-label-md text-label-md ${tab === tb.id ? "bg-primary-container text-on-primary shadow-sm" : "bg-surface-container-low text-on-surface-variant active:bg-surface-container-high"}`}
          >
            {tb.icon && <Icon name={tb.icon} className="text-[18px]" />}
            <span>{t.tabs[tb.id]}</span>
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-2.5 px-space-md">
        {shown.map((e) => {
          const learned = store.isLearned(e.id);
          return (
            <li
              key={e.id}
              className={`rounded-2xl p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${learned ? "bg-primary-fixed/20" : "bg-surface-container-lowest"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${learned ? "bg-primary-container text-on-primary" : e.category === "labour" ? "bg-surface-container-high text-secondary" : "bg-surface-container text-primary-container"}`}
                  >
                    <Icon name={itemIcon(e)} className="text-[22px]" />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <h3 className="truncate font-body-lg text-body-lg font-semibold text-on-surface">
                        {e.name}
                      </h3>
                      {learned && (
                        <span className="rounded-full bg-primary-container px-2 py-0.5 text-[11px] font-bold text-on-primary">
                          {t.newBadge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-caption text-caption ${learned ? "font-medium text-on-primary-fixed-variant" : "text-on-surface-variant"}`}
                    >
                      {learned
                        ? `${t.unitShort[e.unit] ?? e.unit} • ${t.learned}`
                        : (t.unit[e.unit] ?? e.unit)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(editing === e.id ? null : e.id)}
                  className="flex min-h-[48px] shrink-0 items-center gap-3"
                  aria-label={t.editAria(e.name)}
                >
                  <span className="tabular font-headline-md text-headline-md font-bold tracking-tight text-on-surface">
                    {formatRupees(e.price)}
                  </span>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant ${learned ? "bg-surface-container-lowest" : "bg-surface-container-low"}`}
                  >
                    <Icon name="edit" className="text-[18px]" />
                  </span>
                </button>
              </div>
              {editing === e.id && (
                <form
                  className="mt-2 flex gap-2"
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    const v = Number(new FormData(ev.currentTarget).get("price"));
                    if (v > 0) store.setPrice(e.id, v);
                    setEditing(null);
                  }}
                >
                  <input
                    name="price"
                    aria-label={t.newRate}
                    inputMode="numeric"
                    defaultValue={e.price}
                    className="min-h-[48px] min-w-0 flex-1 rounded-xl bg-surface-container-low px-3 text-body-lg outline-none focus:shadow-[0_0_0_2px_#005f39]"
                  />
                  <button
                    type="submit"
                    className="min-h-[48px] rounded-xl bg-primary-container px-4 font-label-lg text-label-lg text-on-primary"
                  >
                    {t.ok}
                  </button>
                </form>
              )}
            </li>
          );
        })}
        {shown.length === 0 && (
          <li className="rounded-2xl bg-surface-container-low p-4 text-center font-body-md text-body-md text-on-surface-variant">
            {t.none}
          </li>
        )}
      </ul>

      <div className="mx-space-md mt-4 flex items-center gap-3 rounded-2xl bg-surface-container-high p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary">
          <Icon name="mic" className="text-[22px]" />
        </div>
        <div className="flex min-w-0 flex-col">
          <p className="font-label-lg text-label-lg font-bold text-on-surface">
            {t.tipTitle} <span className="text-primary-container">{t.tipPhrase}</span>
          </p>
          <p className="font-caption text-caption text-on-surface-variant">{t.tipHelp}</p>
        </div>
      </div>

      {adding ? (
        <form
          aria-label={t.addAria}
          className="mx-space-md mt-4 flex flex-col gap-2 rounded-2xl bg-surface-container-low p-4"
          onSubmit={(ev) => {
            ev.preventDefault();
            const f = new FormData(ev.currentTarget);
            const name = String(f.get("name") ?? "").trim();
            const price = Number(f.get("price"));
            if (!name || !(price > 0)) return;
            store.learn(name, String(f.get("unit") ?? "pc"), price, undefined, { manual: true });
            setAdding(false);
          }}
        >
          <input
            name="name"
            aria-label={t.nameAria}
            placeholder={t.namePh}
            className="min-h-[48px] rounded-xl bg-surface-container-lowest px-3 text-body-lg outline-none focus:shadow-[0_0_0_2px_#005f39]"
          />
          <div className="flex gap-2">
            <input
              name="price"
              aria-label={t.priceAria}
              inputMode="numeric"
              placeholder={t.pricePh}
              className="min-h-[48px] min-w-0 flex-1 rounded-xl bg-surface-container-lowest px-3 text-body-lg outline-none focus:shadow-[0_0_0_2px_#005f39]"
            />
            <select
              name="unit"
              aria-label={t.unitAria}
              defaultValue="pc"
              className="min-h-[48px] rounded-xl bg-surface-container-lowest px-2 text-body-md"
            >
              <option value="pc">{t.unitShort.pc}</option>
              <option value="m">{t.unitShort.m}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="min-h-[48px] rounded-xl bg-surface-container font-label-lg text-label-lg"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="min-h-[48px] rounded-xl bg-primary-container font-label-lg text-label-lg text-on-primary"
            >
              {t.add}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mx-space-md mt-4 flex h-14 min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-primary-container font-title-lg text-title-lg text-on-primary shadow-md active:scale-[0.98]"
        >
          <Icon name="add_circle" className="text-[24px]" /> {t.addBtn}
        </button>
      )}
    </section>
  );
}
