/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_STT_PROVIDER?: "webspeech" | "groq-whisper" | "whisper" | "sarvam";
  readonly VITE_STT_LANG?: string;
  readonly VITE_VAD_SILENCE_MS?: string;
  readonly VITE_CONF_HIGH?: string;
  readonly VITE_CONF_LOW?: string;
  readonly VITE_POSTHOG_KEY?: string;
  readonly VITE_POSTHOG_HOST?: string;
  readonly VITE_DEMO_MODE?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
