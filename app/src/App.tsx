import { useActorRef, useSelector } from "@xstate/react";
import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { TextInput } from "../../phase-2-voice-core/src/text/TextInput";
import { createVoiceRuntime } from "../../phase-2-voice-core/src/voiceRuntime";
import { createBillingAdapter } from "../../phase-4-billing-domain/src/adapter";
import { createBillNumbers, type FinalBill } from "../../phase-4-billing-domain/src/bill/final";
import {
  handleHistoryCommand,
  loadHistory,
  startOfToday,
  summarize,
  type HistoryStore,
} from "../../phase-5-output-share/src/history";
import { loadDrafts, type DraftStore } from "../../phase-5-output-share/src/drafts";
import {
  DEMO_PROFILE,
  loadProfile,
  type ProfileStore,
  type WorkerProfile,
} from "../../phase-5-output-share/src/profile";
import {
  billTotal,
  isEmpty,
  type DraftBill,
  type LineItem,
} from "../../phase-4-billing-domain/src/bill/model";
import { loadRateCard, type RateCardStore } from "../../phase-4-billing-domain/src/rateCard/store";
import { formatRupees } from "../../phase-4-billing-domain/src/speech";
import { extract } from "../../phase-3-understanding/src/client";
import {
  createTelemetry,
  totalBucket,
  type Telemetry,
} from "../../phase-6-quality-demo/src/telemetry";
import { isDemo } from "../../phase-8-finale/src/demo";
import { WebSpeechProvider } from "../../phase-2-voice-core/src/stt/WebSpeechProvider";
import {
  MicBlockedBanner,
  NoiseTip,
  NoticeCard,
  NotUnderstoodBanner,
  OfflineBanner,
  RateLimitedBanner,
  TypeInsteadCard,
} from "../../phase-2-voice-core/src/ui/Banners";
import { InvoiceCard } from "../../phase-4-billing-domain/src/ui/InvoiceCard";
import { JourneySteps } from "../../phase-4-billing-domain/src/ui/JourneySteps";
import {
  HeardCard,
  LiveBillStrip,
  QueuedCard,
  QuestionBanner,
  QuestionSummary,
  QuickAddChips,
  ReadBackPanel,
  ReadBackStatus,
  similarRates,
} from "../../phase-4-billing-domain/src/ui/Panels";
import { Onboarding } from "../../phase-5-output-share/src/ui/Onboarding";
import { BottomNav, type Tab } from "../../phase-2-voice-core/src/ui/BottomNav";
import { Home } from "../../phase-5-output-share/src/ui/Home";
import { TopBar, UI_LANGUAGES } from "../../phase-2-voice-core/src/ui/TopBar";
import {
  HTML_LANG,
  LANG_STORAGE_KEY,
  REPLY_LANG,
  STT_LANG,
  storedUiLang,
  UiLangContext,
  useT,
  useUiLang,
  type UiLangId,
} from "../../phase-2-voice-core/src/ui/lang";
import { VoiceDock, type DockMode } from "../../phase-2-voice-core/src/ui/VoiceDock";

// Screens not needed for the first paint load on demand: SharePreview pulls in QR + PDF code,
// History and the rate card are separate tabs. Keeps the Home LCP off the critical bundle.
const SharePreview = lazy(() =>
  import("../../phase-5-output-share/src/ui/SharePreview").then((m) => ({
    default: m.SharePreview,
  })),
);
const History = lazy(() =>
  import("../../phase-5-output-share/src/ui/History").then((m) => ({ default: m.History })),
);
const RateCardScreen = lazy(() =>
  import("../../phase-4-billing-domain/src/ui/RateCardScreen").then((m) => ({
    default: m.RateCardScreen,
  })),
);

const T: Record<UiLangId, { opening: string; demoReset: string; customer: string }> = {
  hinglish: {
    opening: "Khul raha hai…",
    demoReset: "Demo reset (bills + rate card)",
    customer: "grahak",
  },
  hindi: { opening: "खुल रहा है…", demoReset: "डेमो रीसेट (बिल + रेट कार्ड)", customer: "ग्राहक" },
  english: {
    opening: "Opening…",
    demoReset: "Demo reset (bills + rate card)",
    customer: "the customer",
  },
};

interface Stores {
  rateCard: RateCardStore;
  profile: ProfileStore;
  history: HistoryStore;
  drafts: DraftStore;
  telemetry: Telemetry;
}

/** Manual edits on the current bill, for telemetry (one app instance per page). */
const editCount = { n: 0 };

