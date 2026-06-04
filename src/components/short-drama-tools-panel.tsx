"use client";

import { useState } from "react";
import {
  buildStageDelivery,
  buildToolDivisionTableText,
  EXTERNAL_TOOL_STAGES,
  PRODUCTION_SEQUENCE,
  type ExternalToolStageId,
} from "@/lib/short-drama-workflow";
import type { NovelWorkflowResult } from "@/lib/types";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ShortDramaToolsPanel({ result }: { result: NovelWorkflowResult }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function handleCopy(key: string, text: string) {
    const ok = await copyText(text);
    setCopied(ok ? key : "error");
    window.setTimeout(() => setCopied(null), 2000);
  }

  const hasScript = result.script.length > 0;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            AI短剧生产工具分工（关联当前生成结果）
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            生成脚本后，按下方流程将大纲、分镜与英文提示词交给对应工具继续制作。
          </p>
          {hasScript ? (
            <p className="mt-2 text-sm font-medium text-indigo-700">
              当前建议：复制英文 AI 提示词到 可灵 / 即梦 / Sora / Seedance 生成镜头视频。
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          onClick={() => void handleCopy("table", buildToolDivisionTableText(result))}
        >
          {copied === "table" ? "已复制" : "复制工具分工表"}
        </button>
      </div>

      <p className="mt-4 text-xs text-zinc-500">制作顺序：{PRODUCTION_SEQUENCE}</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs text-zinc-500">
              <th className="py-2 pr-3 font-medium">环节</th>
              <th className="py-2 pr-3 font-medium">推荐工具</th>
              <th className="py-2 pr-3 font-medium">关联当前内容</th>
              <th className="py-2 font-medium">作用</th>
            </tr>
          </thead>
          <tbody>
            {EXTERNAL_TOOL_STAGES.map((stage) => {
              const delivery = hasScript
                ? buildStageDelivery(stage.id, result)
                : "";
              const preview =
                delivery.length > 80
                  ? `${delivery.slice(0, 80).replace(/\n/g, " ")}…`
                  : delivery || "—";

              return (
                <tr key={stage.id} className="border-b border-zinc-100 align-top">
                  <td className="py-3 pr-3 font-medium text-zinc-900">
                    {stage.label}
                  </td>
                  <td className="py-3 pr-3 text-zinc-700">{stage.tools}</td>
                  <td className="py-3 pr-3">
                    <p className="text-xs text-zinc-500">{stage.linkedHint}</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                      {hasScript ? preview : "生成脚本后显示"}
                    </p>
                    {hasScript ? (
                      <button
                        type="button"
                        className="mt-2 text-xs text-indigo-600 hover:underline"
                        onClick={() =>
                          void handleCopy(stage.id, buildStageDelivery(stage.id, result))
                        }
                      >
                        {copied === stage.id ? "已复制" : "复制本环节交付物"}
                      </button>
                    ) : null}
                  </td>
                  <td className="py-3 text-zinc-600">{stage.purpose}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasScript && result.storyboard.length > 0 ? (
        <StageDeliveryPreview
          stageId="video"
          result={result}
          onCopy={handleCopy}
          copied={copied}
        />
      ) : null}
    </section>
  );
}

function StageDeliveryPreview({
  stageId,
  result,
  onCopy,
  copied,
}: {
  stageId: ExternalToolStageId;
  result: NovelWorkflowResult;
  onCopy: (key: string, text: string) => void;
  copied: string | null;
}) {
  const text = buildStageDelivery(stageId, result);
  const label = EXTERNAL_TOOL_STAGES.find((s) => s.id === stageId)?.label ?? stageId;

  return (
    <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-800">{label} · 完整交付物</p>
        <button
          type="button"
          className="text-xs text-indigo-600 hover:underline"
          onClick={() => void onCopy(`${stageId}-full`, text)}
        >
          {copied === `${stageId}-full` ? "已复制" : "复制全部"}
        </button>
      </div>
      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-zinc-700">
        {text}
      </pre>
    </div>
  );
}
