"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { budgetLabel } from "@/lib/kairo/day-budget";

// The time slider is CONTINUOUS: any quarter hour from 30 minutes to 12 hours,
// not a handful of preset stops. Same skin as StepSlider; only the maths under
// the thumb changes. Hour marks are ticks, and a few labels remain as jump
// targets, but the thumb lands wherever you leave it.
export function TimeSlider({ minutes, onMinutes }: { minutes: number; onMinutes: (m: number) => void }) {
  const MIN = 30, MAX = 720, STEP = 15;
  const trackRef = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef(false);
  const pct = ((minutes - MIN) / (MAX - MIN)) * 100;

  const fromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    onMinutes(MIN + Math.round((frac * (MAX - MIN)) / STEP) * STEP);
  };

  const JUMPS = [30, 120, 240, 360, 480, 720];
  return (
    <div>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="How much time do you have today"
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={minutes}
        aria-valuetext={budgetLabel(minutes)}
        onPointerDown={(e) => { drag.current = true; try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ } fromClientX(e.clientX); }}
        onPointerMove={(e) => { if (drag.current) fromClientX(e.clientX); }}
        onPointerUp={() => { drag.current = false; }}
        onPointerCancel={() => { drag.current = false; }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); onMinutes(Math.max(MIN, minutes - STEP)); }
          else if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); onMinutes(Math.min(MAX, minutes + STEP)); }
          else if (e.key === "PageDown") { e.preventDefault(); onMinutes(Math.max(MIN, minutes - 60)); }
          else if (e.key === "PageUp") { e.preventDefault(); onMinutes(Math.min(MAX, minutes + 60)); }
          else if (e.key === "Home") { e.preventDefault(); onMinutes(MIN); }
          else if (e.key === "End") { e.preventDefault(); onMinutes(MAX); }
        }}
        className="relative h-11 cursor-pointer touch-none select-none rounded-full"
      >
        <div className="inset-well absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full" />
        <div className="raised-gold absolute left-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full" style={{ width: `${pct}%`, minWidth: 12 }} />
        {/* hour marks, quieter than stops: they are a ruler, not positions */}
        {Array.from({ length: 12 }, (_, k) => (k + 1) * 60).map((m) => (
          <span
            key={m}
            className="absolute top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${((m - MIN) / (MAX - MIN)) * 100}%`, background: m <= minutes ? "rgba(20,15,3,0.35)" : "var(--color-line-strong)" }}
          />
        ))}
        <span
          className="absolute top-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
          style={{ left: `${pct}%`, background: "radial-gradient(circle at 35% 30%, #fff8ea, #f0d09a 60%, #d9a94f)", boxShadow: "0 1px 2px rgba(0,0,0,0.35), 0 3px 8px -2px rgba(120,84,30,0.5), inset 0 1px 0 rgba(255,255,255,0.7)" }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: "rgba(120,84,30,0.55)" }} />
        </span>
      </div>
      <div className="flex justify-between">
        {JUMPS.map((m) => (
          <button
            key={m}
            onClick={() => onMinutes(m)}
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center rounded px-1 font-mono text-[15px] tabular-nums transition-colors",
              Math.abs(minutes - m) < 8 ? "font-semibold text-accent" : "text-faint hover:text-muted",
            )}
          >
            {budgetLabel(m)}
          </button>
        ))}
      </div>
    </div>
  );
}
