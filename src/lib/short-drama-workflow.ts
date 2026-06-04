import { buildRealisticScenePrompt } from "@/lib/visual-prompts";
import type {
  Language,
  NovelCharacter,
  NovelWorkflowResult,
  ScriptBeat,
  StoryboardShot,
} from "@/lib/types";

export type ExternalToolStageId =
  | "script"
  | "video"
  | "watermark"
  | "dubbing"
  | "subtitles"
  | "editing";

export interface ExternalToolStage {
  id: ExternalToolStageId;
  label: string;
  tools: string;
  linkedHint: string;
  purpose: string;
}

export const EXTERNAL_TOOL_STAGES: ExternalToolStage[] = [
  {
    id: "script",
    label: "脚本创作",
    tools: "ChatGPT / Claude / 文心一言",
    linkedHint: "可直接使用",
    purpose: "生成脚本、分镜脚本与角色设定",
  },
  {
    id: "video",
    label: "视频生成",
    tools: "可灵 / 即梦 / Sora / Seedance",
    linkedHint: "可复制英文提示词",
    purpose: "根据提示词生成视频片段",
  },
  {
    id: "watermark",
    label: "去水印去字幕",
    tools: "550W AI",
    linkedHint: "待后期处理",
    purpose: "去除 AI 视频水印与多余文字",
  },
  {
    id: "dubbing",
    label: "配音",
    tools: "剪映 AI 配音 / 讯飞 / 550W AI 配音",
    linkedHint: "可提取对白配音",
    purpose: "生成角色对白与旁白配音",
  },
  {
    id: "subtitles",
    label: "字幕",
    tools: "剪映 / CapCut",
    linkedHint: "用对白文本做字幕",
    purpose: "添加字幕与花字效果",
  },
  {
    id: "editing",
    label: "剪辑合成",
    tools: "剪映 / Premiere / DaVinci",
    linkedHint: "按镜头顺序剪辑",
    purpose: "镜头拼接、转场、调色与导出",
  },
];

export const PRODUCTION_SEQUENCE =
  "脚本创作 → 视频生成 → 去水印去字幕 → 配音 → 字幕 → 剪辑合成";

export function buildTwentyEpisodeOutline(title: string, language: Language): string {
  const episodes = Array.from({ length: 20 }, (_, i) => i + 1);
  if (language === "zh") {
    const acts = ["起", "承", "转", "合"];
    return episodes
      .map((ep) => {
        const act = acts[Math.min(Math.floor((ep - 1) / 5), 3)];
        return `第${ep}集【${act}】：《${title}》主线推进 — 第 ${ep} 个冲突/转折节点`;
      })
      .join("\n");
  }
  return episodes
    .map(
      (ep) =>
        `Ep ${ep}: "${title}" — beat ${ep} (setup / rising / turn / payoff arc)`
    )
    .join("\n");
}

export function buildShortDramaSettings(
  title: string,
  synopsis: string,
  characters: NovelCharacter[],
  language: Language
): string {
  const cast = characters
    .map(
      (c) =>
        `${c.name}（${c.role}）— ${c.appearance}；性格：${c.personality}`
    )
    .join("\n");

  if (language === "zh") {
    return `【短剧设定】《${title}》\n类型：都市励志竖屏短剧 · 9:16\n一句话：${synopsis}\n\n【主要角色】\n${cast || "（生成角色后自动填充）"}`;
  }

  return `[Series bible] "${title}"\nFormat: vertical urban short drama · 9:16\nLogline: ${synopsis}\n\n[Cast]\n${cast || "(filled after character step)"}`;
}

export function buildEnglishVideoPrompt(
  title: string,
  shot: StoryboardShot,
  language: Language
): string {
  return buildRealisticScenePrompt({
    title,
    heading: shot.heading,
    action: shot.action,
    dialogue: shot.dialogue,
    characterNames: shot.characterNames,
    camera: shot.camera,
    language: "en",
  });
}

