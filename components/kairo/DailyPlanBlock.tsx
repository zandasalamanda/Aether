"use client";

import * as React from "react";
import { Check, ArrowRight, Minimize2, Split, Repeat, Play } from "lucide-react";
import type { BlockStatus, Difficulty } from "@/types";
import { blockStatusMeta, difficultyMeta } from "@/lib/kairo/status";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn, formatClock, formatDuration } from "@/lib/utils";

export interface LivePlanBlock {
  id: string;
  title: string;
  reason: string;
  startTime: string | null;
  durationMinutes: number;
  difficulty: Difficulty;
  status: BlockStatus;
  goalId: string | null;
  nodeId: string | null;
}

export interface BlockActions {
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onPush: (id: string) => void;
  onSmaller: (id: string) => void;
  onSplit: (id: string) => void;
  onReplace: (id: string) => void;
}

function ActionButton({
  icon,
  label,
  onClick,
  tone = "muted",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: "muted" | "green" | "amber";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-line bg-white/[0.02] px-2.5 py-1.5 text-[12px] font-medium transition-colors",
        tone === "green" && "hover:border-green/40 hover:text-green",
        tone === "amber" && "hover:border-amber/40 hover:text-amber",
        tone === "muted" && "text-muted hover:border-line-strong hover:text-ink"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function DailyPlanBlock({ block, actions }: { block: LivePlanBlock; actions: BlockActions }) {
  const done = block.status === "completed";
  const pushed = block.status === "pushed";
  const active = block.status === "in_progress";
  const dMeta = difficultyMeta[block.difficulty];

  return (
    <div
      className={cn(
        "glass relative rounded-2xl p-4 transition-all duration-300",
        active && "ring-1 ring-cyan/40 shadow-[0_0_44px_-18px_rgba(45,214,232,0.9)]",
        (done || pushed) && "opacity-70"
      )}
    >
      <div className="flex gap-4">
        {/* time rail */}
        <div className="flex w-14 shrink-0 flex-col items-center pt-0.5 text-center">
          <span className="font-mono text-[13px] font-semibold text-ink">{formatClock(block.startTime) || "—"}</span>
          <span className="mt-0.5 font-mono text-[11px] text-faint">{formatDuration(block.durationMinutes)}</span>
          <span className={cn("mt-2 h-full w-px", active ? "bg-cyan/50" : "bg-line")} />
        </div>

        {/* body */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className={cn("font-display text-[15px] font-semibold text-ink", done && "line-through decoration-green/60")}>
              {block.title}
            </h3>
            <StatusBadge meta={blockStatusMeta[block.status]} showDot={block.status !== "planned"} />
          </div>
          <p className="mt-1 text-[13px] text-muted">{block.reason}</p>

          <div className="mt-2.5 flex items-center gap-2">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px]", dMeta.chip)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", dMeta.dot)} />
              {dMeta.label}
            </span>
          </div>

          {pushed ? (
            <p className="mt-3 rounded-lg border border-amber/20 bg-amber/5 px-3 py-2 text-[12px] text-amber">
              Moved to later. Your timeline may slip by ~1 day unless recovered.
            </p>
          ) : done ? (
            <p className="mt-3 text-[12px] text-green">Done — goal progress updated.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {active ? (
                <ActionButton tone="green" icon={<Check size={13} />} label="Complete" onClick={() => actions.onComplete(block.id)} />
              ) : (
                <ActionButton tone="green" icon={<Play size={13} />} label="Start" onClick={() => actions.onStart(block.id)} />
              )}
              <ActionButton tone="amber" icon={<ArrowRight size={13} />} label="Push" onClick={() => actions.onPush(block.id)} />
              <ActionButton icon={<Minimize2 size={13} />} label="Smaller" onClick={() => actions.onSmaller(block.id)} />
              <ActionButton icon={<Split size={13} />} label="Split" onClick={() => actions.onSplit(block.id)} />
              <ActionButton icon={<Repeat size={13} />} label="Replace" onClick={() => actions.onReplace(block.id)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
