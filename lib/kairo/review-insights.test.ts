import { describe, it, expect } from "vitest";
import { computeReviewInsights } from "./review-insights";
import type { GoalWithNodes, GoalNode, NodeStatus } from "@/types";

const NOW = Date.parse("2026-07-07T00:00:00Z");
const DAY = 86_400_000;
const ago = (d: number) => new Date(NOW - d * DAY).toISOString();
const ahead = (d: number) => new Date(NOW + d * DAY).toISOString();

function node(status: NodeStatus, updatedDaysAgo: number): GoalNode {
  return {
    id: "n" + Math.round(updatedDaysAgo), goalId: "g", parentId: null, title: "Step", description: "",
    status, progress: 0, priority: 3, estimatedMinutes: 30, dueDate: null, positionX: null, positionY: null,
    aiReason: null, resource: null, createdAt: ago(30), updatedAt: ago(updatedDaysAgo),
  };
}

function goal(over: Partial<GoalWithNodes>): GoalWithNodes {
  return {
    id: "g", userId: "u", title: "Goal", description: "", status: "active", progress: 0,
    targetDate: null, icon: null, notes: "", createdAt: ago(60), updatedAt: ago(1), archivedAt: null,
    nodes: [], ...over,
  };
}

// A goal that started 60 days ago with the deadline 40 days out (60% of the timeline gone).
const timed = (progress: number, over: Partial<GoalWithNodes> = {}) =>
  goal({ progress, createdAt: ago(60), targetDate: ahead(40), ...over });

describe("computeReviewInsights — pace", () => {
  it("flags behind when progress lags time elapsed", () => {
    const r = computeReviewInsights([timed(40, { id: "a", title: "A" })], NOW);
    expect(r.pace[0].state).toBe("behind");
    expect(r.pace[0].verdict).toMatch(/late/);
  });

  it("flags ahead when progress leads time comfortably", () => {
    expect(computeReviewInsights([timed(80)], NOW).pace[0].state).toBe("ahead");
  });

  it("calls it on track when progress roughly matches time", () => {
    expect(computeReviewInsights([timed(60)], NOW).pace[0].state).toBe("on");
  });

  it("marks overdue past the deadline", () => {
    const r = computeReviewInsights([goal({ progress: 50, createdAt: ago(60), targetDate: ago(5) })], NOW);
    expect(r.pace[0].state).toBe("overdue");
  });

  it("says none with no deadline and done at 100%", () => {
    expect(computeReviewInsights([goal({ progress: 30 })], NOW).pace[0].state).toBe("none");
    expect(computeReviewInsights([goal({ progress: 100, targetDate: ahead(40) })], NOW).pace[0].state).toBe("done");
  });

  it("sorts most-urgent first", () => {
    const r = computeReviewInsights(
      [timed(80, { id: "ahead" }), timed(40, { id: "behind" }), goal({ id: "none", progress: 10 })],
      NOW
    );
    expect(r.pace.map((p) => p.goalId)).toEqual(["behind", "ahead", "none"]);
  });
});

describe("computeReviewInsights — stalled & neglected", () => {
  it("surfaces in-motion/blocked steps untouched 7+ days", () => {
    const g = timed(40, { nodes: [node("in_motion", 12), node("in_motion", 2), node("not_started", 30)] });
    const r = computeReviewInsights([g], NOW);
    expect(r.stalled).toHaveLength(1);
    expect(r.stalled[0].days).toBe(12);
  });

  it("surfaces goals with no activity in 10+ days", () => {
    const g = goal({ progress: 30, updatedAt: ago(15), nodes: [node("not_started", 15)] });
    const r = computeReviewInsights([g], NOW);
    expect(r.neglected).toHaveLength(1);
    expect(r.neglected[0].days).toBe(15);
  });

  it("does not neglect a recently-touched goal", () => {
    const g = goal({ progress: 30, updatedAt: ago(1), nodes: [node("not_started", 1)] });
    expect(computeReviewInsights([g], NOW).neglected).toHaveLength(0);
  });
});

describe("computeReviewInsights — headline", () => {
  it("reports when everything is on pace", () => {
    expect(computeReviewInsights([timed(80)], NOW).headline).toMatch(/on pace/i);
  });
  it("counts slipping goals", () => {
    const r = computeReviewInsights([timed(40, { id: "a" }), timed(80, { id: "b" })], NOW);
    expect(r.headline).toMatch(/1 of 2/);
  });
});
