import {
  renderCharacterPortrait,
  renderStoryboardFrame,
} from "@/lib/media-renderer";
import { composeFromStoryboard } from "@/lib/video-compose";
import type {
  AspectRatio,
  Language,
  NovelCharacter,
  NovelWorkflowInput,
  NovelWorkflowResult,
  NovelWorkflowStepPayload,
  ScriptBeat,
  StoryboardShot,
  WorkflowStage,
  WorkflowStageId,
} from "@/lib/types";

const MAX_SCENES = 12;
const CAMERAS_ZH = ["远景", "全景", "中景", "近景", "特写"];
const CAMERAS_EN = ["Wide", "Full", "Medium", "Close", "ECU"];
const ACTS_ZH = ["第一幕 · 起", "第二幕 · 承", "第三幕 · 转", "第四幕 · 合"];
const ACTS_EN = ["Act I · Setup", "Act II · Rising", "Act III · Turn", "Act IV · Payoff"];

function stageLabel(id: WorkflowStageId, language: Language): string {
  const map: Record<WorkflowStageId, Record<Language, string>> = {
    novel: { zh: "① 小说原文", en: "① Novel" },
    script: { zh: "② 剧本", en: "② Script" },
    characters: { zh: "③ 角色设定", en: "③ Characters" },
    storyboard: { zh: "④ 分镜脚本", en: "④ Storyboard" },
    video: { zh: "⑤ 视频片段", en: "⑤ Video" },
  };
  return map[id][language];
}

function initStages(language: Language): WorkflowStage[] {
  const ids: WorkflowStageId[] = [
    "novel",
    "script",
    "characters",
    "storyboard",
    "video",
  ];
  return ids.map((id) => ({
    id,
    label: stageLabel(id, language),
    status: "pending",
  }));
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function extractSpeakerBeforeDialogue(paragraph: string): string | undefined {
  const m = paragraph.match(
    /([\u4e00-\u9fa5A-Za-z·]{2,8})(?:说|道|问|答|喊|叫|叹|低声|轻声|冷笑|怒道)/
  );
  return m?.[1];
}

function extractDialogue(paragraph: string): string {
  const matches = paragraph.match(/「([^」]+)」|"([^"]+)"/g);
  if (!matches) return "";
  return matches
    .map((m) => m.replace(/^[「"]|[」"]$/g, ""))
    .join(" ");
}

function stripDialogue(paragraph: string): string {
  return paragraph
    .replace(/「[^」]+」/g, "")
    .replace(/"[^"]+"/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCharacterNames(text: string, language: Language): string[] {
  const names = new Set<string>();

  for (const m of text.matchAll(
    /([\u4e00-\u9fa5]{2,4})(?:说|道|问|答|喊|叫|叹|低声|轻声|冷笑|怒道)/g
  )) {
    if (m[1] && m[1].length >= 2) names.add(m[1]);
  }

  for (const m of text.matchAll(/([\u4e00-\u9fa5]{2,4})[:：]/g)) {
    if (m[1]) names.add(m[1]);
  }

  if (names.size === 0) {
    names.add(language === "zh" ? "主角" : "Hero");
  }

  return Array.from(names).slice(0, 6);
}

function inferRole(name: string, index: number, language: Language): string {
  if (index === 0) return language === "zh" ? "主角" : "Protagonist";
  if (index === 1) return language === "zh" ? "关键配角" : "Key supporting";
  return language === "zh" ? "配角" : "Supporting";
}

function defaultAppearance(name: string, role: string, language: Language): string {
  if (language === "zh") {
    return `${name}，${role}。都市短剧造型，现代休闲装，表情有层次，适合竖屏特写。`;
  }
  return `${name}, ${role}. Urban short-drama look, modern casual outfit, expressive close-ups.`;
}

function defaultPersonality(name: string, language: Language): string {
  if (language === "zh") {
    return `${name}性格鲜明，有目标感与情绪张力，适合驱动短剧节奏。`;
  }
  return `${name} has clear goals and emotional tension that drive the short drama.`;
}

