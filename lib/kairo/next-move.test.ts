import { describe, it, expect } from "vitest";
import { computeNextMove, nextNodeForGoal } from "./next-move";
import type { GoalWithNodes, GoalNode } from "@/types";

const nd = (over: Partial<GoalNode>): GoalNode => ({
  id: "n", goalId: "g", parentId: null, title: "t", description: "", status: "not_started",
  progress: 0, priority: 3, estimatedMinutes: 30, dueDate: null, positionX: null, positionY: null,
  aiReason: null, resource: null, createdAt: "", updatedAt: "", ...over,
});

const gl = (over: Partial<GoalWithNodes>): GoalWithNodes => ({
  id: "g", userId: "u", title: "Goal", description: "", status: "active", progress: 0,
  targetDate: null, icon: null, notes: "", createdAt: "", updatedAt: "", archivedAt: null, nodes: [], ...over,
});

describe("computeNextMove", () => {
  it("prefers in-motion over at-risk over not-started (continuity beats triage; the Mirror owns slipping)", () => {
    const g = gl({ nodes: [nd({ status: "not_started", title: "NS", id: "a" }), nd({ status: "in_motion", title: "IM", id: "b" }), nd({ status: "at_risk", title: "AR", id: "c" })] });
    expect(computeNextMove([g])?.title).toBe("IM");
  });

  it("breaks live ties by priority (lower first)", () => {
    const g = gl({ nodes: [nd({ status: "in_motion", title: "P3", priority: 3, id: "a" }), nd({ status: "in_motion", title: "P1", priority: 1, id: "b" })] });
    expect(computeNextMove([g])?.title).toBe("P1");
  });

  it("ignores done/blocked nodes and non-active goals", () => {
    const active = gl({ id: "a", title: "Active", nodes: [nd({ status: "done", title: "Done", id: "d" }), nd({ status: "blocked", title: "Blocked", id: "b" }), nd({ status: "not_started", title: "Go", id: "go" })] });
    const paused = gl({ id: "p", status: "paused", nodes: [nd({ status: "in_motion", title: "Nope" })] });
    const move = computeNextMove([paused, active]);
    expect(move?.title).toBe("Go");
    expect(move?.goalId).toBe("a");
  });

  it("returns null when nothing is actionable", () => {
    const g = gl({ nodes: [nd({ status: "done" }), nd({ status: "blocked" })] });
    expect(computeNextMove([g])).toBeNull();
    expect(computeNextMove([])).toBeNull();
  });
});

describe("nextNodeForGoal", () => {
  it("live work wins wherever it sits", () => {
    const g = gl({ nodes: [nd({ status: "not_started", title: "NS", id: "a" }), nd({ status: "at_risk", title: "AR", id: "b" })] });
    expect(nextNodeForGoal(g)?.title).toBe("AR");
  });

  it("returns null when the goal has no open steps", () => {
    expect(nextNodeForGoal(gl({ nodes: [nd({ status: "done", id: "a" }), nd({ status: "blocked", id: "b" })] }))).toBeNull();
  });

  it("offers a chapter's gate right after its own steps, not after every later chapter (the close-the-chapter fix)", () => {
    // m1's steps are done; m2 (the continuation) still has open work. The old
    // walk descended into m2's subtree first, so m1 could never close.
    const g = gl({ nodes: [
      nd({ id: "m1", title: "M1", status: "not_started" }),
      nd({ id: "s1a", title: "S1a", parentId: "m1", status: "done" }),
      nd({ id: "s1b", title: "S1b", parentId: "m1", status: "done" }),
      nd({ id: "m2", title: "M2", parentId: "m1", status: "not_started" }),
      nd({ id: "s2a", title: "S2a", parentId: "m2", status: "not_started" }),
    ] });
    expect(nextNodeForGoal(g)?.id).toBe("m1");
  });

  it("walks in chapter order when nothing is live", () => {
    const g = gl({ nodes: [
      nd({ id: "m1", title: "M1", status: "not_started" }),
      nd({ id: "s1a", title: "S1a", parentId: "m1", status: "not_started" }),
      nd({ id: "m2", title: "M2", parentId: "m1", status: "not_started" }),
      nd({ id: "s2a", title: "S2a", parentId: "m2", status: "not_started" }),
    ] });
    expect(nextNodeForGoal(g)?.id).toBe("s1a");
  });

  it("skips a practice already kept today and offers it when unkept", () => {
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const kept = gl({ nodes: [
      nd({ id: "m1", title: "M1", status: "done" }),
      nd({ id: "p", title: "Practice", parentId: "m1", kind: "recurring", targetPerWeek: 7, checkins: [key] }),
    ] });
    expect(nextNodeForGoal(kept)).toBeNull();
    const unkept = gl({ nodes: [
      nd({ id: "m1", title: "M1", status: "done" }),
      nd({ id: "p", title: "Practice", parentId: "m1", kind: "recurring", targetPerWeek: 7, checkins: [] }),
    ] });
    expect(nextNodeForGoal(unkept)?.id).toBe("p");
  });
});
