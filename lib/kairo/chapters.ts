import type { GoalNode } from "@/types";
import { isRecurring } from "./practice";

// The one chronology authority (docs/specs/tree-redesign.md, section 2).
//
// The AI verifiably emits ONE chain: milestone i+1 is a CHILD of milestone i
// ("depth = time" in the generator prompt), with each milestone's sub-steps as
// its childless children and practices hanging off the milestone that unlocks
// them. So `parentId === null` finds only milestone 1, which is exactly how
// the List came to render milestone 2 styled as a step and silently drop
// milestones 3 to 5. Everything that needs order (the map beacon, the List,
// Today's next move) derives it from here, so the surfaces cannot disagree.

export interface Step {
  node: GoalNode;
  /** broken-down moves under this step (one visual level deep) */
  subs: Step[];
}

export interface Chapter {
  /** the milestone; its own row is the "close the chapter" gate */
  node: GoalNode;
  /** ordered, once-kind work inside this chapter */
  steps: Step[];
  /** recurring children: rhythm, never sequence */
  rhythms: GoalNode[];
}

export interface ChapterizedGoal {
  /** numbered 1..N in emit order */
  chapters: Chapter[];
  /** recurring roots: goal-level rhythm, never numbered */
  goalRhythms: GoalNode[];
}

/**
 * Derive the chapter chain from a goal's nodes. Deterministic, array order
 * preserved throughout. Degradation is defined, not accidental: flat roots
 * (a hand-built goal) become one chapter each; a childless single root is one
 * chapter whose only row is its own gate; an orphaned parentId normalizes to
 * root exactly like the map's layout guard does.
 */
export function deriveChapters(nodes: GoalNode[]): ChapterizedGoal {
  const ids = new Set(nodes.map((n) => n.id));
  const kids = new Map<string | null, GoalNode[]>();
  for (const n of nodes) {
    const parent = n.parentId && ids.has(n.parentId) ? n.parentId : null;
    kids.set(parent, [...(kids.get(parent) ?? []), n]);
  }

  const chapters: Chapter[] = [];
  const goalRhythms: GoalNode[] = [];

  const toStep = (n: GoalNode): Step => ({
    node: n,
    subs: (kids.get(n.id) ?? []).filter((c) => !isRecurring(c)).map((c) => ({ node: c, subs: [] })),
  });

  const chain = (n: GoalNode): void => {
    const children = kids.get(n.id) ?? [];
    const rhythms = children.filter(isRecurring);
    const once = children.filter((c) => !isRecurring(c));
    // The AI appends the next milestone AFTER the sub-steps, so the chain link
    // is the LAST childful once-child. A childful child that is not the
    // continuation is a step Sola broke down: it stays a step whose children
    // render as indented sub-rows, capped at one visual level.
    let continuation: GoalNode | null = null;
    for (let i = once.length - 1; i >= 0; i--) {
      if ((kids.get(once[i].id) ?? []).length > 0) { continuation = once[i]; break; }
    }
    const steps = once.filter((c) => c !== continuation).map(toStep);
    chapters.push({ node: n, steps, rhythms });
    if (continuation) chain(continuation);
  };

  for (const root of kids.get(null) ?? []) {
    if (isRecurring(root)) goalRhythms.push(root);
    else chain(root);
  }

  return { chapters, goalRhythms };
}
