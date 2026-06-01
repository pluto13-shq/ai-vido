import { NextResponse } from "next/server";
import { composeVideo } from "@/lib/video-compose";
import type { AspectRatio, Language } from "@/lib/types";

function isLanguage(value: unknown): value is Language {
  return value === "zh" || value === "en";
}

function isAspectRatio(value: unknown): value is AspectRatio {
  return value === "9:16" || value === "16:9";
}

export const maxDuration = 120;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    topic?: unknown;
    language?: unknown;
    aspectRatio?: unknown;
    variant?: unknown;
  };

  if (typeof body.topic !== "string" || !body.topic.trim()) {
    return NextResponse.json({ message: "缺少主题" }, { status: 400 });
  }

  try {
    const result = await composeVideo({
      topic: body.topic.trim(),
      language: isLanguage(body.language) ? body.language : "zh",
      aspectRatio: isAspectRatio(body.aspectRatio) ? body.aspectRatio : "9:16",
      variant: typeof body.variant === "number" ? body.variant : 0,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "合成失败" },
      { status: 500 }
    );
  }
}
