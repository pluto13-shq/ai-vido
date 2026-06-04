import {
  getOpenAIApiKey,
  getOpenAIBaseUrl,
  isOpenAIConfigured,
} from "@/lib/providers/openai-client";
import {
  isBalanceOrQuotaError,
  normalizeApiErrorMessage,
} from "@/lib/api-errors";
import type { Language, ScriptBeat } from "@/lib/types";

export { isBalanceOrQuotaError } from "@/lib/api-errors";
export function isLlmConfigured(): boolean {
  return Boolean(process.env.LLM_API_KEY?.trim()) || isOpenAIConfigured();
}

function llmApiKey(): string {
  return process.env.LLM_API_KEY?.trim() || getOpenAIApiKey();
}

function llmBaseUrl(): string {
  if (process.env.LLM_BASE_URL?.trim()) {
    return process.env.LLM_BASE_URL.trim().replace(/\/+$/, "");
  }
  const base = getOpenAIBaseUrl();
  return base.endsWith("/v1") ? base : `${base}/v1`;
}

function llmModel(): string {
  return (
    process.env.LLM_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini"
  );
}

export async function chatCompletion(
  system: string,
  user: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const apiKey = llmApiKey();
  if (!apiKey) {
    throw new Error("未配置 LLM_API_KEY 或 OPENAI_API_KEY");
  }

  const url = `${llmBaseUrl()}/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: llmModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: options?.temperature ?? 0.85,
      max_tokens: options?.maxTokens ?? 4096,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
    message?: string;
    code?: number;
  };

  const apiMessage =
    typeof data.error?.message === "string"
      ? data.error.message
      : typeof data.message === "string"
        ? data.message
        : "";

  if (!response.ok) {
    throw new Error(
      normalizeApiErrorMessage(
        apiMessage || `LLM 请求失败 (${response.status})`
      )
    );
  }

  if (apiMessage && isBalanceOrQuotaError(apiMessage)) {
    throw new Error(normalizeApiErrorMessage(apiMessage));
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    if (apiMessage) {
      throw new Error(normalizeApiErrorMessage(apiMessage));
    }
    throw new Error("LLM 返回内容为空");
  }

  return content;
}

export async function generateNovelTextFromTitle(
  title: string,
  language: Language
): Promise<string> {
  const system =
    language === "zh"
      ? "你是资深网文作者，必须紧扣用户给出的标题创作，人物、职业、场景要与标题一致，禁止写成无关的 AI 创业或网红逆袭模板。输出纯正文，不要标题、不要 markdown、不要编号列表。"
      : "You are a novelist. The story must literally match the given title—characters, setting and plot aligned with the title. No generic AI-startup template. Plain prose only.";

  const user =
    language === "zh"
      ? `请根据作品标题《${title}》创作一篇短篇小说正文，要求：
- 6～8 个自然段，段与段之间用空行分隔
- 每段 2～4 句，有画面感与情绪起伏，人物姓名统一
- 可包含中文对白，对白用「」包裹
- 结构：起（困境）→ 承（转折）→ 转（成长）→ 合（升华）
- 剧情必须围绕标题含义展开（例如标题含「乞丐」则主角应为乞丐阶层）
- 只输出正文`
      : `Write a short story for the title "${title}":
- 6–8 paragraphs separated by blank lines
- 2–4 sentences per paragraph, vivid and emotional
- Clear arc: setup → turn → growth → payoff
- Output body text only`;

  return chatCompletion(system, user, { temperature: 0.9, maxTokens: 3000 });
}

export async function generateScriptFromNovel(
  title: string,
  novelText: string,
  language: Language
): Promise<ScriptBeat[]> {
  const system =
    language === "zh"
      ? "你是短剧编剧。根据小说正文输出 JSON 数组，每项含 act、narration、dialogue、speaker（可选）。act 用「第一幕·起」这类四幕结构。只输出 JSON，不要 markdown。"
      : "You are a short-drama scriptwriter. Output a JSON array with act, narration, dialogue, optional speaker. JSON only.";

  const user =
    language === "zh"
      ? `作品标题：《${title}》\n\n小说正文：\n${novelText}\n\n请改编为 4～8 场剧本，JSON 格式：[{"act":"第一幕·起","narration":"...","dialogue":"...","speaker":"..."}]`
      : `Title: "${title}"\n\nNovel:\n${novelText}\n\nAdapt to 4-8 script beats as JSON array.`;

  const raw = await chatCompletion(system, user, { temperature: 0.7, maxTokens: 3500 });
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("剧本 JSON 解析失败");
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    act?: string;
    narration?: string;
    dialogue?: string;
    speaker?: string;
  }[];

  return parsed.map((item, index) => ({
    index: index + 1,
    act: item.act ?? (language === "zh" ? `场景 ${index + 1}` : `Scene ${index + 1}`),
    narration: item.narration ?? "",
    dialogue: item.dialogue ?? "",
    speaker: item.speaker,
  }));
}