/** Wrap markPaid so both the button (S9) and the voice command report bill_marked_paid. */
function withPaidTracking(h: HistoryStore, t: Telemetry): HistoryStore {
  return {
    ...h,
    markPaid(billNo, via) {
      const b = h.list().find((x) => x.billNo === billNo);
      h.markPaid(billNo, via);
      if (b)
        t.track({
          event: "bill_marked_paid",
          props: {
            hours_since_created: Math.round((Date.now() - new Date(b.createdAt).getTime()) / 36e5),
            via: via ?? "unknown",
          },
        });
    },
  };
}

/** Loads the on-device stores (rate card, profile, bills), then onboarding or the billing app. */
/** Current app language, read by the billing adapter (outside React) for its questions and read-back. */
let currentLang: UiLangId = storedUiLang();

export function App() {
  const [stores, setStores] = useState<Stores | null>(null);
  // App language (Hinglish / हिंदी / English): screen text, mic language and the app's messages.
  const [lang, setLangState] = useState<UiLangId>(storedUiLang);
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);
  const setLang = (l: UiLangId) => {
    currentLang = l;
    setLangState(l);
    localStorage.setItem(LANG_STORAGE_KEY, l);
  };
  // The landing page embeds this app in an iframe and has its own language switch. It writes the same
  // localStorage key, which fires a `storage` event here: follow it so the page and the app agree.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LANG_STORAGE_KEY) return;
      const l = storedUiLang();
      currentLang = l;
      setLangState(l);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => {
    // Load the stores ONCE. React's dev mode runs this effect twice; without the `alive` guard two
    // store sets were created and the bill engine kept the first while Home showed the second, so a
    // new bill appeared on Home only after a reload.
    let alive = true;
    void Promise.all([loadRateCard(), loadProfile(), loadHistory(), loadDrafts()]).then(
      ([rateCard, profile, history, drafts]) => {
        if (!alive) return;
        if (!profile.get() && isDemo()) profile.save(DEMO_PROFILE);
        const telemetry = createTelemetry();
        setStores({
          rateCard,
          profile,
          history: withPaidTracking(history, telemetry),
          drafts,
          telemetry,
        });
      },
    );
    return () => {
      alive = false;
    };
  }, []);
  return (
    <UiLangContext.Provider value={{ lang, setLang }}>
      {stores ? (
        <Gate stores={stores} />
      ) : (
        <div className="flex min-h-full items-center justify-center text-body-lg">KaamBill…</div>
      )}
    </UiLangContext.Provider>
  );
}

function Gate({ stores }: { stores: Stores }) {
  const profile = useSyncExternalStore(stores.profile.subscribe, stores.profile.get);
  if (!profile)
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col px-margin pb-10 pt-6">
        <Onboarding rateCard={stores.rateCard} onDone={(p) => stores.profile.save(p)} />
      </main>
    );
  return <BillingApp stores={stores} profile={profile} />;
}

/** Landing page "Wispr Flow" option: `?box=text` opens the typing box on load. */
const boxParamOpen =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("box") === "text";

