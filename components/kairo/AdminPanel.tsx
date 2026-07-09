"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { resetMyAiLimits, setTestPlan } from "@/lib/data/actions";
import { UsageMeter } from "./UsageMeter";
import { SectionLabel } from "./PageHeader";
import type { AiUsage } from "@/lib/ai/usage";

export function AdminPanel({ usage, email }: { usage: AiUsage; email: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label);
    await fn();
    setBusy(null);
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <UsageMeter {...usage} />
      <div className="panel rounded-2xl p-6">
        <SectionLabel className="mb-3">Testing tools</SectionLabel>
        <p className="mb-4 text-[13px] text-muted">
          Signed in as <span className="text-ink">{email}</span> · current plan <span className="text-ink">{usage.plan}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => run("free", () => setTestPlan("free"))} disabled={!!busy} className="raised-btn inline-flex items-center rounded-xl px-4 py-2 text-[13px] text-muted hover:text-ink disabled:opacity-50">
            {busy === "free" ? "Switching…" : "Test as Free"}
          </button>
          <button onClick={() => run("pro", () => setTestPlan("pro"))} disabled={!!busy} className="raised-gold inline-flex items-center rounded-xl px-4 py-2 text-[13px] font-medium disabled:opacity-50">
            {busy === "pro" ? "Switching…" : "Test as Pro"}
          </button>
          <button onClick={() => run("reset", resetMyAiLimits)} disabled={!!busy} className="raised-btn inline-flex items-center rounded-xl px-4 py-2 text-[13px] text-accent hover:text-ink disabled:opacity-50">
            {busy === "reset" ? "Resetting…" : "Reset my AI limits"}
          </button>
        </div>
        <p className="mt-3 text-[11px] text-faint">Only allowlisted admins can see this page. Flipping your plan updates your own account so you can test both tiers; resetting clears just your usage counters.</p>
      </div>
    </div>
  );
}
