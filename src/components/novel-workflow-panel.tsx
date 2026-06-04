"use client";

import { useState } from "react";
import { isBalanceOrQuotaError } from "@/lib/api-errors";
import { isSvgFrame } from "@/lib/frame-detect";
import { ShortDramaToolsPanel } from "@/components/short-drama-tools-panel";
import { buildStageDelivery } from "@/lib/short-drama-workflow";
import type {
  AspectRatio,
  Language,
  NovelWorkflowResult,
  NovelWorkflowStepPayload,
  WorkflowStage,
  WorkflowStageId,
} from "@/lib/types";

const STEPS: WorkflowStageId[] = [
  "novel",
  "script",
  "characters",
  "storyboard",
];

const STEP_HINTS: Record<WorkflowStageId, string> = {
  novel: "生成短剧正文素材",
  script: "改编为分场剧本",
  characters: "提取角色设定",
  storyboard: "生成分镜脚本与英文视频提示词",
  video: "合成视频片段",
};

export function NovelWorkflowPanel() {
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState<Language>("zh");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStageId | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<NovelWorkflowResult | null>(null);
  const [activeStage, setActiveStage] = useState<string>("script");
  const [openShot, setOpenShot] = useState<number | null>(1);
  const [showNovelBody, setShowNovelBody] = useState(false);
  const [warning, setWarning] = useState("");

  async function runStepByStep() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("请先填写作品标题");
      return;
    }

    setError("");
    setWarning("");
    setLoading(true);
    setResult(null);
    setShowNovelBody(false);

    let accumulated: Partial<NovelWorkflowStepPayload> & { title: string } = {
      title: trimmedTitle,
      language,
      aspectRatio,
      composeVideo: false,
      generateSceneImages: false,
    };
    let preferLocal = false;

    try {
      for (const step of STEPS) {
        setCurrentStep(step);

        async function callWorkflow(useLocal: boolean) {
          return fetch("/api/workflow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...accumulated,
              step,
              preferLocalTemplate: useLocal,
            }),
          });
        }

        let response = await callWorkflow(preferLocal);
        let body = (await response.json().catch(() => ({}))) as NovelWorkflowResult & {
          message?: string;
        };

        if (
          !response.ok &&
          body.message &&
          isBalanceOrQuotaError(body.message) &&
          !preferLocal
        ) {
          preferLocal = true;
          setWarning(
            "账户余额不足，已自动改用本地故事模板继续生成（剧情仍会根据作品标题匹配）。"
          );
          response = await callWorkflow(true);
          body = (await response.json().catch(() => ({}))) as NovelWorkflowResult & {
            message?: string;
          };
        }

        if (!response.ok) {
          throw new Error(body.message ?? `步骤「${STEP_HINTS[step]}」失败`);
        }

        if (body.warning) {
          setWarning(body.warning);
          preferLocal = true;
        }

        accumulated = {
          title: trimmedTitle,
          language,
          aspectRatio,
          composeVideo: false,
          generateSceneImages: false,
          preferLocalTemplate: preferLocal,
          workflowId: body.workflowId,
          novelText: body.input.novelText,
          synopsis: body.synopsis,
          script: body.script,
          characters: body.characters,
          storyboard: body.storyboard,
          stages: body.stages,
        };

        setResult(body);

        if (step === "novel") {
          setActiveStage("script");
        } else if (step === "script") {
          setActiveStage("script");
        } else if (step === "characters") {
          setActiveStage("characters");
        } else if (step === "storyboard") {
          setActiveStage("storyboard");
          setOpenShot(1);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
      setCurrentStep(null);
    }
  }

  const novelText = result?.input.novelText ?? "";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">AI短剧生产</h1>
        <p className="mt-2 text-sm text-zinc-600">
          输入标题后生成脚本、角色与分镜；再按工具分工表将内容复制到 ChatGPT / 可灵 /
          剪映等外部工具完成视频、配音与成片。
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">开始创作</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-700">作品标题</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-200"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：逆袭之路"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">目标语言</label>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              disabled={loading}
            >
              <option value="zh">中文</option>
              <option value="en">英文</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">视频尺寸</label>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              disabled={loading}
            >
              <option value="9:16">竖屏 9:16 · 1080×1920</option>
              <option value="16:9">横屏 16:9 · 1920×1080</option>
            </select>
          </div>
        </div>

        <button
          className="mt-5 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-60"
          onClick={runStepByStep}
          disabled={loading}
        >
          {loading && currentStep
            ? `正在${STEP_HINTS[currentStep]}…`
            : loading
              ? "逐步生成中…"
              : "生成脚本与分镜"}
        </button>
        {warning ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {warning}
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      {result ? (
        <>
          <ShortDramaToolsPanel result={result} />

          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">流水线进度</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-5">
              {result.stages.map((stage) => (
                <StageCard key={stage.id} stage={stage} active={currentStep === stage.id} />
              ))}
            </div>
            <p className="mt-4 text-sm text-zinc-600">
              <span className="font-medium text-zinc-900">{result.title}</span>
              {" · "}
              {result.synopsis}
            </p>
            {novelText ? (
              <div className="mt-4">
                <button
                  type="button"
                  className="text-sm text-indigo-600 hover:underline"
                  onClick={() => setShowNovelBody((v) => !v)}
                >
                  {showNovelBody ? "收起生成的正文" : "查看生成的正文"}
                </button>
                {showNovelBody ? (
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-relaxed whitespace-pre-wrap text-zinc-700">
                    {novelText}
                  </pre>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "script", label: "剧本" },
                { id: "characters", label: "角色" },
                { id: "storyboard", label: "分镜" },
                { id: "prompts", label: "英文提示词" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`rounded-full px-4 py-1.5 text-sm transition ${
                    activeStage === tab.id
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-300 text-zinc-700 hover:border-zinc-500"
                  }`}
                  onClick={() => setActiveStage(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeStage === "script" && result.script.length > 0 ? (
              <div className="mt-4 space-y-3">
                {result.script.map((beat) => (
                  <div key={beat.index} className="rounded-xl border border-zinc-200 p-4">
                    <p className="text-xs font-medium text-indigo-600">{beat.act}</p>
                    <p className="mt-1 text-sm text-zinc-800">场景 {beat.index}</p>
                    <p className="mt-2 text-sm text-zinc-600">旁白：{beat.narration}</p>
                    {beat.dialogue ? (
                      <p className="mt-1 text-sm text-zinc-800">
                        对白{beat.speaker ? `（${beat.speaker}）` : ""}：{beat.dialogue}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {activeStage === "characters" && result.characters.length > 0 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.characters.map((char) => (
                  <div
                    key={char.id}
                    className="rounded-xl border border-zinc-200 p-4"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={char.portrait}
                      alt={char.name}
                      className="mx-auto w-32 rounded-xl"
                    />
                    <p className="mt-3 text-center text-base font-semibold text-zinc-900">
                      {char.name}
                    </p>
                    <p className="text-center text-xs text-zinc-500">{char.role}</p>
                    <p className="mt-2 text-sm text-zinc-600">{char.appearance}</p>
                    <p className="mt-1 text-sm text-zinc-500">{char.personality}</p>
                    <p className="mt-2 text-xs text-zinc-400">
                      出场分镜：{char.sceneIds.join(", ") || "-"}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {activeStage === "storyboard" && result.storyboard.length > 0 ? (
              <div className="mt-4 space-y-3">
                {result.storyboard.map((shot) => (
                  <div key={shot.index} className="rounded-xl border border-zinc-200">
                    <button
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                      onClick={() =>
                        setOpenShot((prev) => (prev === shot.index ? null : shot.index))
                      }
                    >
                      <span className="text-sm font-medium text-zinc-800">
                        分镜 {shot.index} · {shot.heading}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {openShot === shot.index ? "收起" : "展开"}
                      </span>
                    </button>
                    {openShot === shot.index ? (
                      <div className="grid gap-4 border-t border-zinc-100 px-4 py-3 md:grid-cols-[200px_1fr]">
                        {shot.frame ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={shot.frame}
                            alt={`分镜 ${shot.index}`}
                            className="w-full max-w-[200px] rounded-xl border border-zinc-200"
                          />
                        ) : (
                          <div className="flex h-40 w-full max-w-[200px] items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-500">
                            视频由外部工具生成
                          </div>
                        )}
                        <div className="space-y-2 text-sm text-zinc-700">
                          <p>机位：{shot.camera}</p>
                          <p>角色：{shot.characterNames.join("、") || "—"}</p>
                          <p>画面：{shot.action}</p>
                          <p>台词：{shot.dialogue}</p>
                          {shot.englishPrompt ? (
                            <p className="text-xs text-indigo-700">
                              EN：{shot.englishPrompt.slice(0, 160)}
                              {shot.englishPrompt.length > 160 ? "…" : ""}
                            </p>
                          ) : null}
                          <p className="text-zinc-400">时长：{shot.durationSec}s</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {activeStage === "prompts" && result.storyboard.length > 0 ? (
              <div className="mt-4">
                <p className="mb-2 text-sm text-zinc-600">
                  复制到 可灵 / 即梦 / Sora / Seedance 生成各镜头视频。
                </p>
                <pre className="max-h-96 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed whitespace-pre-wrap text-zinc-800">
                  {buildStageDelivery("video", result)}
                </pre>
              </div>
            ) : null}

            {activeStage === "video" ? (
              <div className="mt-4 space-y-4">
                {result.video?.videoUrl ? (
                  <div className="max-w-md">
                    <video
                      src={result.video.videoUrl}
                      controls
                      playsInline
                      className="w-full rounded-xl border border-zinc-200 bg-black"
                    />
                    <p className="mt-2 text-sm text-zinc-600">
                      {result.video.width}×{result.video.height} · {result.video.durationSec}s
                      · 配音：{result.video.hasNarration ? "有" : "无"}
                      · BGM：{result.video.hasBgm ? "有" : "无"}
                    </p>
                    <a
                      href={result.video.videoUrl}
                      download
                      className="mt-2 inline-block text-sm text-emerald-700 hover:underline"
                    >
                      下载 mp4
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">
                    {loading && currentStep === "video"
                      ? "正在合成写实分镜视频（每镜约需 30～90 秒）…"
                      : "视频合成未完成。请检查 ffmpeg 是否可用，或查看流水线进度中的错误信息。"}
                  </p>
                )}
                {result.storyboard.length > 0 ? (
                  <div>
                    <p className="mb-2 text-sm font-medium text-zinc-800">成片分镜（写实剧照）</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {result.storyboard.map((shot) => (
                        <div
                          key={shot.index}
                          className="overflow-hidden rounded-xl border border-zinc-200"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={shot.frame}
                            alt={`分镜 ${shot.index}`}
                            className="aspect-[9/16] w-full object-cover"
                          />
                          <p className="px-2 py-1.5 text-xs text-zinc-600">
                            镜头 {shot.index}
                            {isSvgFrame(shot.frame) ? " · 文字卡片（绘图失败）" : " · 写实图"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {!loading &&
            result.script.length === 0 &&
            activeStage !== "video" &&
            activeStage !== "prompts" ? (
              <p className="mt-4 text-sm text-zinc-500">该步骤内容将在生成后显示。</p>
            ) : null}
          </section>
        </>
      ) : loading ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">流水线进度</h2>
          <p className="mt-2 text-sm text-zinc-600">
            {currentStep ? `正在${STEP_HINTS[currentStep]}…` : "准备中…"}
          </p>
        </section>
      ) : null}
    </div>
  );
}

function StageCard({
  stage,
  active,
}: {
  stage: WorkflowStage;
  active?: boolean;
}) {
  const color =
    stage.status === "done"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : stage.status === "running" || active
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : stage.status === "failed"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-zinc-200 bg-zinc-50 text-zinc-600";

  const statusText =
    stage.status === "done"
      ? "完成"
      : stage.status === "running" || active
        ? "进行中"
        : stage.status === "failed"
          ? "失败"
          : "等待";

  return (
    <div className={`rounded-xl border p-3 ${color}`}>
      <p className="text-xs font-semibold">{stage.label}</p>
      <p className="mt-1 text-sm">{statusText}</p>
      {stage.message ? (
        <p className="mt-1 text-[11px] leading-snug opacity-80">{stage.message}</p>
      ) : null}
    </div>
  );
}
