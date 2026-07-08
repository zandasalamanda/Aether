import Link from "next/link";
import { ArrowRight, Waypoints, Timer, PlayCircle, Gauge, Wand2, LayoutGrid } from "lucide-react";
import { Logo } from "@/components/kairo/Logo";
import { HeroPlanet } from "@/components/kairo/HeroPlanet";
import { SectionLabel } from "@/components/kairo/PageHeader";

const BEATS = [
  { k: "Chart it", desc: "Tell Aether a goal. It maps the whole path — milestones, concrete steps, and a finish line — in seconds." },
  { k: "Focus", desc: "Run a calm focus session on the next step. Aether gives you a first move, a short checklist, and unblocks you when you stall." },
  { k: "Arrive", desc: "See your pace to every deadline and adapt as life shifts — so the plan stays honest and you actually finish." },
];

const FEATURES = [
  { icon: Waypoints, title: "Living goal maps", desc: "Every goal becomes a planet with a branching path of steps. The next move glows; the rest waits." },
  { icon: Timer, title: "Working sessions", desc: "A calm timer that sits down with you — a first move, a checklist sized to the session, and drafts it writes with you." },
  { icon: PlayCircle, title: "Real resources", desc: "Each step can pull a real, hand-checked video — not a dead link, not a hallucinated one — to help you actually do it." },
  { icon: Gauge, title: "The honest mirror", desc: "Not just what's done — whether you'll hit your deadline. Aether forecasts your pace and flags what's slipping." },
  { icon: Wand2, title: "A map that adapts", desc: "Finished ahead or stuck for weeks? Aether proposes an easier on-ramp or a new phase — you accept or dismiss." },
  { icon: LayoutGrid, title: "Start from a path", desc: "Adopt a proven starter goal in one tap, or share any map as a read-only link." },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-canvas/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
            <a href="#how" className="transition-colors hover:text-ink">How it works</a>
            <a href="#features" className="transition-colors hover:text-ink">Features</a>
            <a href="#pricing" className="transition-colors hover:text-ink">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="hidden rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-ink sm:block">Sign in</Link>
            <Link href="/onboarding" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-[#1b1206] transition-all hover:brightness-105">Start</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[88vh] overflow-hidden">
        <HeroPlanet className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-canvas via-canvas/70 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-canvas via-transparent to-transparent" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-5 py-24">
          <div className="max-w-xl">
            <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-accent/80">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-soft" /> The calm way to execute
            </div>
            <h1 className="font-display text-6xl font-semibold leading-[1.02] tracking-tight text-ink md:text-7xl">
              <span className="inline-block animate-fade-up" style={{ animationDelay: "0.05s" }}>Chart it.</span>{" "}
              <span className="inline-block animate-fade-up" style={{ animationDelay: "0.22s" }}>Focus.</span>{" "}
              <span className="inline-block animate-fade-up" style={{ animationDelay: "0.39s" }}>Arrive.</span>
            </h1>
            <p className="animate-fade-up mt-6 max-w-md text-[17px] leading-relaxed text-muted" style={{ animationDelay: "0.5s" }}>
              The calm, AI-guided way to execute on big goals. Aether maps the path, walks it with you, and keeps you honest about your pace.
            </p>
            <div className="animate-fade-up mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "0.6s" }}>
              <Link href="/onboarding" className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-[15px] font-semibold text-[#1b1206] transition-all hover:brightness-105">
                Start your map <ArrowRight size={18} />
              </Link>
              <a href="#how" className="inline-flex h-12 items-center gap-2 rounded-full border border-line px-6 text-[15px] text-ink transition-colors hover:bg-white/5">
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — the three beats of the catchphrase */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-10">
          <SectionLabel className="mb-3">How it works</SectionLabel>
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">Three beats, from a spark to done.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {BEATS.map((b, i) => (
            <div key={b.k} className="panel rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full font-mono text-[12px] font-semibold text-accent" style={{ background: "rgba(230,184,119,0.12)" }}>{i + 1}</span>
                <h3 className="font-display text-xl font-semibold text-ink">{b.k}</h3>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-10">
          <SectionLabel className="mb-3">What you get</SectionLabel>
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">A guide, not just a planner.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="panel rounded-2xl p-6 transition-all hover:border-line-strong">
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-accent/20 bg-accent/5 text-accent">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-10 text-center">
          <SectionLabel className="mb-3 flex justify-center">Pricing</SectionLabel>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">Start free. Upgrade when it&apos;s moving.</h2>
        </div>
        <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
          <div className="panel rounded-3xl p-8">
            <div className="text-sm font-semibold text-muted">Free</div>
            <div className="mt-2 font-display text-4xl font-semibold text-ink">$0</div>
            <p className="mt-2 text-sm text-muted">A couple of active goals, focus sessions, real resources, and the pace mirror.</p>
            <Link href="/sign-up" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline">Get started <ArrowRight size={15} /></Link>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-accent/30 bg-accent/[0.06] p-8">
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
            <div className="text-sm font-semibold text-accent">Pro</div>
            <div className="mt-2 flex items-end gap-1">
              <span className="font-display text-4xl font-semibold text-ink">$8</span>
              <span className="mb-1.5 text-sm text-muted">/mo</span>
            </div>
            <p className="mt-2 text-sm text-muted">Unlimited goals, the adapting map, co-written drafts, and a weekly pace digest.</p>
            <Link href="/sign-up" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink hover:underline">Start with Pro <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="panel-2 relative overflow-hidden rounded-[32px] px-8 py-16 text-center">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/20 blur-[90px]" />
          </div>
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">Pick a goal. Watch the path appear.</h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-muted">Chart it. Focus. Arrive. The first map takes about a minute.</p>
          <Link href="/onboarding" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-[15px] font-semibold text-[#1b1206] transition-all hover:brightness-105">
            Start your map <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <Logo size={22} />
          <p className="font-mono text-[12px] text-faint">Chart it. Focus. Arrive.</p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted">
            <Link href="/sign-in" className="hover:text-ink">Sign in</Link>
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#pricing" className="hover:text-ink">Pricing</a>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
