import { renderPoster, renderVideoFrame } from "@/lib/media-renderer";
import {
  ASPECT_PREVIEW,
  type AspectRatio,
  ASPECT_DIMENSIONS,
  type ImageContent,
  type Language,
  type VideoContent,
  type VideoScene,
} from "@/lib/types";

const VIDEO_BEATS: Record<Language, { heading: string; action: string; dialogue: string }[]> = {
  zh: [
    {
      heading: "开场 · 困境",
      action: "主角在出租屋盯着空荡的银行卡余额，窗外是凌晨城市的霓虹。",
      dialogue: "“再这样下去，我连下个月房租都付不起。”",
    },
    {
      heading: "转折 · 机会",
      action: "主角偶然刷到一个 AI 创作工具，半信半疑地点开。",
      dialogue: "“一个人，也能做出一整条产线？”",
    },
    {
      heading: "高潮 · 爆发",
      action: "快速蒙太奇：批量生成的内容在多个平台同时上线，数据曲线暴涨。",
      dialogue: "“原来我缺的不是努力，是杠杆。”",
    },
    {
      heading: "结尾 · 反转",
      action: "三个月后，主角站在演讲台上，台下坐满想复制他路径的人。",
      dialogue: "“别再用体力换钱了，用系统。”",
    },
  ],
  en: [
    {
      heading: "Cold open · The trap",
      action: "The hero stares at a near-empty bank balance in a tiny apartment, city neon outside.",
      dialogue: '"At this rate I can\'t even make next month\'s rent."',
    },
    {
      heading: "Turn · The chance",
      action: "They stumble on an AI creation tool and open it, half skeptical.",
      dialogue: '"One person... running an entire content line?"',
    },
    {
      heading: "Peak · The breakout",
      action: "Fast montage: batches of content go live across platforms, metrics spike.",
      dialogue: '"I was never short on effort. I was short on leverage."',
    },
    {
      heading: "Ending · The twist",
      action: "Three months later, the hero is on stage; the room is full of people copying the playbook.",
      dialogue: '"Stop trading hours for money. Build the system."',
    },
  ],
};

function buildScenes(
  topic: string,
  language: Language,
  variant: number,
  aspectRatio: AspectRatio
): VideoScene[] {
  const beats = VIDEO_BEATS[language];
  const preview = ASPECT_PREVIEW[aspectRatio];
  return beats.map((beat, index) => {
    const action =
      language === "zh" ? `【${topic}】${beat.action}` : `[${topic}] ${beat.action}`;
    return {
      index: index + 1,
      heading: beat.heading,
      action,
      dialogue: beat.dialogue,
      frame: renderVideoFrame(
        index + 1,
        beat.heading,
        action,
        beat.dialogue,
        variant,
        language,
        preview.width,
        preview.height
      ),
    };
  });
}

export function buildVideoContent(
  topic: string,
  language: Language,
  variant: number,
  aspectRatio: AspectRatio
): VideoContent {
  const scenes = buildScenes(topic, language, variant, aspectRatio);
  const dim = ASPECT_DIMENSIONS[aspectRatio];
  const logline =
    language === "zh"
      ? `一个普通人借助 AI 自动化，把「${topic}」做成可复制的内容产线，实现逆袭。`
      : `An ordinary person uses AI automation to turn "${topic}" into a repeatable content engine and turns their life around.`;
  const voiceover =
    language === "zh"
      ? `旁白：这不是运气，而是把「${topic}」拆成了可被机器执行的步骤。`
      : `Voiceover: This isn't luck. It's "${topic}" broken into steps a machine can run.`;
  return {
    logline,
    scenes,
    voiceover,
    aspectRatio,
    width: dim.width,
    height: dim.height,
  };
}

export function buildImageContent(
  topic: string,
  language: Language,
  variant: number
): ImageContent {
  if (language === "zh") {
    const caption = `普通人靠「${topic}」翻身的 3 个关键动作`;
    const body = [
      `第 ${variant + 1} 期 · 实操拆解`,
      ``,
      `1）选题：用 AI 找到正在涨的「${topic}」细分方向；`,
      `2）生产：脚本、配图、剪辑全部交给 Agent 批量完成；`,
      `3）分发：一次创作，多平台同步铺量。`,
      ``,
      `把重复劳动交给系统，你只负责做决策。`,
    ].join("\n");
    const imagePrompt = `高质量竖版海报，主题「${topic}」，极简科技风，强对比标题排版，适合小红书封面`;
    return {
      caption,
      body,
      hashtags: ["#AI创作", "#自动化", `#${topic}`, "#搞钱", "#矩阵运营"],
      imagePrompt,
      poster: renderPoster(caption, body, `#${topic}`, variant),
    };
  }
  const caption = `3 moves that let ordinary people win with "${topic}"`;
  const body = [
    `Issue #${variant + 1} · Playbook`,
    ``,
    `1) Pick: use AI to find a rising niche around "${topic}".`,
    `2) Produce: let agents batch the script, visuals and edits.`,
    `3) Distribute: create once, push to every platform.`,
    ``,
    `Give repetitive work to the system. You just make the calls.`,
  ].join("\n");
  const imagePrompt = `High-quality vertical poster about "${topic}", minimal tech aesthetic, bold high-contrast headline, social-cover ready`;
  return {
    caption,
    body,
    hashtags: ["#AICreation", "#Automation", `#${topic.replace(/\s+/g, "")}`, "#CreatorEconomy"],
    imagePrompt,
    poster: renderPoster(caption, body, `#${topic.replace(/\s+/g, "")}`, variant),
  };
}
