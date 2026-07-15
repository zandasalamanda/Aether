"use client";

import * as React from "react";
import Link from "next/link";
import { Timer, Check, Clock3, Scissors, RotateCcw, Sparkles, Coffee, Waypoints, Undo2 } from "lucide-react";
import type { GoalWithNodes, GoalNode, EnergyLevel, Difficulty } from "@/types";
import type { PlannedBlock } from "@/lib/ai/types";
import { mockDailyPlan } from "@/lib/ai/mock";
import { setNodeStatus, logFocusSession, setGoalNotes } from "@/lib/data/actions";
import { useGoalColors } from "@/lib/kairo/use-goal-colors";
import { goalIcon } from "@/lib/kairo/goal-icon";
import { pickCelebration, fireHaptic } from "@/lib/kairo/celebrate";
import { usePersistentState } from "@/lib/store/persist";
import { track } from "@/lib/analytics";
import { TIME_OPTIONS, ENERGY_OPTIONS, DEFAULT_BUDGET_MINUTES, DEFAULT_ENERGY, budgetLabel } from "@/lib/kairo/day-budget";
import { GoalCore } from "./GoalCore";
import { SolaMark } from "./SolaMark";
import { FocusOverlay } from "./FocusOverlay";
import { Celebration } from "./Celebration";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatDuration, cn } from "@/lib/utils";

type BlockStatus = "planned" | "completed" | "pushed";
interface BlockState extends PlannedBlock {
  id: string;
  status: BlockStatus;
}
interface StoredPlan {
  date: string;
  minutes: number;
  energy: EnergyLevel;
  summary: string;
  explanation: string;
  recoveryNote: string | null;
  blocks: BlockState[];
}

const DIFF: Record<Difficulty, { label: string; cls: string }> = {
  light: { label: "Light", cls: "text-sage" },
  moderate: { label: "Focused", cls: "text-accent" },
  deep: { label: "Deep", cls: "text-warn" },
};

const round5 = (n: number) => Math.round(n / 5) * 5;

/**
 * The Today screen: plan your day with Sola. Tell it the time and energy you have,
 * and it slices your live goals into a focused day — ordered focus blocks with real
 * breaks — that you run one block at a time. Built locally (instant, deterministic)
 * and cached for the day; completing a block writes through to the step's status.
 */
