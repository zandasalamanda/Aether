"use client";

import * as React from "react";
import { goalIcon } from "@/lib/kairo/goal-icon";

// A glossy goal orb that wobbles gently in place like a planet, with a smaller
// planet flying a smooth, near-round 3D orbit around it — passing behind the core
// up top and in front down low. The planet is a billboard (it only moves, never
// rotates) so it stays a round sphere, and it drags a short, tapering gold trail
// behind it (fading and shrinking, so it never reads as several separate orbs).
// The core's centre cross-fades through goal-type icons, in white.

const ICON_KEYS = ["target", "fitness", "money", "language", "travel", "rocket", "writing", "music"];
const SIZE = 216;
const CORE = 92;
const PERIOD = 10; // seconds per orbit

// Head first, then a few quickly-fading, shrinking ghosts close behind it.
const TAIL = [
  { delay: 0, s: 24, o: 1, glow: true },
  { delay: 0.16, s: 19, o: 0.45, glow: false },
  { delay: 0.32, s: 15, o: 0.24, glow: false },
  { delay: 0.5, s: 11, o: 0.12, glow: false },
  { delay: 0.7, s: 8, o: 0.05, glow: false },
];

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

  return (
    <div aria-hidden className={className} style={{ perspective: "460px" }}>
      <div style={{ display: "grid", placeItems: "center", width: SIZE, height: SIZE, transformStyle: "preserve-3d" }}>
        {/* soft glow */}
        <div style={{ ...cell, width: SIZE * 0.76, height: SIZE * 0.76, borderRadius: "50%", background: "radial-gradient(circle, rgba(230,184,119,0.18), transparent 68%)" }} />

        {/* the orbiting planet + its short trail (billboards, so each stays round) */}
        {!reduce &&
          TAIL.map((p, i) => (
            <span
              key={i}
              style={{
                ...cell,
                placeSelf: "center",
                width: p.s, height: p.s, borderRadius: "50%",
                background: "radial-gradient(circle at 36% 30%, #fff6e6 0%, #f0d49a 34%, #e6b877 62%, #a9803f 100%)",
                boxShadow: p.glow ? "inset 1px 1px 2px rgba(255,255,255,0.6), 0 0 14px rgba(230,184,119,0.6)" : undefined,
                opacity: p.o,
                animation: `comet-path ${PERIOD}s linear ${p.delay - PERIOD}s infinite`,
              }}
            />
          ))}

        {/* the central goal orb — a real sphere, wobbling gently in place. Opaque, so
            it hides the planet on the back pass. */}
        <div style={cell} className={reduce ? undefined : "animate-bobble"}>
          <div
            className="relative grid place-items-center rounded-full"
            style={{
              width: CORE, height: CORE,
              background: "radial-gradient(circle at 33% 27%, #fff7e8 0%, #f2d79f 20%, #e6b877 50%, #bb8949 76%, #6d4e27 100%)",
              boxShadow:
                "inset -9px -11px 22px rgba(74,50,18,0.6), inset 6px 7px 15px rgba(255,255,255,0.55), 0 8px 24px -5px rgba(70,46,16,0.5), 0 0 40px rgba(230,184,119,0.26)",
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
