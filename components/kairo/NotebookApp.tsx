"use client";

import * as React from "react";
import { Plus, Search, Pin, PinOff, EyeOff, Eye, Trash2, ArrowLeft, Pencil, Waypoints } from "lucide-react";
import type { Note, GoalWithNodes } from "@/types";
import { createNote, updateNote, archiveNote } from "@/lib/data/actions";
import { goalIcon } from "@/lib/kairo/goal-icon";
import { useGoalColors } from "@/lib/kairo/use-goal-colors";
import { loadPersisted, savePersisted } from "@/lib/store/persist";
import { Markdown } from "./Markdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { Chip, OptionChip } from "@/components/ui/Chip";
import { cn, newId } from "@/lib/utils";

// The notebook, rebuilt as a real place to write.
//
// It used to be ONE textarea per goal: you could not keep two notes about a
// goal, could not write a note that belonged to no goal, and had nothing to
// title, pin, search, or come back to. So nobody came back, and the notebook
// was the least useful screen in the app.
//
// Now it is a library of titled notes with a reading view, and the thing Docs
// and Milanote cannot copy: Sola reads it. Every note carries a switch that
// takes it out of Sola's context, and the promise is stated on the screen
// rather than buried in a privacy page.

const DEMO_KEY = "kairo.notebook.v1";
const nowIso = () => new Date().toISOString();

function blank(over: Partial<Note> = {}): Note {
  return {
    id: newId(), goalId: null, nodeId: null, title: "", body: "", kind: "note", source: "user",
    day: null, pinned: false, solaPrivate: false,
    createdAt: nowIso(), updatedAt: nowIso(), archivedAt: null, ...over,
  };
}

/** "3 minutes ago" / "2d ago": recency is what you scan a note library by. */
function ago(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 14) return `${d}d ago`;
  return `${Math.round(d / 7)}w ago`;
}

