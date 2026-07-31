import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/kairo/Logo";
import { Starfield } from "@/components/kairo/Starfield";
import { PreviewHero } from "@/components/preview/PreviewHero";
import { KeepsCount } from "@/components/preview/KeepsCount";
import { JourneyThread } from "@/components/preview/JourneyThread";
import { AppShots } from "@/components/kairo/AppShots";
import { PLAN_FREE_FEATURES, PLAN_PRO_FEATURES, priceDisplay } from "@/lib/kairo/plans";
import { isNativeRequest } from "@/lib/native";

// The landing page.
//
// Three rules it follows, each a reaction to a specific failure of the page it replaced:
//  1. Show the product before describing it. The real map is above the fold and
//     tappable; there is not a single feature card on the page.
//  2. Answer the "why would I not just improvise this myself" doubt by IMPLICATION
//     rather than by naming anyone. Naming a competitor on your own page is
//     defensive, and it drags a rival's brand into a premium surface. The claim
//     that a plan is easy and keeping one is hard does the same work, quietly.
//  3. Say nothing that is not true. No testimonials, no counts, no "most popular",
//     because we have no users yet and an invented number poisons everything near it.
//
// The whole page is threaded by one continuous dotted line (JourneyThread) drawn
// in the goal map's own next-step vocabulary: the page is itself a goal map, and
// scrolling it is walking the path.

// The homepage is the only route that canonicalizes to "/"; every other page
// declares its own canonical in its metadata export.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function LandingPage() {
  // App Store Guideline 3.1.1: this page is the app's only public price list.
  // The native shell must never reach it, which removes every pricing surface
  // at once. Guarded before any render so nothing can paint first.
  if (await isNativeRequest()) redirect("/app/today");

  return (
    <div data-theme="dark" className="cockpit relative isolate min-h-screen overflow-hidden bg-canvas text-ink">
      <Starfield className="pointer-events-none fixed inset-0 -z-10 opacity-70" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Solaspace",
            applicationCategory: "ProductivityApplication",
            operatingSystem: "Web",
            description:
              "An AI goal-execution app that turns your goals into a living map and builds the best plan for the time you actually have today.",
            offers: [
              { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
              { "@type": "Offer", price: String(priceDisplay.monthly), priceCurrency: "USD", name: "Pro" },
            ],
          }),
        }}
      />
      {/* The page's spine: the goal map's own dotted next-step line, growing
          down the page as you scroll and looping the screenshots in a ring. */}
      <JourneyThread />

      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="raised-btn inline-flex min-h-11 items-center rounded-full px-4 text-[15px] text-muted transition-colors hover:text-ink">
              Sign in
            </Link>
            <Link href="/onboarding" className="raised-btn inline-flex min-h-11 items-center rounded-full px-4 text-[15px] text-ink">
              Start
            </Link>
          </div>
        </div>
      </header>

      <PreviewHero />


      {/* The objection, answered before it is asked. */}
      <section className="mx-auto max-w-3xl px-5 max-lg:pl-12 py-24">
        <h2 data-journey="s-plan" className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
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


      {/* The daily loop. Told as a sentence, not as three cards with icons. */}
      <section className="mx-auto max-w-3xl px-5 max-lg:pl-12 py-24">
        <h2 data-journey="s-day" className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
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
        <p className="mt-8 max-w-xl text-[17px] leading-relaxed text-muted">
          And when a step deserves more than a link, ask for research. Sola reads the current
          web and returns a briefing with sources you can check, scoped to exactly the step you
          are on.
        </p>
      </section>


      {/* The real screens, with the cursor tour. A built product that shows itself
          working reads as finished in a way that no amount of copy does. */}
      <section className="mx-auto max-w-6xl px-5 max-lg:pl-12 py-24">
        <h2 data-journey="s-look" className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          A look inside.
        </h2>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
          The screens you will actually use, walking themselves.
        </p>
        <div className="mt-16" data-journey="shots">
          <AppShots />
        </div>
      </section>


      <KeepsCount />


      {/* One card. Free is the offer; Pro is a line inside it, not a rival column. */}
      <section className="mx-auto max-w-3xl px-5 max-lg:pl-12 py-24">
        <h2 data-journey="price" className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
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

      {/* The close: the thread's terminal node sits on this button and
          completes with a check once the path has been walked. */}
      <section className="mx-auto max-w-3xl px-5 py-28 max-lg:pl-12">
        <p className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          You already know what you want.
          <br />
          <span className="text-gold-lit">This is the part that keeps you moving.</span>
        </p>
        <Link
          data-journey="close"
          href="/onboarding"
          className="raised-gold mt-10 inline-flex min-h-12 items-center gap-2 rounded-xl px-7 text-[15px] font-semibold"
        >
          Start free <ArrowRight size={16} />
        </Link>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] text-muted">Map the way. Build the day.</p>
          <div className="flex gap-2">
            <Link href="/privacy" className="raised-btn inline-flex min-h-11 items-center rounded-full px-4 text-[15px] text-muted transition-colors hover:text-ink">Privacy</Link>
            <Link href="/terms" className="raised-btn inline-flex min-h-11 items-center rounded-full px-4 text-[15px] text-muted transition-colors hover:text-ink">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
