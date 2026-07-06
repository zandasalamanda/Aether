"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "sage" | "warn";

const tones: Record<Tone, { idle: string; active: string }> = {
  neutral: { idle: "border-line text-muted hover:border-line-strong hover:text-ink", active: "border-line-strong bg-white/[0.06] text-ink" },
  accent: { idle: "border-line text-muted hover:border-accent/40 hover:text-accent", active: "border-accent/40 bg-accent/10 text-accent" },
  sage: { idle: "border-line text-muted hover:border-sage/40 hover:text-sage", active: "border-sage/40 bg-sage/10 text-sage" },
  warn: { idle: "border-line text-muted hover:border-warn/40 hover:text-warn", active: "border-warn/40 bg-warn/10 text-warn" },
};

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  active?: boolean;
  icon?: React.ReactNode;
}

export function Chip({ tone = "neutral", active = false, icon, className, children, ...props }: ChipProps) {
  const t = tones[tone];
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors",
        active ? t.active : t.idle,
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
