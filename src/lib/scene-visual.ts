import { renderStoryboardFrame, renderVideoFrame } from "@/lib/media-renderer";
import { generateImageDataUri } from "@/lib/providers/image";
import {
  ASPECT_PREVIEW,
  type AspectRatio,
  type Language,
} from "@/lib/types";
import { buildRealisticScenePrompt } from "@/lib/visual-prompts";

function allowSvgFallback(): boolean {
  return process.env.ENABLE_SVG_FALLBACK === "true";
}

export function buildSvgSceneFrame(params: {
  sceneIndex: number;
  heading: string;
  action: string;
  dialogue: string;
  variant: number;
  language: Language;
  aspectRatio: AspectRatio;
  camera?: string;
  characterNames?: string[];
}): string {
  const preview = ASPECT_PREVIEW[params.aspectRatio];
  if (params.camera && params.characterNames) {
    return renderStoryboardFrame({
      width: preview.width,
      height: preview.height,
      sceneIndex: params.sceneIndex,
      heading: params.heading,
      action: params.action,
      dialogue: params.dialogue,
      variant: params.variant,
      language: params.language,
      camera: params.camera,
      characterNames: params.characterNames,
    });
  }
  return renderVideoFrame(
    params.sceneIndex,
    params.heading,
    params.action,
    params.dialogue,
    params.variant,
    params.language,
    preview.width,
    preview.height
  );
}

/** 生成写实人物场景图（可选 API → 免费 FLUX 备用 → 可选 SVG） */
export async function resolveSceneFrame(params: {
  title: string;
  sceneIndex: number;
  heading: string;
  action: string;
  dialogue: string;
  variant: number;
  language: Language;
  aspectRatio: AspectRatio;
  camera?: string;
  characterNames?: string[];
  allowAi?: boolean;
}): Promise<{ frame: string; isPhotoreal: boolean }> {
  const fallback = buildSvgSceneFrame(params);

  if (params.allowAi === false) {
    return { frame: fallback, isPhotoreal: false };
  }

  const prompt = buildRealisticScenePrompt({
    title: params.title,
    heading: params.heading,
    action: params.action,
    dialogue: params.dialogue,
    characterNames: params.characterNames ?? [],
    camera: params.camera ?? (params.language === "zh" ? "中景" : "Medium"),
    language: params.language,
  });

  const uri = await generateImageDataUri(prompt);
  if (uri) {
    return { frame: uri, isPhotoreal: true };
  }

  if (allowSvgFallback()) {
    return { frame: fallback, isPhotoreal: false };
  }

  return { frame: fallback, isPhotoreal: false };
}
