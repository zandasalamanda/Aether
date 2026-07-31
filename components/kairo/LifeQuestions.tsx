"use client";

import * as React from "react";
import { X } from "lucide-react";
import type { UserContext } from "@/lib/ai/types";
import { DEMO_CONTEXT_KEY } from "@/lib/ai/context";
import { setUserContext } from "@/lib/data/actions";
import { usePersistentState } from "@/lib/store/persist";
import { OptionChip } from "@/components/ui/Chip";
import { SolaMark } from "./SolaMark";

// The interview, never a form. Three questions, one per screen, every one
// skippable, shown ONCE after the first map is live. Each answer is stored
// (DB for real accounts through the one granted column, localStorage for the
// demo), visible and deletable in Settings, and injected into AI calls only
// through the field gates in lib/ai/context.ts. A skip is recorded and the
// question never returns.

interface Q {
  key: "scheduleShape" | "ageBand" | "granularity";
  question: string;
  why: string;
  options: { value: string; label: string }[];
}

const QUESTIONS: Q[] = [
  {
    key: "scheduleShape",
    question: "When is your time usually yours?",
    why: "Sola gives each step a real slot in your day instead of sometime.",
    options: [
      { value: "mornings", label: "Mornings" },
      { value: "evenings", label: "Evenings" },
      { value: "weekends", label: "Weekends" },
      { value: "varies", label: "It varies" },
    ],
  },
  {
    key: "ageBand",
    question: "Roughly how old are you?",
    why: "Pacing and examples change with life stage. This stays private, and you can delete it anytime.",
    options: [
      { value: "under_18", label: "Under 18" },
      { value: "18_24", label: "18-24" },
      { value: "25_34", label: "25-34" },
      { value: "35_44", label: "35-44" },
      { value: "45_54", label: "45-54" },
      { value: "55_64", label: "55-64" },
      { value: "65_plus", label: "65+" },
    ],
  },
  {
    key: "granularity",
    question: "What size steps suit you?",
    why: "Very small steps still finish goals. Sola sizes the whole plan to match.",
    options: [
      { value: "big_moves", label: "Big moves" },
      { value: "standard", label: "Standard" },
      { value: "very_small", label: "Very small" },
    ],
  },
];

export function LifeQuestions({ remote, onDone }: { remote: boolean; onDone?: () => void }) {
  // Once ever: answered or dismissed, this card never comes back on its own.
  const [seen, setSeen] = usePersistentState<boolean>("kairo.lifeq.v1", false);
  const [step, setStep] = React.useState(0);
  const [minor, setMinor] = React.useState(false);

  const persist = (patch: Partial<UserContext>) => {
    // The demo mirrors to localStorage so the mocks personalize too; real
    // accounts write the one granted profile column.
    try {
      const cur = JSON.parse(window.localStorage.getItem(DEMO_CONTEXT_KEY) ?? "{}") as UserContext;
      const merged = { ...cur, ...patch };
      for (const [k, v] of Object.entries(patch)) if (v === null || v === "") delete (merged as Record<string, unknown>)[k];
      window.localStorage.setItem(DEMO_CONTEXT_KEY, JSON.stringify(merged));
    } catch { /* private mode */ }
    if (remote) void setUserContext(patch);
  };

  const finish = () => { setSeen(true); onDone?.(); };

  const answer = (q: Q, value: string) => {
    if (q.key === "ageBand" && value === "under_18") {
      // Stored so it is never re-asked, then the calm stop. No verification
      // theatre, no scolding: the terms are 18 and up, said plainly once.
      persist({ ageBand: "under_18" });
      setMinor(true);
      return;
    }
    persist({ [q.key]: value } as Partial<UserContext>);
    if (step + 1 < QUESTIONS.length) setStep(step + 1);
    else finish();
  };

  const skip = (q: Q) => {
    try {
      const cur = JSON.parse(window.localStorage.getItem(DEMO_CONTEXT_KEY) ?? "{}") as UserContext;
      const skipped = Array.from(new Set([...(cur.skipped ?? []), q.key]));
      window.localStorage.setItem(DEMO_CONTEXT_KEY, JSON.stringify({ ...cur, skipped }));
      if (remote) void setUserContext({ skipped });
    } catch { /* private mode */ }
    if (step + 1 < QUESTIONS.length) setStep(step + 1);
    else finish();
  };

  if (seen) return null;

  if (minor) {
    return (
      <div className="chrome animate-sheet-up mx-auto w-full max-w-md rounded-2xl p-5 text-center">
        <p className="text-[16px] font-medium text-ink">Solaspace is built for adults 18 and up.</p>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Thanks for trying it. You can close your account any time from Settings.
        </p>
        <button onClick={finish} className="raised-btn mx-auto mt-4 inline-flex min-h-11 items-center rounded-xl px-5 text-[15px] text-muted transition-colors hover:text-ink">
          Okay
        </button>
      </div>
    );
  }

  const q = QUESTIONS[step];
  return (
    <div className="chrome animate-sheet-up mx-auto w-full max-w-md rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <SolaMark size={22} />
          <p className="text-[13px] text-muted">
            Your map is live. Three quick questions and Sola fits it to your actual life. Skip anything.
          </p>
        </div>
        <button onClick={finish} aria-label="Not now" className="raised-btn grid h-9 w-9 shrink-0 place-items-center rounded-lg text-faint transition-colors hover:text-ink">
          <X size={15} />
        </button>
      </div>

      <p className="mt-4 font-display text-[19px] font-semibold text-ink">{q.question}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {q.options.map((o) => (
          <OptionChip key={o.value} onClick={() => answer(q, o.value)}>{o.label}</OptionChip>
        ))}
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-faint">{q.why}</p>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5" aria-label={`Question ${step + 1} of ${QUESTIONS.length}`}>
          {QUESTIONS.map((_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i <= step ? "var(--color-accent)" : "var(--color-line-strong)" }} />
          ))}
        </div>
        <button onClick={() => skip(q)} className="inline-flex min-h-11 items-center rounded-full px-3 text-[14px] text-faint transition-colors hover:text-ink">
          Skip
        </button>
      </div>
    </div>
  );
}
