"use client";

import { useState } from "react";
import { CreatorDashboard } from "@/components/creator-dashboard";
import { NovelWorkflowPanel } from "@/components/novel-workflow-panel";

type AppMode = "novel" | "quick";

export function AppShell() {
  const [mode, setMode] = useState<AppMode>("novel");

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl gap-2 px-6 py-3">
          <TabButton
            active={mode === "novel"}
            onClick={() => setMode("novel")}
            label="AI短剧生产"
          />
          <TabButton
            active={mode === "quick"}
            onClick={() => setMode("quick")}
            label="快速批量创作"
          />
        </div>
      </div>
      {mode === "novel" ? <NovelWorkflowPanel /> : <CreatorDashboard />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-zinc-900 text-white"
          : "text-zinc-600 hover:bg-zinc-100"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
