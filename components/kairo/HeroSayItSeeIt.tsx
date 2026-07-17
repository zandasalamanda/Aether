"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { SHOWCASE_MAPS } from "@/lib/kairo/showcase-maps";
import { PENDING_KEY } from "./OnboardingFlow";
import { GoalOrb } from "./GoalOrb";

// The landing hero. Type a goal right here and it hands off the SAME way the
// onboarding screen does: stash the goal, send you to sign up, and Sola maps it
// the moment you're back. It never calls the AI itself — nothing is generated,
// and no tokens spent, until there's an account. A goal orb rises quietly behind
// the words for depth; the real example plan lives lower down the page.

export function HeroSayItSeeIt() {
  const router = useRouter();
  const [goal, setGoal] = React.useState("");
  const [ph, setPh] = React.useState(0);

  // Rotate the placeholder example so the box feels alive without any big motion.
  React.useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => setPh((p) => (p + 1) % SHOWCASE_MAPS.length), 3200);
    return () => window.clearInterval(id);
  }, []);

  const start = () => {
    const g = goal.trim();
    if (g) {
      try { window.sessionStorage.setItem(PENDING_KEY, g); } catch { /* private mode */ }
    }
    router.push("/sign-up");
  };

  return (
    <div className="relative flex min-h-[86svh] flex-col items-center justify-center px-5 pb-10 pt-24 text-center">
      {/* A goal orb above the title, sized close to it. In-flow (not behind the
          text) so the top bar never clips it and it never overlaps the words. */}
      <GoalOrb className="animate-fade-up mb-3" />

      <h1 className="animate-fade-up font-display text-[2.5rem] font-semibold leading-[1.06] tracking-tight text-ink sm:text-6xl md:text-[4.1rem]">
        Are you ready to{" "}
        <span className="relative whitespace-nowrap text-accent">
          get things done
          <span aria-hidden className="absolute inset-x-0 -bottom-1 h-[0.09em] rounded-full bg-gradient-to-r from-accent/30 via-accent to-accent/30" />
        </span>
        ?
      </h1>
      <p className="animate-fade-up mx-auto mt-7 max-w-xl text-balance text-[16px] leading-relaxed text-muted sm:text-lg" style={{ animationDelay: "0.1s" }}>
        Type any goal in plain words. Sola maps every step and finds every resource, so you always know exactly what to do next.
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); start(); }}
        className="chrome animate-fade-up mt-10 flex w-full max-w-xl items-center gap-2 rounded-2xl py-2 pl-4 pr-2"
        style={{ animationDelay: "0.2s" }}
      >
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder={`e.g. ${SHOWCASE_MAPS[ph].prompt}`}
          aria-label="Your goal"
          enterKeyHint="go"
          className="min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-faint focus:outline-none sm:text-[17px]"
        />
        <button type="submit" className="raised-gold inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-[14px] font-semibold sm:px-5">
          Get started <ArrowRight size={15} />
        </button>
      </form>
      <p className="animate-fade-up mt-3.5 font-mono text-[11px] uppercase tracking-[0.16em] text-faint" style={{ animationDelay: "0.28s" }}>
        Free to start · no card needed
      </p>

      <a href="#how" className="mt-16 text-faint transition-colors hover:text-muted" aria-label="See how it works">
        <ChevronDown size={22} className="animate-pulse-soft" />
      </a>
    </div>
  );
}
