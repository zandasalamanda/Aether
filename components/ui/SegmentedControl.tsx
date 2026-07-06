"use client";

import { cn } from "@/lib/utils";

export interface Segment<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1.5 rounded-2xl border border-line bg-white/[0.02] p-1.5", className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cn(
              "flex-1 rounded-xl px-3 py-2.5 text-center transition-all duration-200",
              active
                ? "bg-[linear-gradient(180deg,rgba(45,214,232,0.16),rgba(76,141,255,0.10))] text-ink shadow-[0_0_28px_-10px_rgba(45,214,232,0.7)] ring-1 ring-cyan/40"
                : "text-muted hover:text-ink hover:bg-white/[0.04]"
            )}
          >
            <span className="block text-sm font-medium">{opt.label}</span>
            {opt.hint && <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wide text-faint">{opt.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}