function formatStoryboardScript(
  script: ScriptBeat[],
  storyboard: StoryboardShot[],
  language: Language
): string {
  const lines: string[] = [];
  for (const beat of script) {
    const shot = storyboard.find((s) => s.scriptBeatIndex === beat.index);
    const header =
      language === "zh"
        ? `【场景 ${beat.index}】${beat.act}`
        : `[Scene ${beat.index}] ${beat.act}`;
    lines.push(header);
    lines.push(language === "zh" ? `旁白：${beat.narration}` : `VO: ${beat.narration}`);
    if (beat.dialogue) {
      const who = beat.speaker ? `（${beat.speaker}）` : "";
      lines.push(
        language === "zh"
          ? `对白${who}：${beat.dialogue}`
          : `Dialogue${who}: ${beat.dialogue}`
      );
    }
    if (shot) {
      lines.push(language === "zh" ? `机位：${shot.camera}` : `Camera: ${shot.camera}`);
      lines.push(language === "zh" ? `画面：${shot.action}` : `Action: ${shot.action}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

function formatEnglishPrompts(
  title: string,
  storyboard: StoryboardShot[]
): string {
  return storyboard
    .map((shot) => {
      const prompt =
        shot.englishPrompt ?? buildEnglishVideoPrompt(title, shot, "en");
      return `Shot ${shot.index} · ${shot.camera}\n${prompt}`;
    })
    .join("\n\n");
}

function formatDialogueForDubbing(
  script: ScriptBeat[],
  language: Language
): string {
  return script
    .filter((b) => b.dialogue || b.narration)
    .map((b) => {
      const parts: string[] = [];
      if (b.narration) {
        parts.push(
          language === "zh"
            ? `[旁白] ${b.narration}`
            : `[Narrator] ${b.narration}`
        );
      }
      if (b.dialogue) {
        const who = b.speaker ?? (language === "zh" ? "角色" : "Character");
        parts.push(
          language === "zh"
            ? `[${who}] ${b.dialogue}`
            : `[${who}] ${b.dialogue}`
        );
      }
      return `场景 ${b.index}：\n${parts.join("\n")}`;
    })
    .join("\n\n");
}

function formatSubtitleText(
  script: ScriptBeat[],
  language: Language
): string {
  return script
    .map((b) => {
      const lines: string[] = [];
      if (b.narration) {
        lines.push(language === "zh" ? `【旁白】${b.narration}` : `[VO] ${b.narration}`);
      }
      if (b.dialogue) {
        const who = b.speaker ? `${b.speaker}：` : "";
        lines.push(
          language === "zh" ? `【对白】${who}${b.dialogue}` : `[DLG] ${who}${b.dialogue}`
        );
      }
      return lines.join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

function formatEditingChecklist(
  storyboard: StoryboardShot[],
  language: Language
): string {
  const shots = storyboard
    .map((s) =>
      language === "zh"
        ? `镜头 ${s.index}（${s.durationSec}s）— ${s.heading}`
        : `Shot ${s.index} (${s.durationSec}s) — ${s.heading}`
    )
    .join("\n");

  if (language === "zh") {
    return `【按镜头顺序剪辑】\n${shots || "（先生成分镜）"}\n\n【素材清单】\n- 视频片段：可灵/即梦/Sora/Seedance 导出\n- BGM：按情绪选曲\n- 字幕：见「字幕」环节文本\n- 配音：见「配音」环节导出`;
  }

  return `[Edit order]\n${shots || "(generate storyboard first)"}\n\n[Assets]\n- Clips from Kling/Jimeng/Sora/Seedance\n- BGM\n- Subtitles text from subtitles stage\n- VO from dubbing stage`;
}

export function buildStageDelivery(
  stageId: ExternalToolStageId,
  result: NovelWorkflowResult
): string {
  const { title, synopsis, script, characters, storyboard } = result;
  const language = result.input.language;
  const settings = buildShortDramaSettings(title, synopsis, characters, language);
  const outline = buildTwentyEpisodeOutline(title, language);
  const boardScript = formatStoryboardScript(script, storyboard, language);

  switch (stageId) {
    case "script":
      return `${settings}\n\n【20 集大纲】\n${outline}\n\n【单集分镜脚本】\n${boardScript}`;
    case "video":
      return formatEnglishPrompts(title, storyboard);
    case "watermark":
      return language === "zh"
        ? "【待后期处理】\n将可灵/即梦/Sora/Seedance 导出的镜头视频导入 550W AI，批量去水印与烧录字幕。"
        : "[Post] Import clips from video tools into 550W AI to remove watermarks/subtitles.";
    case "dubbing":
      return formatDialogueForDubbing(script, language);
    case "subtitles":
      return formatSubtitleText(script, language);
    case "editing":
      return formatEditingChecklist(storyboard, language);
    default:
      return "";
  }
}

export function buildToolDivisionTableText(result: NovelWorkflowResult): string {
  const header =
    "AI短剧生产工具分工（关联当前生成结果）\n" +
    `作品：${result.title}\n` +
    `流程：${PRODUCTION_SEQUENCE}\n\n`;

  const rows = EXTERNAL_TOOL_STAGES.map((stage) => {
    const delivery = buildStageDelivery(stage.id, result);
    const preview =
      delivery.length > 120 ? `${delivery.slice(0, 120)}…` : delivery;
    return `【${stage.label}】\n推荐工具：${stage.tools}\n关联：${stage.linkedHint}\n作用：${stage.purpose}\n交付摘要：${preview.replace(/\n/g, " ")}`;
  });

  return header + rows.join("\n\n");
}
