import { describe, it, expect } from "vitest";
import { deriveGoalContext, selectNotesForSola, buildNodeContext } from "./note-context";
import type { Note } from "@/types";

const note = (over: Partial<Note>): Note => ({
  id: "n", goalId: null, nodeId: null, title: "", body: "body", kind: "note", source: "user",
  day: null, pinned: false, solaPrivate: false,
  createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", archivedAt: null,
  ...over,
});

describe("note privacy", () => {
  const notes = [
    note({ id: "a", goalId: "g", body: "public thing" }),
    note({ id: "b", goalId: "g", body: "SECRET", solaPrivate: true }),
    note({ id: "c", goalId: "g", body: "archived thing", archivedAt: "2026-02-01T00:00:00Z" }),
  ];

  it("never lets a private or archived note into any selector", () => {
    expect(deriveGoalContext(notes, "g")).toContain("public thing");
    expect(deriveGoalContext(notes, "g")).not.toContain("SECRET");
    expect(deriveGoalContext(notes, "g")).not.toContain("archived");

    const chat = selectNotesForSola(notes, ["g"], "2026-03-01");
    expect(chat.map((e) => e.id)).toEqual(["a"]);

    const node = buildNodeContext(notes, "g", null);
    expect(node).not.toContain("SECRET");
    expect(node).not.toContain("archived");
  });
});

describe("deriveGoalContext", () => {
  it("puts pinned first, then most recent, and only this goal's notes", () => {
    const notes = [
      note({ id: "old", goalId: "g", title: "Old", body: "old", updatedAt: "2026-01-01T00:00:00Z" }),
      note({ id: "new", goalId: "g", title: "New", body: "new", updatedAt: "2026-06-01T00:00:00Z" }),
      note({ id: "pin", goalId: "g", title: "Pinned", body: "pinned", pinned: true, updatedAt: "2025-01-01T00:00:00Z" }),
      note({ id: "other", goalId: "other", title: "Other", body: "other goal" }),
    ];
    const out = deriveGoalContext(notes, "g");
    expect(out.indexOf("pinned")).toBeLessThan(out.indexOf("new"));
    expect(out.indexOf("new")).toBeLessThan(out.indexOf("old"));
    expect(out).not.toContain("other goal");
    expect(out).toContain("[Pinned]");
  });

  it("stops at the digest cap instead of growing without bound", () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      note({ id: `n${i}`, goalId: "g", body: "x".repeat(1200), updatedAt: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00Z` }),
    );
    expect(deriveGoalContext(many, "g").length).toBeLessThanOrEqual(4000);
  });
});

describe("selectNotesForSola", () => {
  it("takes pinned, then today's daily, then notes for goals in the plan", () => {
    const notes = [
      note({ id: "pin", body: "pinned", pinned: true }),
      note({ id: "today", kind: "daily", day: "2026-03-01", body: "today" }),
      note({ id: "yesterday", kind: "daily", day: "2026-02-28", body: "yesterday" }),
      note({ id: "inplan", goalId: "g1", body: "in plan" }),
      note({ id: "offplan", goalId: "zzz", body: "off plan" }),
    ];
    const ids = selectNotesForSola(notes, ["g1"], "2026-03-01").map((e) => e.id);
    expect(ids).toEqual(["pin", "today", "inplan"]);
  });

  it("caps the entry count and never repeats a note that qualifies twice", () => {
    const dupe = note({ id: "both", goalId: "g1", body: "counts once", pinned: true });
    expect(selectNotesForSola([dupe], ["g1"], "2026-03-01").map((e) => e.id)).toEqual(["both"]);

    const many = Array.from({ length: 30 }, (_, i) => note({ id: `p${i}`, body: `n${i}`, pinned: true }));
    expect(selectNotesForSola(many, [], "2026-03-01").length).toBeLessThanOrEqual(12);
  });
});

describe("buildNodeContext", () => {
  it("puts notes attached to this step ahead of everything else", () => {
    const notes = [
      note({ id: "goalpin", goalId: "g", body: "goal pinned", pinned: true }),
      note({ id: "step", goalId: "g", nodeId: "n1", body: "about this step" }),
      note({ id: "loose", goalId: "g", body: "loose goal note" }),
    ];
    const out = buildNodeContext(notes, "g", "n1");
    expect(out.indexOf("about this step")).toBeLessThan(out.indexOf("goal pinned"));
    expect(out.indexOf("goal pinned")).toBeLessThan(out.indexOf("loose goal note"));
  });
});