function preview(body: string): string {
  return body.replace(/[#*_`>\-\[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

export function NotebookApp({
  notes: initial,
  goals,
  remote,
  initialGoalId,
}: {
  notes: Note[];
  goals: GoalWithNodes[];
  remote: boolean;
  initialGoalId?: string;
}) {
  const color = useGoalColors();
  const [notes, setNotes] = React.useState<Note[]>(initial);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  const [filterGoal, setFilterGoal] = React.useState<string | null>(initialGoalId ?? null);
  const saveTimer = React.useRef<number | null>(null);

  // Demo mode keeps the whole library in localStorage, so the notebook is fully
  // usable with no keys, same as goals.
  React.useEffect(() => {
    if (remote) return;
    const stored = loadPersisted<Note[]>(DEMO_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored?.length) setNotes(stored);
  }, [remote]);

  const persistAll = React.useCallback((next: Note[]) => {
    if (!remote) savePersisted(DEMO_KEY, next);
  }, [remote]);

  const patch = (id: string, p: Partial<Note>, { server = true } = {}) => {
    setNotes((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, ...p, updatedAt: nowIso() } : n));
      persistAll(next);
      return next;
    });
    if (remote && server) void updateNote({ id, ...p } as Parameters<typeof updateNote>[0]);
  };

  // Typing saves on a debounce; toggles save immediately.
  const edit = (id: string, p: Partial<Note>) => {
    setNotes((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, ...p, updatedAt: nowIso() } : n));
      persistAll(next);
      return next;
    });
    if (!remote) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { void updateNote({ id, ...p } as Parameters<typeof updateNote>[0]); }, 700);
  };

  const add = async () => {
    const n = blank({ goalId: filterGoal });
    setNotes((prev) => { const next = [n, ...prev]; persistAll(next); return next; });
    setOpenId(n.id);
    if (remote) {
      const saved = await createNote({ goalId: n.goalId });
      if (saved.ok && saved.id) {
        setNotes((prev) => { const next = prev.map((x) => (x.id === n.id ? { ...x, id: saved.id! } : x)); persistAll(next); return next; });
        setOpenId(saved.id);
      }
    }
  };

  const remove = (id: string) => {
    setNotes((prev) => { const next = prev.filter((n) => n.id !== id); persistAll(next); return next; });
    setOpenId(null);
    if (remote) void archiveNote({ id });
  };

  const open = notes.find((n) => n.id === openId) ?? null;

  const shown = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    return notes
      .filter((n) => !n.archivedAt)
      .filter((n) => (filterGoal ? n.goalId === filterGoal : true))
      .filter((n) => !term || n.title.toLowerCase().includes(term) || n.body.toLowerCase().includes(term))
      .sort((a, b) => (a.pinned !== b.pinned ? (a.pinned ? -1 : 1) : Date.parse(b.updatedAt) - Date.parse(a.updatedAt)));
  }, [notes, q, filterGoal]);

  // ---------------------------------------------------------------- the note
  if (open) {
    const g = goals.find((x) => x.id === open.goalId) ?? null;
    return (
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setOpenId(null)} className="raised-btn inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3.5 text-[14px] text-muted transition-colors hover:text-ink">
            <ArrowLeft size={15} /> All notes
          </button>
          <span className="ml-auto font-mono text-[11px] text-faint">{ago(open.updatedAt)}</span>
          <button
            onClick={() => patch(open.id, { pinned: !open.pinned })}
            aria-pressed={open.pinned}
            title={open.pinned ? "Unpin" : "Pin to the top and to Sola's context"}
            className={cn("grid h-11 w-11 place-items-center rounded-xl transition-colors", open.pinned ? "raised-gold" : "raised-btn text-muted hover:text-ink")}
          >
            {open.pinned ? <Pin size={16} /> : <PinOff size={16} />}
          </button>
          <button
            onClick={() => patch(open.id, { solaPrivate: !open.solaPrivate })}
            aria-pressed={open.solaPrivate}
            title={open.solaPrivate ? "Sola does not read this note" : "Sola reads this note"}
            className={cn("grid h-11 w-11 place-items-center rounded-xl transition-colors", open.solaPrivate ? "raised-btn text-warn" : "raised-btn text-muted hover:text-ink")}
          >
            {open.solaPrivate ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button onClick={() => remove(open.id)} title="Delete this note" className="raised-btn grid h-11 w-11 place-items-center rounded-xl text-muted transition-colors hover:text-warn">
            <Trash2 size={16} />
          </button>
        </div>

        <input
          value={open.title}
          onChange={(e) => edit(open.id, { title: e.target.value })}
          placeholder="Untitled"
          aria-label="Note title"
          className="mt-5 w-full bg-transparent font-display text-[26px] font-semibold tracking-tight text-ink placeholder:text-faint focus:outline-none"
        />

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <OptionChip active={!open.goalId} onClick={() => patch(open.id, { goalId: null })} className="text-[13px]">No goal</OptionChip>
          {goals.map((x) => (
            <OptionChip key={x.id} active={open.goalId === x.id} onClick={() => patch(open.id, { goalId: x.id })} className="text-[13px]">
              {x.title.length > 22 ? `${x.title.slice(0, 22)}…` : x.title}
            </OptionChip>
          ))}
        </div>

        {open.solaPrivate && (
          <p className="mt-3 flex items-center gap-2 text-[13px] text-warn">
            <EyeOff size={14} className="shrink-0" /> Private. Sola does not read this note.
          </p>
        )}

        <textarea
          value={open.body}
          onChange={(e) => edit(open.id, { body: e.target.value })}
          placeholder="Write anything. Markdown works, and Sola reads this when it plans with you."
          aria-label="Note body"
          className="inset-well mt-4 min-h-[46vh] w-full resize-y rounded-2xl px-4 py-3.5 text-[16px] leading-relaxed text-ink placeholder:text-faint focus-visible:outline-none"
        />

        {open.body.trim() && (
          <div className="panel mt-4 rounded-2xl p-4">
            <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              <Eye size={12} /> Preview
            </div>
            <div className="text-[15px] leading-relaxed text-muted"><Markdown>{open.body}</Markdown></div>
          </div>
        )}

        {g && (
          <p className="mt-3 flex items-center gap-1.5 text-[13px] text-faint">
            <Waypoints size={13} /> Attached to {g.title}
          </p>
        )}
      </div>
    );
  }

  // ------------------------------------------------------------- the library
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center gap-2">
        <div className="chrome flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-3">
          <Search size={15} className="shrink-0 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your notes"
            aria-label="Search notes"
            className="min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-faint focus:outline-none"
          />
        </div>
        <button onClick={() => void add()} className="raised-gold inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-4 text-[15px] font-semibold">
          <Plus size={16} /> New note
        </button>
      </div>

      {goals.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <OptionChip active={!filterGoal} onClick={() => setFilterGoal(null)} className="text-[13px]">All</OptionChip>
          {goals.map((g) => (
            <OptionChip key={g.id} active={filterGoal === g.id} onClick={() => setFilterGoal(g.id)} className="text-[13px]">
              {g.title.length > 22 ? `${g.title.slice(0, 22)}…` : g.title}
            </OptionChip>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Pencil size={22} />}
            title={q ? "Nothing matches" : "Your notebook is empty"}
            description={q ? "Try a different word." : "Notes live here: what you are thinking, what you learned, what to remember. Sola reads them when it plans with you."}
            action={!q ? <Chip icon={<Plus size={14} />} onClick={() => void add()}>Write the first one</Chip> : undefined}
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {shown.map((n) => {
            const g = goals.find((x) => x.id === n.goalId) ?? null;
            const Icon = g ? goalIcon(g.icon) : null;
            return (
              <li key={n.id}>
                <button onClick={() => setOpenId(n.id)} className="panel block w-full rounded-2xl p-3.5 text-left transition-transform hover:-translate-y-0.5">
                  <div className="flex items-center gap-2">
                    {n.pinned && <Pin size={13} className="shrink-0 text-accent" />}
                    {n.solaPrivate && <EyeOff size={13} className="shrink-0 text-warn" />}
                    <span className="min-w-0 flex-1 truncate text-[16px] font-medium text-ink">{n.title.trim() || "Untitled"}</span>
                    <span className="shrink-0 font-mono text-[11px] text-faint">{ago(n.updatedAt)}</span>
                  </div>
                  {preview(n.body) && <p className="mt-1 truncate text-[14px] text-muted">{preview(n.body)}</p>}
                  {g && Icon && (
                    <span className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-faint">
                      <Icon size={12} style={{ color: color(g.id) }} /> {g.title}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-[13px] leading-relaxed text-faint">
        Sola reads this notebook to plan with you. Private notes stay out. Notes are never used to train anything.
      </p>
    </div>
  );
}