function pickAct(index: number, total: number, language: Language): string {
  const acts = language === "zh" ? ACTS_ZH : ACTS_EN;
  const ratio = index / Math.max(total - 1, 1);
  if (ratio < 0.25) return acts[0];
  if (ratio < 0.5) return acts[1];
  if (ratio < 0.75) return acts[2];
  return acts[3];
}

function inferTitle(text: string, language: Language): string {
  const first = splitParagraphs(text)[0] ?? "";
  const short = first.slice(0, 24);
  if (short.length >= 4) return short;
  return language === "zh" ? "小说改编短剧" : "Novel Adaptation";
}

export function generateNovelFromTitle(title: string, language: Language): string {
  const t = title.trim();
  if (language === "zh") {
    return [
      `《${t}》的故事，从一个看似普通的夜晚开始。`,
      `主角站在人生的十字路口，望着窗外城市的灯火，心里只有一个念头：不能再这样下去了。`,
      `「如果《${t}》只是传说，那我偏要把它写成现实。」他握紧手机，打开了那款被称为「AI内容工厂」的工具。`,
      `第一周，数据平平；第二周，有一条内容突然爆了；第三周，账号矩阵同时起量。`,
      `曾经质疑他的人开始私信求方法，而他已经明白：缺的从来不是努力，而是一套能复制的系统。`,
      `演讲台上，灯光落下。台下掌声雷动——《${t}》，终于从标题变成了被看见的故事。`,
    ].join("\n\n");
  }
  return [
    `The story of "${t}" begins on an ordinary night that does not feel ordinary at all.`,
    `The protagonist stands at a crossroads, city lights outside the window, one thought in mind: this cannot go on.`,
    `"If «${t}» is only a title, I will make it real." They open a tool called the AI Content Factory.`,
    `Week one is quiet. Week two, one piece breaks out. Week three, the whole matrix starts moving.`,
    `Skeptics turn into DMs asking for the playbook. The truth is clear: effort was never the bottleneck—the system was.`,
    `On stage, under the lights, applause rolls in. "${t}" is no longer just a title. It is a story people can see.`,
  ].join("\n\n");
}

function buildSynopsis(paragraphs: string[], language: Language): string {
  const joined = paragraphs.slice(0, 3).join(" ");
  const trimmed = joined.slice(0, 120);
  if (language === "zh") {
    return trimmed || "一段待改编的小说故事。";
  }
  return trimmed || "A novel story ready for adaptation.";
}

function novelToScript(
  paragraphs: string[],
  language: Language
): ScriptBeat[] {
  const chunks =
    paragraphs.length > MAX_SCENES
      ? paragraphs.slice(0, MAX_SCENES)
      : paragraphs;

  return chunks.map((paragraph, index) => {
    const speaker = extractSpeakerBeforeDialogue(paragraph);
    const dialogue = extractDialogue(paragraph);
    const narration = stripDialogue(paragraph) || paragraph;
    return {
      index: index + 1,
      act: pickAct(index, chunks.length, language),
      narration,
      dialogue,
      speaker,
    };
  });
}

function buildCharacters(
  names: string[],
  script: ScriptBeat[],
  language: Language
): NovelCharacter[] {
  return names.map((name, index) => {
    const role = inferRole(name, index, language);
    const sceneIds = script
      .filter(
        (beat) =>
          beat.speaker === name ||
          beat.narration.includes(name) ||
          beat.dialogue.includes(name)
      )
      .map((beat) => beat.index);

    const assignedScenes =
      sceneIds.length > 0 ? sceneIds : index === 0 ? script.map((b) => b.index) : [];

    return {
      id: `char_${index + 1}`,
      name,
      role,
      appearance: defaultAppearance(name, role, language),
      personality: defaultPersonality(name, language),
      sceneIds: assignedScenes,
      portrait: renderCharacterPortrait(
        name,
        role,
        defaultAppearance(name, role, language),
        index
      ),
    };
  });
}

function resolveCharactersForBeat(
  beat: ScriptBeat,
  characters: NovelCharacter[]
): NovelCharacter[] {
  if (beat.speaker) {
    const speaker = characters.find((c) => c.name === beat.speaker);
    if (speaker) return [speaker];
  }
  const inText = characters.filter(
    (c) => beat.narration.includes(c.name) || beat.dialogue.includes(c.name)
  );
  if (inText.length > 0) return inText;
  return characters.slice(0, 1);
}

