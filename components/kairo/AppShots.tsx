"use client";

import * as React from "react";
import Image, { type StaticImageData } from "next/image";
import { X, Maximize2, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Imported, not referenced by path. Next then derives each image's real size and
// fingerprints the URL by CONTENT — so replacing a shot can never serve a stale
// cached copy (the optimizer keys on the URL), and nobody hand-maintains w/h.
import mapPng from "@/public/shots/map.png";
import solaPng from "@/public/shots/sola.png";
import listPng from "@/public/shots/list.png";
import reviewPng from "@/public/shots/review.png";
import focusPng from "@/public/shots/focus.png";

interface Shot {
  img: StaticImageData;
  alt: string;
}

/** A point on the shot worth explaining. x/y are percentages of the image. */
interface Beat {
  x: number;
  y: number;
  label: React.ReactNode;
}

const MAP: Shot = { img: mapPng, alt: "The living goal map with a step open, showing the video picked for it" };
const MAP_BEATS: Beat[] = [
  { x: 47, y: 41, label: <>Every goal becomes a <b>living map</b>, with real progress on its face.</> },
  { x: 61, y: 46, label: <>Each step <b>in order</b>. The ones you finished <b>light the trail</b>.</> },
  { x: 94, y: 84, label: <>One clear <b>next move</b>, always marked.</> },
  { x: 50, y: 90, label: <>The <b>exact video you need</b>, already found and attached.</> },
];

const SIDE: (Shot & { beats: Beat[] })[] = [
  {
    img: solaPng,
    alt: "The Ask Sola panel proposing plan changes to accept or dismiss",
    beats: [
      // Sit beside the text, not on top of it — the cursor points, it shouldn't cover.
      { x: 20, y: 17, label: <><b>Ask in plain words</b> for what you want.</> },
      { x: 13, y: 49, label: <>Sola proposes the <b>exact changes</b> it would make.</> },
      { x: 24, y: 91, label: <><b>Nothing moves</b> until you say so.</> },
    ],
  },
  {
    img: listPng,
    alt: "List view of goals with steps checked off and research attached",
    beats: [
      { x: 85, y: 8, label: <><b>Every goal and step</b>, plainly listed.</> },
      { x: 78, y: 38, label: <>Your <b>next step</b>, marked for you.</> },
      { x: 50, y: 61, label: <>The <b>research sits right on the step</b>.</> },
    ],
  },
  {
    img: reviewPng,
    alt: "Weekly review showing true pace to each deadline",
    beats: [
      { x: 74, y: 23, label: <><b>Ahead or behind</b>, told to you straight.</> },
      { x: 50, y: 57, label: <>How much is <b>done</b> against how much <b>time is gone</b>.</> },
      { x: 18, y: 83, label: <><b>Proof you showed up</b>.</> },
    ],
  },
  {
    img: focusPng,
    alt: "A focus session with a timer and a first-move checklist",
    beats: [
      { x: 67, y: 27, label: <><b>One step, one timer</b>, nothing else.</> },
      { x: 52, y: 68, label: <>It hands you <b>the first move</b>.</> },
      { x: 45, y: 81, label: <>Tick them off and <b>just start</b>.</> },
    ],
  },
];

// Gold, faintly glowing key words — the same treatment the old captions used.
const MARK = "[&_b]:font-semibold [&_b]:text-accent [&_b]:[text-shadow:0_0_14px_rgba(230,184,119,0.55)]";

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(m.matches);
    read();
    m.addEventListener("change", read);
    return () => m.removeEventListener("change", read);
  }, []);
  return reduced;
}

const GLIDE = "left .9s cubic-bezier(0.22,1,0.36,1), top .9s cubic-bezier(0.22,1,0.36,1)";

/**
 * A screenshot that explains itself: a cursor glides around the image carrying a
 * glow, resting on one region at a time while the line underneath says what it
 * is. Only runs while on screen. Under reduced motion the cursor is hidden and
 * every note is listed at once instead.
 */
function ShotTour({ shot, beats, rounded, onZoom }: { shot: Shot; beats: Beat[]; rounded: string; onZoom: (s: Shot) => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [i, setI] = React.useState(0);
  const [live, setLive] = React.useState(false);
  const reduced = useReducedMotion();

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    if (!live || reduced) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % beats.length), 3200);
    return () => window.clearInterval(id);
  }, [live, reduced, beats.length]);

  const at = beats[i];

  return (
    <figure ref={ref} className="panel-2 rounded-3xl p-2 md:p-3">
      <div className="group relative overflow-hidden rounded-2xl">
        <Image src={shot.img} alt={shot.alt} className={cn("w-full", rounded)} />

        {!reduced && (
          <>
            {/* the glow the cursor carries, resting on whatever it's pointing at */}
            <span
              className="pointer-events-none absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 animate-pulse-soft rounded-full"
              style={{
                left: `${at.x}%`,
                top: `${at.y}%`,
                transition: GLIDE,
                background: "radial-gradient(circle, rgba(230,184,119,0.42), rgba(230,184,119,0.13) 45%, transparent 70%)",
              }}
            />
            {/* the cursor itself — its tip lands on the point */}
            <MousePointer2
              size={18}
              className="pointer-events-none absolute text-white"
              style={{
                left: `${at.x}%`,
                top: `${at.y}%`,
                transition: GLIDE,
                fill: "rgba(255,255,255,0.9)",
                filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.7))",
              }}
            />
          </>
        )}

        <button
          onClick={() => onZoom(shot)}
          className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white/70 opacity-0 backdrop-blur transition-opacity hover:text-white group-hover:opacity-100"
          aria-label="Enlarge screenshot"
        >
          <Maximize2 size={15} />
        </button>
      </div>

      {/* the line that explains whatever the cursor is resting on */}
      <figcaption className={cn("px-2 pb-1 pt-4 text-center", MARK)}>
        {reduced ? (
          <span className="text-[14px] leading-relaxed text-muted">
            {beats.map((b, k) => (
              <React.Fragment key={k}>{b.label} </React.Fragment>
            ))}
          </span>
        ) : (
          <span key={i} className="animate-fade-in block text-[14.5px] leading-relaxed text-muted">
            {at.label}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

export function AppShots() {
  const [zoom, setZoom] = React.useState<Shot | null>(null);

  React.useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoom(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  return (
    <>
      {/* Held a touch narrower than the section so the shots feel composed, not overwhelming. */}
      <div className="mx-auto max-w-5xl">
        <ShotTour shot={MAP} beats={MAP_BEATS} rounded="rounded-2xl" onZoom={setZoom} />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {SIDE.map((s) => (
            <ShotTour key={s.img.src} shot={s} beats={s.beats} rounded="rounded-xl" onZoom={setZoom} />
          ))}
        </div>
      </div>

      {zoom && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/90 p-4 backdrop-blur-md" onClick={() => setZoom(null)} role="dialog" aria-modal="true" aria-label={zoom.alt}>
          <button onClick={() => setZoom(null)} className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full text-white/70 transition-colors hover:text-white" aria-label="Close">
            <X size={22} />
          </button>
          {/* Full-res raw asset scaled to fit — most reliable for a lightbox. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoom.img.src}
            alt={zoom.alt}
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in rounded-xl object-contain shadow-2xl"
            style={{ maxHeight: "90vh", maxWidth: "94vw" }}
          />
        </div>
      )}
    </>
  );
}