function BillingApp({ stores, profile }: { stores: Stores; profile: WorkerProfile }) {
  const store = stores.rateCard;
  const [resend, setResend] = useState<FinalBill | null>(null);
  const [runtime] = useState(() =>
    createVoiceRuntime(
      createBillingAdapter({
        getLang: () => REPLY_LANG[currentLang],
        rateCard: store,
        extract,
        nextBillNo: createBillNumbers(
          Math.max(isDemo() ? 42 : 1, stores.history.list().length + 1),
        ),
        onFinalized: (bill, st) => {
          stores.history.add(bill);
          stores.telemetry.track({
            event: "bill_finalized",
            props: {
              ms_to_finalize: st.msToFinalize,
              clarification_turns: st.clarificationTurns,
              amber_confirmations: st.amberConfirmations,
              manual_edits: editCount.n,
              item_count: bill.items.length,
              total_bucket: totalBucket(bill.total),
              doc_type: bill.docType,
            },
          });
          editCount.n = 0;
        },
        onHistory: (a) =>
          handleHistoryCommand(stores.history, a, (b) => setResend(b), REPLY_LANG[currentLang]),
      }),
      new WebSpeechProvider(), // the mic uses the browser's speech recognition; Wispr Flow types into the text box
    ),
  );
  const bills = useSyncExternalStore(stores.history.subscribe, stores.history.list);
  const { lang, setLang } = useUiLang();
  const t = useT(T);
  const uiLang = UI_LANGUAGES.find((l) => l.id === lang) ?? UI_LANGUAGES[0]!;
  useEffect(() => {
    runtime.setLang(STT_LANG[lang]);
  }, [runtime, lang]);
  useEffect(
    () => runtime.setHints(store.list().flatMap((e) => [e.name, ...e.aliases.slice(0, 1)])),
    [runtime, store],
  );
  const today = summarize(bills, startOfToday());
  const actor = useActorRef(runtime.machine);
  useEffect(() => runtime.bind(actor.send), [runtime, actor]);
  const state = useSelector(actor, (s) => s.value as string);
  const ctx = useSelector(actor, (s) => s.context);
  const [tab, setTab] = useState<Tab>("boliye");
  const send = actor.send;
  const draft = ctx.draft as DraftBill;
  // Mic = KaamBill's own speech recognition. Wispr Flow is used in the Likh Ke text box (a web page can't start Flow).
  const tapMic = () => send(state === "listening" ? { type: "STOP" } : { type: "MIC_TAP" });

  const edit = (update: (d: DraftBill) => DraftBill) =>
    send({ type: "DRAFT_EDIT", update: update as never });
  const editLine = (id: string, patch: { qty: number; unitPrice: number | null }) => {
    const line = draft.items.find((l) => l.id === id);
    if (line) {
      editCount.n++;
      stores.telemetry.track({
        event: "chip_corrected",
        props: {
          field: patch.unitPrice !== line.unitPrice ? "price" : "qty",
          was_amber: !line.confirmed && line.confidence < 0.85,
        },
      });
    }
    edit((d) => ({
      ...d,
      lastChangedId: id,
      items: d.items.map((l): LineItem =>
        l.id !== id
          ? l
          : {
              ...l,
              qty: patch.qty,
              unitPrice: patch.unitPrice,
              priceSource:
                patch.unitPrice === null
                  ? null
                  : patch.unitPrice === l.unitPrice
                    ? l.priceSource
                    : "spoken",
              confirmed: true,
              skipped: false,
              rev: l.rev + 1,
            },
      ),
    }));
  };

  const dockMode: DockMode =
    state === "listening"
      ? "listening"
      : state === "processing" || state === "finalizing"
        ? "processing"
        : state === "asking"
          ? "asking"
          : state === "awaitApproval"
            ? "awaitApproval"
            : ctx.error === "mic_blocked" || ctx.error === "unsupported"
              ? "disabled"
              : "idle";
  const micBlocked =
    ctx.error === "mic_blocked" || ctx.error === "unsupported" || !runtime.sttSupported;
  // The text box (typing or Wispr Flow) sits above the mic on the Boliye screen; there is no separate
  // "Likh Ke" tab. Hidden on the share/payment screens (nothing to type there) and while listening.
  // The text box opens only when the worker asks to type ("Likh ke daalein", "Likh ke" on a question,
  // "+ Item jodein"); it then stays open for this bill, until closed (×) or the bill is done.
  // Landing page "Wispr Flow" option (?box=text): the box is open from the start, so Flow can dictate into it.
  const [textOpen, setTextOpen] = useState(boxParamOpen);
  const showText = textOpen && state !== "sharePreview" && state !== "listening" && !resend;
  const onBillTabs = tab === "boliye";
  const [focusText, setFocusText] = useState(boxParamOpen ? 1 : 0);
  // The dock's height changes (text box shown/hidden, listening card, payment screens): track it.
  const dockRef = useRef<HTMLDivElement>(null);
  const [dockHeight, setDockHeight] = useState(320);
  useEffect(() => {
    const el = dockRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) =>
      setDockHeight(Math.ceil(e!.target.getBoundingClientRect().height)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const typeInstead = () => {
    setTab("boliye");
    setTextOpen(true);
    setFocusText((n) => n + 1);
  };
  const q = state === "asking" ? ctx.pendingQuestion : null;
  // Only touch the saved draft once this session has worked on a bill, so opening the app
  // never wipes a draft saved last time (it stays under Bills → Drafts until resumed).
  const touchedDraft = useRef(false);
  useEffect(() => {
    if (!isEmpty(draft)) touchedDraft.current = true;
    if (!touchedDraft.current) return;
    if (state === "sharePreview" || state === "finalizing") stores.drafts.clear();
    else stores.drafts.save(draft);
  }, [draft, state, stores.drafts]);
  const onShared = (
    bill: FinalBill,
    r: "share_sheet" | "whatsapp_link" | "cancelled",
    customerPhone: string | null,
  ) => {
    if (r === "cancelled") return;
    stores.history.markShared(bill.billNo, customerPhone);
    stores.telemetry.track({ event: "bill_shared", props: { method: r } });
  };

  const busy = state === "processing" || state === "finalizing";
  // S10a: the big "likh kar bataayein" card replaces the small text box in the dock.
  const bigTextCard =
    onBillTabs &&
    !resend &&
    micBlocked &&
    (state === "error" || state === "idle" || state === "notUnderstood");
  const s10 = state === "error" || state === "notUnderstood" || state === "offlineQueued";
  const qLine = q?.targetId ? draft.items.find((l) => l.id === q.targetId) : undefined;
  const heard = draft.transcript.at(-1) ?? null;
  const invoice = (mode: "live" | "dimmed" | "review") => (
    <InvoiceCard
      draft={draft}
      mode={mode}
      focusId={q?.targetId ?? null}
      confirm={
        q?.kind === "confirm"
          ? { q, onYes: () => send({ type: "TEXT_SUBMIT", text: "haan" }) }
          : null
      }
      onEditLine={editLine}
      onEditCharges={(patch) => {
        editCount.n++;
        const field =
          "laborCharge" in patch
            ? "labour"
            : "visitingCharge" in patch
              ? "visiting"
              : "discount" in patch
                ? "discount"
                : "customer";
        stores.telemetry.track({ event: "chip_corrected", props: { field, was_amber: false } });
        edit((d) => ({ ...d, ...patch }));
      }}
      onAddItem={typeInstead}
      // F1: only when no question is open; it leads to the read-back (S6), never to sharing.
      canReadBack={state === "idle" || state === "notUnderstood"}
      onReadBack={() => edit((d) => d)}
    />
  );

  return (
    <div className="flex min-h-full flex-col">
      <TopBar
        language={uiLang}
        onLanguage={(l) => setLang(l.id as UiLangId)}
        onRateCard={() => setTab("rates")}
      />
      {/* Bottom padding = the real height of the fixed dock (text box + mic + nav), so nothing hides under it. */}
      <main
        className="flex w-full flex-1 flex-col gap-space-md px-margin pt-24"
        style={{ paddingBottom: dockHeight + 16 }}
      >
        <Suspense fallback={<div className="py-10 text-center text-body-lg">{t.opening}</div>}>
          {tab === "rates" && <RateCardScreen store={store} />}
          {resend && (
            <SharePreview
              bill={resend}
              profile={profile}
              history={stores.history}
              startAt="invoice"
              onShared={(r, ph) => onShared(resend, r, ph)}
              onDone={() => setResend(null)}
            />
          )}
          {!resend && tab === "bills" && (
            <History
              store={stores.history}
              drafts={stores.drafts}
              onResend={setResend}
              onResume={(d) => {
                send({ type: "RESET" });
                edit(() => d); // back into the machine → next question or a fresh read-back
                setTab("boliye");
              }}
            />
          )}
          {!resend && tab === "khata" && (
            <>
              <Onboarding
                key={profile.vpa}
                initial={profile}
                rateCard={store}
                standalone={false}
                onDone={(p) => {
                  stores.profile.save(p);
                  setTab("boliye");
                }}
              />
              {isDemo() && (
                <button
                  type="button"
                  onClick={() => {
                    stores.history.clear();
                    store.reset();
                    send({ type: "RESET" });
                    setTab("boliye");
                  }}
                  className="min-h-[52px] rounded-xl border-2 border-error font-label-lg text-label-lg text-error"
                >
                  {t.demoReset}
                </button>
              )}
            </>
          )}

          {onBillTabs && !resend && ctx.notice && <NoticeCard text={ctx.notice.text} />}
          {onBillTabs &&
            !resend &&
            (state === "sharePreview" && ctx.output ? (
              <SharePreview
                bill={ctx.output}
                profile={profile}
                history={stores.history}
                onEditPayee={() => setTab("khata")}
                onShared={(r, ph) => onShared(ctx.output!, r, ph)}
                onDone={() => {
                  setTextOpen(false);
                  send({ type: "SHARED" });
                }}
              />
            ) : (
              <>
                {/* Journey steps 1–2 (Saaman → Jaanch) above a bill in progress; 3–5 live in SharePreview. */}
                {!isEmpty(draft) && (
                  <JourneySteps
                    step={
                      q ||
                      state === "readBack" ||
                      state === "awaitApproval" ||
                      state === "finalizing"
                        ? 2
                        : 1
                    }
                  />
                )}
                {/* S10 banners sit above the CURRENT bill (never above Home). */}
                {state === "error" && micBlocked && (
                  <>
                    <MicBlockedBanner
                      onRetry={
                        ctx.error === "mic_blocked" ? () => send({ type: "RETRY" }) : undefined
                      }
                    />
                  </>
                )}
                {bigTextCard && (
                  <TypeInsteadCard>
                    <TextInput
                      focusSignal={focusText}
                      onSubmit={(text) => send({ type: "TEXT_SUBMIT", text })}
                      disabled={busy}
                    />
                    <div className="px-1 pt-2">
                      <QuickAddChips onAdd={(text) => send({ type: "TEXT_SUBMIT", text })} />
                    </div>
                  </TypeInsteadCard>
                )}
                {state === "error" && ctx.error === "rate_limited" && (
                  <RateLimitedBanner onRetry={() => send({ type: "RETRY" })} />
                )}
                {((state === "error" && !micBlocked && ctx.error !== "rate_limited") ||
                  state === "notUnderstood") && (
                  <NotUnderstoodBanner
                    onRetry={() => send({ type: "RETRY" })}
                    onExample={(t) => send({ type: "TEXT_SUBMIT", text: t })}
                  />
                )}
                {state === "offlineQueued" && (
                  <>
                    <OfflineBanner onRetry={() => send({ type: "RETRY" })} />
                    <QueuedCard draft={draft} />
                  </>
                )}

                {isEmpty(draft) ? (
                  !s10 && (
                    <Home
                      workerName={profile.businessName}
                      trade={profile.trade}
                      todayTotal={today.total}
                      todayCount={today.count}
                      recent={bills}
                      dimmed={state === "listening"}
                      onType={typeInstead}
                      onAllBills={() => setTab("bills")}
                      onShare={setResend}
                      onOpen={setResend}
                    />
                  )
                ) : q?.kind === "missing" ? (
                  <>
                    {/* S4: summary header, the bill dimmed ABOVE, the one question BELOW. */}
                    <QuestionSummary draft={draft} />
                    {invoice("dimmed")}
                    <QuestionBanner
                      q={q}
                      line={qLine}
                      customer={draft.customerName}
                      prices={
                        qLine && qLine.unitPrice === null && !q.quickReplies?.length
                          ? similarRates(store.list(), qLine)
                          : []
                      }
                      onPrice={(p) =>
                        qLine && editLine(qLine.id, { qty: qLine.qty, unitPrice: p.price })
                      }
                      onReply={(t) => send({ type: "TEXT_SUBMIT", text: t })}
                      onSkip={() => send({ type: "TEXT_SUBMIT", text: "baad mein" })}
                      onType={typeInstead}
                      onMic={micBlocked ? undefined : tapMic}
                    />
                  </>
                ) : state === "awaitApproval" && ctx.lastSaid ? (
                  <>
                    {/* S6: status → item checklist → totals → read-back card → total → buttons. */}
                    <ReadBackStatus draft={draft} />
                    {invoice("review")}
                    <ReadBackPanel
                      u={ctx.lastSaid}
                      total={formatRupees(billTotal(draft))}
                      customer={draft.customerName ?? t.customer}
                      onApprove={() => send({ type: "APPROVE" })}
                      onEdit={() => send({ type: "EDIT" })}
                    />
                  </>
                ) : (
                  <>
                    {/* S3 live bill (S5: the confirm sits inside the amber row). */}
                    {!s10 && (
                      <LiveBillStrip
                        name={profile.businessName}
                        sub={[profile.trade, profile.city].filter(Boolean).join(" · ")}
                      />
                    )}
                    {!s10 && heard && <HeardCard text={heard} />}
                    {invoice("live")}
                    {s10 && state !== "offlineQueued" && !micBlocked && <NoiseTip />}
                  </>
                )}
              </>
            ))}
        </Suspense>
      </main>

      <div
        ref={dockRef}
        className="fixed bottom-0 z-50 w-full pb-safe bg-surface-container-lowest/95 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl"
      >
        {showText && onBillTabs && !bigTextCard && (
          <div className="flex flex-col gap-2 px-margin pt-3">
            <TextInput
              focusSignal={focusText}
              onClose={() => setTextOpen(false)}
              onSubmit={(text) => send({ type: "TEXT_SUBMIT", text })}
              disabled={busy}
            />
          </div>
        )}
        <VoiceDock
          mode={dockMode}
          langLabel={uiLang.label}
          partial={ctx.partial}
          onMic={tapMic}
          onStop={() => send({ type: "STOP" })}
          onCancel={() => send({ type: "CANCEL" })}
        />
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  );
}
