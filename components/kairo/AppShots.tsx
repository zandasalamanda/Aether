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
  id: string;
  img: StaticImageData;
  alt: string;
  beats: Beat[];
}

/** A point on the shot worth explaining. x/y are percentages of the image. */
interface Beat {
  x: number;
  y: number;
  label: React.ReactNode;
}

const MAP: Shot = {
  id: "map",
  img: mapPng,
  alt: "The living goal map with a step open, showing the video picked for it",
  beats: [
    { x: 47, y: 41, label: <>Every goal becomes a <b>living map</b>, with real progress on its face.</> },
    { x: 61, y: 46, label: <>Each step <b>in order</b>. The ones you finished <b>light the trail</b>.</> },
    { x: 94, y: 84, label: <>One clear <b>next move</b>, always marked.</> },
    { x: 50, y: 90, label: <>The <b>exact video you need</b>, already found and attached.</> },
  ],
};

const SIDE: Shot[] = [
  {
    id: "sola",
    img: solaPng,
    alt: "The Ask Sola panel proposing plan changes to accept or dismiss",
    beats: [
      // Sit beside the text, not on top of it — the cursor points, it shouldn't cover.
      { x: 20, y: 17, label: <><b>Ask in plain words</b>.</> },
      { x: 13, y: 49, label: <>It proposes the <b>exact changes</b>.</> },
      { x: 24, y: 91, label: <><b>Nothing moves</b> until you say so.</> },
    ],
  },
  {
    id: "list",
    img: listPng,
    alt: "List view of goals with steps checked off and research attached",
    beats: [
      { x: 85, y: 8, label: <><b>Every goal and step</b>, listed.</> },
      { x: 78, y: 38, label: <>Your <b>next step</b>, marked.</> },
      { x: 50, y: 61, label: <>The <b>research sits on the step</b>.</> },
    ],
  },
  {
    id: "review",
    img: reviewPng,
    alt: "Weekly review showing true pace to each deadline",
    beats: [
      { x: 74, y: 23, label: <><b>Ahead or behind</b>, told straight.</> },
      { x: 50, y: 57, label: <><b>Done</b> against <b>time gone</b>.</> },
      { x: 18, y: 83, label: <><b>Proof you showed up</b>.</> },
    ],
  },
  {
    id: "focus",
    img: focusPng,
    alt: "A focus session with a timer and a first-move checklist",
    beats: [
      { x: 67, y: 27, label: <><b>One step, one timer</b>.</> },
      { x: 52, y: 68, label: <>It hands you <b>the first move</b>.</> },
      { x: 45, y: 81, label: <>Tick them off and <b>just start</b>.</> },
    ],
  },
];

/** Document order — the order the relay hands off in (left to right, top down). */
const ORDER = [MAP.id, ...SIDE.map((s) => s.id)];

// Gold, faintly glowing key words — the same treatment the old captions used.
const MARK = "[&_b]:font-semibold [&_b]:text-accent [&_b]:[text-shadow:0_0_14px_rgba(230,184,119,0.55)]";

const GLIDE_MS = 900;
const HOLD_MS = 3200;
const GLIDE = `left ${GLIDE_MS}ms cubic-bezier(0.22,1,0.36,1), top ${GLIDE_MS}ms cubic-bezier(0.22,1,0.36,1)`;

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

/**
 * One screenshot. It only animates while it holds the section's single "turn" —
 * a cursor glides between its points carrying a glow, and an explainer chip fades
 * in beside the cursor once it lands (never dragged along mid-flight). When it has
 * shown every beat it hands the turn on. Reduced motion drops the cursor entirely
 * and prints the notes underneath instead.
 */
