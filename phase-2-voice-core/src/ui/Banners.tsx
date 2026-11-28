import type { ReactNode } from "react";
import { Icon } from "../../../phase-1-ui-ux-design/src/Icon";
import { useT, type UiLangId } from "./lang";

const HINGLISH = {
  micOff: "Mic band hai — likh ke bhi bata sakte hain",
  micOffSub: "Phone settings se mic allow kijiye, ya neeche likhiye",
  micHowTo: 'Browser icon tap karein → Site settings → Microphone → "Allow".',
  fixIt: "Theek karein",
  textModeOn: "Text mode chalu hai",
  typeAria: "Likh kar bataayein",
  typeTitle: "Aapka kaam likh kar bataayein",
  typeSub: "Rate card se rate aur total apne aap",
  examples: ["15 meter wire Finolex", "Do MCB jod do", "Labour 500"],
  notUnderstood: "Samajh nahi aaya, ek baar phir boliye",
  again: "Phir se",
  notUnderstoodSub: "Site par shor jyada hai ya aawaz cut gayi thi. Thoda paas aakar saaf boliye.",
  tryLike: "Aise bol kar try kijiye (tap karein):",
  tipTitle: "Karigar madad",
  tipText: "Agar fan ya drill chal rahi hai toh mic ko paas laakar boliye, ya Likh Ke se likhiye.",
  offlineChip: "Offline mode (phone par save)",
  offlineTitle: "Internet nahi hai — bill save ho gaya, baad mein process hoga",
  offlineSub: "Aapka koi data loss nahi hoga.",
  tryAgain: "Phir try karein",
  offlineSafe: "Aap bolte ya likhte rahiye, bill phone mein surakshit save ho raha hai.",
  busy: "Thoda ruk ke boliye — server busy hai",
  keyNotSet: "Groq key set nahi hai",
  keyNotSetSub:
    "Bill banane ke liye server par GROQ_API_KEY chahiye. .env mein key daaliye (README dekhein), phir dobara try karein.",
};

const T: Record<UiLangId, typeof HINGLISH> = {
  hinglish: HINGLISH,
  hindi: {
    micOff: "माइक बंद है — लिखकर भी बता सकते हैं",
    micOffSub: "फ़ोन की settings से माइक चालू कीजिए, या नीचे लिखिए",
    micHowTo: 'ब्राउज़र आइकन टैप करें → Site settings → Microphone → "Allow"।',
    fixIt: "ठीक करें",
    textModeOn: "टेक्स्ट मोड चालू है",
    typeAria: "लिखकर बताइए",
    typeTitle: "अपना काम लिखकर बताइए",
    typeSub: "रेट कार्ड से रेट और टोटल अपने आप",
    examples: ["15 मीटर Finolex वायर", "दो MCB जोड़ दो", "लेबर 500"],
    notUnderstood: "समझ नहीं आया, एक बार फिर बोलिए",
    again: "फिर से",
    notUnderstoodSub: "साइट पर शोर ज़्यादा है या आवाज़ कट गई थी। थोड़ा पास आकर साफ़ बोलिए।",
    tryLike: "ऐसे बोलकर देखिए (टैप करें):",
    tipTitle: "कारीगर मदद",
    tipText: "अगर पंखा या ड्रिल चल रही है तो माइक को पास लाकर बोलिए, या “लिख के” से लिखिए।",
    offlineChip: "ऑफ़लाइन मोड (फ़ोन पर सेव)",
    offlineTitle: "इंटरनेट नहीं है — बिल सेव हो गया, बाद में बनेगा",
    offlineSub: "आपका कोई डेटा नहीं खोएगा।",
    tryAgain: "फिर कोशिश करें",
    offlineSafe: "आप बोलते या लिखते रहिए, बिल फ़ोन में सुरक्षित सेव हो रहा है।",
    busy: "थोड़ा रुककर बोलिए — सर्वर बिज़ी है",
    keyNotSet: "Groq की key सेट नहीं है",
    keyNotSetSub:
      "बिल बनाने के लिए सर्वर पर GROQ_API_KEY चाहिए। .env में key डालिए (README देखें), फिर दोबारा कोशिश कीजिए।",
  },
  english: {
    micOff: "Mic is off — you can type instead",
    micOffSub: "Allow the mic in phone settings, or type below",
    micHowTo: 'Tap the browser icon → Site settings → Microphone → "Allow".',
    fixIt: "Fix it",
    textModeOn: "Text mode is on",
    typeAria: "Type it",
    typeTitle: "Type your work here",
    typeSub: "Rates and total come from your rate card",
    examples: ["15 metres Finolex wire", "Add two MCBs", "Labour 500"],
    notUnderstood: "Didn't catch that, please say it again",
    again: "Again",
    notUnderstoodSub:
      "It may be too noisy, or the sound cut out. Come a little closer and speak clearly.",
    tryLike: "Try saying it like this (tap):",
    tipTitle: "Worker tip",
    tipText: "If a fan or drill is running, hold the mic closer, or use Type.",
    offlineChip: "Offline mode (saved on phone)",
    offlineTitle: "No internet — bill saved, it will be processed later",
    offlineSub: "You won't lose any data.",
    tryAgain: "Try again",
    offlineSafe: "Keep speaking or typing; the bill is saved safely on your phone.",
    busy: "Wait a moment and speak again — the server is busy",
    keyNotSet: "Groq key not set",
    keyNotSetSub:
      "Building a bill needs GROQ_API_KEY on the server. Add the key to .env (see the README), then try again.",
  },
};

