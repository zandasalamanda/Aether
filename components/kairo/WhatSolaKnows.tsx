"use client";

import * as React from "react";
import { X } from "lucide-react";
import type { UserContext } from "@/lib/ai/types";
import { DEMO_CONTEXT_KEY, readDemoContext } from "@/lib/ai/context";
import { setUserContext } from "@/lib/data/actions";
import { SectionLabel } from "./PageHeader";

// The trust surface, and the honest pitch against a chat window: your plan
// lives in a database that never forgets, and this is the whole database of
// you, editable and deletable. Every fact below shapes plans through the field
// gates in lib/ai/context.ts; deleting one deletes it from every future call.

const LABELS: { key: keyof UserContext; name: string; render: (v: unknown) => string }[] = [
  { key: "scheduleShape", name: "Free time", render: (v) => ({ mornings: "Mornings", evenings: "Evenings", weekends: "Weekends", varies: "It varies" }[String(v)] ?? String(v)) },
  { key: "ageBand", name: "Age", render: (v) => String(v).replace("_plus", "+").replace("under_18", "under 18").replace("_", "-") },
  { key: "granularity", name: "Step size", render: (v) => ({ big_moves: "Big moves", standard: "Standard", very_small: "Very small" }[String(v)] ?? String(v)) },
  { key: "region", name: "Area", render: (v) => String(v) },
  { key: "budgetComfort", name: "Budget", render: (v) => ({ tight: "Tight", some_room: "Some room", flexible: "Flexible", private: "Prefer not to say" }[String(v)] ?? String(v)) },
  { key: "busyWith", name: "Life", render: (v) => String(v) },
];

export function WhatSolaKnows({ remote, initial }: { remote: boolean; initial: UserContext | null }) {
  // Remote truth arrives as a prop; the demo reads its mirror after mount
  // (localStorage does not exist on the server).
  const [ctx, setCtx] = React.useState<UserContext | null>(initial);
  React.useEffect(() => {
    if (!remote) setCtx(readDemoContext());
  }, [remote]);

  const forget = (key: keyof UserContext) => {
    setCtx((c) => {
      const next = { ...(c ?? {}) } as Record<string, unknown>;
      delete next[key];
      try { window.localStorage.setItem(DEMO_CONTEXT_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      return next as UserContext;
    });
    if (remote) void setUserContext({ [key]: null } as Partial<UserContext>);
  };

  const rows = LABELS.filter((l) => {
    const v = ctx?.[l.key];
    return v !== undefined && v !== null && String(v).trim() !== "";
  });

  return (
    <section className="panel rounded-2xl p-4">
      <SectionLabel>What Sola knows</SectionLabel>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">
        Everything here shapes your plans. Edit or delete anything and Sola forgets it everywhere.
      </p>
      {rows.length === 0 ? (
        <p className="mt-3 text-[14px] text-faint">
          Nothing yet. Sola asks a few optional questions after your first map, and anything you answer appears here.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {rows.map((l) => (
            <li key={l.key} className="flex min-h-11 items-center gap-3 rounded-xl border border-line px-3">
              <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{l.name}</span>
              <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{l.render(ctx?.[l.key])}</span>
              <button
                onClick={() => forget(l.key)}
                aria-label={`Forget ${l.name}`}
                title="Forget this"
                className="raised-btn grid h-8 w-8 shrink-0 place-items-center rounded-lg text-faint transition-colors hover:text-warn"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
