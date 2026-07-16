"use client";

import * as React from "react";
import { Waypoints, Sparkles, Sunrise, MessageCircle, ArrowRight, X } from "lucide-react";
import { loadPersisted, savePersisted } from "@/lib/store/persist";
import { cn } from "@/lib/utils";

// A calm, one-time welcome the first time someone opens the map. Big type, high
// contrast, plain language, large buttons — written for a first-time (older) user
// who has never seen a "goal galaxy" before. Shown once, then never again.

const KEY = "kairo.tutorial.v1";

const STEPS = [
  { icon: Waypoints, title: "Welcome to Solaspace", body: "This is your map. Every goal you add lives here as its own glowing path." },
  { icon: Sparkles, title: "Just say what you want", body: "Tell Solaspace a goal in plain words. It maps out every step for you, in order." },
  { icon: Sunrise, title: "It builds your day", body: "Each morning, open Today. Tell it your time and energy, and it plans the day around your goals." },
  { icon: MessageCircle, title: "Meet Sola, your guide", body: "Sola is your assistant. Ask it to reshape your plan, break a step down, or help you get started." },
];

/** Reset the flag so the tour shows again (used by a "Show me around" setting). */
export function replayTour() {
  savePersisted(KEY, false);
}

export function FirstRunTour() {
  const [open, setOpen] = React.useState(false);
  const [i, setI] = React.useState(0);

  // Read the flag AFTER mount (client-only) so we never flash the tour for a
  // returning user during hydration, and never render it on the server.
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (loadPersisted<boolean>(KEY) !== true) setOpen(true);
  }, []);

  const dismiss = () => { savePersisted(KEY, true); setOpen(false); };
  if (!open) return null;

  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[300] grid place-items-center bg-canvas/95 px-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Welcome tour">
      <button onClick={dismiss} className="absolute right-5 top-[calc(env(safe-area-inset-top)+16px)] grid h-11 w-11 place-items-center rounded-full text-faint transition-colors hover:text-ink" aria-label="Skip the tour">
        <X size={20} />
      </button>

      <div key={i} className="animate-fade-up flex w-full max-w-sm flex-col items-center text-center">
        <span className="grid h-20 w-20 place-items-center rounded-3xl border border-accent/25 bg-accent/[0.07]">
          <Icon size={34} className="text-accent" />
        </span>
        <h2 className="mt-7 font-display text-[26px] font-semibold tracking-tight text-ink">{step.title}</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-muted">{step.body}</p>

        <div className="mt-7 flex items-center gap-2" aria-hidden>
          {STEPS.map((_, k) => (
            <span key={k} className={cn("h-1.5 rounded-full transition-all", k === i ? "w-6 bg-accent" : "w-1.5 bg-white/15")} />
          ))}
        </div>

        <div className="mt-8 flex w-full flex-col items-center gap-3">
          <button
            onClick={() => (last ? dismiss() : setI((n) => n + 1))}
            className="raised-gold inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-[16px] font-semibold"
          >
            {last ? "Get started" : "Next"} <ArrowRight size={18} />
          </button>
          {!last && (
            <button onClick={dismiss} className="py-1 text-[14px] text-faint transition-colors hover:text-muted">
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
