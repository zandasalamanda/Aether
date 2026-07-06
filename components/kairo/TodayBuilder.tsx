"use client";

import * as React from "react";
import { Check, ArrowRight, Minimize2, Split, Repeat, Play, ChevronDown } from "lucide-react";
import type { GoalWithNodes, EnergyLevel, BlockStatus, Difficulty } from "@/types";
import { buildDailyPlan } from "@/lib/ai/build-daily-plan";
import type { DailyPlanResult } from "@/lib/ai/types";
import { blockStatusMeta } from "@/lib/kairo/status";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SoftGlassCard } from "@/components/ui/SoftGlassCard";
import { Chip } from "@/components/ui/Chip";
import { SectionLabel } from "./PageHeader";
import { cn, makeId, formatClock } from "@/lib/utils";

interface LiveBlock {
  id: string; title: string; reason: string; startTime: string | null;
  durationMinutes: number; difficulty: Difficulty; status: BlockStatus;
}

const TIME = [
  { value: "30", label: "30m" },
  { value: "60", label: "1h" },
  { value: "120", label: "2h" },
] as const;
const ENERGY = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
] as const;

export function TodayBuilder({ goals }: { goals: GoalWithNodes[] }) {
  const [minutes, setMinutes] = React.useState("120");
  const [energy, setEnergy] = React.useState<EnergyLevel>("normal");
  const [thinking, setThinking] = React.useState(true);
  const [plan, setPlan] = React.useState<DailyPlanResult | null>(null);
  const [blocks, setBlocks] = React.useState<LiveBlock[]>([]);

  const build = React.useCallback(async (m: number, e: EnergyLevel) => {
    setThinking(true);
    await new Promise((r) => setTimeout(r, 520));
    const res = await buildDailyPlan({ availableMinutes: m, energy: e, context: "", goals });
    setPlan(res);
    setBlocks(res.blocks.map((b) => ({ id: makeId("blk"), status: "planned", title: b.title, reason: b.reason, startTime: b.startTime, durationMinutes: b.durationMinutes, difficulty: b.difficulty })));
    setThinking(false);
  }, [goals]);

  React.useEffect(() => { void build(Number(minutes), energy); }, [minutes, energy, build]);

  const update = (id: string, fn: (b: LiveBlock) => LiveBlock) => setBlocks((p) => p.map((b) => (b.id === id ? fn(b) : b)));
  const act = {
    start: (id: string) => setBlocks((p) => p.map((b) => ({ ...b, status: b.id === id ? "in_progress" : b.status === "in_progress" ? "planned" : b.status }))),
    complete: (id: string) => update(id, (b) => ({ ...b, status: "completed" })),
    push: (id: string) => update(id, (b) => ({ ...b, status: "pushed" })),
    smaller: (id: string) => update(id, (b) => ({ ...b, durationMinutes: Math.max(10, Math.round(b.durationMinutes / 2 / 5) * 5), difficulty: "light", title: b.title.startsWith("Make a start") ? b.title : `Make a start: ${b.title.toLowerCase()}` })),
    split: (id: string) => setBlocks((p) => {
      const i = p.findIndex((b) => b.id === id); if (i < 0) return p;
      const b = p[i]; const h = Math.max(10, Math.round(b.durationMinutes / 2 / 5) * 5);
      return [...p.slice(0, i), { ...b, id: makeId("blk"), durationMinutes: h, title: `${b.title} (1/2)` }, { ...b, id: makeId("blk"), durationMinutes: h, title: `${b.title} (2/2)`, startTime: null }, ...p.slice(i + 1)];
    }),
    replace: (id: string) => update(id, (b) => ({ ...b, title: "Plan & tidy instead", reason: "Swapped for lower-lift work.", difficulty: "light", durationMinutes: Math.min(b.durationMinutes, 20) })),
  };

  return (
    <div className="space-y-10">
      {/* window */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2.5">
          <SectionLabel>Available time</SectionLabel>
          <SegmentedControl options={TIME as unknown as { value: string; label: string }[]} value={minutes} onChange={setMinutes} />
        </div>
        <div className="space-y-2.5">
          <SectionLabel>Energy</SectionLabel>
          <SegmentedControl options={ENERGY as unknown as { value: EnergyLevel; label: string }[]} value={energy} onChange={setEnergy} />
        </div>
      </div>

      {/* path */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionLabel>Today&apos;s path</SectionLabel>
          <span className="text-[12px] text-muted">{thinking ? "Building…" : plan?.summary}</span>
        </div>

        {thinking ? (
          <div className="space-y-2.5">{[0, 1, 2].map((i) => <div key={i} className="h-[68px] animate-pulse rounded-xl bg-white/[0.03]" />)}</div>
        ) : blocks.length === 0 ? (
          <SoftGlassCard className="rounded-xl px-4 py-10 text-center text-sm text-muted">No blocks fit today. Add time or raise your energy.</SoftGlassCard>
        ) : (
          <div className="space-y-2.5">
            {blocks.map((b) => <PlanBlock key={b.id} block={b} act={act} />)}
          </div>
        )}

        {!thinking && plan?.recoveryNote && (
          <div className="rounded-xl border border-warn/20 bg-warn/[0.06] px-4 py-3 text-[13px] text-warn">{plan.recoveryNote}</div>
        )}
      </div>
    </div>
  );
}

function PlanBlock({ block: b, act }: { block: LiveBlock; act: Record<string, (id: string) => void> }) {
  const [open, setOpen] = React.useState(false);
  const done = b.status === "completed";
  const pushed = b.status === "pushed";
  const meta = blockStatusMeta[b.status];
  return (
    <SoftGlassCard className="rounded-xl">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-4 px-4 py-3.5 text-left">
        <span className="w-12 shrink-0 font-mono text-[12px] text-faint">{formatClock(b.startTime) || `${b.durationMinutes}m`}</span>
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-[15px]", done ? "text-faint line-through" : "text-ink")}>{b.title}</span>
          <span className="truncate text-[12px] text-muted">{b.reason}</span>
        </span>
        {b.status !== "planned" && !done && <span className={cn("hidden rounded-md px-2 py-0.5 text-[11px] sm:inline", meta.chip)}>{meta.label}</span>}
        {done ? (
          <span className="grid h-5 w-5 shrink-0 animate-pop place-items-center rounded-full bg-sage" style={{ boxShadow: "0 0 10px #8fae9f88" }}>
            <Check size={12} className="text-[#0d1a14]" strokeWidth={3} />
          </span>
        ) : (
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} />
        )}
        <ChevronDown size={16} className={cn("shrink-0 text-faint transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-line px-4 py-3">
          {pushed ? (
            <p className="text-[12px] text-warn">Moved to later. Timeline may slip ~1 day unless recovered.</p>
          ) : done ? (
            <p className="text-[12px] text-sage">Done — goal progress updated.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {b.status === "in_progress" ? (
                <Chip tone="sage" icon={<Check size={14} />} onClick={() => act.complete(b.id)}>Complete</Chip>
              ) : (
                <Chip tone="accent" icon={<Play size={14} />} onClick={() => act.start(b.id)}>Start</Chip>
              )}
              <Chip tone="sage" icon={<Check size={14} />} onClick={() => act.complete(b.id)}>Done</Chip>
              <Chip tone="warn" icon={<ArrowRight size={14} />} onClick={() => act.push(b.id)}>Push</Chip>
              <Chip icon={<Minimize2 size={14} />} onClick={() => act.smaller(b.id)}>Smaller</Chip>
              <Chip icon={<Split size={14} />} onClick={() => act.split(b.id)}>Split</Chip>
              <Chip icon={<Repeat size={14} />} onClick={() => act.replace(b.id)}>Replace</Chip>
            </div>
          )}
        </div>
      )}
    </SoftGlassCard>
  );
}
