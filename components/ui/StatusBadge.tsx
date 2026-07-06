import { cn } from "@/lib/utils";
import type { StatusMeta } from "@/lib/kairo/status";

export function StatusBadge({
  meta,
  className,
  showDot = true,
}: {
  meta: StatusMeta;
  className?: string;
  showDot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        meta.chip,
        className
      )}
    >
      {showDot && <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />}
      {meta.label}
    </span>
  );
}
