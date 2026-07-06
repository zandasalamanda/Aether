import { describe, it, expect } from "vitest";
import { parseDeadline } from "./deadline";

// Thursday, Jan 15 2026, 09:00
const NOW = new Date(2026, 0, 15, 9, 0, 0);
const on = (p: string) => parseDeadline(p, NOW);
const dateOf = (iso?: string) => new Date(iso ?? "");

describe("parseDeadline", () => {
  it("parses ISO dates", () => {
    expect(on("finish by 2026-09-01")?.iso.slice(0, 10)).toBe("2026-09-01");
  });

  it("parses numeric M/D", () => {
    const d = on("due 3/20");
    expect(dateOf(d?.iso).getMonth()).toBe(2);
    expect(dateOf(d?.iso).getDate()).toBe(20);
  });

  it("parses 'in N weeks'", () => {
    const d = on("in 3 weeks");
    expect(dateOf(d?.iso).getMonth()).toBe(1); // Feb
    expect(dateOf(d?.iso).getDate()).toBe(5);
  });

  it("parses a bare month to its next occurrence", () => {
    const d = on("launch my app by September");
    expect(dateOf(d?.iso).getMonth()).toBe(8);
    expect(dateOf(d?.iso).getFullYear()).toBe(2026);
  });

  it("parses a month with a day", () => {
    const d = on("due sept 15");
    expect(dateOf(d?.iso).getMonth()).toBe(8);
    expect(dateOf(d?.iso).getDate()).toBe(15);
  });

  it("rolls a past month into next year", () => {
    // Jan 1 is before Jan 15 (now) → next January is 2027
    expect(dateOf(on("by january")?.iso).getFullYear()).toBe(2027);
  });

  it("parses a weekday to its next occurrence", () => {
    expect(dateOf(on("finish by friday")?.iso).getDay()).toBe(5);
  });

  it("parses 'end of month' and 'tomorrow'", () => {
    expect(dateOf(on("by end of month")?.iso).getDate()).toBe(31);
    expect(dateOf(on("tomorrow")?.iso).getDate()).toBe(16);
  });

  it("returns null when there is no date", () => {
    expect(parseDeadline("launch my app")).toBeNull();
    expect(parseDeadline("study for finals")).toBeNull();
  });
});
