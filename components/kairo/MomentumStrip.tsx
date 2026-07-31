"use client";

import * as React from "react";
import { Flame, Clock, Timer } from "lucide-react";
import type { FocusStats, GoalWithNodes } from "@/types";
import { useGoalColors } from "@/lib/kairo/use-goal-colors";
import { goalIcon } from "@/lib/kairo/goal-icon";
import { cn } from "@/lib/utils";
import { SectionLabel } from "./PageHeader";

function hm(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

// Streaks earn a *moment* at the thresholds that matter, not a number that ticks
// up unremarked. Calm, on-brand, never "level up".
const STREAK_MILESTONES: Record<number, string> = {
  3: "Three days straight. It's becoming a habit.",
  7: "A full week of momentum. This is the rhythm.",
  30: "Thirty days. That's not luck; that's a practice.",
};

/** Momentum + where the focus time went: the payoff of finishing focus sessions. */
export function MomentumStrip({ stats, goals }: { stats: FocusStats; goals: GoalWithNodes[] }) {
  const color = useGoalColors();
  const goalById = React.useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals]);
  const maxMinutes = Math.max(1, ...stats.perGoal.map((p) => p.minutes));
  const cold = stats.totalSessions === 0;
  const milestone = STREAK_MILESTONES[stats.streakDays];
  // Let the focus-time bars sweep out on mount: a tactile chart, not a static block.
  const [grown, setGrown] = React.useState(false);
  React.useEffect(() => { const id = requestAnimationFrame(() => setGrown(true)); return () => cancelAnimationFrame(id); }, []);

  return (
    <div>
      <SectionLabel>Momentum</SectionLabel>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        <Tile
          icon={<Flame size={15} className={cn("shrink-0", stats.streakDays > 0 ? "text-accent" : "text-faint", milestone && "animate-pulse-soft")} />}
          value={String(stats.streakDays)}
          unit={stats.streakDays === 1 ? "day" : "days"}
          label="Focus streak"
          lit={stats.streakDays > 0}
        />
        <Tile icon={<Clock size={15} className="shrink-0 text-muted" />} value={hm(stats.weekMinutes)} label="This week" sub={`${stats.weekSessions} session${stats.weekSessions === 1 ? "" : "s"}`} />
        <Tile icon={<Timer size={15} className="shrink-0 text-muted" />} value={hm(stats.totalMinutes)} label="All time" sub={`${stats.totalSessions} session${stats.totalSessions === 1 ? "" : "s"}`} />
      </div>

      {milestone && (
        <div className="panel-2 focus-accent mt-3 flex items-center gap-2 rounded-xl px-3.5 py-2.5 animate-fade-up">
          <Flame size={14} className="shrink-0 text-accent" />
          <span className="text-[15px] leading-relaxed text-ink/90">{milestone}</span>
        </div>
      )}

      {stats.perGoal.length > 0 && (
        <div className="mt-4 space-y-2.5">
          {stats.perGoal.slice(0, 5).map((p) => {
            const g = goalById.get(p.goalId);
            if (!g) return null;
            const hex = color(g.id);
            const Icon = goalIcon(g.icon);
            return (
              <div key={p.goalId} className="flex items-center gap-3">
                <Icon size={15} className="shrink-0" style={{ color: hex }} />
                <span className="w-28 shrink-0 truncate text-[15px] text-ink/90">{g.title}</span>
                <div className="inset-well h-2 flex-1 overflow-hidden rounded-full">
                  <div className="h-full rounded-full" style={{ width: grown ? `${Math.max(6, (p.minutes / maxMinutes) * 100)}%` : "0%", background: hex, transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)" }} />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-[15px] tabular-nums text-muted">{hm(p.minutes)}</span>
              </div>
            );
          })}
        </div>
      )}

      {cold && (
        <p className="mt-3 text-[15px] leading-relaxed text-faint">
          Finish a focus session on any step and your streak and focus time show up here.
        </p>
      )}
    </div>
  );
}

function Tile({ icon, value, unit, label, sub, lit }: { icon: React.ReactNode; value: string; unit?: string; label: string; sub?: string; lit?: boolean }) {
  return (
    <div className="panel rounded-2xl p-3.5">
      <div className="flex items-center gap-1.5">{icon}<span className="min-w-0 font-mono text-[13px] uppercase leading-tight tracking-[0.06em] text-faint">{label}</span></div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`font-display text-2xl font-bold tabular-nums ${lit ? "text-accent" : "text-ink"}`}>{value}</span>
        {unit && <span className="text-[15px] text-faint">{unit}</span>}
      </div>
      {sub && <span className="mt-0.5 block text-[13px] text-faint">{sub}</span>}
    </div>
  );
}
