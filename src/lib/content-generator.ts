import { renderPoster } from "@/lib/media-renderer";
import { resolveSceneFrame } from "@/lib/scene-visual";
import {
  buildTitleLogline,
  getTitleAwareVideoBeats,
} from "@/lib/story-templates";
import {
  type AspectRatio,
  ASPECT_DIMENSIONS,
  type ImageContent,
  type Language,
  type VideoContent,
  type VideoScene,
} from "@/lib/types";

/** 同步构建故事线；画面由 enrichVideoScenesWithFrames 或合成接口生成 */
export function buildVideoContent(
  topic: string,
  language: Language,
  variant: number,
  aspectRatio: AspectRatio
): VideoContent {
  const beats = getTitleAwareVideoBeats(topic, language);
  const scenes: VideoScene[] = beats.map((beat, index) => {
    const action =
      language === "zh" ? `【${topic}】${beat.action}` : `[${topic}] ${beat.action}`;
    return {
      index: index + 1,
      heading: beat.heading,
      action,
      dialogue: beat.dialogue,
      frame: "",
    };
  });

  const dim = ASPECT_DIMENSIONS[aspectRatio];
  const logline = buildTitleLogline(topic, language);
  const voiceover =
    language === "zh"
      ? `旁白：这是《${topic}》的故事线——从困境到转折，再到逆袭结局。`
      : `Voiceover: The story arc of "${topic}"—from trap to turn to payoff.`;

  return {
    logline,
    scenes,
    voiceover,
    aspectRatio,
    width: dim.width,
    height: dim.height,
  };
}

/** 为每条场景生成写实分镜图（用于快速批量合成） */
export async function enrichVideoScenesWithFrames(
  topic: string,
  scenes: VideoScene[],
  language: Language,
  aspectRatio: AspectRatio,
  variant: number
): Promise<VideoScene[]> {
  return Promise.all(
    scenes.map(async (scene, index) => ({
      ...scene,
      frame: (
        await resolveSceneFrame({
          title: topic,
          sceneIndex: scene.index,
          heading: scene.heading,
          action: scene.action,
          dialogue: scene.dialogue,
          variant: variant + index,
          language,
          aspectRatio,
        })
      ).frame,
    }))
  );
}

export function buildImageContent(
  topic: string,
  language: Language,
  variant: number
): ImageContent {
  if (language === "zh") {
    const caption = `《${topic}》关键剧情拆解`;
    const body = [
      `第 ${variant + 1} 期 · 故事线`,
      ``,
      ...getTitleAwareVideoBeats(topic, language).map(
        (b, i) => `${i + 1}）${b.heading}：${b.action}`
      ),
    ].join("\n");
    const imagePrompt = `写实电影海报，主题「${topic}」，真实人物摄影，剧情张力，竖版 9:16，无文字`;
    return {
      caption,
      body,
      hashtags: ["#短剧", "#逆袭", `#${topic}`, "#写实风"],
      imagePrompt,
      poster: renderPoster(caption, body, `#${topic}`, variant),
    };
  }
  const caption = `Story arc: "${topic}"`;
  const body = [
    `Issue #${variant + 1}`,
    ``,
    ...getTitleAwareVideoBeats(topic, language).map(
      (b, i) => `${i + 1}) ${b.heading}: ${b.action}`
    ),
  ].join("\n");
  const imagePrompt = `Photorealistic movie poster, theme "${topic}", real humans, vertical 9:16`;
  return {
    caption,
    body,
    hashtags: ["#ShortDrama", `#${topic.replace(/\s+/g, "")}`],
    imagePrompt,
    poster: renderPoster(caption, body, `#${topic}`, variant),
  };
}
