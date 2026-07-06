import type { GoalWithNodes } from "@/types";

export interface NextMove {
  title: string;
  goalTitle: string;
  goalId: string;
}

// Rank actionable nodes: slipping first, then in-motion, then not-started.
const RANK: Record<string, number> = { at_risk: 0, in_motion: 1, not_started: 2 };

/** The single best thing to do next across every active goal. */
export function computeNextMove(goals: GoalWithNodes[]): NextMove | null {
  const candidates = goals
    .filter((g) => g.status === "active")
    .flatMap((g) =>
      g.nodes
        .filter((n) => n.status === "at_risk" || n.status === "in_motion" || n.status === "not_started")
        .map((n) => ({ n, g }))
    );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (RANK[a.n.status] - RANK[b.n.status]) || (a.n.priority - b.n.priority));
  const { n, g } = candidates[0];
  return { title: n.title, goalTitle: g.title, goalId: g.id };
}
