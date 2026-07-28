import { describe, it, expect } from "vitest";
import { adherence, dayKey, goalProgress, nodeCompletion, toggleCheckin } from "./practice";
import type { GoalNode, GoalWithNodes } from "@/types";

const NOW = Date.parse("2026-07-23T12:00:00");
const DAY = 86_400_000;
const daysAgo = (n: number) => dayKey(NOW - n * DAY);

const node = (o: Partial<GoalNode>): GoalNode => ({
  id: "n", goalId: "g", parentId: null, title: "T", description: "",
  status: "in_motion", progress: 0, priority: 3, estimatedMinutes: 30,
  dueDate: null, positionX: null, positionY: null, aiReason: null,
  resource: null, createdAt: new Date(NOW - 28 * DAY).toISOString(),
  updatedAt: new Date(NOW - DAY).toISOString(), ...o,
});

const goal = (nodes: GoalNode[], o: Partial<GoalWithNodes> = {}): GoalWithNodes => ({
  id: "g", userId: "u", title: "G", description: "", status: "active",
  progress: 0, targetDate: new Date(NOW + 28 * DAY).toISOString(), icon: null,
  notes: "", createdAt: new Date(NOW - 28 * DAY).toISOString(),
  updatedAt: new Date(NOW).toISOString(), archivedAt: null, nodes, ...o,
});

const daily = (checkinDays: number[]) =>
  node({ kind: "recurring", targetPerWeek: 7, checkins: checkinDays.map(daysAgo).sort() });

describe("adherence", () => {
  it("perfect daily keeping reads as 1", () => {
    const a = adherence(daily([...Array(28).keys()]), NOW);
    expect(a.ratio).toBeGreaterThan(0.95);
    expect(a.loggedToday).toBe(true);
  });

  it("half the days reads as roughly half", () => {
    const a = adherence(daily([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26]), NOW);
    expect(a.ratio).toBeGreaterThan(0.4);
    expect(a.ratio).toBeLessThan(0.62);
  });

  it("counts the current week separately", () => {
    const a = adherence(daily([0, 1, 2, 20, 21, 22]), NOW);
    expect(a.weekDone).toBe(3);
    expect(a.weekTarget).toBe(7);
  });

  it("a brand-new practice expects at least one session, not zero", () => {
    const n = daily([]);
    n.createdAt = new Date(NOW - DAY).toISOString();
    expect(adherence(n, NOW).expected).toBeGreaterThanOrEqual(1);
    expect(adherence(n, NOW).ratio).toBe(0);
  });
});

describe("toggleCheckin", () => {
  it("logs today once and undoes on the second tap", () => {
    const once = toggleCheckin(daily([]), NOW);
    expect(once.checkins).toContain(dayKey(NOW));
    const undone = toggleCheckin(once, NOW);
    expect(undone.checkins).not.toContain(dayKey(NOW));
  });

  it("wakes a not-started practice and refreshes updatedAt for stall detection", () => {
    const n = toggleCheckin(daily([]), NOW);
    expect(n.status).toBe("in_motion");
    expect(Date.parse(n.updatedAt)).toBe(NOW);
  });

  it("keeps node.progress equal to adherence, never 100-from-one-tap", () => {
    const n = toggleCheckin(daily([]), NOW);
    expect(n.progress).toBeLessThan(20);
  });
});

describe("nodeCompletion and goalProgress", () => {
  it("once-steps behave exactly as the old done/total count", () => {
    const g = goal([node({ status: "done" }), node({ status: "not_started" })]);
    expect(goalProgress(g, NOW)).toBe(50);
  });

  it("a perfectly kept practice tracks the calendar", () => {
    // Halfway through the goal window, kept daily: contributes ~0.5.
    const c = nodeCompletion(daily([...Array(28).keys()]), goal([]), NOW);
    expect(c).toBeGreaterThan(0.42);
    expect(c).toBeLessThan(0.55);
  });

  it("half-kept practice contributes half of the calendar share", () => {
    const c = nodeCompletion(daily([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26]), goal([]), NOW);
    expect(c).toBeGreaterThan(0.18);
    expect(c).toBeLessThan(0.3);
  });

  it("a practice can never mark the goal finished on its own", () => {
    const g = goal([daily([...Array(28).keys()])]);
    expect(goalProgress(g, NOW)).toBeLessThan(100);
  });

  it("without a goal deadline the honest number is the adherence itself", () => {
    const c = nodeCompletion(daily([...Array(28).keys()]), goal([], { targetDate: null }), NOW);
    expect(c).toBeGreaterThan(0.95);
  });
});
