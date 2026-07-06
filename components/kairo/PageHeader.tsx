import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-7 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-cyan/80">{eyebrow}</div>
        )}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-[32px] md:leading-tight">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-xl text-sm text-muted md:text-[15px]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("font-mono text-[11px] uppercase tracking-[0.2em] text-faint", className)}>{children}</div>
  );
}
