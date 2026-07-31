import { describe, it, expect } from "vitest";
import { Repeat, BookOpen, PlayCircle, CalendarClock, Palette, Dumbbell, Flag, ArrowRight, Wallet } from "lucide-react";
import { nodeIcon } from "./node-icon";

// The rule order in node-icon.ts is load-bearing; these are exactly the
// collisions the ordering exists to win, so a reorder fails loudly.

const n = (title: string, over: Partial<Parameters<typeof nodeIcon>[0]> = {}) =>
  ({ title, firstAction: "", resource: null, ...over });

describe("nodeIcon", () => {
  it("resource kind wins over every keyword", () => {
    expect(nodeIcon(n("Go for a run", { resource: { kind: "watch", label: "x", query: "x" } }))).toBe(PlayCircle);
  });

  it("'run through the set' is practice, not fitness", () => {
    expect(nodeIcon(n("Run through the set twice"))).toBe(Repeat);
    expect(nodeIcon(n("Run 5k on Saturday"))).toBe(Dumbbell);
  });

  it("'book a court' schedules; 'read a book' reads", () => {
    expect(nodeIcon(n("Book a court for Tuesday"))).toBe(CalendarClock);
    expect(nodeIcon(n("Read a book on investing"))).toBe(BookOpen);
  });

  it("'pick colors' is design, not a decision", () => {
    expect(nodeIcon(n("Pick colors and type"))).toBe(Palette);
  });

  it("falls through to the firstAction when the title says nothing", () => {
    expect(nodeIcon(n("The boring part", { firstAction: "Open your banking app and note the budget" }))).toBe(Wallet);
  });

  it("never a dot: chapters fly a Flag, steps an ArrowRight", () => {
    expect(nodeIcon(n("Zzzz"), { chapter: true })).toBe(Flag);
    expect(nodeIcon(n("Zzzz"))).toBe(ArrowRight);
  });
});
