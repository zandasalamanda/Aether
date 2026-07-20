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
        <span className="ml-0.5 rounded bg-accent/15 px-1 py-px font-mono text-[9px] font-semibold uppercase tracking-wide text-accent">Pro</span>
      )}
    </button>
  );
}
