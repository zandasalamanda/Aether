import { describe, it, expect } from "vitest";
import { formatDuration, formatClock, pct, clampPct, initials, relativeDays } from "./utils";

describe("formatDuration", () => {
  it("renders minutes under an hour", () => {
    expect(formatDuration(25)).toBe("25m");
  });
  it("renders whole hours", () => {
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(120)).toBe("2h");
  });
  it("renders hours and minutes", () => {
    expect(formatDuration(90)).toBe("1h 30m");
  });
});

describe("formatClock", () => {
  it("formats HH:MM into a 12-hour clock", () => {
    expect(formatClock("15:30")).toBe("3:30 PM");
    expect(formatClock("09:05")).toBe("9:05 AM");
  });
  it("returns empty for nullish", () => {
    expect(formatClock(null)).toBe("");
    expect(formatClock(undefined)).toBe("");
  });
});

describe("pct / clampPct", () => {
  it("rounds and clamps", () => {
    expect(pct(72.4)).toBe("72%");
    expect(clampPct(120)).toBe(100);
    expect(clampPct(-5)).toBe(0);
  });
});

describe("initials", () => {
  it("takes up to two initials", () => {
    expect(initials("Alex Rivera")).toBe("AR");
    expect(initials("kairo")).toBe("K");
  });
});

describe("relativeDays", () => {
  it("labels today and empty", () => {
    expect(relativeDays(new Date().toISOString())).toBe("today");
    expect(relativeDays(null)).toBe("");
  });
});
