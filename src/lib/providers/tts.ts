import { isOpenAIConfigured, openaiFetch } from "@/lib/providers/openai-client";
import type { Language } from "@/lib/types";

export interface TtsResult {
  audio: Buffer;
  format: "mp3" | "wav";
}

const MAX_TTS_CHARS = 4096;

export function isTtsConfigured(): boolean {
  return isOpenAIConfigured();
}

export async function synthesizeSpeech(
  text: string,
  language: Language
): Promise<TtsResult | null> {
  if (!isTtsConfigured()) {
    return null;
  }

  const input = text.trim().slice(0, MAX_TTS_CHARS);
  if (!input) {
    return null;
  }

  const model = process.env.TTS_MODEL?.trim() || "tts-1";
  const voice = process.env.TTS_VOICE?.trim() || (language === "zh" ? "nova" : "alloy");

  const response = await openaiFetch("/v1/audio/speech", {
    method: "POST",
    body: JSON.stringify({
      model,
      voice,
      input,
      response_format: "mp3",
    }),
  });

  const audio = Buffer.from(await response.arrayBuffer());
  return { audio, format: "mp3" };
}
