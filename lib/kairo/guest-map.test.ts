import { describe, it, expect } from "vitest";
import { templateToShowcaseMap } from "./guest-map";
import { templateToMap, TEMPLATES } from "./templates";

const t = TEMPLATES[0];

describe("templateToShowcaseMap", () => {
  it("carries the template's identity and colour into a ShowcaseMap", () => {
    const map = templateToShowcaseMap(t, "#e6b877");
    expect(map.id).toBe(t.id);
    expect(map.title).toBe(t.title);
    expect(map.color).toBe("#e6b877");
    expect(map.milestones.length).toBe(t.milestones.length);
  });

  it("flattens each milestone's sub-steps to titles", () => {
    const map = templateToShowcaseMap(t, "#000");
    map.milestones.forEach((m, i) => {
      expect(m.title).toBe(t.milestones[i].title);
      expect(m.subs.map((s) => s.title)).toEqual((t.milestones[i].subs ?? []).map((s) => s.title));
    });
  });
});

describe("template round-trips to a persistable map", () => {
  it("templateToMap yields nodes whose parents always precede them", () => {
    const res = templateToMap(t, 0);
    expect(res.nodes.length).toBeGreaterThan(0);
    res.nodes.forEach((n, i) => {
      if (n.parentIndex != null) expect(n.parentIndex).toBeLessThan(i);
    });
  });
});
