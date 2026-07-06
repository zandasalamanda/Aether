"use client";

import * as React from "react";
import Link from "next/link";
import { Check, LogOut, Zap } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { SectionLabel } from "./PageHeader";

function PillGroup<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-line py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-medium text-ink">{label}</div>
        {hint && <div className="text-[12px] text-muted">{hint}</div>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all",
              o.value === value
                ? "border-cyan/40 bg-cyan/10 text-ink"
                : "border-line text-muted hover:text-ink hover:bg-white/[0.03]"
            )}
          >
            {o.value === value && <Check size={12} className="mr-1 inline text-cyan" />}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsForm({ user }: { user: SessionUser }) {
  const [tone, setTone] = React.useState("calm");
  const [planning, setPlanning] = React.useState("balanced");
  const [energy, setEnergy] = React.useState("normal");
  const [notify, setNotify] = React.useState("daily");

  return (
    <div className="space-y-5">
      {/* Profile */}
      <div className="glass rounded-2xl p-6">
        <SectionLabel className="mb-4">Profile</SectionLabel>
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[linear-gradient(135deg,#2dd6e8,#9a7cff)] text-lg font-semibold text-[#04121c]">
            {user.initials}
          </div>
          <div className="min-w-0">
            <div className="font-display text-lg font-semibold text-ink">{user.name}</div>
            <div className="text-sm text-muted">{user.email}</div>
          </div>
          <span className="ml-auto rounded-full border border-line px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-muted">
            {user.plan} plan
          </span>
        </div>
      </div>

      {/* Preferences */}
      <div className="glass rounded-2xl px-6 py-2">
        <div className="py-3">
          <SectionLabel>Kairo's behavior</SectionLabel>
        </div>
        <PillGroup label="AI tone" hint="How Kairo talks to you" value={tone} onChange={setTone} options={[{ value: "calm", label: "Calm" }, { value: "direct", label: "Direct" }, { value: "strict", label: "Strict" }, { value: "encouraging", label: "Encouraging" }]} />
        <PillGroup label="Planning style" hint="How it shapes your day" value={planning} onChange={setPlanning} options={[{ value: "balanced", label: "Balanced" }, { value: "ambitious", label: "Ambitious" }, { value: "light", label: "Light" }, { value: "deep_work", label: "Deep Work" }]} />
        <PillGroup label="Default energy" value={energy} onChange={setEnergy} options={[{ value: "low", label: "Low" }, { value: "normal", label: "Normal" }, { value: "high", label: "High" }]} />
        <PillGroup label="Notifications" hint="Placeholder — not sending yet" value={notify} onChange={setNotify} options={[{ value: "off", label: "Off" }, { value: "daily", label: "Daily nudge" }]} />
      </div>

      {/* Account */}
      <div className="glass rounded-2xl p-6">
        <SectionLabel className="mb-4">Account</SectionLabel>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/app/billing" className="inline-flex h-10 items-center gap-2 rounded-full border border-violet/25 bg-violet/5 px-5 text-sm font-medium text-violet transition-colors hover:bg-violet/10">
            <Zap size={15} /> Manage plan
          </Link>
          <Link href="/" className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-5 text-sm text-muted transition-colors hover:text-ink hover:bg-white/5">
            <LogOut size={15} /> Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}