function scriptToStoryboard(
  script: ScriptBeat[],
  characters: NovelCharacter[],
  language: Language,
  aspectRatio: AspectRatio
): StoryboardShot[] {
  const preview =
    aspectRatio === "9:16"
      ? { width: 360, height: 640 }
      : { width: 640, height: 360 };
  const cameras = language === "zh" ? CAMERAS_ZH : CAMERAS_EN;

  return script.map((beat, index) => {
    const cast = resolveCharactersForBeat(beat, characters);
    const camera = cameras[index % cameras.length];
    const heading =
      language === "zh"
        ? `${beat.act} · 场景 ${beat.index}`
        : `${beat.act} · Scene ${beat.index}`;
    const action = beat.narration;
    const dialogue = beat.dialogue
      ? beat.speaker
        ? `${beat.speaker}：${beat.dialogue}`
        : beat.dialogue
      : language === "zh"
        ? "（无对白，旁白推进）"
        : "(No dialogue, narration only)";

    return {
      index: beat.index,
      scriptBeatIndex: beat.index,
      characterIds: cast.map((c) => c.id),
      characterNames: cast.map((c) => c.name),
      heading,
      action,
      dialogue,
      camera,
      durationSec: beat.dialogue ? 4 : 3,
      frame: renderStoryboardFrame({
        width: preview.width,
        height: preview.height,
        sceneIndex: beat.index,
        heading,
        action,
        dialogue,
        variant: index,
        language,
        camera,
        characterNames: cast.map((c) => c.name),
      }),
    };
  });
}

export async function runNovelWorkflowStep(
  payload: NovelWorkflowStepPayload
): Promise<NovelWorkflowResult> {
  const stages =
    payload.stages?.map((s) => ({ ...s })) ?? initStages(payload.language);
  const setStage = (
    id: WorkflowStageId,
    status: WorkflowStage["status"],
    message?: string
  ) => {
    const stage = stages.find((s) => s.id === id);
    if (stage) {
      stage.status = status;
      stage.message = message;
    }
  };

  const title = payload.title.trim();
  if (!title) {
    throw new Error("作品标题不能为空");
  }

  let novelText = payload.novelText?.trim() ?? "";
  let synopsis = payload.synopsis ?? "";
  let script = payload.script ?? [];
  let characters = payload.characters ?? [];
  let storyboard = payload.storyboard ?? [];
  let video: NovelWorkflowResult["video"];

  switch (payload.step) {
    case "novel": {
      setStage("novel", "running");
      novelText = generateNovelFromTitle(title, payload.language);
      const paragraphs = splitParagraphs(novelText);
      synopsis = buildSynopsis(paragraphs, payload.language);
      setStage("novel", "done", `已根据标题生成 ${paragraphs.length} 段正文`);
      break;
    }
    case "script": {
      if (!novelText) {
        throw new Error("请先生成小说正文");
      }
      setStage("novel", "done", "正文已就绪");
      setStage("script", "running");
      const paragraphs = splitParagraphs(novelText);
      synopsis = buildSynopsis(paragraphs, payload.language);
      script = novelToScript(paragraphs, payload.language);
      setStage("script", "done", `已生成 ${script.length} 场剧本`);
      break;
    }
    case "characters": {
      if (!novelText || script.length === 0) {
        throw new Error("请先生成剧本");
      }
      setStage("novel", "done");
      setStage("script", "done");
      setStage("characters", "running");
      const names = extractCharacterNames(novelText, payload.language);
      characters = buildCharacters(names, script, payload.language);
      setStage("characters", "done", `已提取 ${characters.length} 个角色`);
      break;
    }
    case "storyboard": {
      if (script.length === 0 || characters.length === 0) {
        throw new Error("请先生成角色设定");
      }
      setStage("novel", "done");
      setStage("script", "done");
      setStage("characters", "done");
      setStage("storyboard", "running");
      storyboard = scriptToStoryboard(
        script,
        characters,
        payload.language,
        payload.aspectRatio
      );
      setStage("storyboard", "done", `已生成 ${storyboard.length} 个分镜`);
      break;
    }
    case "video": {
      if (storyboard.length === 0) {
        throw new Error("请先生成分镜");
      }
      setStage("novel", "done");
      setStage("script", "done");
      setStage("characters", "done");
      setStage("storyboard", "done");
      if (payload.composeVideo === false) {
        setStage("video", "pending", "未请求合成");
        break;
      }
      setStage("video", "running");
      try {
        const composed = await composeFromStoryboard(
          storyboard,
          synopsis || title,
          payload.language,
          payload.aspectRatio
        );
        video = {
          videoUrl: composed.url,
          width: composed.width,
          height: composed.height,
          durationSec: composed.durationSec,
          hasNarration: composed.hasNarration,
          hasBgm: composed.hasBgm,
        };
        setStage("video", "done", `已合成 mp4 · ${composed.durationSec}s`);
      } catch (error) {
        setStage(
          "video",
          "failed",
          error instanceof Error ? error.message : "视频合成失败"
        );
      }
      break;
    }
    default:
      throw new Error("未知工作流步骤");
  }

  if (!synopsis && novelText) {
    synopsis = buildSynopsis(splitParagraphs(novelText), payload.language);
  }

  return {
    workflowId: payload.workflowId ?? `wf_${Date.now()}`,
    input: {
      title,
      novelText,
      language: payload.language,
      aspectRatio: payload.aspectRatio,
      composeVideo: payload.composeVideo,
    },
    stages,
    title,
    synopsis,
    script,
    characters,
    storyboard,
    video,
    generatedAt: new Date().toISOString(),
  };
}

