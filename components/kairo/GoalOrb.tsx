"use client";

import * as React from "react";
import { goalIcon } from "@/lib/kairo/goal-icon";

// A small breathing goal orb. A node orbits it on a TILTED plane in real CSS 3D
// (preserve-3d), so it swings behind the orb on the far side and in front on the
// near side, growing and shrinking with perspective — a little Saturn ring. The
// centre cross-fades through goal-type icons.

const ICON_KEYS = ["target", "fitness", "money", "language", "travel", "rocket", "writing", "music"];

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
    <div aria-hidden className={className} style={{ perspective: "640px" }}>
      <div style={{ display: "grid", placeItems: "center", width: 208, height: 128, transformStyle: "preserve-3d" }}>
        {/* soft glow, held just behind everything */}
        <div style={{ ...cell, width: 138, height: 138, borderRadius: "50%", transform: "translateZ(-6px)", background: "radial-gradient(circle, rgba(230,184,119,0.2), transparent 70%)" }} />

        {/* the tilted orbit plane, spinning, carrying the node through real depth */}
        <div style={{ ...cell, width: 120, height: 120, transformStyle: "preserve-3d", transform: "rotateX(64deg)" }}>
          <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", animation: reduce ? undefined : "orbit 13s linear infinite" }}>
            <span
              style={{
                position: "absolute", left: "50%", top: "50%", width: 12, height: 12, marginLeft: -6, marginTop: -6,
                borderRadius: "50%", transform: "translateX(58px)",
                background: "radial-gradient(circle at 35% 30%, #fdf3e0, #e6b877 60%, #a9803f)",
                boxShadow: "0 0 9px rgba(230,184,119,0.55)",
              }}
            />
          </div>
        </div>

        {/* the central goal orb — faces you at z 0, so it hides the node on the back pass */}
        <div style={{ ...cell, transformStyle: "preserve-3d" }}>
          <div
            className="grid place-items-center rounded-full"
            style={{
              width: 60, height: 60,
              background: "radial-gradient(circle at 36% 30%, #fdf3e0 0%, #e6b877 46%, #7c5c30 100%)",
              boxShadow: "inset 0 2px 6px rgba(255,255,255,0.5), 0 0 28px rgba(230,184,119,0.24)",
              animation: reduce ? undefined : "breathe 7s ease-in-out infinite",
            }}
          >
            {React.createElement(goalIcon(ICON_KEYS[ic]), { key: ic, size: 24, strokeWidth: 1.7, className: "animate-fade-in", style: { color: "rgba(58,40,14,0.74)" } })}
          </div>
        </div>
      </div>
    </div>
  );
}
