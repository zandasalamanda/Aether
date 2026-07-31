"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "sage" | "warn";

const activeColor: Record<Tone, string> = {
  neutral: "text-ink",
  accent: "text-accent",
  sage: "text-sage",
  warn: "text-warn",
};
const idleHover: Record<Tone, string> = {
  neutral: "hover:text-ink",
  accent: "hover:text-accent",
  sage: "hover:text-sage",
  warn: "hover:text-warn",
};

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  active?: boolean;
  icon?: React.ReactNode;
  pro?: boolean;
}

export function Chip({ tone = "neutral", active = false, icon, pro = false, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        // 36px box plus a 4px hit-area ring on every side reaches the 44px
        // minimum. 4px is chosen so that chips in a `gap-2` row meet exactly
        // rather than overlapping each other's tappable region.
        "raised-btn relative inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[14px] font-medium",
        "before:absolute before:-inset-1 before:content-['']",
        active ? activeColor[tone] : cn("text-muted", idleHover[tone]),
        className
      )}
      {...props}
    >
      {icon}
      {children}
      {pro && (
        <span className="raised-btn pointer-events-none ml-0.5 rounded px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-wide text-accent">Pro</span>
      )}
    </button>
  );
}

/**
 * Pick-one-of-these, as opposed to Chip's do-something.
 *
 * These are different jobs and they were wearing the same clothes. Chip is the
 * app's raised action button, and `raised-btn` plus `rounded-lg` on a 36px
 * control reads as a lifted rectangle. Used for the answers in "Map my goal" it
 * put a row of little square boxes one screen after the same question was asked
 * with soft outlined pills, so the two steps of one flow disagreed about what an
 * option looks like.
 *
 * Outlined pill, 44px. Unselected is a quiet outline; selected is the raised
 * gold surface, so the whole control changes, not just the text colour. Chip
 * only recoloured the label, which left the answer you had chosen almost
 * invisible.
 */
export function OptionChip({ active = false, className, children, ...props }: Omit<ChipProps, "tone" | "pro">) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[14px] transition-colors",
        active
          ? "raised-gold"
          : "border-line bg-transparent text-muted hover:border-accent/40 hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
