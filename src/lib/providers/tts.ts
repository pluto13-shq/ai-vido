/**
 * TTS 适配层。
 *
 * 你选择了“其他” TTS 服务商：把具体接口文档给我后，在 synthesizeSpeech 里
 * 实现真实请求即可（返回音频 Buffer，wav/mp3 均可）。
 *
 * 现在的行为：未配置 TTS_PROVIDER 时返回 null（合成视频将不带配音），
 * 已配置但未实现时抛出可读错误，便于你定位。
 */
import type { Language } from "@/lib/types";

export interface TtsResult {
  audio: Buffer;
  format: "mp3" | "wav";
}

export function isTtsConfigured(): boolean {
  return Boolean(process.env.TTS_PROVIDER && process.env.TTS_API_KEY);
}

export async function synthesizeSpeech(
  text: string,
  language: Language
): Promise<TtsResult | null> {
  if (!isTtsConfigured()) {
    return null;
  }

  const provider = process.env.TTS_PROVIDER;

  // 占位：接入你的真实 TTS。例如 OpenAI 兼容：
  // const res = await fetch(`${process.env.TTS_BASE_URL}/v1/audio/speech`, {
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${process.env.TTS_API_KEY}`, "Content-Type": "application/json" },
  //   body: JSON.stringify({ model: process.env.TTS_MODEL, voice: process.env.TTS_VOICE, input: text }),
  // });
  // return { audio: Buffer.from(await res.arrayBuffer()), format: "mp3" };

  void text;
  void language;
  throw new Error(
    `TTS_PROVIDER=${provider} 已配置，但尚未在 src/lib/providers/tts.ts 实现真实调用。请提供该服务接口文档。`
  );
}
