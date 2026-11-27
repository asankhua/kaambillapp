import Groq from "groq-sdk";
import { getEnv, VOICE_PROVIDERS, type VoiceProvider } from "../../phase-0-setup/server/env.js";
import { guard, jsonResponse } from "../../phase-3-understanding/server/handler.js";
import { retryAfterSeconds } from "../../phase-3-understanding/server/structured.js";
import { SarvamError, transcribeSarvam } from "./sarvam.js";
import { MAX_AUDIO_BYTES, transcribe, WHISPER_LANGS, type WhisperLang } from "./whisper.js";

/**
 * POST /api/stt (multipart: audio, lang, hints, provider?): cloud speech-to-text (Phase 8).
 * Backend = the `provider` field ("groq" | "sarvam") if sent, else VOICE_PROVIDER (default groq).
 * Used by the groq-whisper and sarvam mic engines and by the Whisper second pass.
 * Same protection as /api/extract; max ~30 s of audio.
 * Audio is not stored (architecture.md §8).
 */
let client: Groq | undefined;

export async function POST(request: Request): Promise<Response> {
  const env = getEnv();
  const g = await guard(request, env);
  if ("reject" in g) return g.reject;
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse({ error: "invalid_form" }, 400, g.origin);
  }
  const audio = form.get("audio");
  const lang = String(form.get("lang") ?? "hi-IN") as WhisperLang;
  const hints = String(form.get("hints") ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  if (!(audio instanceof Blob) || audio.size === 0)
    return jsonResponse({ error: "no_audio" }, 400, g.origin);
  if (audio.size > MAX_AUDIO_BYTES) return jsonResponse({ error: "audio_too_long" }, 413, g.origin);
  if (!(lang in WHISPER_LANGS)) return jsonResponse({ error: "unsupported_lang" }, 400, g.origin);
  const requested = String(form.get("provider") ?? "");
  if (requested && !(VOICE_PROVIDERS as readonly string[]).includes(requested))
    return jsonResponse({ error: "unsupported_provider" }, 400, g.origin);
  const provider = (requested || env.VOICE_PROVIDER) as VoiceProvider;
  if (provider === "sarvam" && !env.SARVAM_API_KEY)
    return jsonResponse({ error: "provider_not_configured" }, 503, g.origin);

  client ??= new Groq({ apiKey: env.GROQ_API_KEY, maxRetries: 1, timeout: 15_000 });
  const started = Date.now();
  try {
    const r =
      provider === "sarvam"
        ? await transcribeSarvam(audio, {
            apiKey: env.SARVAM_API_KEY!,
            model: env.SARVAM_STT_MODEL,
            mode: env.SARVAM_STT_MODE,
            lang,
            hints,
            timeoutMs: 15_000,
          })
        : await transcribe(client, audio, {
            model: env.GROQ_STT_MODEL,
            lang,
            hints,
            timeoutMs: 15_000,
          });
    console.log(
      JSON.stringify({
        evt: "stt",
        provider,
        ms: Date.now() - started,
        bytes: audio.size,
        lang,
        noSpeech: r.noSpeech,
      }),
    );
    return jsonResponse(
      { text: r.text, confidence: r.confidence ?? null, noSpeech: r.noSpeech },
      200,
      g.origin,
    );
  } catch (err) {
    console.error(
      JSON.stringify({
        evt: "stt_error",
        provider,
        error: err instanceof Error ? err.name : "unknown",
      }),
    );
    if (err instanceof SarvamError && err.status === 429)
      return jsonResponse({ error: "llm_rate_limited", retryAfter: 5 }, 429, g.origin);
    const retryAfter = retryAfterSeconds(err);
    if (retryAfter !== null)
      return jsonResponse({ error: "llm_rate_limited", retryAfter }, 429, g.origin);
    return jsonResponse({ error: "upstream_unavailable" }, 502, g.origin);
  }
}
