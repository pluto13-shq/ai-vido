"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ALL_PLATFORMS, PLATFORM_LABELS } from "@/lib/platforms";
import type {
  AspectRatio,
  ContentMode,
  GeneratedAsset,
  JobResult,
  Language,
  PlatformAccount,
  Platform,
  PublishResult,
} from "@/lib/types";

interface JobRequest {
  topic: string;
  mode: ContentMode;
  count: number;
  language: Language;
  aspectRatio: AspectRatio;
}

const defaultRequest: JobRequest = {
  topic: "AI创业者逆袭短剧",
  mode: "mixed",
  count: 4,
  language: "zh",
  aspectRatio: "9:16",
};

export function CreatorDashboard() {
  const [request, setRequest] = useState<JobRequest>(defaultRequest);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<JobResult | null>(null);
  const [openAssetId, setOpenAssetId] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [connecting, setConnecting] = useState<Platform | null>(null);

  const [publishTargets, setPublishTargets] = useState<Platform[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<PublishResult[]>([]);

  const refreshAccounts = useCallback(async () => {
    const response = await fetch("/api/accounts");
    if (response.ok) {
      const body = (await response.json()) as { accounts: PlatformAccount[] };
      setAccounts(body.accounts);
    }
  }, []);

  useEffect(() => {
    void refreshAccounts();
  }, [refreshAccounts]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data as { type?: string };
      if (data?.type === "oauth") {
        void refreshAccounts();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [refreshAccounts]);

  const connectedPlatforms = useMemo(
    () => accounts.filter((item) => item.connected).map((item) => item.platform),
    [accounts]
  );

  const stat = useMemo(() => {
    if (!result) return null;
    const successAssets = result.assets.filter((a) => a.status === "success").length;
    const failedAssets = result.assets.length - successAssets;
    return { successAssets, failedAssets };
  }, [result]);

  async function generate() {
    setError("");
    setLoading(true);
    setResult(null);
    setPublishResults([]);
    setOpenAssetId(null);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "任务提交失败");
      }

      const body = (await response.json()) as JobResult;
      setResult(body);
      if (body.assets.length > 0) {
        setOpenAssetId(body.assets[0].assetId);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }

  async function toggleConnect(account: PlatformAccount) {
    setConnecting(account.platform);
    try {
      if (account.connected) {
        await fetch(`/api/accounts?platform=${account.platform}`, { method: "DELETE" });
        await refreshAccounts();
        return;
      }

      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: account.platform }),
      });
      const body = (await response.json()) as {
        mode: "oauth" | "demo";
        authorizeUrl?: string;
      };

      if (body.mode === "oauth" && body.authorizeUrl) {
        window.open(body.authorizeUrl, "oauth_login", "width=560,height=720");
      } else {
        await refreshAccounts();
      }
    } finally {
      setConnecting(null);
    }
  }

  function togglePublishTarget(platform: Platform) {
    setPublishTargets((prev) =>
      prev.includes(platform)
        ? prev.filter((item) => item !== platform)
        : [...prev, platform]
    );
  }

  async function publish() {
    if (!result) return;
    setPublishing(true);
    setPublishResults([]);
    setError("");

    try {
      const targets = publishTargets.length > 0 ? publishTargets : connectedPlatforms;
      if (targets.length === 0) {
        throw new Error("请先连接并选择至少一个平台账号");
      }

      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assets: result.assets, platforms: targets }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "发布失败");
      }

      const body = (await response.json()) as { results: PublishResult[] };
      setPublishResults(body.results);
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "未知错误");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">AI Agent 全自动内容工厂</h1>
        <p className="mt-2 text-sm text-zinc-600">
          一键完成脚本创作、视频/图文生成，连接账号后分发到全球平台。
        </p>
      </section>

      {/* 1. 生成配置 */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">① 创作任务</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-700">选题关键词</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-200"
              value={request.topic}
              onChange={(e) => setRequest((p) => ({ ...p, topic: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">内容形态</label>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-200"
              value={request.mode}
              onChange={(e) =>
                setRequest((p) => ({ ...p, mode: e.target.value as ContentMode }))
              }
            >
              <option value="mixed">混合（视频+图文）</option>
              <option value="video">仅视频</option>
              <option value="image">仅图文</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">目标语言</label>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-200"
              value={request.language}
              onChange={(e) =>
                setRequest((p) => ({ ...p, language: e.target.value as Language }))
              }
            >
              <option value="zh">中文</option>
              <option value="en">英文</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">视频尺寸</label>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-200"
              value={request.aspectRatio}
              onChange={(e) =>
                setRequest((p) => ({ ...p, aspectRatio: e.target.value as AspectRatio }))
              }
            >
              <option value="9:16">竖屏 9:16 · 1080×1920</option>
              <option value="16:9">横屏 16:9 · 1920×1080</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">批量数量</label>
            <input
              type="number"
              min={1}
              max={20}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring focus:ring-indigo-200"
              value={request.count}
              onChange={(e) =>
                setRequest((p) => ({ ...p, count: Number(e.target.value) || 1 }))
              }
            />
          </div>
        </div>

        <button
          className="mt-5 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
          onClick={generate}
          disabled={loading}
        >
          {loading ? "正在生成..." : "生成内容"}
        </button>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      {/* 2. 生成内容展示 */}
      {result ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-zinc-900">② 生成内容</h2>
            <p className="text-sm text-zinc-500">
              成功 {stat?.successAssets ?? 0} · 失败 {stat?.failedAssets ?? 0}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {result.assets.map((asset, index) => (
              <AssetCard
                key={asset.assetId}
                asset={asset}
                variant={index}
                topic={result.input.topic}
                language={result.input.language}
                aspectRatio={result.input.aspectRatio}
                open={openAssetId === asset.assetId}
                onToggle={() =>
                  setOpenAssetId((prev) => (prev === asset.assetId ? null : asset.assetId))
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* 3. 账号授权 */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">③ 连接账号（授权登录）</h2>
        <p className="mt-1 text-sm text-zinc-500">
          已配置开发者凭证的平台会弹出真实登录授权；未配置的平台用演示账号连接（仅打通流程）。
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
          {accounts.map((account) => (
            <div
              key={account.platform}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-zinc-800">
                  {PLATFORM_LABELS[account.platform]}
                </p>
                <p className="text-xs text-zinc-500">
                  {account.connected
                    ? account.mode === "demo"
                      ? "已连接（演示）"
                      : "已授权"
                    : account.mode === "oauth"
                      ? "可真实授权"
                      : "未连接"}
                </p>
              </div>
              <button
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  account.connected
                    ? "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
                    : "bg-zinc-900 text-white hover:bg-zinc-700"
                }`}
                disabled={connecting === account.platform}
                onClick={() => toggleConnect(account)}
              >
                {connecting === account.platform
                  ? "处理中"
                  : account.connected
                    ? "断开"
                    : "连接"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 发布 */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">④ 发布到平台</h2>
        {connectedPlatforms.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">请先在上方连接至少一个平台账号。</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-zinc-500">
              选择要发布的目标（默认发布到全部已连接账号）。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {connectedPlatforms.map((platform) => {
                const selected = publishTargets.includes(platform);
                return (
                  <button
                    key={platform}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      selected
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-300 text-zinc-700 hover:border-zinc-500"
                    }`}
                    onClick={() => togglePublishTarget(platform)}
                  >
                    {PLATFORM_LABELS[platform]}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <button
          className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={publish}
          disabled={publishing || !result || connectedPlatforms.length === 0}
        >
          {publishing ? "正在发布..." : "一键发布已生成内容"}
        </button>

        {publishResults.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-600">
                  <th className="px-2 py-2 font-medium">平台</th>
                  <th className="px-2 py-2 font-medium">状态</th>
                  <th className="px-2 py-2 font-medium">说明</th>
                  <th className="px-2 py-2 font-medium">链接</th>
                </tr>
              </thead>
              <tbody>
                {publishResults.map((r, index) => (
                  <tr key={`${r.platform}-${r.assetId}-${index}`} className="border-b border-zinc-100">
                    <td className="px-2 py-2">{PLATFORM_LABELS[r.platform]}</td>
                    <td className="px-2 py-2">
                      {r.status === "published"
                        ? "已发布"
                        : r.status === "skipped"
                          ? "已跳过"
                          : "失败"}
                    </td>
                    <td className="px-2 py-2 text-zinc-600">{r.message}</td>
                    <td className="px-2 py-2">
                      {r.publishedUrl ? (
                        <a
                          href={r.publishedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          查看
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function AssetCard({
  asset,
  variant,
  topic,
  language,
  aspectRatio,
  open,
  onToggle,
}: {
  asset: GeneratedAsset;
  variant: number;
  topic: string;
  language: Language;
  aspectRatio: AspectRatio;
  open: boolean;
  onToggle: () => void;
}) {
  const [composing, setComposing] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(asset.video?.videoUrl);
  const [composeError, setComposeError] = useState("");
  const [composeNote, setComposeNote] = useState("");

  async function compose() {
    setComposing(true);
    setComposeError("");
    setComposeNote("");
    try {
      const response = await fetch("/api/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, language, aspectRatio, variant }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        url?: string;
        message?: string;
        hasNarration?: boolean;
        hasBgm?: boolean;
        durationSec?: number;
      };
      if (!response.ok || !body.url) {
        throw new Error(body.message ?? "合成失败");
      }
      setVideoUrl(body.url);
      setComposeNote(
        `已合成 ${aspectRatio} · ${body.durationSec ?? "?"}s · 配音：${
          body.hasNarration ? "有" : "无(未配置TTS)"
        } · 背景music：${body.hasBgm ? "有" : "无(放 public/assets/bgm.mp3 即生效)"}`
      );
    } catch (err) {
      setComposeError(err instanceof Error ? err.message : "合成失败");
    } finally {
      setComposing(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={onToggle}
      >
        <span className="text-sm font-medium text-zinc-800">
          <span className="mr-2 rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
            {asset.mode === "video" ? "视频" : "图文"}
          </span>
          {asset.title}
        </span>
        <span className="text-xs text-zinc-400">{open ? "收起" : "展开"}</span>
      </button>

      {open ? (
        <div className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-700">
          {asset.video ? (
            <div className="grid gap-4 md:grid-cols-[260px_1fr]">
              <div>
                <StoryboardPlayer scenes={asset.video.scenes} videoUrl={videoUrl} />
                <button
                  className="mt-2 w-full max-w-[260px] rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                  onClick={compose}
                  disabled={composing}
                >
                  {composing ? "正在合成 mp4..." : videoUrl ? "重新合成 mp4" : "🎬 一键合成 mp4"}
                </button>
                {videoUrl ? (
                  <a
                    href={videoUrl}
                    download
                    className="mt-1 block max-w-[260px] text-center text-xs text-emerald-700 hover:underline"
                  >
                    下载视频文件
                  </a>
                ) : null}
                {composeNote ? (
                  <p className="mt-1 max-w-[260px] text-[11px] text-zinc-400">{composeNote}</p>
                ) : null}
                {composeError ? (
                  <p className="mt-1 max-w-[260px] text-[11px] text-red-600">{composeError}</p>
                ) : null}
              </div>
              <div className="space-y-3">
                <p className="text-zinc-500">一句话故事：{asset.video.logline}</p>
                <ol className="space-y-2">
                  {asset.video.scenes.map((scene) => (
                    <li key={scene.index} className="rounded-lg bg-zinc-50 p-3">
                      <p className="font-medium text-zinc-800">
                        场景 {scene.index} · {scene.heading}
                      </p>
                      <p className="mt-1 text-zinc-600">画面：{scene.action}</p>
                      <p className="mt-1 text-zinc-600">台词：{scene.dialogue}</p>
                    </li>
                  ))}
                </ol>
                <p className="text-zinc-500">{asset.video.voiceover}</p>
              </div>
            </div>
          ) : null}

          {asset.image ? (
            <div className="grid gap-4 md:grid-cols-[260px_1fr]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.image.poster}
                alt={asset.image.caption}
                className="w-full max-w-[260px] rounded-xl border border-zinc-200"
              />
              <div className="space-y-2">
                <p className="font-medium text-zinc-800">标题：{asset.image.caption}</p>
                <pre className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 font-sans text-zinc-700">
                  {asset.image.body}
                </pre>
                <p className="text-zinc-500">话题：{asset.image.hashtags.join(" ")}</p>
                <p className="text-zinc-500">配图提示词：{asset.image.imagePrompt}</p>
              </div>
            </div>
          ) : null}

          {asset.status === "failed" ? (
            <p className="text-red-600">生成失败：{asset.errorMessage ?? "未知错误"}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function StoryboardPlayer({
  scenes,
  videoUrl,
}: {
  scenes: { index: number; frame: string }[];
  videoUrl?: string;
}) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing || scenes.length <= 1) return;
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % scenes.length);
    }, 1500);
    return () => clearInterval(timer);
  }, [playing, scenes.length]);

  if (videoUrl) {
    return (
      <video
        src={videoUrl}
        controls
        className="w-full max-w-[260px] rounded-xl border border-zinc-200"
      />
    );
  }

  return (
    <div className="w-full max-w-[260px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={scenes[frame]?.frame}
        alt={`分镜 ${frame + 1}`}
        className="w-full rounded-xl border border-zinc-200"
      />
      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
        <button
          className="rounded border border-zinc-300 px-2 py-1 hover:bg-zinc-100"
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? "暂停" : "播放"}
        </button>
        <span>
          分镜 {frame + 1} / {scenes.length}
        </span>
        <button
          className="rounded border border-zinc-300 px-2 py-1 hover:bg-zinc-100"
          onClick={() => setFrame((prev) => (prev + 1) % scenes.length)}
        >
          下一帧
        </button>
      </div>
      <p className="mt-1 text-center text-[11px] text-zinc-400">故事板预览（配置视频模型后显示成片）</p>
    </div>
  );
}
