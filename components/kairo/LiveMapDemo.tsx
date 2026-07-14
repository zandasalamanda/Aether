"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SHOWCASE_MAPS } from "@/lib/kairo/showcase-maps";
import { PlanetOrb } from "./PlanetOrb";
import { ShowcaseTree } from "./ShowcaseTree";
import { Button } from "@/components/ui/Button";

// The landing's "show, don't tell" moment: a real goal map floating in space (grid +
// core glow, like the app itself — not a boxed card), drawing itself and cycling
// through sample goals. Every node is tappable to reveal the research behind that
// step, so a visitor sees the product working before they lift a finger.
export function LiveMapDemo() {
  const [i, setI] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (paused) return; // don't cycle while someone is exploring a step's research
    const id = window.setInterval(() => setI((p) => (p + 1) % SHOWCASE_MAPS.length), 8500);
    return () => window.clearInterval(id);
  }, [paused]);

  const map = SHOWCASE_MAPS[i];

  return (
    <div className="relative isolate overflow-hidden rounded-[32px] px-3 py-10 md:py-14">
      {/* space backdrop — a faint grid + a soft core glow tinted to the goal's colour */}
      <div className="grid-veil pointer-events-none absolute inset-0 -z-10 opacity-30" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[520px] w-[520px] max-w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: `${map.color}14`, transition: "background 1s ease" }}
      />

      <div className="text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">Watch a goal become a plan</div>
        <div className="mt-2.5 flex items-center justify-center gap-2.5">
          <PlanetOrb hex={map.color} size={26} icon={map.icon} seed={map.id} />
          <h3 className="font-display text-xl font-semibold text-ink transition-colors md:text-2xl">{map.title}</h3>
        </div>
        <p className="mx-auto mt-2 max-w-sm text-[13px] text-muted">Tap any step to see the research picked for it — real videos and guides.</p>
      </div>

      <div className="mt-6 min-h-[320px]">
        <ShowcaseTree map={map} interactive onOpenChange={setPaused} />
      </div>

      <div className="mt-5 flex items-center justify-center gap-2">
        {SHOWCASE_MAPS.map((m, idx) => (
          <button key={m.id} onClick={() => setI(idx)} aria-label={`Show ${m.short} plan`} className="grid place-items-center p-1">
            <span
              className="block h-1.5 rounded-full transition-all duration-300"
              style={{ width: idx === i ? 22 : 6, background: idx === i ? m.color : "rgba(255,255,255,0.18)" }}
            />
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <Link href="/build">
          <Button variant="primary" size="lg">Map your goal <ArrowRight size={16} /></Button>
        </Link>
      </div>
    </div>
  );
}