export function TodayPlanner({
  goals,
  remote,
  dayKey,
  dateLabel,
}: {
  goals: GoalWithNodes[];
  remote: boolean;
  dayKey: string;
  dateLabel: string;
}) {
  const color = useGoalColors();
  const [stored, setStored] = usePersistentState<StoredPlan | null>("kairo.today.v1", null);
  const [minutes, setMinutes] = React.useState<number>(DEFAULT_BUDGET_MINUTES);
  const [energy, setEnergy] = React.useState<EnergyLevel>(DEFAULT_ENERGY);
  const [building, setBuilding] = React.useState(false);
  const [focus, setFocus] = React.useState<{ goalId: string; node: GoalNode; minutes: number } | null>(null);
  const [celebration, setCelebration] = React.useState<{ title: string; sub: string; hex: string } | null>(null);
  const [note, setNote] = React.useState<string | null>(null);

  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  React.useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);
  const later = (fn: () => void, ms: number) => { const id = setTimeout(fn, ms); timers.current.push(id); return id; };

  const active = stored && stored.date === dayKey ? stored : null;

  const activeGoals = goals.filter((g) => g.status === "active");
  const hasGoals = activeGoals.length > 0;
  const hasWork = activeGoals.some((g) => g.nodes.some((n) => n.status !== "done" && n.status !== "blocked"));

  const flash = (msg: string) => { setNote(msg); later(() => setNote(null), 2400); };

  const nodeFor = (goalId: string, nodeId: string) =>
    goals.find((g) => g.id === goalId)?.nodes.find((n) => n.id === nodeId) ?? null;

  const build = () => {
    const res = mockDailyPlan({ availableMinutes: minutes, energy, context: "", goals: activeGoals });
    const blocks: BlockState[] = res.blocks.map((b, i) => ({ ...b, id: `b${i}`, status: "planned" }));
    track("day_built", { minutes, energy, blocks: blocks.length });
    const commit = () => {
      setStored({ date: dayKey, minutes, energy, summary: res.summary, explanation: res.explanation, recoveryNote: res.recoveryNote, blocks });
      setBuilding(false);
    };
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { commit(); return; }
    setBuilding(true);
    later(commit, 950);
  };

  const rebuild = () => {
    if (active) { setMinutes(active.minutes); setEnergy(active.energy); }
    setStored(null);
  };

  const patchBlocks = (fn: (b: BlockState) => BlockState) =>
    setStored((prev) => (prev ? { ...prev, blocks: prev.blocks.map(fn) } : prev));

  const finishStep = (goalId: string, nodeId: string, mins?: number) => {
    // Finishing the work finishes the step — so every block of that node closes.
    patchBlocks((b) => (b.nodeId === nodeId ? { ...b, status: "completed" } : b));
    track("step_completed", { goalId, surface: "today" });
    if (remote) {
      void setNodeStatus({ goalId, nodeId, status: "done" });
      if (mins) void logFocusSession({ goalId, nodeId, minutes: mins });
    }
    const line = pickCelebration(nodeId);
    setCelebration({ title: line.title, sub: line.sub, hex: color(goalId) });
    fireHaptic();
    later(() => setCelebration(null), 1700);
  };

  const startBlock = (b: BlockState) => {
    if (!b.goalId || !b.nodeId) return;
    const n = nodeFor(b.goalId, b.nodeId);
    if (!n) { flash("That step isn't on your map anymore. Rebuild to refresh today."); return; }
    if (remote && n.status !== "in_motion") void setNodeStatus({ goalId: b.goalId, nodeId: b.nodeId, status: "in_motion" });
    track("focus_started", { surface: "today" });
    setFocus({ goalId: b.goalId, node: n, minutes: b.durationMinutes });
  };

  const pushBlock = (id: string) => {
    patchBlocks((b) => (b.id === id ? { ...b, status: "pushed" } : b));
    flash("Pushed off today — it'll be first up next time.");
  };
  const undoPush = (id: string) => patchBlocks((b) => (b.id === id ? { ...b, status: "planned" } : b));

  const shrinkBlock = (id: string) => {
    let out = 0;
    patchBlocks((b) => {
      if (b.id !== id) return b;
      const next = Math.max(10, round5(b.durationMinutes / 2));
      out = next;
      const difficulty: Difficulty = b.difficulty === "deep" ? "moderate" : b.difficulty === "moderate" ? "light" : "light";
      return { ...b, durationMinutes: next, difficulty };
    });
    flash(`Trimmed to ${out}m — easier to start.`);
  };

  const appendNote = (goalId: string, label: string, body: string) => {
    const g = goals.find((x) => x.id === goalId);
    if (!g) return;
    const notes = (g.notes ? `${g.notes.trim()}\n\n` : "") + `--- ${label} ---\n${body.trim()}\n`;
    g.notes = notes; // keep the in-memory copy fresh for this session
    if (remote) void setGoalNotes({ goalId, notes });
  };

  const focusBlocks = active?.blocks.filter((b) => b.kind === "focus") ?? [];
  const doneCount = focusBlocks.filter((b) => b.status === "completed").length;
  const liveCount = focusBlocks.filter((b) => b.status !== "pushed").length;
  const allDone = liveCount > 0 && doneCount === liveCount;
  const focusGoal = focus ? goals.find((g) => g.id === focus.goalId) : null;

  // --- floating overlays (shared across states) ---
  const overlays = (
    <>
      {celebration && (
        <div className="pointer-events-none fixed inset-0 z-[135] grid place-items-center px-6">
          <div className="chrome animate-sheet-up flex flex-col items-center rounded-2xl px-8 py-6 text-center">
            <Celebration hex={celebration.hex} size={60} />
            <h3 className="mt-3 font-display text-lg font-semibold text-ink">{celebration.title}</h3>
            <p className="mt-1 max-w-[15rem] text-[13px] leading-relaxed text-muted">{celebration.sub}</p>
          </div>
        </div>
      )}
      {note && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[130] flex justify-center px-6 md:bottom-8">
          <div className="chrome animate-fade-in rounded-full px-4 py-2 text-[13px] text-ink">{note}</div>
        </div>
      )}
      {focus && focusGoal && (
        <FocusOverlay
          key={focus.node.id}
          title={focus.node.title}
          goalTitle={focusGoal.title}
          nodeDescription={focus.node.description}
          context={focusGoal.notes.trim() || undefined}
          hex={color(focus.goalId)}
          initialMinutes={focus.minutes}
          onComplete={(mins) => { finishStep(focus.goalId, focus.node.id, mins); setFocus(null); }}
          onClose={() => setFocus(null)}
          onSaveArtifact={(label, body) => appendNote(focus.goalId, `${label} · ${focus.node.title}`, body)}
        />
      )}
    </>
  );

  // --- building narration ---
  if (building) {
    return (
      <>
        {overlays}
        <div className="grid min-h-[60vh] place-items-center">
          <div className="flex flex-col items-center text-center">
            <GoalCore size={132} className="animate-pulse-soft" />
            <p className="mt-8 font-display text-xl font-medium text-ink">Shaping your day…</p>
            <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.2em] text-accent/70">Sola is fitting the work to your time</p>
          </div>
        </div>
      </>
    );
  }

  // --- no plan yet: the setup ("plan your day with Sola") ---
  if (!active) {
    if (!hasGoals) {
      return (
        <>
          {overlays}
          <EmptyState
            icon={<Sparkles size={22} />}
            title="Nothing to plan yet"
            description="Map a goal first — then Sola can build your day around it."
            action={<Link href="/app/map"><Button variant="primary" size="lg">Create a goal</Button></Link>}
          />
        </>
      );
    }
    return (
      <>
        {overlays}
        <div className="mx-auto flex max-w-lg flex-col items-center py-4 text-center">
          <GoalCore size={104} className="mb-6" />
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Plan today with Sola</h1>
          <p className="mt-2.5 max-w-sm text-[15px] leading-relaxed text-muted">
            Tell Sola the time and energy you&apos;ve got. It builds a focused day around your goals, with breaks so it holds.
          </p>

          {!hasWork && (
            <p className="mt-5 rounded-xl border border-line bg-white/[0.02] px-4 py-3 text-[13px] text-muted">
              Every step is done or blocked right now. Add a step on the map, then build your day.
            </p>
          )}

          <div className="mt-9 w-full text-left">
            <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">How much time do you have?</div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.minutes}
                  onClick={() => setMinutes(t.minutes)}
                  aria-pressed={minutes === t.minutes}
                  className={cn(
                    "rounded-xl py-3 text-[15px] font-medium tabular-nums transition-all",
                    minutes === t.minutes ? "raised-gold text-ink" : "panel text-muted hover:text-ink"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 w-full text-left">
            <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">How&apos;s your energy?</div>
            <div className="grid grid-cols-3 gap-2">
              {ENERGY_OPTIONS.map((e) => (
                <button
                  key={e.value}
                  onClick={() => setEnergy(e.value)}
                  aria-pressed={energy === e.value}
                  className={cn(
                    "rounded-xl px-2 py-3 text-center transition-all",
                    energy === e.value ? "raised-gold" : "panel hover:border-line-strong"
                  )}
                >
                  <div className={cn("text-[15px] font-medium", energy === e.value ? "text-ink" : "text-muted")}>{e.label}</div>
                  <div className={cn("mt-0.5 text-[11px] leading-tight", energy === e.value ? "text-ink/70" : "text-faint")}>{e.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={build}
            disabled={!hasWork}
            className="raised-gold mt-9 inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-[15px] font-semibold disabled:opacity-40"
          >
            <Sparkles size={17} /> Build my day
          </button>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{budgetLabel(minutes)} · {energy} energy</p>
        </div>
      </>
    );
  }

  // --- the built day ---
  return (
    <>
      {overlays}

      {/* header */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
              <SolaMark size={13} /> {dateLabel}
            </div>
            <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">Today&apos;s plan</h1>
          </div>
          <button onClick={rebuild} className="raised-btn inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] text-muted transition-colors hover:text-ink">
            <RotateCcw size={14} /> Rebuild
          </button>
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">{active.explanation}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
          <span>{active.summary}</span>
        </div>
        {active.recoveryNote && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-warn/25 bg-warn/[0.06] px-3.5 py-2.5 text-[13px] leading-relaxed text-warn/90">
            <Clock3 size={15} className="mt-0.5 shrink-0" /> {active.recoveryNote}
          </div>
        )}
        {/* progress */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
            <span>Progress</span>
            <span>{doneCount} / {liveCount} done</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${liveCount ? (doneCount / liveCount) * 100 : 0}%`, boxShadow: "0 0 8px var(--color-accent)" }} />
          </div>
        </div>
      </div>

      {allDone && (
        <div className="panel-2 mb-5 flex items-center gap-4 rounded-2xl p-5">
          <Celebration size={48} />
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">You cleared your day</h2>
            <p className="mt-0.5 text-[13px] leading-relaxed text-muted">Every focus block done. Rest it, or build a fresh one.</p>
          </div>
        </div>
      )}

      {/* the blocks */}
      <ol className="space-y-2.5">
        {active.blocks.map((b, i) => {
          if (b.kind === "break") {
            return (
              <li key={b.id} className="flex items-center gap-3 px-1 py-1 text-faint">
                <span className="h-px flex-1 bg-line" />
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em]">
                  <Coffee size={12} /> {b.title} · {b.durationMinutes}m
                </span>
                <span className="h-px flex-1 bg-line" />
              </li>
            );
          }

          const stepNo = active.blocks.slice(0, i + 1).filter((x) => x.kind === "focus").length;
          const hex = b.goalId ? color(b.goalId) : "#e6b877";
          const g = b.goalId ? goals.find((x) => x.id === b.goalId) : null;
          const Icon = goalIcon(g?.icon);
          const diff = DIFF[b.difficulty];
          const completed = b.status === "completed";
          const pushed = b.status === "pushed";

          return (
            <li
              key={b.id}
              className={cn(
                "panel relative overflow-hidden rounded-2xl p-4 transition-opacity",
                (completed || pushed) && "opacity-55"
              )}
            >
              {!completed && !pushed && (
                <span className="pointer-events-none absolute inset-y-0 left-0 w-1" style={{ background: hex }} aria-hidden />
              )}
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg font-mono text-[11px] font-semibold" style={{ background: `${hex}1f`, color: hex }}>{stepNo}</span>
                <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  <Icon size={12} style={{ color: hex }} />
                  <span className="truncate">{g?.title ?? "Step"}</span>
                </span>
                {pushed ? (
                  <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-faint">Pushed</span>
                ) : (
                  <span className={cn("shrink-0 font-mono text-[10px] uppercase tracking-wide", diff.cls)}>{diff.label}</span>
                )}
                <span className="shrink-0 font-mono text-[11px] text-faint">{formatDuration(b.durationMinutes)}</span>
              </div>

              <h3 className={cn("mt-2 font-display text-lg font-semibold leading-snug", completed ? "text-muted line-through" : "text-ink")}>{b.title}</h3>
              {b.reason && !completed && <p className="mt-1 truncate text-[12px] text-faint">{b.reason}</p>}

              {!completed && !pushed && (
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <button onClick={() => startBlock(b)} className="raised-gold inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-medium">
                    <Timer size={15} /> Start
                  </button>
                  <button onClick={() => b.goalId && b.nodeId && finishStep(b.goalId, b.nodeId)} className="raised-btn inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] text-sage">
                    <Check size={15} /> Done
                  </button>
                  <button onClick={() => shrinkBlock(b.id)} className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors hover:text-ink" aria-label="Make smaller" title="Make it smaller">
                    <Scissors size={14} />
                  </button>
                  <button onClick={() => pushBlock(b.id)} className="grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors hover:text-ink" aria-label="Push to later" title="Push to later">
                    <Clock3 size={15} />
                  </button>
                </div>
              )}

              {pushed && (
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => undoPush(b.id)} className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
                    <Undo2 size={14} /> Bring back to today
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex items-center justify-center">
        <Link href="/app/map" className="inline-flex items-center gap-1.5 text-[13px] text-faint transition-colors hover:text-ink">
          <Waypoints size={14} /> Open the map
        </Link>
      </div>
    </>
  );
}
