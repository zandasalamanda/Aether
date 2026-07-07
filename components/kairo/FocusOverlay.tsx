"use client";

import * as React from "react";
import { X, Play, Pause, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [15, 25, 50];

/** A calm, full-screen focus timer for a single step. Completing it logs the step done. */
export function FocusOverlay({
  title,
  hex,
  onComplete,
  onClose,
}: {
  title: string;
  hex: string;
  onComplete: () => void;
  onClose: () => void;
}) {
  const [minutes, setMinutes] = React.useState(25);
  const [left, setLeft] = React.useState(25 * 60);
  const [running, setRunning] = React.useState(false);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const setDur = (m: number) => { setMinutes(m); setLeft(m * 60); setDone(false); setRunning(false); };
  const total = minutes * 60;
  const pct = total ? 1 - left / total : 0;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const R = 100;
  const C = 2 * Math.PI * R;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-canvas/95 px-6 backdrop-blur-xl">
      <button
        onClick={onClose}
        className="absolute right-5 top-[calc(env(safe-area-inset-top)+16px)] grid h-10 w-10 place-items-center rounded-full text-faint transition-colors hover:text-ink"
        aria-label="Close focus"
      >
        <X size={18} />
      </button>

      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">{done ? "Session complete" : "Focusing on"}</span>
        <h2 className="mt-2 line-clamp-2 font-display text-xl font-semibold text-ink">{title}</h2>

        <div className="relative my-9 grid place-items-center" style={{ width: 224, height: 224 }}>
          <span className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${hex}22, transparent 70%)` }} />
          <svg width={224} height={224} className="absolute -rotate-90">
            <circle cx={112} cy={112} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
            <circle
              cx={112}
              cy={112}
              r={R}
              fill="none"
              stroke={hex}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={(1 - pct) * C}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <span
            className={cn("grid h-40 w-40 place-items-center rounded-full", running && "animate-pulse-soft")}
            style={{ background: `radial-gradient(circle at 36% 30%, ${hex}33, rgba(12,14,18,0.9) 72%)`, boxShadow: `0 0 60px ${hex}33, inset 0 0 30px ${hex}22` }}
          >
            <span className="font-display text-4xl font-bold tabular-nums text-ink">{mm}:{ss}</span>
          </span>
        </div>

        {!running && !done && (
          <div className="inset-well mb-6 flex gap-1 rounded-xl p-1">
            {OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => setDur(m)}
                className={cn("rounded-lg px-4 py-2 text-sm transition-colors", minutes === m ? "raised-btn text-ink" : "text-muted hover:text-ink")}
              >
                {m}m
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {done ? (
            <button onClick={onComplete} className="raised-gold inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[15px] font-medium">
              <Check size={18} /> Mark complete
            </button>
          ) : (
            <>
              <button onClick={() => setRunning((r) => !r)} className="raised-gold inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[15px] font-medium">
                {running ? <><Pause size={18} /> Pause</> : <><Play size={18} /> {left < total ? "Resume" : "Start"}</>}
              </button>
              <button onClick={onComplete} className="raised-btn inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] text-sage">
                <Check size={16} /> Done
              </button>
            </>
          )}
        </div>

        {!done && left < total && (
          <button onClick={() => setDur(minutes)} className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-faint transition-colors hover:text-muted">
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>
    </div>
  );
}
