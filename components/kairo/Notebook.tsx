"use client";

import * as React from "react";
import Link from "next/link";
import { Waypoints, NotebookPen, Sparkles, Loader2, Check, Plus, X, Eye, Pencil } from "lucide-react";
import type { GoalWithNodes } from "@/types";
import { Markdown } from "./Markdown";
import { goalIcon } from "@/lib/kairo/goal-icon";
import { useGoalColors } from "@/lib/kairo/use-goal-colors";
import { setGoalNotes, addNode } from "@/lib/data/actions";
import { extractSteps } from "@/lib/ai/extract-steps";
import { loadPersisted, savePersisted } from "@/lib/store/persist";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Chip, OptionChip } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/IconButton";
import { cn, newId } from "@/lib/utils";

const NOTES_KEY = "kairo.notes.v1";

export function Notebook({ goals, remote, initialGoalId }: { goals: GoalWithNodes[]; remote: boolean; initialGoalId?: string }) {
  const color = useGoalColors();
  const [notesByGoal, setNotesByGoal] = React.useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    for (const g of goals) base[g.id] = g.notes ?? "";
    return base;
  });
  const [selectedId, setSelectedId] = React.useState<string>(
    () => (initialGoalId && goals.some((g) => g.id === initialGoalId) ? initialGoalId : goals[0]?.id ?? "")
  );
  const [saved, setSaved] = React.useState(true);
  const [preview, setPreview] = React.useState(false);
  const timer = React.useRef<number | null>(null);
  const [extracting, setExtracting] = React.useState(false);
  const [picks, setPicks] = React.useState<{ step: string; on: boolean }[] | null>(null);
  const [added, setAdded] = React.useState(0);

  React.useEffect(() => {
    if (remote) return;
    const stored = loadPersisted<Record<string, string>>(NOTES_KEY);
    // SSR-safe: localStorage can only be read after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setNotesByGoal((n) => ({ ...n, ...stored }));
  }, [remote]);

  const persist = (goalId: string, text: string, all: Record<string, string>) => {
    if (remote) void setGoalNotes({ goalId, notes: text });
    else savePersisted(NOTES_KEY, all);
    setSaved(true);
  };

  const onChange = (goalId: string, text: string) => {
    setSaved(false);
    setNotesByGoal((prev) => {
      const next = { ...prev, [goalId]: text };
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => persist(goalId, text, next), 700);
      return next;
    });
  };

  const flush = (goalId: string, text: string) => {
    if (timer.current) { window.clearTimeout(timer.current); timer.current = null; }
    persist(goalId, text, { ...notesByGoal, [goalId]: text });
  };

  if (goals.length === 0) {
    return (
      <EmptyState
        icon={<NotebookPen size={22} />}
        title="Nothing to note yet"
        description="Map a goal first, then add context and thoughts here."
        action={<Link href="/app/map"><Button variant="primary" size="lg">Create a goal</Button></Link>}
      />
    );
  }

  const selected = goals.find((g) => g.id === selectedId) ?? goals[0];

  const selectGoal = (id: string) => { setSelectedId(id); setPicks(null); setAdded(0); };

  const runExtract = async () => {
    const text = notesByGoal[selected.id] ?? "";
    if (!text.trim() || extracting) return;
    setExtracting(true);
    setPicks(null);
    const res = await extractSteps({ goalTitle: selected.title, notes: text });
    setPicks(res.steps.map((s) => ({ step: s, on: true })));
    setExtracting(false);
  };

  const addPicks = () => {
    const chosen = (picks ?? []).filter((p) => p.on).map((p) => p.step);
    if (!chosen.length) return;
    if (remote) {
      let order = selected.nodes.length;
      for (const title of chosen) {
        void addNode({ id: newId(), goalId: selected.id, title, estimatedMinutes: 30, sortOrder: order++, parentId: null });
      }
    }
    setPicks(null);
    setAdded(chosen.length);
    window.setTimeout(() => setAdded((n) => (n === chosen.length ? 0 : n)), 3500);
  };

  const notes = notesByGoal[selected.id] ?? "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {goals.map((g) => {
          const active = g.id === selected.id;
          return (
            <OptionChip key={g.id} active={active} onClick={() => selectGoal(g.id)} className="gap-2">
              {React.createElement(goalIcon(g.icon), { size: 15, style: { color: color(g.id) } })}
              <span className="max-w-[160px] truncate">{g.title}</span>
            </OptionChip>
          );
        })}
      </div>

      <div className="panel rounded-2xl p-1.5 transition-colors focus-within:border-accent/40">
        <div className="flex items-center justify-between px-3.5 pt-2.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">{saved ? "Saved" : "Saving…"}</span>
          <div className="flex items-center gap-3">
            <Chip onClick={() => setPreview((p) => !p)} icon={preview ? <Pencil size={12} /> : <Eye size={12} />} className="text-[13px]">
              {preview ? "Edit" : "Preview"}
            </Chip>
            <Link href={`/app/map?goal=${selected.id}`} className="raised-btn inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink">
              <Waypoints size={13} /> Open in map
            </Link>
          </div>
        </div>
        {preview ? (
          <div className="min-h-[320px] w-full px-3.5 py-3 text-[15px] leading-relaxed text-ink">
            {notes.trim() ? <Markdown>{notes}</Markdown> : <p className="text-faint">Nothing to preview yet. Switch to Edit and add notes. Markdown works: **bold**, - lists, # headings, tables.</p>}
          </div>
        ) : (
          <textarea
            key={selected.id}
            value={notesByGoal[selected.id] ?? ""}
            onChange={(e) => onChange(selected.id, e.target.value)}
            onBlur={(e) => flush(selected.id, e.target.value)}
            placeholder={`Notes, links, and context for "${selected.title}"…`}
            className="min-h-[320px] w-full resize-none bg-transparent px-3.5 py-3 text-[15px] leading-relaxed text-ink placeholder:text-faint focus:outline-none focus-visible:shadow-none"
          />
        )}
      </div>

      {picks ? (
        <div className="panel animate-sheet-up rounded-2xl p-3">
          <div className="mb-2 flex items-center gap-2 px-0.5">
            <Sparkles size={13} className="text-accent" />
            <span className="flex-1 text-[13px] text-muted">Add these to <span className="text-ink">{selected.title}</span>?</span>
            <IconButton label="Cancel" onClick={() => setPicks(null)} className="h-9 w-9"><X size={13} /></IconButton>
          </div>
          {picks.length === 0 ? (
            <p className="px-0.5 pb-1 text-[13px] text-muted">No clear action steps in these notes yet. Add a few to-dos and try again.</p>
          ) : (
            <>
              <ul className="space-y-1.5">
                {picks.map((p, i) => (
                  <li key={i}>
                    <button
                      onClick={() => setPicks((cur) => (cur ? cur.map((x, j) => (j === i ? { ...x, on: !x.on } : x)) : cur))}
                      className="flex w-full items-center gap-2.5 text-left"
                    >
                      <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-lg transition-colors", p.on ? "bg-accent" : "inset-well")}>
                        {p.on && <Check size={13} className="text-canvas" />}
                      </span>
                      <span className={cn("text-[14px] leading-snug", p.on ? "text-ink" : "text-faint line-through")}>{p.step}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3">
                <button onClick={addPicks} disabled={!picks.some((p) => p.on)} className="raised-gold inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium disabled:opacity-40">
                  <Plus size={14} /> Add {picks.filter((p) => p.on).length} to map
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="min-w-0 text-[12px] text-faint">Solaspace reads these notes when you &ldquo;Ask&rdquo; or &ldquo;Go deeper&rdquo; on this goal&apos;s steps.</p>
          <button
            onClick={runExtract}
            disabled={!notes.trim() || extracting}
            className="raised-btn inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] text-accent transition-colors hover:text-ink disabled:opacity-40"
          >
            {extracting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Turn notes into steps
          </button>
        </div>
      )}

      {added > 0 && (
        <p className="px-1 text-[12px] text-sage">
          Added {added} step{added === 1 ? "" : "s"} to {selected.title} ·{" "}
          <Link href={`/app/map?goal=${selected.id}`} className="underline transition-colors hover:text-ink">open in map</Link>
        </p>
      )}
    </div>
  );
}
