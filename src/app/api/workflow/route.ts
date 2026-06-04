import { NextResponse } from "next/server";
import { runNovelWorkflow, runNovelWorkflowStep } from "@/lib/novel-pipeline";
import type {
  AspectRatio,
  Language,
  NovelWorkflowInput,
  NovelWorkflowStepPayload,
  WorkflowStageId,
} from "@/lib/types";

export const maxDuration = 300;

function isLanguage(value: unknown): value is Language {
  return value === "zh" || value === "en";
}

function isAspectRatio(value: unknown): value is AspectRatio {
  return value === "9:16" || value === "16:9";
}

const STEP_IDS: WorkflowStageId[] = [
  "novel",
  "script",
  "characters",
  "storyboard",
  "video",
];

function isWorkflowStep(value: unknown): value is WorkflowStageId {
  return typeof value === "string" && STEP_IDS.includes(value as WorkflowStageId);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<
    NovelWorkflowInput & NovelWorkflowStepPayload
  >;

  const language = isLanguage(body.language) ? body.language : "zh";
  const aspectRatio = isAspectRatio(body.aspectRatio) ? body.aspectRatio : "9:16";

  if (isWorkflowStep(body.step)) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ message: "请填写作品标题" }, { status: 400 });
    }

    const payload: NovelWorkflowStepPayload = {
      step: body.step,
      title,
      language,
      aspectRatio,
      composeVideo: body.composeVideo === true,
      generateSceneImages: body.generateSceneImages === true,
      novelText: typeof body.novelText === "string" ? body.novelText : undefined,
      synopsis: typeof body.synopsis === "string" ? body.synopsis : undefined,
      script: Array.isArray(body.script) ? body.script : undefined,
      characters: Array.isArray(body.characters) ? body.characters : undefined,
      storyboard: Array.isArray(body.storyboard) ? body.storyboard : undefined,
      stages: Array.isArray(body.stages) ? body.stages : undefined,
      workflowId: typeof body.workflowId === "string" ? body.workflowId : undefined,
      preferLocalTemplate: body.preferLocalTemplate === true,
    };

    try {
      const result = await runNovelWorkflowStep(payload);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json(
        { message: error instanceof Error ? error.message : "工作流执行失败" },
        { status: 500 }
      );
    }
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const novelText = typeof body.novelText === "string" ? body.novelText.trim() : "";

  if (!novelText && !title) {
    return NextResponse.json({ message: "请填写作品标题" }, { status: 400 });
  }

  const input: NovelWorkflowInput = {
    novelText: novelText || undefined,
    title: title || undefined,
    language,
    aspectRatio,
    composeVideo: body.composeVideo === true,
    generateSceneImages: body.generateSceneImages === true,
  };

  try {
    const result = await runNovelWorkflow(input);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "工作流执行失败" },
      { status: 500 }
    );
  }
}
