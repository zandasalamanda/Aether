"use client";

import Link from "next/link";
import { SectionLabel } from "./PageHeader";
import { cn } from "@/lib/utils";

interface Props {
  plan: "free" | "pro";
  dayUsed: number;
  dayLimit: number;
  monthUsed: number;
  monthLimit: number;
  proDay: number;
  proMonth: number;
}

export function UsageMeter({ plan, dayUsed, dayLimit, monthUsed, monthLimit, proDay, proMonth }: Props) {
  const over = dayUsed >= dayLimit;
  const pct = Math.min(100, Math.round((dayUsed / Math.max(1, dayLimit)) * 100));
  const multiple = Math.max(1, Math.round(proDay / Math.max(1, dayLimit)));

  return (
    <div className="panel rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <SectionLabel>AI usage</SectionLabel>
        <span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">{plan} plan</span>
      </div>

      <div className="flex items-center justify-between text-[13px]">
        <span className="text-muted">Today</span>
        <span className={cn("font-mono", over ? "text-warn" : "text-ink")}>{dayUsed} / {dayLimit}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full rounded-full transition-all", over ? "bg-warn" : "bg-accent")} style={{ width: `${pct}%` }} />
      </div>
      {over ? (
        <p className="mt-2 text-[12px] text-warn">
          You&rsquo;ve hit today&rsquo;s limit — it resets within a day.{plan === "free" ? " Upgrade to Pro for far more." : ""}
        </p>
      ) : (
        <p className="mt-2 text-[12px] text-faint">{dayLimit - dayUsed} left today · {monthUsed} / {monthLimit} this month</p>
      )}

      {plan === "free" && (
        <div className="mt-5 rounded-xl border border-accent/20 bg-accent/[0.05] p-4">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-ink">With Pro</span>
            <span className="font-mono text-accent">{proDay} / day · {proMonth} / mo</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-accent/60" style={{ width: `${Math.min(100, Math.round((dayLimit / proDay) * 100))}%` }} />
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
            That&rsquo;s about {multiple}× your free daily credits — plus unlimited goals, Ask Sola, the adapting map, and grounded Research.
          </p>
          <Link href="/app/billing" className="raised-gold mt-3 inline-flex items-center rounded-lg px-3.5 py-1.5 text-[13px] font-medium">Upgrade to Pro</Link>
        </div>
      )}
    </div>
  );
}