function ShotTour({
  shot, active, compact, onInView, onDone, onZoom,
}: {
  shot: Shot;
  active: boolean;
  compact?: boolean;
  onInView: (id: string, v: boolean) => void;
  onDone: (id: string) => void;
  onZoom: (s: Shot) => void;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const [i, setI] = React.useState(0);
  const reduced = useReducedMotion();

  // Held in refs so the beat timer never restarts just because the parent handed
  // us a new callback identity (onDone changes whenever the visible set does).
  const doneRef = React.useRef(onDone);
  const seenRef = React.useRef(onInView);
  React.useEffect(() => {
    doneRef.current = onDone;
    seenRef.current = onInView;
  });

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => seenRef.current(shot.id, e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [shot.id]);

  // Walk this shot's beats while it holds the turn, then pass it along.
  React.useEffect(() => {
    if (!active || reduced) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setI(0);
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      if (n >= shot.beats.length) {
        window.clearInterval(id);
        doneRef.current(shot.id);
      } else {
        setI(n);
      }
    }, HOLD_MS);
    return () => window.clearInterval(id);
  }, [active, reduced, shot.id, shot.beats.length]);

  const at = shot.beats[i];
  // Flip the chip so it never runs off the frame.
  const toLeft = at.x > 55;
  const above = at.y > 78;
  const show = active && !reduced;

  return (
    <figure ref={ref} className="panel-2 rounded-3xl p-2 md:p-3">
      <div className="group relative overflow-hidden rounded-2xl">
        <Image src={shot.img} alt={shot.alt} className={cn("w-full", compact ? "rounded-xl" : "rounded-2xl")} />

        {show && (
          <>
            {/* the glow the cursor carries, resting on whatever it points at */}
            <span
              className="pointer-events-none absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 animate-pulse-soft rounded-full"
              style={{
                left: `${at.x}%`,
                top: `${at.y}%`,
                transition: GLIDE,
                background: "radial-gradient(circle, rgba(230,184,119,0.42), rgba(230,184,119,0.13) 45%, transparent 70%)",
              }}
            />
            {/* the cursor — its tip lands on the point */}
            <MousePointer2
              size={18}
              className="pointer-events-none absolute z-10 text-white"
              style={{
                left: `${at.x}%`,
                top: `${at.y}%`,
                transition: GLIDE,
                fill: "rgba(255,255,255,0.9)",
                filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.7))",
              }}
            />
            {/* the chip. Keyed on the beat and delayed by the glide, so it is hidden
                while the cursor travels and fades in where it lands. */}
            <span
              key={i}
              className={cn("chrome pointer-events-none absolute z-10 rounded-xl px-3 py-2 text-left leading-snug text-ink", compact ? "text-[12px]" : "text-[13px]", MARK)}
              style={{
                left: `${at.x}%`,
                top: `${at.y}%`,
                maxWidth: compact ? 180 : 250,
                width: "max-content",
                transform: `translate(${toLeft ? "calc(-100% - 16px)" : "16px"}, ${above ? "calc(-100% - 12px)" : "12px"})`,
                animation: `fade-in 0.45s ease ${GLIDE_MS}ms both`,
              }}
            >
              {at.label}
            </span>
          </>
        )}

        <button
          onClick={() => onZoom(shot)}
          className="absolute right-2 top-2 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white/70 opacity-0 backdrop-blur transition-opacity hover:text-white group-hover:opacity-100"
          aria-label="Enlarge screenshot"
        >
          <Maximize2 size={15} />
        </button>
      </div>

      {/* Reduced motion gets the notes as plain text; everyone else gets them from
          the chip, and screen readers read them here. */}
      <figcaption className={cn(reduced ? "px-2 pb-1 pt-4 text-center text-[14px] leading-relaxed text-muted" : "sr-only", MARK)}>
        {shot.beats.map((b, k) => (
          <React.Fragment key={k}>{b.label} </React.Fragment>
        ))}
      </figcaption>
    </figure>
  );
}

export function AppShots() {
  const [zoom, setZoom] = React.useState<Shot | null>(null);
  const [inView, setInView] = React.useState<Record<string, boolean>>({});
  const [active, setActive] = React.useState<string | null>(null);

  const onInView = React.useCallback((id: string, v: boolean) => {
    setInView((prev) => (prev[id] === v ? prev : { ...prev, [id]: v }));
  }, []);

  // Only one shot animates on the whole page: whichever is on screen. If the one
  // holding the turn scrolls away, the turn moves to the first visible shot.
  React.useEffect(() => {
    const visible = ORDER.filter((id) => inView[id]);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive((cur) => (cur && inView[cur] ? cur : (visible[0] ?? null)));
  }, [inView]);

  // Finished its beats — hand the turn to the next visible shot, left to right.
  const onDone = React.useCallback((id: string) => {
    setActive((cur) => {
      if (cur !== id) return cur;
      const visible = ORDER.filter((v) => inView[v]);
      if (visible.length <= 1) return cur;
      return visible[(visible.indexOf(id) + 1) % visible.length];
    });
  }, [inView]);

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
        <ShotTour shot={MAP} active={active === MAP.id} onInView={onInView} onDone={onDone} onZoom={setZoom} />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {SIDE.map((s) => (
            <ShotTour key={s.id} shot={s} compact active={active === s.id} onInView={onInView} onDone={onDone} onZoom={setZoom} />
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
