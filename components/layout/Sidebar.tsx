"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Zap } from "lucide-react";
import { NAV } from "./nav";
import { Logo } from "@/components/kairo/Logo";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

export function Sidebar({ user, className }: { user: SessionUser; className?: string }) {
  const pathname = usePathname();
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-[248px] flex-col justify-between border-r border-line bg-canvas-2/60 px-4 py-6 backdrop-blur-xl",
        className
      )}
    >
      <div>
        <Link href="/app/today" className="mb-8 flex px-2">
          <Logo />
        </Link>
        <nav className="space-y-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "text-ink" : "text-muted hover:text-ink hover:bg-white/[0.03]"
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg border transition-all",
                    active
                      ? "border-cyan/40 bg-cyan/10 text-cyan shadow-[0_0_20px_-6px_rgba(45,214,232,0.8)]"
                      : "border-line bg-white/[0.02] text-muted group-hover:text-ink"
                  )}
                >
                  <Icon size={16} strokeWidth={2} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3">
        {user.plan === "free" && (
          <Link
            href="/app/billing"
            className="block rounded-2xl border border-violet/25 bg-[linear-gradient(180deg,rgba(154,124,255,0.14),rgba(76,141,255,0.06))] p-4 transition-all hover:border-violet/45"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Zap size={15} className="text-violet" /> Upgrade to Pro
            </div>
            <p className="mt-1 text-xs text-muted">Unlimited goals, deeper AI planning, and forecasting.</p>
          </Link>
        )}
        <div className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[linear-gradient(135deg,#2dd6e8,#9a7cff)] text-[13px] font-semibold text-[#04121c]">
            {user.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-ink">{user.name}</div>
            <div className="font-mono text-[10px] uppercase tracking-wide text-faint">{user.plan} plan</div>
          </div>
          <Link href="/app/settings" className="text-muted transition-colors hover:text-ink" aria-label="Settings">
            <Settings size={16} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
