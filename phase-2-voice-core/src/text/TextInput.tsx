import { useEffect, useRef, useState } from "react";
import { Icon } from "../../../phase-1-ui-ux-design/src/Icon";
import { useT } from "../ui/lang";

const T = {
  hinglish: {
    label: "Apna kaam likhiye",
    placeholder: "Likhein ya Wispr Flow se boliye...",
    send: "Bhejein",
    close: "Band karein",
    wisprHint: "Wispr Flow keyboard se bhi bol sakte hain",
  },
  hindi: {
    label: "अपना काम लिखिए",
    placeholder: "लिखें या Wispr Flow से बोलें...",
    send: "भेजें",
    close: "बंद करें",
    wisprHint: "Wispr Flow कीबोर्ड से भी बोल सकते हैं",
  },
  english: {
    label: "Write your work",
    placeholder: "Type or speak with Wispr Flow...",
    send: "Send",
    close: "Close",
    wisprHint: "Or dictate with the Wispr Flow keyboard",
  },
};

/**
 * "Likh Ke" text input (architecture.md §5.1.2). Typed text, or text dictated with the
 * Wispr Flow app (no key, no code), arrives here as Turn{source:"text"} and skips speech-to-text.
 */
export function TextInput({
  onSubmit,
  autoFocus = false,
  disabled = false,
  focusSignal = 0,
  wisprHint = false,
  onClose,
}: {
  onSubmit: (text: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  /** Bump to focus the box. */
  focusSignal?: number;
  /** Show a × that hides the box again. */
  onClose?: () => void;
  /** Show how to dictate with Wispr Flow (text box above the mic). The mic button can't start Flow itself. */
  wisprHint?: boolean;
}) {
  const tr = useT(T);
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (autoFocus || focusSignal > 0) ref.current?.focus();
  }, [autoFocus, focusSignal]);
  const submit = () => {
    const t = text.trim();
    if (!t || disabled) return;
    onSubmit(t);
    setText("");
  };
  return (
    <>
      {wisprHint && (
        <p
          className="mb-1 flex items-center gap-1 truncate font-caption text-caption font-semibold text-secondary"
          data-testid="wispr-hint"
        >
          <Icon name="keyboard_voice" className="shrink-0 text-[16px]" />
          <span className="truncate">{tr.wisprHint}</span>
        </p>
      )}
      <form
        className="flex w-full items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="sr-only" htmlFor="likhke">
          {tr.label}
        </label>
        <textarea
          id="likhke"
          ref={ref}
          rows={1}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={tr.placeholder}
          className="max-h-36 min-h-[52px] min-w-0 flex-1 resize-none rounded-2xl border-2 border-border-strong bg-white px-4 py-3 text-body-lg text-on-surface outline-none [field-sizing:content] focus:border-primary-container"
        />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={tr.close}
            title={tr.close}
            className="flex h-[52px] w-9 shrink-0 items-center justify-center rounded-xl text-on-surface-variant active:bg-surface-container"
          >
            <Icon name="close" className="text-[22px]" />
          </button>
        )}
        {/* Icon-only so the text box gets the width on a 360 px phone; the accessible name stays "Bhejein". */}
        <button
          type="submit"
          aria-label={tr.send}
          title={tr.send}
          disabled={disabled || !text.trim()}
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-primary-container text-on-primary disabled:opacity-40"
        >
          <Icon name="send" className="text-[24px]" />
        </button>
      </form>
    </>
  );
}
