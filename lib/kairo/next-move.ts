import type { GoalWithNodes, GoalNode } from "@/types";
import { deriveChapters, type Chapter, type Step } from "./chapters";
import { isRecurring, dayKey } from "./practice";

// The unified walker: ONE definition of "next" shared by the map's beacon, the
// List, and Today, derived from the same chapter chain everything renders.
// Before this, the map and the List each had their own ranking and disagreed,
// and the map's tree walk descended into the continuation milestone's whole
// subtree before offering the milestone itself, so a chapter could never be
// closed until every later chapter was done. The sequence here puts a
// chapter's gate right after its own steps: finish the steps, close the
// chapter, move on. That is what "follow it chronologically" means.

export interface NextMove {
  title: string;
  goalTitle: string;
  goalId: string;
}

/** Actionable now: not done, not blocked, and not a practice already kept today. */
function open(n: GoalNode, todayKey: string): boolean {
  if (n.status === "done" || n.status === "blocked") return false;
  if (isRecurring(n) && (n.checkins ?? []).includes(todayKey)) return false;
  return true;
}

/** The full chronological order of one goal: steps, then sub-moves, then the gate. */
function* sequence(goal: GoalWithNodes): Generator<GoalNode> {
  const { chapters, goalRhythms } = deriveChapters(goal.nodes);
  function* stepSeq(s: Step): Generator<GoalNode> {
    // A broken-down step is completed through its parts: the parts first, the
    // step itself as their gate, the same shape a chapter has.
    for (const sub of s.subs) yield* stepSeq(sub);
    yield s.node;
  }
  function* chapterSeq(c: Chapter): Generator<GoalNode> {
    for (const s of c.steps) yield* stepSeq(s);
    // A chapter's practices belong to its era: they rank after its one-off
    // work and before the gate, and drop out on days they are already kept.
    for (const r of c.rhythms) yield r;
    yield c.node;
  }
  for (const c of chapters) yield* chapterSeq(c);
  for (const r of goalRhythms) yield r;
}

// Something already underway wins wherever it sits: continuity beats strict
// order. in_motion outranks at_risk on purpose (the Mirror surfaces slipping
// separately; the walker's job is "keep moving"), priority breaks ties.
const LIVE_RANK: Record<string, number> = { in_motion: 0, at_risk: 1 };

function liveIn(nodes: GoalNode[]): GoalNode | null {
  const live = nodes
    .filter((n) => n.status === "in_motion" || n.status === "at_risk")
    .sort((a, b) => (LIVE_RANK[a.status] - LIVE_RANK[b.status]) || (a.priority - b.priority));
  return live[0] ?? null;
}

/** The single next step to work on within one goal (null if nothing's open). */
export function nextNodeForGoal(goal: GoalWithNodes): GoalNode | null {
  const todayKey = dayKey(Date.now());
  const live = liveIn(goal.nodes);
  if (live && open(live, todayKey)) return live;
  for (const n of sequence(goal)) if (open(n, todayKey)) return n;
  return null;
}

/** The single best thing to do next across every active goal. */
export function computeNextMove(goals: GoalWithNodes[]): NextMove | null {
  const active = goals.filter((g) => g.status === "active");
  // A goal with live work outranks a goal without; between live candidates the
  // usual rank applies; between cold goals, array order (the user's own goal
  // order) decides.
  let best: { n: GoalNode; g: GoalWithNodes; live: boolean } | null = null;
  for (const g of active) {
    const n = nextNodeForGoal(g);
    if (!n) continue;
    const isLive = n.status === "in_motion" || n.status === "at_risk";
    if (!best) { best = { n, g, live: isLive }; continue; }
    if (isLive && !best.live) { best = { n, g, live: isLive }; continue; }
    if (isLive && best.live) {
      const cmp = (LIVE_RANK[n.status] - LIVE_RANK[best.n.status]) || (n.priority - best.n.priority);
      if (cmp < 0) best = { n, g, live: isLive };
    }
  }
  return best ? { title: best.n.title, goalTitle: best.g.title, goalId: best.g.id } : null;
}
