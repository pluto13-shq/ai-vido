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

// --- 短剧改编工作流 ---

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
  /** 为 false 时不生成 AI 分镜图（交给可灵/即梦等外部工具） */
  generateSceneImages?: boolean;
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
  /** 为 true 时跳过 LLM，使用本地标题模板（余额不足时自动开启） */
  preferLocalTemplate?: boolean;
  generateSceneImages?: boolean;
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
  /** 可灵 / 即梦 / Sora / Seedance 用英文提示词 */
  englishPrompt?: string;
  durationSec: number;
}

export interface NovelWorkflowResult {
  workflowId: string;
  input: NovelWorkflowInput;
  stages: WorkflowStage[];
  /** 非致命提示（如余额不足已回退本地模板） */
  warning?: string;
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
