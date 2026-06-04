import { isBalanceOrQuotaError } from "@/lib/api-errors";
import {
  isOpenAIConfigured,
  openaiFetch,
} from "@/lib/providers/openai-client";
import { generateFreeImageDataUri } from "@/lib/providers/free-image";

export function isImageConfigured(): boolean {
  return isOpenAIConfigured();
}

function imageSizeFromEnv(): string {
  const size = process.env.IMAGE_SIZE?.trim();
  if (size) return size;
  return "768x1344";
}

async function generatePaidImage(prompt: string): Promise<Buffer> {
  const model = process.env.IMAGE_MODEL?.trim() || "black-forest-labs/FLUX.1-schnell";
  const size = imageSizeFromEnv();

  const response = await openaiFetch("/v1/images/generations", {
    method: "POST",
    body: JSON.stringify({
      model,
      prompt: prompt.slice(0, 4000),
      n: 1,
      size,
      response_format: "b64_json",
    }),
  });

  const body = (await response.json()) as {
    data?: { b64_json?: string }[];
  };

  const b64 = body.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("图片 API 未返回图像数据");
  }

  return Buffer.from(b64, "base64");
}

/** 写实图：优先配置的绘图 API，失败则用免费 FLUX 备用 */
export async function generateImage(prompt: string): Promise<Buffer | null> {
  const size = imageSizeFromEnv();

  if (isImageConfigured()) {
    try {
      return await generatePaidImage(prompt);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (!isBalanceOrQuotaError(msg)) {
        /* 非余额问题也尝试免费备用 */
      }
    }
  }

  const freeUri = await generateFreeImageDataUri(prompt, size);
  if (!freeUri) return null;

  const b64 = freeUri.split(",")[1];
  return b64 ? Buffer.from(b64, "base64") : null;
}

export async function generateImageDataUri(prompt: string): Promise<string | null> {
  const buffer = await generateImage(prompt);
  if (!buffer) return null;
  return `data:image/png;base64,${buffer.toString("base64")}`;
}
