import { describe, it, expect } from "vitest";
import { sanitizeBriefing } from "./enrich-step";
import { mockEnrichStep } from "./mock";

const RAW = {
  firstAction: "Open your banking app and write down last month's total spending",
  successCriterion: "One number on paper",
  whenWhereCue: "after dinner, at the kitchen table",
  commonMistakes: [
    { mistake: "Guessing", fix: "Read the statement" },
    { mistake: "Too strict", fix: "Start at 10%" },
    { mistake: "Extra", fix: "Extra fix" },
    { mistake: "Fourth", fix: "Must be dropped" },
  ],
  ifStuck: "Write one category's total",
  whatYoullNeed: ["banking app login", "", "10 minutes", "a", "b", "c"],
  personalNote: null,
  sources: [{ title: "x", url: "https://x" }],
  level: "enriched",
};

describe("sanitizeBriefing", () => {
  it("clamps lists: three mistakes, four needs, no empties", () => {
    const b = sanitizeBriefing(RAW)!;
    expect(b.commonMistakes).toHaveLength(3);
    expect(b.whatYoullNeed).toHaveLength(4);
    expect(b.whatYoullNeed).not.toContain("");
  });

  it("strips sources below the researched level: only a real research merge cites", () => {
    expect(sanitizeBriefing(RAW)!.sources).toEqual([]);
    expect(sanitizeBriefing({ ...RAW, level: "researched" })!.sources).toHaveLength(1);
  });

  it("nulls a personalNote that cites a fact the user never gave", () => {
    const b = sanitizeBriefing({ ...RAW, personalNote: "Sized for your evenings and a tight budget" }, [])!;
    expect(b.personalNote).toBeNull();
  });

  it("keeps a personalNote that quotes a provided fact", () => {
    const b = sanitizeBriefing(
      { ...RAW, personalNote: "Sized for your evenings and a tight budget" },
      ["evenings", "tight"],
    )!;
    expect(b.personalNote).toContain("evenings");
  });

  it("rejects output missing the two skeleton fields", () => {
    expect(sanitizeBriefing({ ...RAW, firstAction: "  " })).toBeNull();
    expect(sanitizeBriefing({ ...RAW, successCriterion: "" })).toBeNull();
    expect(sanitizeBriefing("not an object")).toBeNull();
  });

  it("clamps every string to its budget", () => {
    const b = sanitizeBriefing({ ...RAW, firstAction: "y".repeat(400), ifStuck: "z".repeat(400), whenWhereCue: "w".repeat(400) })!;
    expect(b.firstAction).toHaveLength(160);
    expect(b.ifStuck).toHaveLength(160);
    expect(b.whenWhereCue).toHaveLength(100);
  });
});

describe("mockEnrichStep", () => {
  const CLASSES = [
    ["save money for a house", "money"],
    ["get fit for the summer", "fitness"],
    ["learn spanish", "learning"],
    ["launch a small business", "build"],
    ["tidy the garage", "default"],
  ] as const;

  it("fills every field for every keyword class", () => {
    for (const [goal] of CLASSES) {
      const b = mockEnrichStep("First step", goal);
      expect(b.firstAction, goal).toBeTruthy();
      expect(b.successCriterion, goal).toBeTruthy();
      expect(b.whenWhereCue, goal).toBeTruthy();
      expect(b.commonMistakes.length, goal).toBeGreaterThan(0);
      expect(b.ifStuck, goal).toBeTruthy();
      expect(b.level).toBe("mock");
    }
  });

  it("never claims to know the user and never cites sources", () => {
    for (const [goal] of CLASSES) {
      const b = mockEnrichStep("First step", goal);
      expect(b.personalNote).toBeNull();
      expect(b.sources).toEqual([]);
    }
  });

  it("is distinct across classes, not one template five times", () => {
    const stucks = new Set(CLASSES.map(([goal]) => mockEnrichStep("First step", goal).ifStuck));
    expect(stucks.size).toBe(CLASSES.length);
  });
});
