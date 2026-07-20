"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function KairoMark({ size = 30, className }: { size?: number; className?: string }) {
  // The core gradient needs an id that is unique per instance. The mark renders
  // more than once per page (sidebar plus top bar, header plus footer), and a
  // shared hardcoded id meant every copy pointed at whichever one came first in
  // the document. On mobile that first copy lives inside the `hidden md:flex`
  // sidebar, which is display:none, and WebKit refuses to paint a gradient that
  // is defined inside a display:none subtree. The result was the top bar's mark
  // losing its glowing centre and rendering as a bare ring.
  // useId can contain characters that are not safe inside url(#...), so strip
  // it down to plain alphanumerics.
  const coreId = `km-core-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
      // Soft contact shadow so the orb is seated on cream; near-invisible on dark.
      style={{ filter: "drop-shadow(var(--mark-drop))" }}
    >
      <defs>
        <radialGradient id={coreId} cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#fdf3e0" />
          <stop offset="46%" stopColor="#e6b877" />
          <stop offset="100%" stopColor="#7c5c30" />
        </radialGradient>
      </defs>
      {/* orbit: theme-aware (white on dark, warm-dark arc on cream) */}
      <path
        d="M16 3.5a12.5 12.5 0 1 1 -9.4 20.7"
        style={{ stroke: "var(--mark-orbit)" }}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* node on orbit: theme-aware */}
      <circle cx="6.6" cy="24.2" r="2" style={{ fill: "var(--mark-node)" }} />
      {/* glowing core + hairline rim so it never dissolves into white */}
      <circle cx="16" cy="15" r="6.2" fill={`url(#${coreId})`} style={{ stroke: "var(--mark-rim)" }} strokeWidth="0.75" />
      {/* specular highlight keeps the glossy-orb read on light */}
      <ellipse cx="13.8" cy="12.6" rx="1.8" ry="1.2" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}

export function Logo({
  className,
  showWordmark = true,
  size = 28,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <KairoMark size={size} />
      {showWordmark && (
        <span className="font-display text-[19px] font-semibold tracking-tight text-ink">Solaspace</span>
      )}
    </span>
  );
}
