import type { Goal, GoalNode, GoalWithNodes } from "@/types";

// Practices: recurring steps ("gym 4x a week", "20 minutes of Spanish daily").
//
// Everything here is deterministic arithmetic over stored state, in the same
// spirit as review-insights.ts: no AI, no network, no clock reads of its own.
// Callers pass `nowMs` so the server and client can agree on what "today" is.
//
// The honesty rule this module exists to enforce: a practice is never "done",
// it is KEPT. Its contribution to a goal is how far through the goal's window
// you are, discounted by how often you have actually been showing up. Show up
// daily and the practice tracks the calendar; show up half the time and the
// projection drifts late exactly as it should.

const DAY = 86_400_000;
/** Adherence looks at a rolling window: the recent truth, not ancient history. */
const WINDOW_DAYS = 28;

/** Local calendar day, "YYYY-MM-DD". Sessions belong to days, not timestamps. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** The slice of a node this module actually reads, so the server layer can
 *  pass raw rows without constructing a full GoalWithNodes. */
export type PracticeNodeSlice = Pick<
  GoalNode,
  "status" | "kind" | "targetPerWeek" | "checkins" | "createdAt"
>;

export function isRecurring(n: Pick<GoalNode, "kind">): boolean {
  return n.kind === "recurring";
}

export interface Adherence {
  /** Sessions logged inside the window. */
  done: number;
  /** Sessions the cadence asked for in the same window (never 0). */
  expected: number;
  /** done / expected, clamped to 0..1. */
  ratio: number;
  /** Sessions logged in the current week (last 7 days). */
  weekDone: number;
  /** The cadence itself, for "3 of 5 this week" copy. */
  weekTarget: number;
  /** True when a session is logged for the local day of `nowMs`. */
  loggedToday: boolean;
}

/**
 * How faithfully a practice is being kept, over the last four weeks (or its
 * whole life, if it is younger than that). Rolling on purpose: it forgives a
 * rough start and it refuses to coast on one, which is the only reading that
 * stays true in both directions.
 */
export function adherence(node: PracticeNodeSlice, nowMs: number): Adherence {
  const weekTarget = Math.max(1, Math.min(7, Math.round(node.targetPerWeek ?? 7)));
  const born = Date.parse(node.createdAt);
  const windowStart = Math.max(
    Number.isNaN(born) ? nowMs : born,
    nowMs - WINDOW_DAYS * DAY
  );
  const windowDays = Math.max(1, (nowMs - windowStart) / DAY);
  const expected = Math.max(1, Math.round((windowDays / 7) * weekTarget));

  const startKey = dayKey(windowStart);
  const weekKey = dayKey(nowMs - 7 * DAY + DAY); // inclusive 7-day span ending today
  const todayKey = dayKey(nowMs);
  const days = node.checkins ?? [];

  let done = 0;
  let weekDone = 0;
  let loggedToday = false;
  for (const d of days) {
    if (d >= startKey && d <= todayKey) done++;
    if (d >= weekKey && d <= todayKey) weekDone++;
    if (d === todayKey) loggedToday = true;
  }

  return {
    done,
    expected,
    ratio: Math.max(0, Math.min(1, done / expected)),
    weekDone,
    weekTarget,
    loggedToday,
  };
}

/**
 * Log or un-log today's session (tap again to undo a mis-tap). Idempotent per
 * local day. Returns the node with `checkins`, `progress` (the adherence, so
 * the orb's ring shows how the habit is holding), `status`, and `updatedAt`
 * refreshed. Refreshing updatedAt matters beyond bookkeeping: the Mirror's
 * stall detection keys on it, so a kept practice never reads as stalled.
 */
export function toggleCheckin<
  T extends PracticeNodeSlice & Pick<GoalNode, "updatedAt" | "progress">
>(node: T, nowMs: number): T {
  const today = dayKey(nowMs);
  const had = (node.checkins ?? []).includes(today);
  const checkins = had
    ? (node.checkins ?? []).filter((d) => d !== today)
    : [...(node.checkins ?? []), today].sort();
  const next: T = {
    ...node,
    checkins,
    status: node.status === "not_started" && checkins.length > 0 ? "in_motion" : node.status,
    updatedAt: new Date(nowMs).toISOString(),
  };
  return { ...next, progress: Math.round(adherence(next, nowMs).ratio * 100) };
}

/** 0..1 share of the goal's timeline already elapsed (mirrors review-insights). */
function timeFraction(goal: Pick<Goal, "createdAt" | "targetDate">, nowMs: number): number {
  if (!goal.targetDate) return 0;
  const start = Date.parse(goal.createdAt);
  const end = Date.parse(goal.targetDate);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return Math.max(0, Math.min(1, (nowMs - start) / (end - start)));
}

/**
 * One step's contribution to its goal, 0..1.
 *  - once:      done or not. Unchanged from the old counting.
 *  - recurring: elapsed share of the goal's window x adherence. Keeping a
 *    daily habit perfectly makes the practice track the calendar; keeping it
 *    half the time projects the finish late by exactly that half, with no
 *    special case anywhere downstream. Without a goal deadline there is no
 *    calendar to track, so the adherence itself is the honest number.
 */
export function nodeCompletion(
  node: PracticeNodeSlice,
  goal: Pick<Goal, "createdAt" | "targetDate">,
  nowMs: number
): number {
  if (!isRecurring(node)) return node.status === "done" ? 1 : 0;
  const a = adherence(node, nowMs).ratio;
  return goal.targetDate ? timeFraction(goal, nowMs) * a : a;
}

/**
 * Goal progress, 0..100: the mean of every step's completion. For goals made
 * only of once-steps this returns exactly what the old done/total count did,
 * so nothing already shipped shifts underfoot.
 */
export function progressOf(
  nodes: PracticeNodeSlice[],
  goal: Pick<Goal, "createdAt" | "targetDate">,
  nowMs: number
): number {
  if (nodes.length === 0) return 0;
  const sum = nodes.reduce((s, n) => s + nodeCompletion(n, goal, nowMs), 0);
  return Math.round((sum / nodes.length) * 100);
}

export function goalProgress(goal: GoalWithNodes, nowMs: number): number {
  if (goal.nodes.length === 0) return goal.progress;
  return progressOf(goal.nodes, goal, nowMs);
}
