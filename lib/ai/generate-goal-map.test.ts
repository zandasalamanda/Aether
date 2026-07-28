import { describe, it, expect } from "vitest";
import { sanitizeGoalMap } from "./generate-goal-map";
import type { GeneratedNode, GoalMapResult } from "./types";

function futureIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}

// Raw model output is untrusted; the cast lets tests feed the sanitiser the
// kind of garbage a real response can carry.
function node(over: Record<string, unknown>): GeneratedNode {
  return {
    title: "Step",
    description: "Do the thing.",
    status: "not_started",
    estimatedMinutes: 30,
    priority: 2,
    aiReason: "why",
    parentIndex: null,
    resource: null,
    ...over,
  } as GeneratedNode;
}

function result(nodes: GeneratedNode[]): GoalMapResult {
  return {
    title: "Learn Spanish",
    description: "A practice goal.",
    suggestedTargetDate: futureIso(),
    nodes,
    firstNextAction: "Pick a course",
    weeklyRhythm: "Daily · 20 min",
  };
}

describe("sanitizeGoalMap practice fields", () => {
  it("keeps a valid recurring kind and its weekly cadence", () => {
    const r = sanitizeGoalMap(
      result([node({}), node({ kind: "recurring", targetPerWeek: 5, parentIndex: 0 })]),
      "learn spanish"
    );
    expect(r.nodes[1].kind).toBe("recurring");
    expect(r.nodes[1].targetPerWeek).toBe(5);
  });

  it("clamps targetPerWeek to whole numbers between 1 and 7", () => {
    const r = sanitizeGoalMap(
      result([
        node({}),
        node({ kind: "recurring", targetPerWeek: 12, parentIndex: 0 }),
        node({ kind: "recurring", targetPerWeek: 0, parentIndex: 0 }),
        node({ kind: "recurring", targetPerWeek: 3.6, parentIndex: 0 }),
      ]),
      "learn spanish"
    );
    expect(r.nodes[1].targetPerWeek).toBe(7);
    expect(r.nodes[2].targetPerWeek).toBe(1);
    expect(r.nodes[3].targetPerWeek).toBe(4);
  });

  it("drops garbage kinds and any cadence riding along with them", () => {
    const r = sanitizeGoalMap(
      result([node({}), node({ kind: "weekly", targetPerWeek: 5, parentIndex: 0 })]),
      "learn spanish"
    );
    expect(r.nodes[1].kind).toBeUndefined();
    expect(r.nodes[1].targetPerWeek).toBeUndefined();
  });

  it("keeps an explicit once kind and strips its cadence", () => {
    const r = sanitizeGoalMap(
      result([node({}), node({ kind: "once", targetPerWeek: 5, parentIndex: 0 })]),
      "learn spanish"
    );
    expect(r.nodes[1].kind).toBe("once");
    expect(r.nodes[1].targetPerWeek).toBeUndefined();
  });

  it("never lets the first node be recurring, so the first next action stays finishable", () => {
    const r = sanitizeGoalMap(
      result([node({ kind: "recurring", targetPerWeek: 7 }), node({ parentIndex: 0 })]),
      "learn spanish"
    );
    expect(r.nodes[0].kind).toBeUndefined();
    expect(r.nodes[0].targetPerWeek).toBeUndefined();
  });

  it("stores null when a recurring node's cadence is missing or not a number", () => {
    const r = sanitizeGoalMap(
      result([node({}), node({ kind: "recurring", targetPerWeek: "daily", parentIndex: 0 })]),
      "learn spanish"
    );
    expect(r.nodes[1].kind).toBe("recurring");
    expect(r.nodes[1].targetPerWeek).toBeNull();
  });
});
