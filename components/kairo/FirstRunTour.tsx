"use client";

import * as React from "react";
import { ArrowRight, X, MousePointer2, Check } from "lucide-react";
import { loadPersisted, savePersisted } from "@/lib/store/persist";
import { cn } from "@/lib/utils";
import { SolaMark } from "./SolaMark";
import { useSvgId } from "@/lib/kairo/svg-id";

// A calm, one-time welcome the first time someone opens the map. Big type, high
// contrast, plain language, large buttons, written for a first-time (older) user
// who has never seen a "goal galaxy" before. Shown once, then never again.

const KEY = "kairo.tutorial.v1";

const STEPS = [
  { demo: "map" as const, title: "Welcome to Solaspace", body: "This is your map. Every goal you add lives here as its own glowing path." },
  { demo: "say" as const, title: "Just say what you want", body: "Tell Solaspace a goal in plain words. It maps out every step for you, in order." },
  { demo: "day" as const, title: "It builds your day", body: "Each morning, open Today. Tell it your time and energy, and it plans the day around your goals." },
  { demo: "sola" as const, title: "Meet Sola, your guide", body: "Sola is your assistant. Ask it to reshape your plan, break a step down, or help you get started." },
];

/** Reset the flag so the tour shows again (used by a "Show me around" setting). */
export function replayTour() {
  savePersisted(KEY, false);
}

// A slow, looping demo: a cursor glides in, taps the goal core, and the tree
// unfolds. Uses the map's own gold-orb language and theme-aware accent, so it
// reads on both dark and light. Reduced-motion freezes it fully drawn.
const BRANCHES = [
  { d: "M 66 50 Q 100 34 124 30", len: 78 },
  { d: "M 70 58 Q 110 58 142 58", len: 74 },
  { d: "M 66 66 Q 98 84 122 88", len: 74 },
];
const CHILDREN = [
  { x: 132, y: 30 },
  { x: 150, y: 58 },
  { x: 130, y: 90 },
];

function TourDemo() {
  const orbId = useSvgId("td-orb");
  return (
    <div className="relative mx-auto h-28 w-56" aria-hidden>
      <svg viewBox="0 0 224 112" className="absolute inset-0 h-full w-full" fill="none">
        <defs>
          <radialGradient id={orbId} cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#fdf3e0" />
            <stop offset="52%" stopColor="#e6b877" />
            <stop offset="100%" stopColor="#7c5c30" />
          </radialGradient>
        </defs>
        {/* branches sweep out after the tap */}
        {BRANCHES.map((b, k) => (
          <path
            key={k}
            d={b.d}
            className="demo-branch"
            stroke="var(--color-accent)"
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
            style={{ strokeDasharray: b.len, ["--len" as string]: String(b.len) }}
          />
        ))}
        {/* the goal core */}
        <circle cx="52" cy="58" r="18" fill={`url(#${orbId})`} style={{ filter: "drop-shadow(var(--mark-drop))" }} />
        {/* tap ripple, timed to the press */}
        <circle
          cx="52" cy="58" r="18" fill="none"
          stroke="var(--color-accent)" strokeWidth="2"
          className="demo-ripple"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
        {/* child steps bloom as each branch reaches them */}
        {CHILDREN.map((c, k) => (
          <circle
            key={k}
            cx={c.x} cy={c.y} r="9" fill={`url(#${orbId})`}
            className="demo-bloom"
            style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: `${k * 0.1}s` }}
          />
        ))}
      </svg>
      <MousePointer2
        size={22}
        className="demo-cursor absolute text-ink"
        style={{ left: 42, top: 48, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" }}
      />
    </div>
  );
}

