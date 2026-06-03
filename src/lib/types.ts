export type ContentMode = "video" | "image" | "mixed";

export type Language = "zh" | "en";

export type AspectRatio = "9:16" | "16:9";

export interface VideoDimension {
  width: number;
  height: number;
}

export const ASPECT_DIMENSIONS: Record<AspectRatio, VideoDimension> = {
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
};

export const ASPECT_PREVIEW: Record<AspectRatio, VideoDimension> = {
  "9:16": { width: 360, height: 640 },
  "16:9": { width: 640, height: 360 },
};

export type Platform =
  | "douyin"
  | "kuaishou"
  | "bilibili"
  | "xiaohongshu"
  | "wechat_video"
  | "wechat_oa"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "instagram"
  | "threads"
  | "x"
  | "pinterest"
  | "linkedin";

export type GenerationStatus = "success" | "failed";

export interface CreationJobInput {
  topic: string;
  mode: ContentMode;
  count: number;
  language: Language;
  aspectRatio: AspectRatio;
}

export interface VideoScene {
  index: number;
  heading: string;
  action: string;
  dialogue: string;
  frame: string;
}

export interface VideoContent {
  logline: string;
  scenes: VideoScene[];
  voiceover: string;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  videoUrl?: string;
}

export interface ImageContent {
  caption: string;
  body: string;
  hashtags: string[];
  imagePrompt: string;
  poster: string;
}

export interface GeneratedAsset {
  assetId: string;
  mode: "video" | "image";
  title: string;
  language: Language;
  tags: string[];
  status: GenerationStatus;
  errorMessage?: string;
  video?: VideoContent;
  image?: ImageContent;
}

export interface JobResult {
  jobId: string;
  input: CreationJobInput;
  generatedAt: string;
  assets: GeneratedAsset[];
}

export interface PlatformAccount {
  platform: Platform;
  connected: boolean;
  accountName?: string;
  connectedAt?: string;
  mode: "oauth" | "demo";
}

export interface PublishResult {
  platform: Platform;
  assetId: string;
  status: "published" | "skipped" | "failed";
  message: string;
  publishedUrl?: string;
}

// --- 小说改编工作流 ---

export type WorkflowStageId =
  | "novel"
  | "script"
  | "characters"
  | "storyboard"
  | "video";

export type WorkflowStageStatus = "pending" | "running" | "done" | "failed";

export interface WorkflowStage {
  id: WorkflowStageId;
  label: string;
  status: WorkflowStageStatus;
  message?: string;
}

export interface NovelWorkflowInput {
  novelText?: string;
  title?: string;
  language: Language;
  aspectRatio: AspectRatio;
  composeVideo?: boolean;
}

/** 分步执行工作流时客户端携带的累积状态 */
export interface NovelWorkflowStepPayload {
  step: WorkflowStageId;
  title: string;
  language: Language;
  aspectRatio: AspectRatio;
  composeVideo?: boolean;
  novelText?: string;
  synopsis?: string;
  script?: ScriptBeat[];
  characters?: NovelCharacter[];
  storyboard?: StoryboardShot[];
  stages?: WorkflowStage[];
  workflowId?: string;
}

export interface ScriptBeat {
  index: number;
  act: string;
  narration: string;
  dialogue: string;
  speaker?: string;
}

export interface NovelCharacter {
  id: string;
  name: string;
  role: string;
  appearance: string;
  personality: string;
  sceneIds: number[];
  portrait: string;
}

export interface StoryboardShot {
  index: number;
  scriptBeatIndex: number;
  characterIds: string[];
  characterNames: string[];
  heading: string;
  action: string;
  dialogue: string;
  camera: string;
  frame: string;
  durationSec: number;
}

export interface NovelWorkflowResult {
  workflowId: string;
  input: NovelWorkflowInput;
  stages: WorkflowStage[];
  title: string;
  synopsis: string;
  script: ScriptBeat[];
  characters: NovelCharacter[];
  storyboard: StoryboardShot[];
  video?: {
    videoUrl: string;
    width: number;
    height: number;
    durationSec: number;
    hasNarration: boolean;
    hasBgm: boolean;
  };
  generatedAt: string;
}
