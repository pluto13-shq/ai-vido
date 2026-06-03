import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { Resvg } from "@resvg/resvg-js";
import {
  buildStoryboardFrameSvg,
  buildVideoFrameSvg,
} from "@/lib/media-renderer";
import { synthesizeSpeech } from "@/lib/providers/tts";
import { buildVideoContent } from "@/lib/content-generator";
import {
  ASPECT_DIMENSIONS,
  type AspectRatio,
  type Language,
  type StoryboardShot,
} from "@/lib/types";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

const DEFAULT_SECONDS_PER_SCENE = 3.5;

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

interface SceneForCompose {
  index: number;
  heading: string;
  action: string;
  dialogue: string;
  durationSec: number;
  svg: string;
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

async function runFfmpegCompose(
  scenes: SceneForCompose[],
  dim: { width: number; height: number },
  narrationText: string,
  language: Language
): Promise<ComposeResult> {
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "compose-"));
  const outDir = path.join(process.cwd(), "public", "generated");
  await fs.mkdir(outDir, { recursive: true });

  const fileName = `video_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp4`;
  const outPath = path.join(outDir, fileName);

  const scenePaths: string[] = [];
  for (const scene of scenes) {
    const png = svgToPng(scene.svg, dim.width);
    const p = path.join(workDir, `scene_${scene.index}.png`);
    await fs.writeFile(p, png);
    scenePaths.push(p);
  }

  let narrationPath: string | null = null;
  try {
    const tts = await synthesizeSpeech(narrationText, language);
    if (tts) {
      narrationPath = path.join(workDir, `narration.${tts.format}`);
      await fs.writeFile(narrationPath, tts.audio);
    }
  } catch {
    narrationPath = null;
  }

  const bgmPath = await bgmFilePath();
  const durationSec = scenes.reduce((sum, s) => sum + s.durationSec, 0);

  await new Promise<void>((resolve, reject) => {
    const command = ffmpeg();

    scenes.forEach((scene, i) => {
      command
        .input(scenePaths[i])
        .inputOptions(["-loop", "1", "-t", String(scene.durationSec)]);
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

export async function composeFromStoryboard(
  storyboard: StoryboardShot[],
  synopsis: string,
  language: Language,
  aspectRatio: AspectRatio
): Promise<ComposeResult> {
  const dim = ASPECT_DIMENSIONS[aspectRatio];
  const scenes: SceneForCompose[] = storyboard.map((shot, index) => ({
    index: shot.index,
    heading: shot.heading,
    action: shot.action,
    dialogue: shot.dialogue,
    durationSec: shot.durationSec,
    svg: buildStoryboardFrameSvg({
      width: dim.width,
      height: dim.height,
      sceneIndex: shot.index,
      heading: shot.heading,
      action: shot.action,
      dialogue: shot.dialogue,
      variant: index,
      language,
      camera: shot.camera,
      characterNames: shot.characterNames,
    }),
  }));

  const narrationText = [
    synopsis,
    ...storyboard.map((s) => s.dialogue),
  ].join(" ");

  return runFfmpegCompose(scenes, dim, narrationText, language);
}

export async function composeVideo(input: ComposeInput): Promise<ComposeResult> {
  const variant = input.variant ?? 0;
  const dim = ASPECT_DIMENSIONS[input.aspectRatio];
  const content = buildVideoContent(
    input.topic,
    input.language,
    variant,
    input.aspectRatio
  );

  const scenes: SceneForCompose[] = content.scenes.map((scene) => ({
    index: scene.index,
    heading: scene.heading,
    action: scene.action,
    dialogue: scene.dialogue,
    durationSec: DEFAULT_SECONDS_PER_SCENE,
    svg: buildVideoFrameSvg({
      width: dim.width,
      height: dim.height,
      sceneIndex: scene.index,
      heading: scene.heading,
      action: scene.action,
      dialogue: scene.dialogue,
      variant,
      language: input.language,
    }),
  }));

  const narrationText = [
    content.logline,
    ...content.scenes.map((s) => s.dialogue),
    content.voiceover,
  ].join(" ");

  return runFfmpegCompose(scenes, dim, narrationText, input.language);
}
