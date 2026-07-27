import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/kairo/Logo";
import { Starfield } from "@/components/kairo/Starfield";
import { PreviewHero } from "@/components/preview/PreviewHero";
import { KeepsCount } from "@/components/preview/KeepsCount";
import { AppShots } from "@/components/kairo/AppShots";
import { PaceRule } from "@/components/preview/PaceRule";
import { PLAN_FREE_FEATURES, PLAN_PRO_FEATURES, priceDisplay } from "@/lib/kairo/plans";

// A candidate landing page, at its own route so the live one is untouched.
//
// Three rules it follows, each a reaction to a specific failure of the current page:
//  1. Show the product before describing it. The real map is above the fold and
//     tappable; there is not a single feature card on the page.
//  2. Answer the "why would I not just improvise this myself" doubt by IMPLICATION
//     rather than by naming anyone. Naming a competitor on your own page is
//     defensive, and it drags a rival's brand into a premium surface. The claim
//     that a plan is easy and keeping one is hard does the same work, quietly.
//  3. Say nothing that is not true. No testimonials, no counts, no "most popular",
//     because we have no users yet and an invented number poisons everything near it.
export const metadata: Metadata = {
  title: "Solaspace preview",
  robots: { index: false, follow: false },
};

export default function PreviewPage() {
  return (
    <div data-theme="dark" className="cockpit relative isolate min-h-screen overflow-hidden bg-canvas text-ink">
      <Starfield className="pointer-events-none fixed inset-0 -z-10 opacity-70" />

      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
          <Logo />
          <div className="flex items-center gap-1">
            <Link href="/sign-in" className="inline-flex min-h-11 items-center rounded-full px-4 text-[15px] text-muted transition-colors hover:text-ink">
              Sign in
            </Link>
            <Link href="/onboarding" className="raised-btn inline-flex min-h-11 items-center rounded-full px-4 text-[15px] text-ink">
              Start
            </Link>
          </div>
        </div>
      </header>

      <PreviewHero />

      <PaceRule at={26} />

      {/* The objection, answered before it is asked. */}
      <section className="mx-auto max-w-3xl px-5 py-24">
        <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          Anything can write you a plan.
          <br />
          <span className="text-gold-lit">Almost nothing keeps one.</span>
        </h2>
        <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-muted">
          The plan was never the hard part. The hard part is week three, when the first
          version no longer matches your life and there is nobody keeping score. Solaspace
          holds the real record: every step, with a date, and what you actually finished.
        </p>
      </section>

      <PaceRule at={44} />

      {/* The daily loop. Told as a sentence, not as three cards with icons. */}
      <section className="mx-auto max-w-3xl px-5 py-24">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Then it builds your day.
        </h2>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
          Tell Solaspace how much time you have and how much energy you have. It picks the steps
          that genuinely fit today and leaves the rest on the map. Fall behind and nothing is
          lost. Push anything, and the plan rebuilds around where you actually are.
        </p>
        <p className="mt-8 max-w-xl text-[17px] leading-relaxed text-muted">
          Every step arrives with the video or guide you need already attached, from a publisher
          you have heard of. No searching, no blank page, no wondering whether you are starting
          in the right place.
        </p>
      </section>

      <PaceRule at={62} />

      {/* The real screens, with the cursor tour. A built product that shows itself
          working reads as finished in a way that no amount of copy does. */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          A look inside.
        </h2>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
          The screens you will actually use. Follow the cursor.
        </p>
        <div className="mt-10">
          <AppShots />
        </div>
      </section>

      <PaceRule at={74} />

      <KeepsCount />

      <PaceRule at={80} />

      {/* One card. Free is the offer; Pro is a line inside it, not a rival column. */}
      <section className="mx-auto max-w-3xl px-5 py-24">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Start free.
        </h2>
        <p className="mt-5 text-[17px] leading-relaxed text-muted">
          {PLAN_FREE_FEATURES[0]}, and enough of everything else to know whether this works for
          you. No card, and nothing expires.
        </p>

        <ul className="mt-9 space-y-3">
          {PLAN_FREE_FEATURES.map((f) => (
            <li key={f} className="flex gap-3 text-[17px] text-ink">
              <span aria-hidden className="mt-[0.6em] h-[3px] w-4 shrink-0 bg-accent" />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-10 border-t border-line pt-7">
          <p className="text-[17px] leading-relaxed text-muted">
            When two goals is not enough, Pro is ${priceDisplay.monthly} a month (or $
            {priceDisplay.yearly} a year, saving {priceDisplay.savingsPct}%) and adds{" "}
            {PLAN_PRO_FEATURES.slice(0, 2).join(", ").toLowerCase()}. You upgrade from inside the
            app, when you want it, not before.
          </p>
        </div>

        <Link
          href="/onboarding"
          className="raised-gold mt-10 inline-flex min-h-12 items-center gap-2 rounded-xl px-6 text-[15px] font-semibold"
        >
          Map my first goal <ArrowRight size={16} />
        </Link>
      </section>

      {/* The close. The rule finally reaches the end, with no gap left. */}
      <PaceRule at={96} />

      <section className="mx-auto max-w-3xl px-5 py-28 text-center">
        <p className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          You already know what you want.
          <br />
          <span className="text-gold-lit">This is the part that keeps you moving.</span>
        </p>
        <Link
          href="/onboarding"
          className="raised-gold mt-10 inline-flex min-h-12 items-center gap-2 rounded-xl px-7 text-[15px] font-semibold"
        >
          Start free <ArrowRight size={16} />
        </Link>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] text-muted">Map the way. Build the day.</p>
          <div className="flex gap-1">
            <Link href="/privacy" className="inline-flex min-h-11 items-center px-3 text-[15px] text-muted transition-colors hover:text-ink">Privacy</Link>
            <Link href="/terms" className="inline-flex min-h-11 items-center px-3 text-[15px] text-muted transition-colors hover:text-ink">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
