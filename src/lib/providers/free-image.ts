/** 无 API 余额时的写实图备用（Pollinations 开放接口） */

function parseSize(size: string): { width: number; height: number } {
  const m = size.match(/^(\d+)x(\d+)$/);
  if (m) {
    return { width: Number(m[1]), height: Number(m[2]) };
  }
  return { width: 768, height: 1344 };
}

export async function generateFreeImageDataUri(
  prompt: string,
  size = "768x1344"
): Promise<string | null> {
  const { width, height } = parseSize(size);
  const shortPrompt = prompt.slice(0, 600);
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(shortPrompt)}` +
    `?width=${width}&height=${height}&nologo=true&enhance=true&model=flux`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "image/*" },
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const mime = response.headers.get("content-type")?.includes("jpeg")
      ? "image/jpeg"
      : "image/png";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}
