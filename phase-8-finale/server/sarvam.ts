import type { WhisperLang } from "./whisper.js";

/**
 * Sarvam AI speech-to-text (REST, clips under 30 s): https://docs.sarvam.ai (POST /speech-to-text).
 * Used when VOICE_PROVIDER=sarvam (or the client asks for provider=sarvam). Needs SARVAM_API_KEY.
 * Strong on Hindi, Hinglish and Indian-accented English. Sarvam returns no confidence score.
 */
export const SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text";

/** Same two app languages as the rest of the mic stack. */
export const SARVAM_LANGS: Record<WhisperLang, string> = { "hi-IN": "hi-IN", "en-IN": "en-IN" };

export interface SarvamOptions {
  apiKey: string;
  model: string;
  mode: string;
  lang: WhisperLang;
  hints: string[];
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}

/** Sarvam allows up to 50 key terms of at most 64 characters each. */
export function keyterms(hints: string[]): string[] {
  const seen = new Set<string>();
  for (const h of hints) {
    const t = h.trim().slice(0, 64);
    if (t) seen.add(t);
    if (seen.size === 50) break;
  }
  return [...seen];
}

/** Thrown for non-2xx replies; `status` lets the route map 429 to "rate limited". */
export class SarvamError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string,
  ) {
    super(`Sarvam STT failed (HTTP ${status}${code ? `, ${code}` : ""})`);
    this.name = "SarvamError";
  }
}

export async function transcribeSarvam(
  audio: Blob,
  opts: SarvamOptions,
): Promise<{ text: string; confidence?: undefined; noSpeech: boolean }> {
  const ext = /mp4|m4a/.test(audio.type)
    ? "m4a"
    : /ogg/.test(audio.type)
      ? "ogg"
      : /wav/.test(audio.type)
        ? "wav"
        : "webm";
  const form = new FormData();
  // Sarvam rejects MIME types with codec parameters ("audio/webm;codecs=opus" -> HTTP 400), which is
  // what MediaRecorder reports in Chrome and Edge. Send the bare type ("audio/webm").
  const mime = audio.type.split(";")[0]!.trim();
  form.append("file", new Blob([audio], { type: mime }), `turn.${ext}`);
  form.append("model", opts.model);
  form.append("mode", opts.mode);
  form.append("language_code", SARVAM_LANGS[opts.lang]);
  // keyterms bias spelling toward the rate card (Havells, Finolex, MCB, CPVC…); saaras:v4 only.
  const terms = opts.model === "saaras:v4" ? keyterms(opts.hints) : [];
  if (terms.length) form.append("keyterms", JSON.stringify(terms));

  const res = await (opts.fetchImpl ?? fetch)(SARVAM_STT_URL, {
    method: "POST",
    headers: { "api-subscription-key": opts.apiKey },
    body: form,
    signal: AbortSignal.timeout(opts.timeoutMs),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { code?: string } } | null;
    throw new SarvamError(res.status, body?.error?.code);
  }
  const data = (await res.json()) as { transcript?: string };
  const text = (data.transcript ?? "").trim();
  return { text, noSpeech: text === "" };
}
