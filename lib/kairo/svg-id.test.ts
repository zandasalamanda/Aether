import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// The guard for the mobile black-orb bug. See svg-id.ts for why this keeps
// happening: a literal id on a <defs> child collides between component
// instances, and on a phone the losing reference paints flat black.
//
// This test reads the source rather than rendering anything, because the bug
// only appears in a real WebKit layout with a display:none sibling, which no
// jsdom test can reproduce. Grepping the source is the only check that actually
// holds the line.

const ROOT = join(__dirname, "..", "..");
const DIRS = ["components", "app"];

// Elements that define something referenced later by url(#id). A literal id on
// any of these is the bug.
const DEFS = "linearGradient|radialGradient|mask|filter|clipPath|pattern|marker|symbol";
const LITERAL_ID = new RegExp(`<(${DEFS})\\s[^>]*\\bid="`, "g");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      walk(full, out);
    } else if (/\.tsx?$/.test(entry)) {
      // Standalone .svg files are deliberately excluded: they are whole
      // documents rendered on their own (favicon, OG image), never composed
      // into a page beside a second copy of themselves, so a literal id there
      // cannot collide.
      out.push(full);
    }
  }
  return out;
}

describe("SVG paint-server ids", () => {
  it("are never hardcoded, so they cannot collide between instances on mobile", () => {
    const offenders: string[] = [];

    for (const d of DIRS) {
      for (const file of walk(join(ROOT, d))) {
        const src = readFileSync(file, "utf8");
        for (const m of src.matchAll(LITERAL_ID)) {
          const line = src.slice(0, m.index).split("\n").length;
          offenders.push(`${relative(ROOT, file)}:${line}  <${m[1]} id="...">`);
        }
      }
    }

    expect(
      offenders,
      `Hardcoded SVG def id(s). Derive the id from useSvgId("prefix") in lib/kairo/svg-id.ts instead, or this paints flat black on mobile:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
