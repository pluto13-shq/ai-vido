import { NextResponse } from "next/server";
import { runCreationJob } from "@/lib/agent-orchestrator";
import type {
  AspectRatio,
  ContentMode,
  CreationJobInput,
  Language,
} from "@/lib/types";

function isContentMode(value: unknown): value is ContentMode {
  return value === "video" || value === "image" || value === "mixed";
}

function isLanguage(value: unknown): value is Language {
  return value === "zh" || value === "en";
}

function isAspectRatio(value: unknown): value is AspectRatio {
  return value === "9:16" || value === "16:9";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<CreationJobInput>;

  if (!body.topic || typeof body.topic !== "string") {
    return NextResponse.json({ message: "选题关键词不能为空" }, { status: 400 });
  }

  const input: CreationJobInput = {
    topic: body.topic.trim(),
    mode: isContentMode(body.mode) ? body.mode : "mixed",
    count: typeof body.count === "number" ? body.count : 3,
    language: isLanguage(body.language) ? body.language : "zh",
    aspectRatio: isAspectRatio(body.aspectRatio) ? body.aspectRatio : "9:16",
  };

  const result = await runCreationJob(input);
  return NextResponse.json(result, { status: 200 });
}
