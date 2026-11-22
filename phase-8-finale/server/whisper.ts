import type Groq from "groq-sdk";
import { toFile } from "groq-sdk";

/**
 * Groq-hosted Whisper (architecture.md §5.1, §5.1.3). Same GROQ_API_KEY.
 * Confidence = mean exp(avg_logprob) over segments; high no_speech_prob → empty.
 */
export type AudioClient = Pick<Groq, "audio">;

export const WHISPER_LANGS = { "hi-IN": "hi", "en-IN": "en" } as const;
export type WhisperLang = keyof typeof WHISPER_LANGS;
export const MAX_AUDIO_BYTES = 4 * 1024 * 1024; // ~30 s of compressed speech

interface Segment {
  avg_logprob?: number;
  no_speech_prob?: number;
}

export function confidenceFromSegments(segments: Segment[] | undefined): number | undefined {
  if (!segments?.length) return undefined;
  const probs = segments.map((s) => Math.exp(Math.min(0, s.avg_logprob ?? -1)));
  return Math.round((probs.reduce((a, b) => a + b, 0) / probs.length) * 100) / 100;
}

export async function transcribe(
  client: AudioClient,
  audio: Blob,
  opts: { model: string; lang: WhisperLang; hints: string[]; timeoutMs: number },
): Promise<{ text: string; confidence?: number; noSpeech: boolean }> {
  const ext = /mp4|m4a/.test(audio.type)
    ? "m4a"
    : /ogg/.test(audio.type)
      ? "ogg"
      : /wav/.test(audio.type)
        ? "wav"
        : "webm";
  const res = (await client.audio.transcriptions.create(
    {
      file: await toFile(audio, `turn.${ext}`, { type: audio.type || "audio/webm" }),
      model: opts.model,
      language: WHISPER_LANGS[opts.lang],
      // Whisper "prompt" biases spelling: rate-card brands/items (Havells, Finolex, MCB, CPVC…)
      prompt: opts.hints.slice(0, 40).join(", ").slice(0, 600) || undefined,
      response_format: "verbose_json",
      temperature: 0,
    },
    { timeout: opts.timeoutMs },
  )) as unknown as { text: string; segments?: Segment[] };
  const segs = res.segments ?? [];
  const noSpeech =
    !res.text.trim() || (segs.length > 0 && segs.every((s) => (s.no_speech_prob ?? 0) > 0.6));
  return {
    text: noSpeech ? "" : res.text.trim(),
    confidence: confidenceFromSegments(segs),
    noSpeech,
  };
}
