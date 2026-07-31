import type { Note } from "@/types";

// The ONE place notes become AI context. Every budget lives here, so no caller
// invents its own slicing and no private note can leak by accident: every
// selector below filters archived and solaPrivate before anything else.
//
// No embeddings, no vector store. A user has a handful of goals and dozens of
// notes; pinned-plus-recent under a character budget beats a retrieval stack on
// both latency and noise at this scale, and it is explainable, which matters
// when the promise is "you can see everything Sola knows".

const CAP_GOAL_DIGEST = 4000;
const CAP_CHAT_TOTAL = 6000;
const MAX_CHAT_ENTRIES = 12;

/** Readable by Sola: not archived, not marked private. */
function readable(n: Note): boolean {
  return !n.archivedAt && !n.solaPrivate;
}

/** Pinned first, then most recently updated. */
function byPinnedThenRecent(a: Note, b: Note): number {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
}

function entry(n: Note, bodyCap: number): string {
  const title = n.title.trim().slice(0, 120);
  const body = n.body.trim().slice(0, bodyCap);
  return title ? `[${title}]\n${body}` : body;
}

/**
 * The per-goal digest that fills Goal.notes and rides along on every per-node
 * AI call. Relevance-ordered, so a briefing sees the pinned note about this
 * goal before a stale one, which the old "first 600 chars of one blob" could
 * never do.
 */
export function deriveGoalContext(notes: Note[], goalId: string): string {
  const out: string[] = [];
  let used = 0;
  for (const n of notes.filter((n) => n.goalId === goalId && readable(n)).sort(byPinnedThenRecent)) {
    const e = entry(n, 1200);
    if (!e.trim()) continue;
    if (used + e.length > CAP_GOAL_DIGEST) break;
    out.push(e);
    used += e.length;
  }
  return out.join("\n\n");
}

export interface SolaNotebookEntry {
  id: string;
  title: string;
  body: string;
  goalId: string | null;
}

/**
 * What Sola sees in chat. Order: pinned notes, then today's daily note, then
 * notes attached to a goal that is actually in the conversation's plan. Stops
 * at 12 entries or 6000 body characters, whichever comes first.
 */
export function selectNotesForSola(notes: Note[], planGoalIds: string[], todayIso: string): SolaNotebookEntry[] {
  const live = notes.filter(readable);
  const picked: Note[] = [];
  const seen = new Set<string>();
  const take = (n: Note) => {
    if (seen.has(n.id)) return;
    seen.add(n.id);
    picked.push(n);
  };

  for (const n of live.filter((n) => n.pinned).sort(byPinnedThenRecent)) take(n);
  for (const n of live.filter((n) => n.kind === "daily" && n.day === todayIso)) take(n);
  const inPlan = new Set(planGoalIds);
  for (const n of live.filter((n) => n.goalId && inPlan.has(n.goalId)).sort(byPinnedThenRecent)) take(n);

  const out: SolaNotebookEntry[] = [];
  let used = 0;
  for (const n of picked) {
    if (out.length >= MAX_CHAT_ENTRIES) break;
    const cap = n.pinned ? 1200 : n.kind === "daily" ? 800 : 600;
    const body = n.body.trim().slice(0, cap);
    if (!body) continue;
    if (used + body.length > CAP_CHAT_TOTAL) break;
    out.push({ id: n.id, title: n.title.trim().slice(0, 120), body, goalId: n.goalId });
    used += body.length;
  }
  return out;
}

/**
 * Node-scoped relevance for a step briefing: notes pinned to THIS step first,
 * then pinned notes, then the goal's recent ones.
 */
export function buildNodeContext(notes: Note[], goalId: string, nodeId: string | null): string {
  const live = notes.filter(readable);
  const ordered = [
    ...(nodeId ? live.filter((n) => n.nodeId === nodeId) : []),
    ...live.filter((n) => n.nodeId !== nodeId && n.pinned && n.goalId === goalId),
    ...live.filter((n) => n.nodeId !== nodeId && !n.pinned && n.goalId === goalId).sort(byPinnedThenRecent),
  ];
  const out: string[] = [];
  const seen = new Set<string>();
  let used = 0;
  for (const n of ordered) {
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    const e = entry(n, 1200);
    if (!e.trim()) continue;
    if (used + e.length > CAP_GOAL_DIGEST) break;
    out.push(e);
    used += e.length;
  }
  return out.join("\n\n");
}
