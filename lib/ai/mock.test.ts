import { describe, it, expect } from "vitest";
import { mockGoalMap, mockDailyPlan, mockSortInbox, mockReview } from "./mock";
import { buildSeed } from "@/lib/mock/seed";

describe("mockGoalMap", () => {
  it("produces a structured, ordered map from a prompt", () => {
    const r = mockGoalMap({ prompt: "Launch my app by September" });
    expect(r.title).toBe("Launch my app by September");
    expect(r.nodes.length).toBeGreaterThanOrEqual(5);
    expect(r.nodes[0].status).toBe("in_motion");
    expect(r.nodes.slice(1).every((n) => n.status === "not_started")).toBe(true);
    expect(new Date(r.suggestedTargetDate).getTime()).toBeGreaterThan(Date.now());
    expect(typeof r.firstNextAction).toBe("string");
    expect(r.firstNextAction.length).toBeGreaterThan(0);
  });

  it("is deterministic for the same prompt", () => {
    expect(mockGoalMap({ prompt: "Study better for finals" })).toEqual(
      mockGoalMap({ prompt: "Study better for finals" })
    );
  });

  it("selects a theme by keyword", () => {
    expect(mockSortInbox).toBeTypeOf("function");
    const study = mockGoalMap({ prompt: "study for exams" });
    expect(study.nodes.some((n) => /syllabus|study|mock test/i.test(n.title))).toBe(true);
  });
});

describe("mockDailyPlan", () => {
  const goals = buildSeed().goals;

  it("never exceeds the available budget", () => {
    const r = mockDailyPlan({ availableMinutes: 90, energy: "normal", context: "", goals });
    const total = r.blocks.reduce((s, b) => s + b.durationMinutes, 0);
    expect(total).toBeLessThanOrEqual(90);
    expect(r.blocks.every((b) => b.nodeId)).toBe(true);
  });

  it("keeps blocks short on low energy", () => {
    const r = mockDailyPlan({ availableMinutes: 120, energy: "low", context: "", goals });
    expect(r.blocks.every((b) => b.durationMinutes <= 30)).toBe(true);
  });

  it("surfaces a recovery note when a node is at risk", () => {
    const r = mockDailyPlan({ availableMinutes: 180, energy: "high", context: "", goals });
    expect(r.recoveryNote).toBeTruthy();
  });
});

describe("mockSortInbox", () => {
  it("categorizes by urgency and impact", () => {
    const r = mockSortInbox({
      items: [
        { id: "a", content: "Pay the electric bill today" },
        { id: "b", content: "Design the new landing page" },
        { id: "c", content: "maybe someday learn the violin" },
      ],
    });
    const byId = Object.fromEntries(r.items.map((i) => [i.id, i.category]));
    expect(byId.a).toBe("must_do");
    expect(byId.b).toBe("high_impact");
    expect(byId.c).toBe("not_worth_doing");
    expect(r.items.length).toBe(3);
  });
});

describe("mockReview", () => {
  it("summarizes movement and the next best move", () => {
    const r = mockReview({ goals: buildSeed().goals, recentPlan: buildSeed().todayPlan });
    expect(r.changes.length).toBeGreaterThan(0);
    expect(r.nextBestMove).toContain("focused block");
    expect(typeof r.recoverability).toBe("string");
  });
});
