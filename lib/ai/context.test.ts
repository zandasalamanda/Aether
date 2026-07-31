import { describe, it, expect } from "vitest";
import { buildContextBlock, providedFactValues } from "./context";
import type { UserContext } from "./types";

const CTX: UserContext = {
  ageBand: "45_54",
  scheduleShape: "evenings",
  granularity: "very_small",
  region: "Leiden, NL",
  budgetComfort: "tight",
  busyWith: "full-time job, two kids under 5",
};

describe("buildContextBlock", () => {
  it("returns an empty string when nothing is known", () => {
    expect(buildContextBlock(null, null, "goal-map")).toBe("");
    expect(buildContextBlock({}, {}, "enrich")).toBe("");
  });

  it("gates region: it reaches enrich and research, never goal-map or draft", () => {
    expect(buildContextBlock(CTX, null, "enrich")).toContain("Leiden");
    expect(buildContextBlock(CTX, null, "research")).toContain("Leiden");
    expect(buildContextBlock(CTX, null, "goal-map")).not.toContain("Leiden");
    expect(buildContextBlock(CTX, null, "draft")).not.toContain("Leiden");
  });

  it("draft sees only the life shape", () => {
    const b = buildContextBlock(CTX, null, "draft");
    expect(b).toContain("two kids");
    expect(b).not.toContain("45-54");
    expect(b).not.toContain("tight");
  });

  it("never leaks a private budget answer", () => {
    const b = buildContextBlock({ ...CTX, budgetComfort: "private" }, null, "enrich");
    expect(b).not.toContain("Budget");
    expect(b).not.toContain("private");
  });

  it("renders goal intake and always appends the standing instruction", () => {
    const b = buildContextBlock(null, { "Target date?": "3 months" }, "goal-map");
    expect(b).toContain("Goal answers: Target date: 3 months");
    expect(b).toContain("Never invent, guess, or restate facts as questions.");
  });

  it("adds the sizing line for very small steps, only where steps are generated", () => {
    expect(buildContextBlock(CTX, null, "goal-map")).toContain("no once-step over 30 minutes");
    expect(buildContextBlock(CTX, null, "expand")).toContain("no once-step over 30 minutes");
    expect(buildContextBlock(CTX, null, "enrich")).not.toContain("no once-step over 30 minutes");
  });

  it("standard granularity is the default and says nothing", () => {
    const b = buildContextBlock({ scheduleShape: "mornings", granularity: "standard" }, null, "goal-map");
    expect(b).toContain("mornings");
    expect(b).not.toContain("standard");
  });
});

describe("providedFactValues", () => {
  it("collects the values a personalNote may cite, excluding private", () => {
    const v = providedFactValues({ ...CTX, budgetComfort: "private" }, { "Deadline?": "in 6 weeks" });
    expect(v).toContain("evenings");
    expect(v).toContain("Leiden, NL");
    expect(v).toContain("in 6 weeks");
    expect(v).not.toContain("");
    expect(v.join(" ")).not.toContain("private");
  });
});
