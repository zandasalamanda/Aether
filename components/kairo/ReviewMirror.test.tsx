// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { ReviewMirror } from "./ReviewMirror";
import type { ReviewInsights } from "@/lib/kairo/review-insights";
import type { GoalWithNodes } from "@/types";

// Review must not grow with the goal count: past four rows a section scrolls
// inside itself instead of stacking down the page.

const goal = (id: string, title: string): GoalWithNodes =>
  ({
    id, userId: "u", title, description: "", status: "active", progress: 40,
    targetDate: null, icon: null, notes: "", createdAt: "2026-01-01", updatedAt: "2026-01-01",
    archivedAt: null, nodes: [],
  }) as GoalWithNodes;

const pace = (goalId: string, title: string) => ({
  goalId, title, state: "behind" as const, verdict: "Behind", progress: 40, timeFraction: 0.7,
});

const insightsFor = (n: number): ReviewInsights =>
  ({
    headline: "h",
    pace: Array.from({ length: n }, (_, i) => pace(`g${i}`, `Goal ${i}`)),
    stalled: [],
    neglected: [],
    practices: [],
  }) as unknown as ReviewInsights;

describe("ReviewMirror", () => {
  it("lets four timed goals render uncapped", () => {
    const { container } = render(
      <ReviewMirror insights={insightsFor(4)} goals={Array.from({ length: 4 }, (_, i) => goal(`g${i}`, `Goal ${i}`))} />,
    );
    expect(container.querySelector(".overflow-y-auto")).toBeNull();
    cleanup();
  });

  it("caps a long goal list to a fixed-height scroll region with the count in the label", () => {
    const { container, getByText } = render(
      <ReviewMirror insights={insightsFor(9)} goals={Array.from({ length: 9 }, (_, i) => goal(`g${i}`, `Goal ${i}`))} />,
    );
    const region = container.querySelector<HTMLElement>(".overflow-y-auto");
    expect(region).not.toBeNull();
    expect(region!.style.maxHeight).toBe("430px");
    // all nine rows exist inside the region; the screen just does not pay for them
    expect(region!.querySelectorAll("a").length).toBe(9);
    getByText(/On pace · 9/);
    cleanup();
  });
});
