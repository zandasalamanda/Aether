"use client";

import * as React from "react";
import Link from "next/link";
import { TrendingUp, AlertTriangle, ArrowRight, LifeBuoy } from "lucide-react";
import type { ReviewResult } from "@/lib/ai/types";
import { SoftGlassCard } from "@/components/ui/SoftGlassCard";
import { Button, buttonVariants } from "@/components/ui/Button";
import { SectionLabel } from "./PageHeader";
import { cn } from "@/lib/utils";

export function ReviewPanel({ review }: { review: ReviewResult }) {
  const [flash, setFlash] = React.useState<string | null>(null);
  const ping = (m: string) => { setFlash(m); window.setTimeout(() => setFlash((f) => (f === m ? null : f)), 2400); };
  const onTrack = review.risks.length === 0;

  return (
    <div className="max-w-xl space-y-8">
      {/* summary */}
      <div>
        <p className="font-display text-[22px] font-medium leading-snug text-ink md:text-[26px]">{review.summary}</p>
        <div className={cn("mt-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px]", onTrack ? "border-sage/25 bg-sage/[0.06] text-sage" : "border-warn/25 bg-warn/[0.06] text-warn")}>
          {review.recoverability}
        </div>
      </div>

      {/* moved */}
      {review.changes.length > 0 && (
        <ReviewBlock icon={<TrendingUp size={15} className="text-sage" />} label="What moved">
          {review.changes.map((c, i) => <Line key={i} dot="bg-sage">{c}</Line>)}
        </ReviewBlock>
      )}

      {/* at risk */}
      {review.risks.length > 0 && (
        <ReviewBlock icon={<AlertTriangle size={15} className="text-warn" />} label="At risk">
          {review.risks.map((r, i) => <Line key={i} dot="bg-warn">{r}</Line>)}
        </ReviewBlock>
      )}

      {/* next best move */}
      <SoftGlassCard focal className="rounded-2xl p-6">
        <SectionLabel className="text-accent/80">Next best move</SectionLabel>
        <p className="mt-2.5 text-[17px] text-ink">{review.nextBestMove}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <Button variant="primary" onClick={() => ping("Recovery block added to Today.")}>
            <LifeBuoy size={16} /> Add recovery block
          </Button>
          <Link href="/app/today" className={buttonVariants({ variant: "glass" })}>
            Rebuild today <ArrowRight size={15} />
          </Link>
        </div>
        {flash && <p className="mt-3 text-[13px] text-sage">{flash}</p>}
      </SoftGlassCard>
    </div>
  );
}

function ReviewBlock({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <SoftGlassCard className="rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <SectionLabel>{label}</SectionLabel>
      </div>
      <ul className="space-y-2.5">{children}</ul>
    </SoftGlassCard>
  );
}

function Line({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[15px] text-ink/90">
      <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
      {children}
    </li>
  );
}
