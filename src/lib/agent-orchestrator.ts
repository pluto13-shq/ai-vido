import { buildImageContent, buildVideoContent } from "@/lib/content-generator";
import type { CreationJobInput, GeneratedAsset, JobResult } from "@/lib/types";

function randomAssetId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildTags(topic: string): string[] {
  return ["AI短剧", "自动化创作", "矩阵运营", topic].filter(Boolean);
}

async function generateOneAsset(
  input: CreationJobInput,
  index: number
): Promise<GeneratedAsset> {
  const useVideo =
    input.mode === "video" || (input.mode === "mixed" && index % 2 === 0);
  const mode = useVideo ? "video" : "image";
  const titlePrefix =
    input.language === "zh"
      ? useVideo
        ? "AI小短剧"
        : "图文爆款"
      : useVideo
        ? "AI Short Drama"
        : "Image Post";
  const title = `${titlePrefix} #${index + 1} | ${input.topic}`;

  try {
    await new Promise((resolve) => setTimeout(resolve, 60));

    return {
      assetId: randomAssetId(mode),
      mode,
      title,
      language: input.language,
      tags: buildTags(input.topic),
      status: "success",
      video: useVideo
        ? buildVideoContent(input.topic, input.language, index, input.aspectRatio)
        : undefined,
      image: useVideo
        ? undefined
        : buildImageContent(input.topic, input.language, index),
    };
  } catch (error) {
    return {
      assetId: randomAssetId(mode),
      mode,
      title,
      language: input.language,
      tags: buildTags(input.topic),
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "未知错误",
    };
  }
}

export async function runCreationJob(input: CreationJobInput): Promise<JobResult> {
  const normalizedCount = Math.max(1, Math.min(input.count, 20));
  const assets = await Promise.all(
    Array.from({ length: normalizedCount }, (_, index) =>
      generateOneAsset(input, index)
    )
  );

  return {
    jobId: `job_${Date.now()}`,
    input: { ...input, count: normalizedCount },
    generatedAt: new Date().toISOString(),
    assets,
  };
}
