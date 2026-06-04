import { isBalanceOrQuotaError, normalizeApiErrorMessage } from "@/lib/api-errors";

/** OpenAI 兼容网关（同一 API Key 可用于 TTS / 绘图） */

export function getOpenAIApiKey(): string {
  return (
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.TTS_API_KEY?.trim() ||
    process.env.IMAGE_API_KEY?.trim() ||
    ""
  );
}

export function getOpenAIBaseUrl(): string {
  const raw =
    process.env.OPENAI_BASE_URL?.trim() ||
    process.env.TTS_BASE_URL?.trim() ||
    process.env.IMAGE_BASE_URL?.trim() ||
    "https://api.openai.com";
  return raw.replace(/\/+$/, "");
}

export function isOpenAIConfigured(): boolean {
  return Boolean(getOpenAIApiKey());
}

function resolveApiPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = getOpenAIBaseUrl();
  // BASE_URL 已含 /v1 时，避免 /v1/v1/audio/speech 重复
  if (base.endsWith("/v1") && normalized.startsWith("/v1/")) {
    return normalized.slice(3);
  }
  return normalized;
}

export async function openaiFetch(
  path: string,
  init: RequestInit
): Promise<Response> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    throw new Error("未配置 OPENAI_API_KEY");
  }

  const url = `${getOpenAIBaseUrl()}${resolveApiPath(path)}`;
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...init, headers });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const raw = detail.slice(0, 300) || response.statusText;
    if (isBalanceOrQuotaError(raw)) {
      throw new Error(normalizeApiErrorMessage(raw));
    }
    throw new Error(`API 请求失败 ${response.status}：${raw}`);
  }

  return response;
}
