import { describe, it, expect } from "vitest";
import { deriveChapters } from "./chapters";
import type { GoalNode } from "@/types";

const nd = (id: string, over: Partial<GoalNode> = {}): GoalNode => ({
  id, goalId: "g", parentId: null, title: id, description: "", status: "not_started",
  progress: 0, priority: 3, estimatedMinutes: 30, dueDate: null, positionX: null, positionY: null,
  aiReason: null, resource: null, createdAt: "", updatedAt: "", ...over,
});

// The AI's real shape: milestones chained (m2 is a child of m1), sub-steps as
// childless children, the continuation appended after the sub-steps.
const chain = (): GoalNode[] => [
  nd("m1"),
  nd("s1a", { parentId: "m1" }),
  nd("s1b", { parentId: "m1" }),
  nd("m2", { parentId: "m1" }),
  nd("s2a", { parentId: "m2" }),
  nd("m3", { parentId: "m2" }),
  nd("s3a", { parentId: "m3" }),
];

describe("deriveChapters", () => {
  it("walks the AI's chain into ordered chapters (the shape that broke the List)", () => {
    const { chapters } = deriveChapters(chain());
    expect(chapters.map((c) => c.node.id)).toEqual(["m1", "m2", "m3"]);
    expect(chapters[0].steps.map((s) => s.node.id)).toEqual(["s1a", "s1b"]);
    expect(chapters[2].steps.map((s) => s.node.id)).toEqual(["s3a"]);
  });

  it("treats flat roots (a hand-built goal) as one chapter each", () => {
    const { chapters } = deriveChapters([nd("a"), nd("b"), nd("c")]);
    expect(chapters.map((c) => c.node.id)).toEqual(["a", "b", "c"]);
    expect(chapters.every((c) => c.steps.length === 0)).toBe(true);
  });

  it("keeps a broken-down step mid-chain as a step with subs, not a chapter", () => {
    const nodes = [
      nd("m1"),
      nd("s1", { parentId: "m1" }),
      nd("s1x", { parentId: "s1" }), // Sola broke s1 down
      nd("m2", { parentId: "m1" }),  // the LAST childful child is the chain link
      nd("s2", { parentId: "m2" }),
    ];
    const { chapters } = deriveChapters(nodes);
    expect(chapters.map((c) => c.node.id)).toEqual(["m1", "m2"]);
    expect(chapters[0].steps.map((s) => s.node.id)).toEqual(["s1"]);
    expect(chapters[0].steps[0].subs.map((s) => s.node.id)).toEqual(["s1x"]);
  });

  it("routes recurring nodes to rhythms, never to the numbered sequence", () => {
    const nodes = [
      nd("practice-root", { kind: "recurring", targetPerWeek: 7 }),
      nd("m1"),
      nd("gym", { parentId: "m1", kind: "recurring", targetPerWeek: 4 }),
      nd("s1", { parentId: "m1" }),
    ];
    const { chapters, goalRhythms } = deriveChapters(nodes);
    expect(goalRhythms.map((r) => r.id)).toEqual(["practice-root"]);
    expect(chapters).toHaveLength(1);
    expect(chapters[0].rhythms.map((r) => r.id)).toEqual(["gym"]);
    expect(chapters[0].steps.map((s) => s.node.id)).toEqual(["s1"]);
  });

  it("handles a single childless root and an orphaned parentId", () => {
    expect(deriveChapters([nd("only")]).chapters.map((c) => c.node.id)).toEqual(["only"]);
    const { chapters } = deriveChapters([nd("a", { parentId: "ghost" })]);
    expect(chapters.map((c) => c.node.id)).toEqual(["a"]); // orphan normalizes to root
  });
});
