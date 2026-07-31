"use client";

import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

export function MicButton({ listening, onClick, className }: { listening: boolean; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={listening ? "Stop dictation" : "Dictate"}
      aria-pressed={listening}
      className={cn(
        "raised-btn grid h-11 w-11 shrink-0 place-items-center rounded-lg",
        listening ? "text-accent" : "text-muted hover:text-ink",
        className
      )}
      style={listening ? { ["--btn-border" as string]: "color-mix(in srgb, var(--color-accent) 50%, transparent)" } : undefined}
    >
      <Mic size={16} className={listening ? "animate-pulse-soft" : ""} />
    </button>
  );
}
