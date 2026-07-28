"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SHOWCASE_MAPS } from "@/lib/kairo/showcase-maps";
import { ShowcaseTree } from "@/components/kairo/ShowcaseTree";
import { PENDING_KEY } from "@/components/kairo/OnboardingFlow";
import { GoalOrb } from "@/components/kairo/GoalOrb";

// The first screen. Stacked, not split: the previous attempt used a sticky
// two-column layout that mutated while the other half scrolled, which reads as
// broken on a phone before it reads as clever. This is the same on every width.
//
// The map below the words is the real component the app renders, running on real
// canned goals with real cited sources, and it is tappable from the first second.
// Nothing here calls the AI and nothing is saved, so a visitor can use it without
// an account and without costing anything.

const GOALS = ["financial", "fitness", "language"] as const;

export function PreviewHero() {
  const router = useRouter();
  const [goal, setGoal] = React.useState("");
  const [pick, setPick] = React.useState(0);

  const map = SHOWCASE_MAPS.find((m) => m.id === GOALS[pick]) ?? SHOWCASE_MAPS[0];

  const start = () => {
    const g = goal.trim();
    if (g) {
      try { window.sessionStorage.setItem(PENDING_KEY, g); } catch { /* private mode */ }
      router.push("/sign-up");
      return;
    }
    // An empty box means they have not decided yet, so send them to the warmer
    // guided screen rather than a bare sign-up form.
    router.push("/onboarding");
  };

  return (
    <section className="relative px-5 pb-10 pt-24 md:pt-28">
      <div className="mx-auto max-w-3xl text-center">
        {/* A quiet gold aurora behind the words, so the first screen carries the
            same lit warmth as the orbs instead of flat text on flat black. */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-24 -z-10 h-[420px] w-[720px] max-w-[92vw] -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(ellipse at center, rgba(230,184,119,0.13), rgba(230,184,119,0.04) 45%, transparent 70%)" }} />
        {/* The signature orb: a lit goal core with its moon in orbit, cycling
            through goal icons. The page's whole story in one object, and the
            warm counterpart to the empty orb that walks the thread below. */}
        <div className="flex justify-center">
          <GoalOrb className="animate-fade-up -mb-2 -mt-6" />
        </div>
        <h1 className="animate-fade-up font-display text-[2.6rem] font-semibold leading-[1.04] tracking-tight text-ink sm:text-6xl md:text-[4.2rem]">
          Become who you keep
          <br className="hidden sm:block" /> <span className="text-gold-lit">meaning to be.</span>
        </h1>

        <p className="animate-fade-up mx-auto mt-7 max-w-xl text-balance text-[17px] leading-relaxed text-muted sm:text-[19px]" style={{ animationDelay: "0.08s" }}>
          Tell Solaspace what you want. It maps every step, finds the video or guide for each
          one, and builds your day around the time you actually have.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); start(); }}
          className="chrome animate-fade-up mx-auto mt-9 flex w-full max-w-xl flex-col gap-2 rounded-2xl p-2 sm:flex-row sm:items-center sm:py-2 sm:pl-4 sm:pr-2"
          style={{ animationDelay: "0.16s" }}
        >
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What do you want to get done?"
            aria-label="Your goal"
            enterKeyHint="go"
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[16px] text-ink placeholder:text-faint focus:outline-none sm:px-0 sm:py-0 sm:text-[17px]"
          />
          <button
            type="submit"
            className="raised-gold inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl px-5 text-[15px] font-semibold sm:w-auto"
          >
            Start <ArrowRight size={15} />
          </button>
        </form>

        <p className="mt-4 text-[15px] text-faint">Free to start. No card needed.</p>
      </div>

      {/* The product, running, before a single feature is described. */}
      <div className="mx-auto mt-14 max-w-5xl">
        {/* The label sits on its own line below sm so the three chips stay on one
            row together instead of orphaning the last one. */}
        <div className="mb-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <span className="text-[15px] text-faint sm:mr-1">See a real one:</span>
          <div className="flex items-center gap-1">
          {GOALS.map((id, i) => {
            const m = SHOWCASE_MAPS.find((x) => x.id === id);
            return (
              <button
                key={id}
                onClick={() => setPick(i)}
                aria-pressed={i === pick}
                className={
                  i === pick
                    ? "raised-btn inline-flex min-h-11 items-center rounded-full px-4 text-[15px] text-ink"
                    : "inline-flex min-h-11 items-center rounded-full px-4 text-[15px] text-muted transition-colors hover:text-ink"
                }
              >
                {m?.short}
              </button>
            );
          })}
          </div>
        </div>

        <div className="relative" data-journey="tree">
          {/* maxScale 1 forbids upscaling, so every map draws at the same size under
              the switcher instead of the compact ones rendering visibly larger. */}
          <ShowcaseTree map={map} interactive maxScale={1} />
        </div>

        <p className="mt-4 text-center text-[15px] text-faint">
          Tap any step. Every one carries a real source you can open and check.
        </p>
      </div>
    </section>
  );
}