/**
 * S10 banners. Each sits ABOVE the current bill (the bill stays visible underneath).
 * Fix F3: no "Wispr Flow Active". Fix F9: no dB number.
 */

/** S10a: Mic band hai (kaambill_mic_blocked_fallback): banner + "Text mode chalu hai" strip. */
export function MicBlockedBanner({ onRetry }: { onRetry?: () => void }) {
  const t = useT(T);
  return (
    <>
      <div
        role="alert"
        className="flex flex-col gap-3 rounded-2xl bg-error-container/70 p-4 text-on-error-container shadow-sm"
      >
        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error text-on-error">
            <Icon name="mic_off" className="text-[22px]" />
          </span>
          <div className="flex flex-col">
            <span className="font-title-lg text-title-lg leading-tight text-error">{t.micOff}</span>
            <span className="mt-0.5 font-body-md text-body-md text-on-surface">{t.micOffSub}</span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2">
          <p className="flex items-start gap-1.5 font-caption text-caption text-on-surface-variant">
            <Icon name="info" className="text-[16px]" /> {t.micHowTo}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-xl bg-surface-container-lowest px-3 font-label-md text-label-md text-error shadow-sm active:scale-95"
            >
              <Icon name="settings" className="text-[18px]" /> {t.fixIt}
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface-container px-4 py-3">
        <span className="flex items-center gap-2 font-label-lg text-label-lg text-on-surface">
          <span className="h-2.5 w-2.5 rounded-full bg-secondary" /> {t.textModeOn}
        </span>
      </div>
    </>
  );
}

/** S10a big card: "Aapka kaam likh kar bataayein" with the text box (passed in) and quick-add chips. */
export function TypeInsteadCard({ children }: { children: ReactNode }) {
  const t = useT(T);
  return (
    <section
      aria-label={t.typeAria}
      className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-headline-md text-headline-md leading-tight text-primary-container">
          <Icon name="edit_note" /> {t.typeTitle}
        </span>
      </div>
      <div className="rounded-2xl border-2 border-primary-container p-2">{children}</div>
      <p className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant">
        <Icon name="auto_awesome" className="text-[16px] text-primary-container" /> {t.typeSub}
      </p>
    </section>
  );
}

