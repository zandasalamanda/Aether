import { cn } from "@/lib/utils";

export function KairoMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <radialGradient id="km-core" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#d7fbff" />
          <stop offset="45%" stopColor="#2dd6e8" />
          <stop offset="100%" stopColor="#4c8dff" />
        </radialGradient>
        <linearGradient id="km-arc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2dd6e8" />
          <stop offset="100%" stopColor="#9a7cff" />
        </linearGradient>
      </defs>
      {/* orbit */}
      <path
        d="M16 3.5a12.5 12.5 0 1 1 -9.4 20.7"
        stroke="url(#km-arc)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* node on orbit */}
      <circle cx="6.6" cy="24.2" r="2.1" fill="#9a7cff" />
      {/* glowing core */}
      <circle cx="16" cy="15" r="6.4" fill="url(#km-core)" />
      <circle cx="16" cy="15" r="6.4" fill="url(#km-core)" opacity="0.5" style={{ filter: "blur(3px)" }} />
    </svg>
  );
}

export function Logo({
  className,
  showWordmark = true,
  size = 28,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <KairoMark size={size} />
      {showWordmark && (
        <span className="font-display text-[19px] font-semibold tracking-tight text-ink">
          Kairo
        </span>
      )}
    </span>
  );
}
