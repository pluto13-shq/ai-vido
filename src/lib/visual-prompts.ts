import type { Language } from "@/lib/types";

export function buildRealisticPortraitPrompt(
  name: string,
  role: string,
  appearance: string,
  language: Language
): string {
  if (language === "zh") {
    return `写实摄影风格，中国都市短剧人物立绘，角色「${name}」，${role}，${appearance}，真实人脸与皮肤质感，电影级布光，浅景深，竖构图 9:16，无文字无水印，非动漫非插画`;
  }
  return `Photorealistic cinematic portrait, Chinese urban short drama, character ${name}, ${role}, ${appearance}, real human skin texture, film lighting, shallow depth of field, vertical 9:16, no text, not anime`;
}

export function buildRealisticScenePrompt(params: {
  title: string;
  heading: string;
  action: string;
  dialogue: string;
  characterNames: string[];
  camera: string;
  language: Language;
}): string {
  const cast =
    params.characterNames.length > 0
      ? params.characterNames.join("、")
      : params.language === "zh"
        ? "主角"
        : "protagonist";

  if (params.language === "zh") {
    return `写实电影剧照，竖屏短剧《${params.title}》，${params.heading}，${params.camera}，画面：${params.action}，出镜人物：${cast}，情绪与剧情连贯，真实人物摄影，自然光影，街道/室内实景感，禁止动漫卡通，禁止文字字幕，禁止渐变海报`;
  }

  return `Photorealistic cinematic still, vertical short drama "${params.title}", ${params.heading}, ${params.camera}, scene: ${params.action}, cast: ${cast}, coherent story mood, real human photography, natural light, no anime, no text overlay`;
}
