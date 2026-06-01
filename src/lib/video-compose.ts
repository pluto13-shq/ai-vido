import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { Resvg } from "@resvg/resvg-js";
import { buildVideoFrameSvg } from "@/lib/media-renderer";
import { synthesizeSpeech } from "@/lib/providers/tts";
import { buildVideoContent } from "@/lib/content-generator";
import {
  ASPECT_DIMENSIONS,
  type AspectRatio,
  type Language,
} from "@/lib/types";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

const SECONDS_PER_SCENE = 3.5;

export interface ComposeInput {
  topic: string;
  language: Language;
  aspectRatio: AspectRatio;
  variant?: number;
}

export interface ComposeResult {
  url: string;
  fileName: string;
  width: number;
  height: number;
  durationSec: number;
  hasNarration: boolean;
  hasBgm: boolean;
}

function svgToPng(svg: string, width: number): Buffer {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: width } });
  return Buffer.from(resvg.render().asPng());
}

async function bgmFilePath(): Promise<string | null> {
  const candidate = path.join(process.cwd(), "public", "assets", "bgm.mp3");
  try {
    await fs.access(candidate);
    return candidate;
  } catch {
    return null;
  }
}

export async function composeVideo(input: ComposeInput): Promise<ComposeResult> {
  const variant = input.variant ?? 0;
  const dim = ASPECT_DIMENSIONS[input.aspectRatio];
  const content = buildVideoContent(input.topic, input.language, variant, input.aspectRatio);

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "compose-"));
  const outDir = path.join(process.cwd(), "public", "generated");
  await fs.mkdir(outDir, { recursive: true });

  const fileName = `video_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp4`;
  const outPath = path.join(outDir, fileName);

  const scenePaths: string[] = [];
  for (const scene of content.scenes) {
    const svg = buildVideoFrameSvg({
      width: dim.width,
      height: dim.height,
      sceneIndex: scene.index,
      heading: scene.heading,
      action: scene.action,
      dialogue: scene.dialogue,
      variant,
      language: input.language,
    });
    const png = svgToPng(svg, dim.width);
    const p = path.join(workDir, `scene_${scene.index}.png`);
    await fs.writeFile(p, png);
    scenePaths.push(p);
  }

  // 旁白配音（已配置 TTS 才生成）
  let narrationPath: string | null = null;
  const narrationText = [
    content.logline,
    ...content.scenes.map((s) => s.dialogue),
    content.voiceover,
  ].join(" ");
  try {
    const tts = await synthesizeSpeech(narrationText, input.language);
    if (tts) {
      narrationPath = path.join(workDir, `narration.${tts.format}`);
      await fs.writeFile(narrationPath, tts.audio);
    }
  } catch {
    narrationPath = null;
  }

  const bgmPath = await bgmFilePath();
  const durationSec = content.scenes.length * SECONDS_PER_SCENE;

  await new Promise<void>((resolve, reject) => {
    const command = ffmpeg();

    scenePaths.forEach((p) => {
      command.input(p).inputOptions(["-loop", "1", "-t", String(SECONDS_PER_SCENE)]);
    });

    const audioInputIndexes: number[] = [];
    let nextIndex = scenePaths.length;

    if (narrationPath) {
      command.input(narrationPath);
      audioInputIndexes.push(nextIndex);
      nextIndex += 1;
    }
    if (bgmPath) {
      command.input(bgmPath).inputOptions(["-stream_loop", "-1"]);
      audioInputIndexes.push(nextIndex);
      nextIndex += 1;
    }
    if (audioInputIndexes.length === 0) {
      command
        .input("anullsrc=channel_layout=stereo:sample_rate=44100")
        .inputOptions(["-f", "lavfi"]);
      audioInputIndexes.push(nextIndex);
      nextIndex += 1;
    }

    const filters: string[] = [];
    scenePaths.forEach((_, i) => {
      filters.push(
        `[${i}:v]scale=${dim.width}:${dim.height}:force_original_aspect_ratio=decrease,` +
          `pad=${dim.width}:${dim.height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p[v${i}]`
      );
    });
    filters.push(
      `${scenePaths.map((_, i) => `[v${i}]`).join("")}concat=n=${scenePaths.length}:v=1:a=0[vout]`
    );

    if (audioInputIndexes.length === 1) {
      filters.push(`[${audioInputIndexes[0]}:a]aresample=44100,apad[aout]`);
    } else {
      filters.push(
        `${audioInputIndexes.map((idx) => `[${idx}:a]`).join("")}amix=inputs=${audioInputIndexes.length}:duration=longest,apad[aout]`
      );
    }

    command
      .complexFilter(filters)
      .outputOptions([
        "-map",
        "[vout]",
        "-map",
        "[aout]",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-r",
        "30",
        "-t",
        String(durationSec),
        "-shortest",
        "-movflags",
        "+faststart",
      ])
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(outPath);
  });

  await fs.rm(workDir, { recursive: true, force: true });

  return {
    url: `/generated/${fileName}`,
    fileName,
    width: dim.width,
    height: dim.height,
    durationSec,
    hasNarration: Boolean(narrationPath),
    hasBgm: Boolean(bgmPath),
  };
}
