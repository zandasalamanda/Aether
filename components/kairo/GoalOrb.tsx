"use client";

import * as React from "react";
import { goalIcon } from "@/lib/kairo/goal-icon";

// A goal orb with a small planet flying around it on a tilted 3D orbit. The
// planet and its trail are BILLBOARDS — they only move, never rotate — so each
// stays a round sphere facing you, while the elliptical path + real z-depth make
// the orbit read as 3D (it passes behind the core up top, and swings in front and
// larger down low). It trails a smooth gold comet tail of tightly-spaced,
// tapering dots. The core is a glossy sphere whose centre cross-fades through
// goal-type icons, in white like the rest of the app.

const ICON_KEYS = ["target", "fitness", "money", "language", "travel", "rocket", "writing", "music"];
const SIZE = 208;
const CORE = 92;
const PERIOD = 9; // seconds per orbit
const TRAIL = 13; // head + tail

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(m.matches);
    read();
    m.addEventListener("change", read);
    return () => m.removeEventListener("change", read);
  }, []);
  return reduced;
}

export function GoalOrb({ className }: { className?: string }) {
  const reduce = usePrefersReducedMotion();
  const [ic, setIc] = React.useState(0);

  React.useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setIc((n) => (n + 1) % ICON_KEYS.length), 2600);
    return () => window.clearInterval(id);
  }, [reduce]);

  const cell: React.CSSProperties = { gridArea: "1 / 1" };

  // The comet: a bright head, then a taper of ever-smaller, fainter dots each
  // lagging a hair behind, so they blend into one clean streak.
  const dots = Array.from({ length: TRAIL }, (_, i) => {
    const f = i / (TRAIL - 1);
    return { size: 16 - i * 0.95, opacity: i === 0 ? 1 : 0.85 * (1 - f * 0.92), delay: i * 0.07, glow: i === 0 };
  });

  return (
    <div aria-hidden className={className} style={{ perspective: "440px" }}>
      <div style={{ display: "grid", placeItems: "center", width: SIZE, height: SIZE, transformStyle: "preserve-3d" }}>
        {/* soft glow */}
        <div style={{ ...cell, width: SIZE * 0.78, height: SIZE * 0.78, borderRadius: "50%", transform: "translateZ(-10px)", background: "radial-gradient(circle, rgba(230,184,119,0.2), transparent 68%)" }} />

        {/* the comet — billboard dots riding the tilted 3D path */}
        {!reduce &&
          dots.map((d, i) => (
            <span
              key={i}
              style={{
                ...cell,
                width: d.size, height: d.size, placeSelf: "center", borderRadius: "50%",
                background: "radial-gradient(circle at 38% 32%, #fff6e6, #e6b877 58%, #a9803f)",
                boxShadow: d.glow ? "0 0 12px rgba(230,184,119,0.7)" : undefined,
                opacity: d.opacity,
                // delay - PERIOD keeps each dot a hair BEHIND the head (trailing),
                // with no first-play gap.
                animation: `comet-path ${PERIOD}s linear ${d.delay - PERIOD}s infinite`,
              }}
            />
          ))}

        {/* the central goal orb — a real sphere at z 0, so it hides the comet on the back pass */}
        <div style={{ ...cell, transformStyle: "preserve-3d" }}>
          <div
            className="relative grid place-items-center rounded-full"
            style={{
              width: CORE, height: CORE,
              background: "radial-gradient(circle at 33% 27%, #fff7e8 0%, #f2d79f 20%, #e6b877 50%, #bb8949 76%, #6d4e27 100%)",
              boxShadow:
                "inset -9px -11px 22px rgba(74,50,18,0.6), inset 6px 7px 15px rgba(255,255,255,0.55), 0 8px 24px -5px rgba(70,46,16,0.5), 0 0 40px rgba(230,184,119,0.26)",
              animation: reduce ? undefined : "breathe 7s ease-in-out infinite",
            }}
          >
            <span
              className="pointer-events-none absolute rounded-full"
              style={{ width: 28, height: 19, left: "22%", top: "18%", background: "radial-gradient(circle, rgba(255,255,255,0.85), rgba(255,255,255,0) 68%)" }}
            />
            {React.createElement(goalIcon(ICON_KEYS[ic]), {
              key: ic,
              size: 34,
              strokeWidth: 1.7,
              className: "animate-fade-in relative",
              style: { color: "#ffffff", opacity: 0.82, filter: "drop-shadow(0 1px 2px rgba(50,34,8,0.55))" },
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
