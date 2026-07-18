"use client";

import * as React from "react";
import { goalIcon } from "@/lib/kairo/goal-icon";
import { CometCanvas } from "./CometCanvas";

// A glossy goal orb that wobbles gently in place like a planet, with a small
// planet flying a smooth orbit behind it, trailing a gold comet tail. The core's
// centre cross-fades through goal-type icons, in white like the rest of the app.

const ICON_KEYS = ["target", "fitness", "money", "language", "travel", "rocket", "writing", "music"];
const SIZE = 208;
const CORE = 92;

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
    <div aria-hidden className={className}>
      <div style={{ display: "grid", placeItems: "center", width: SIZE, height: SIZE }}>
        {/* soft glow */}
        <div style={{ ...cell, width: SIZE * 0.78, height: SIZE * 0.78, borderRadius: "50%", background: "radial-gradient(circle, rgba(230,184,119,0.18), transparent 68%)" }} />

        {/* the orbiting planet + its smooth comet trail, behind the core */}
        <div style={cell}>
          <CometCanvas size={SIZE} />
        </div>

        {/* the central goal orb — a real sphere, wobbling gently in place. Opaque, so
            it hides the comet on the back pass. */}
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
