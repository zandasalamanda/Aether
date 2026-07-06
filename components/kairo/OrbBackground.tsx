import { cn } from "@/lib/utils";

/**
 * Ambient depth layer — soft drifting orbs of light behind content.
 * Purely decorative, sits at -z and never intercepts pointer events.
 */
export function OrbBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)} aria-hidden>
      <div className="absolute -left-[10%] top-[-8%] h-[42vmax] w-[42vmax] animate-drift rounded-full bg-blue/20 blur-[120px]" />
      <div className="absolute right-[-12%] top-[6%] h-[36vmax] w-[36vmax] animate-drift rounded-full bg-violet/18 blur-[130px] [animation-delay:-8s]" />
      <div className="absolute bottom-[-14%] left-[28%] h-[40vmax] w-[40vmax] animate-drift rounded-full bg-cyan/14 blur-[140px] [animation-delay:-16s]" />
      <div className="absolute inset-0 grid-veil opacity-[0.5]" />
    </div>
  );
}
