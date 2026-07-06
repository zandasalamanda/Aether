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
        "grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-colors",
        listening ? "border-accent/50 bg-accent/10 text-accent" : "border-line text-faint hover:bg-white/5 hover:text-ink",
        className
      )}
    >
      <Mic size={16} className={listening ? "animate-pulse-soft" : ""} />
    </button>
  );
}