/** S10c: Samajh nahi aaya (kaambill_error_samajh_nahi_aaya). */
export function NotUnderstoodBanner({
  onRetry,
  onExample,
}: {
  onRetry: () => void;
  onExample: (t: string) => void;
}) {
  const t = useT(T);
  const examples = t.examples;
  return (
    <>
      <div
        role="alert"
        className="flex flex-col gap-2 rounded-2xl bg-error-container/60 p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-error text-on-error">
              <Icon name="record_voice_over" className="text-[20px]" />
            </span>
            <span className="font-headline-md text-headline-md leading-tight text-error">
              {t.notUnderstood}
            </span>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="flex min-h-[48px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-error px-4 font-label-lg text-label-lg text-on-error shadow-sm active:scale-95"
          >
            <Icon name="replay" /> {t.again}
          </button>
        </div>
        <p className="pl-11 font-body-md text-body-md text-on-surface">{t.notUnderstoodSub}</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface">
          <Icon name="lightbulb" className="text-[18px]" /> {t.tryLike}
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {examples.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onExample(e)}
              className="flex min-h-[48px] shrink-0 items-center gap-1.5 rounded-full bg-surface-container-lowest px-4 font-label-lg text-label-lg text-on-surface shadow-sm active:scale-95"
            >
              <Icon name="record_voice_over" className="text-[18px] text-primary-container" /> “{e}”
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/** S10c tip card (Stitch "Karigar madad"). */
export function NoiseTip() {
  const t = useT(T);
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-surface-container p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest text-secondary">
        <Icon name="tips_and_updates" className="text-[20px]" />
      </span>
      <div className="flex flex-col">
        <span className="font-label-lg text-label-lg text-on-surface">{t.tipTitle}</span>
        <span className="font-body-md text-body-md text-on-surface-variant">{t.tipText}</span>
      </div>
    </div>
  );
}

/** S10b: Offline (kaambill_offline_queue_mode). */
export function OfflineBanner({ onRetry }: { onRetry: () => void }) {
  const t = useT(T);
  return (
    <>
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl bg-surface-container p-4 shadow-sm"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-on-surface">
          <Icon name="cloud_off" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-0.5 font-caption text-caption text-on-surface-variant">
            <span className="h-1.5 w-1.5 rounded-full bg-outline" /> {t.offlineChip}
          </span>
          <span className="font-title-lg text-title-lg leading-snug text-on-surface">
            {t.offlineTitle}
          </span>
          <span className="font-body-md text-body-md text-on-surface-variant">{t.offlineSub}</span>
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 flex min-h-[48px] w-fit items-center gap-1.5 rounded-xl bg-surface-container-lowest px-4 font-label-md text-label-md text-on-surface shadow-sm active:scale-95"
          >
            <Icon name="refresh" className="text-[18px]" /> {t.tryAgain}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-tertiary-fixed px-3 py-2.5 text-on-tertiary-fixed">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-tertiary text-on-tertiary">
          <Icon name="verified_user" className="text-[18px]" />
        </span>
        <span className="font-label-md text-label-md">{t.offlineSafe}</span>
      </div>
    </>
  );
}

/** Groq free-tier quota hit (architecture.md §13.4). */
export function RateLimitedBanner({ onRetry }: { onRetry: () => void }) {
  const t = useT(T);
  return (
    <div
      role="status"
      className="rounded-2xl border border-amber bg-amber-tint p-4 text-amber-text"
    >
      <div className="font-label-lg text-label-lg">{t.busy}</div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 min-h-[48px] rounded-xl bg-white px-4 font-label-md text-label-md"
      >
        {t.tryAgain}
      </button>
    </div>
  );
}

/** The server has no GROQ_API_KEY: the app runs, but it can't turn words into a bill until one is set. */
export function KeyNotSetBanner({ onRetry }: { onRetry: () => void }) {
  const t = useT(T);
  return (
    <div
      role="status"
      data-testid="key-not-set"
      className="rounded-2xl border border-amber bg-amber-tint p-4 text-amber-text"
    >
      <div className="flex items-center gap-2 font-label-lg text-label-lg">
        <Icon name="key" className="text-[20px]" /> {t.keyNotSet}
      </div>
      <p className="mt-1 font-body-md text-body-md">{t.keyNotSetSub}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 min-h-[48px] rounded-xl bg-white px-4 font-label-md text-label-md"
      >
        {t.tryAgain}
      </button>
    </div>
  );
}

/** On-screen confirmation of a side effect, e.g. "Verma ji ka bill paid mark ho gaya". */
export function NoticeCard({ text }: { text: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-xl bg-primary-fixed/60 px-4 py-3 font-label-lg text-label-lg text-on-primary-fixed shadow-sm"
    >
      <Icon
        name="check_circle"
        className="text-primary-container [font-variation-settings:'FILL'_1]"
      />{" "}
      {text}
    </div>
  );
}