/** Step 2: a goal is typed in plain words, and its steps drop in underneath. */
function SayDemo() {
  return (
    <div className="relative mx-auto h-28 w-56" aria-hidden>
      <div className="chrome flex h-9 items-center gap-1 rounded-xl px-3">
        <span className="demo-type overflow-hidden whitespace-nowrap text-[12px] text-ink">Run a half marathon</span>
        <span className="demo-caret h-4 w-px bg-accent" />
      </div>
      <div className="mt-2 space-y-1.5">
        {[0, 1, 2].map((k) => (
          <div
            key={k}
            className="demo-row raised-btn flex h-5 items-center gap-2 rounded-lg px-2"
            style={{ animationDelay: `${k * 0.12}s` }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="h-1 rounded-full bg-white/15" style={{ width: `${68 - k * 12}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Step 3: you give it the time you have, and the day stacks itself. */
function DayDemo() {
  const H = [16, 26, 12, 22, 30];
  return (
    <div className="relative mx-auto flex h-28 w-56 flex-col justify-end" aria-hidden>
      <div className="inset-well mb-3 h-2.5 overflow-hidden rounded-full">
        <div className="demo-fill raised-gold h-full rounded-full" />
      </div>
      <div className="flex items-end justify-between gap-1.5">
        {H.map((h, k) => (
          <div
            key={k}
            className="demo-block raised-btn flex-1 rounded-md"
            style={{ height: h * 2, animationDelay: `${k * 0.09}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Step 4: you ask in your own words, Sola answers with a change you can take. */
function SolaDemo() {
  return (
    <div className="relative mx-auto flex h-28 w-56 flex-col justify-center gap-1.5" aria-hidden>
      <div className="demo-ask raised-btn ml-auto flex h-6 items-center rounded-full px-2.5">
        <span className="h-1 w-16 rounded-full bg-white/20" />
      </div>
      <div className="demo-reply chrome mr-auto flex h-8 w-40 items-center gap-2 rounded-xl px-2.5">
        <SolaMark size={14} />
        <span className="flex-1 space-y-1">
          <span className="block h-1 w-full rounded-full bg-white/15" />
          <span className="block h-1 w-2/3 rounded-full bg-white/10" />
        </span>
      </div>
      <div className="demo-accept raised-gold mr-auto flex h-6 items-center gap-1.5 rounded-full px-2.5">
        <Check size={11} className="text-[#1b1206]" strokeWidth={2.6} />
        <span className="h-1 w-10 rounded-full bg-[#1b1206]/40" />
      </div>
    </div>
  );
}

const DEMOS = { map: TourDemo, say: SayDemo, day: DayDemo, sola: SolaDemo };

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

  return (
    // Cover the app content area, not the raw viewport: on desktop the map sits
    // right of the 248px sidebar (mirrors app/app/map/page.tsx), so the card
    // centers on the map rather than drifting left under the sidebar.
    <div className="fixed inset-y-0 left-0 right-0 z-[300] grid place-items-center bg-canvas/95 px-6 backdrop-blur-md md:left-[248px]" role="dialog" aria-modal="true" aria-label="Welcome tour">
      <button onClick={dismiss} className="raised-btn absolute right-5 top-[calc(var(--sa-top)+16px)] grid h-11 w-11 place-items-center rounded-full text-faint hover:text-ink" aria-label="Skip the tour">
        <X size={20} />
      </button>

      <div key={i} className="animate-fade-up flex w-full max-w-sm flex-col items-center text-center">
        {/* Four screens, four demos. It used to play the same map animation
            twice and show a static icon for the other two. */}
        {(() => { const D = DEMOS[step.demo]; return <D />; })()}
        <h2 className="mt-6 font-display text-[26px] font-semibold tracking-tight text-ink">{step.title}</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-muted">{step.body}</p>

        <div className="inset-well mt-7 flex items-center gap-2 rounded-full px-2.5 py-2" aria-hidden>
          {STEPS.map((_, k) => (
            <span
              key={k}
              className={cn("h-1.5 rounded-full transition-all", k === i ? "w-6 bg-accent" : "w-1.5")}
              style={k === i ? undefined : { background: "color-mix(in srgb, var(--color-ink) 18%, transparent)" }}
            />
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
            <button onClick={dismiss} className="raised-btn min-h-11 rounded-xl px-5 py-2.5 text-[14px] font-medium text-muted hover:text-ink">
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
