"use client";

import * as React from "react";
import Link from "next/link";
import { AlarmClock, PauseCircle, Moon } from "lucide-react";
import type { GoalWithNodes } from "@/types";
import type { ReviewInsights, PaceState } from "@/lib/kairo/review-insights";
import { useGoalColors } from "@/lib/kairo/use-goal-colors";
import { goalIcon } from "@/lib/kairo/goal-icon";
import { SectionLabel } from "./PageHeader";
import { cn } from "@/lib/utils";

const STATE_TONE: Record<PaceState, string> = {
  overdue: "text-warn",
  behind: "text-warn",
  on: "text-sage",
  ahead: "text-sage",
  done: "text-sage", // a finished goal is a win, not the dimmest thing on screen
  none: "text-faint",
};


// Review must not grow with the goal count. Each section shows a fixed number
// of rows and the rest scroll INSIDE the section, so ten goals cost the same
// screen space as four. The fade at the bottom edge is the scroll affordance;
// the row count in the label says how much is really there.
function CappedList({ count, maxHeight, children }: { count: number; maxHeight: number; children: React.ReactNode }) {
  const capped = count > 4;
  if (!capped) return <>{children}</>;
  return (
    <div
      className="overflow-y-auto overscroll-contain pr-1"
      style={{
        maxHeight,
        maskImage: "linear-gradient(to bottom, #000 calc(100% - 28px), transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, #000 calc(100% - 28px), transparent)",
      }}
    >
      {children}
    </div>
  );
}

/** The Mirror: pace toward each deadline, plus what's stalled or drifting. */
export function ReviewMirror({ insights, goals }: { insights: ReviewInsights; goals: GoalWithNodes[] }) {
  const color = useGoalColors();
  const byId = React.useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals]);
  const timed = insights.pace.filter((p) => p.state !== "none");
  const noDeadline = insights.pace.filter((p) => p.state === "none");

  return (
    <div className="space-y-9">
      <p className="font-display text-[22px] font-medium leading-snug text-ink md:text-[25px]">{insights.headline}</p>

      {timed.length > 0 && (
        <div>
          <SectionLabel>On pace{timed.length > 4 ? ` · ${timed.length}` : ""}</SectionLabel>
          <CappedList count={timed.length} maxHeight={430}>
          <div className="mt-3 space-y-3.5 pb-6">
            {timed.map((p, i) => {
              const g = byId.get(p.goalId);
              const hex = g ? color(g.id) : "#e6b877";
              const Icon = goalIcon(g?.icon ?? null);
              return (
                <Link key={p.goalId} href={`/app/map?goal=${p.goalId}`} className={cn("panel block min-h-11 rounded-2xl p-3.5 transition-transform hover:-translate-y-0.5 animate-fade-up", p.state === "done" && "border-sage/25 bg-sage/[0.04]")} style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-center gap-2.5">
                    <Icon size={15} className="shrink-0" style={{ color: hex }} />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">{p.title}</span>
                    <span className={cn("shrink-0 text-[15px] font-medium", STATE_TONE[p.state])}>{p.verdict}</span>
                  </div>
                  {/* progress fill (where you are) vs a marker for time elapsed (where you should be) */}
                  <div className="inset-well relative mt-2.5 h-2 overflow-hidden rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.round(p.progress))}%`, background: hex }} />
                    {p.state !== "done" && (
                      <span
                        className="absolute top-[-2px] h-3 w-[2px] rounded-full"
                        style={{ left: `calc(${Math.round(p.timeFraction * 100)}% - 1px)`, background: p.state === "behind" || p.state === "overdue" ? "var(--color-warn, #d98b6a)" : "color-mix(in srgb, var(--color-ink) 55%, transparent)" }}
                        title="Time elapsed"
                      />
                    )}
                  </div>
                  <div className="mt-1.5 flex justify-between gap-2 font-mono text-[13px] tabular-nums text-faint">
                    <span>{Math.round(p.progress)}% done</span>
                    <span>{Math.round(p.timeFraction * 100)}% of time gone</span>
                  </div>
                </Link>
              );
            })}
          </div>
          </CappedList>
        </div>
      )}

      {(insights.stalled.length > 0 || insights.neglected.length > 0) && (
        <div>
          <SectionLabel>Losing steam{insights.stalled.length + insights.neglected.length > 4 ? ` · ${insights.stalled.length + insights.neglected.length}` : ""}</SectionLabel>
          <CappedList count={insights.stalled.length + insights.neglected.length} maxHeight={250}>
          <div className="mt-3 space-y-2 pb-6">
            {insights.stalled.map((s, i) => (
              <Callout key={`s${i}`} goalId={s.goalId} icon={<PauseCircle size={15} className="text-warn" />}>
                <span className="text-ink">{s.nodeTitle}</span>, stuck {s.days} days in {s.goalTitle}
              </Callout>
            ))}
            {insights.neglected.map((n, i) => (
              <Callout key={`n${i}`} goalId={n.goalId} icon={<Moon size={15} className="text-muted" />}>
                <span className="text-ink">{n.title}</span>, untouched for {n.days} days
              </Callout>
            ))}
          </div>
          </CappedList>
        </div>
      )}

      {noDeadline.length > 0 && (
        <div>
          <SectionLabel>No deadline yet{noDeadline.length > 4 ? ` · ${noDeadline.length}` : ""}</SectionLabel>
          <CappedList count={noDeadline.length} maxHeight={250}>
          <div className="mt-3 space-y-2 pb-6">
            {noDeadline.map((p) => (
              <Callout key={p.goalId} goalId={p.goalId} icon={<AlarmClock size={15} className="text-faint" />}>
                <span className="text-ink">{p.title}</span>. Set a deadline to track your pace
              </Callout>
            ))}
          </div>
          </CappedList>
        </div>
      )}
    </div>
  );
}

function Callout({ goalId, icon, children }: { goalId: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={`/app/map?goal=${goalId}`} className="panel flex min-h-11 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[15px] leading-snug text-muted transition-transform hover:-translate-y-0.5">
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </Link>
  );
}