export async function runNovelWorkflow(
  input: NovelWorkflowInput
): Promise<NovelWorkflowResult> {
  const stages = initStages(input.language);
  const setStage = (
    id: WorkflowStageId,
    status: WorkflowStage["status"],
    message?: string
  ) => {
    const stage = stages.find((s) => s.id === id);
    if (stage) {
      stage.status = status;
      stage.message = message;
    }
  };

  const title = input.title?.trim();
  const novelText =
    input.novelText?.trim() ||
    (title ? generateNovelFromTitle(title, input.language) : "");
  const paragraphs = splitParagraphs(novelText);
  if (paragraphs.length === 0) {
    throw new Error("请提供作品标题或小说正文");
  }

  setStage("novel", "done", `已读取 ${paragraphs.length} 段原文`);

  setStage("script", "running");
  const resolvedTitle = title || inferTitle(novelText, input.language);
  const synopsis = buildSynopsis(paragraphs, input.language);
  const script = novelToScript(paragraphs, input.language);
  setStage("script", "done", `已生成 ${script.length} 场剧本`);

  setStage("characters", "running");
  const names = extractCharacterNames(novelText, input.language);
  const characters = buildCharacters(names, script, input.language);
  setStage("characters", "done", `已提取 ${characters.length} 个角色`);

  setStage("storyboard", "running");
  const storyboard = scriptToStoryboard(
    script,
    characters,
    input.language,
    input.aspectRatio
  );
  setStage("storyboard", "done", `已生成 ${storyboard.length} 个分镜`);

  let video: NovelWorkflowResult["video"];
  if (input.composeVideo !== false) {
    setStage("video", "running");
    try {
      const composed = await composeFromStoryboard(
        storyboard,
        synopsis,
        input.language,
        input.aspectRatio
      );
      video = {
        videoUrl: composed.url,
        width: composed.width,
        height: composed.height,
        durationSec: composed.durationSec,
        hasNarration: composed.hasNarration,
        hasBgm: composed.hasBgm,
      };
      setStage("video", "done", `已合成 mp4 · ${composed.durationSec}s`);
    } catch (error) {
      setStage(
        "video",
        "failed",
        error instanceof Error ? error.message : "视频合成失败"
      );
    }
  } else {
    setStage("video", "pending", "未请求合成，可在页面手动合成");
  }

  return {
    workflowId: `wf_${Date.now()}`,
    input: { ...input, novelText },
    stages,
    title: resolvedTitle,
    synopsis,
    script,
    characters,
    storyboard,
    video,
    generatedAt: new Date().toISOString(),
  };
}
