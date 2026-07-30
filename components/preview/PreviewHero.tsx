"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SHOWCASE_MAPS } from "@/lib/kairo/showcase-maps";
import { ShowcaseTree } from "@/components/kairo/ShowcaseTree";
import { PENDING_KEY } from "@/components/kairo/OnboardingFlow";

// The first screen, and the first section of the map.
//
// The hero used to be a centred stack under a decorative orb, which made it the
// only block on the page not attached to the thread: the page's spine was born
// 900px down, inside the tree, so the whole first screen read as a different
// document from everything below it.
//
// Now the thread enters ABOVE the page's first pixel, fades up out of black
// behind the header, and settles onto the same left rail every section below
// already rides. The tagline, the headline, the goal input and the switcher are
// stops on that walk. The hero is not a poster with a line beside it; it is the
// first four beads of the map the page is about.
//
// That is also why everything here is left aligned. A centred hero cannot hang
// off a rail, and the rail is the point.
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
    <section className="relative pb-12">
      {/* An off-centre bloom, aimed at the headline's first lines rather than at
          the middle of the screen. A symmetrical glow behind a left-aligned
          column is a leftover from the centred layout and reads as one. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px]"
        style={{ background: "radial-gradient(ellipse 46% 55% at 26% 30%, rgba(230,184,119,0.15), rgba(230,184,119,0.045) 45%, transparent 72%)" }}
      />

      <div className="relative mx-auto max-w-3xl pl-12 pr-5 pt-28 md:pt-32 lg:px-5">
        {/* The thread's first anchor, pinned to the very top of the page. It is
            invisible, but it must stay at least 2px on both axes: JourneyThread
            treats anything smaller as a display:none element and skips it. */}
        <span data-journey="h-rail" aria-hidden className="pointer-events-none absolute left-0 top-0 h-2 w-2" />

        <p data-journey="h-mark" className="animate-fade-up text-[14px] tracking-[0.06em] text-accent-dim">
          Map the way. Build the day.
        </p>

        <h1 data-journey="h-title" className="animate-fade-up mt-4 font-display text-[2.7rem] font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl md:text-[4.4rem]">
          Become who you keep
          <br className="hidden sm:block" /> <span className="text-gold-lit">meaning to be.</span>
        </h1>

        <p className="animate-fade-up mt-6 max-w-xl text-pretty text-[17px] leading-relaxed text-muted sm:text-[19px]" style={{ animationDelay: "0.08s" }}>
          Tell Solaspace what you want. It maps every step, finds the video or guide for each
          one, and builds your day around the time you actually have.
        </p>

        <form
          data-journey="h-start"
          onSubmit={(e) => { e.preventDefault(); start(); }}
          className="chrome animate-fade-up mt-8 flex w-full max-w-xl flex-col gap-2 rounded-2xl p-2 sm:flex-row sm:items-center sm:py-2 sm:pl-4 sm:pr-2"
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

        {/* The switcher, and the line explaining the map, above the map it
            explains. Left aligned, so the row simply wraps at any width and the
            old flex-col centring hack is unnecessary. */}
        <div data-journey="h-picks" className="mt-12">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-[15px] text-faint">See a real one:</span>
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
          <p className="mt-3 max-w-md text-[15px] text-faint">
            Tap any step. Every one carries a real source you can open and check.
          </p>
        </div>
      </div>

      {/* The product, running, before a single feature is described. It sits
          outside the text column so it keeps its own width. */}
      <div className="mx-auto mt-7 max-w-5xl px-5">
        {/* maxScale 1 forbids upscaling, so every map draws at the same size under
            the switcher instead of the compact ones rendering visibly larger. */}
        <div className="relative" data-journey="tree">
          <ShowcaseTree map={map} interactive maxScale={1} />
        </div>
      </div>
    </section>
  );
}
