"use client";

import * as React from "react";
import Image, { type StaticImageData } from "next/image";
import { X, Maximize2, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Imported, not referenced by path. Next then derives each image's real size and
// fingerprints the URL by CONTENT, so replacing a shot can never serve a stale
// cached copy (the optimizer keys on the URL), and nobody hand-maintains w/h.
import mapPng from "@/public/shots/map.png";
import solaPng from "@/public/shots/sola.png";
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
    { x: 47, y: 41, label: <>This is one goal. The number is <b>how far you have got</b>.</> },
    { x: 61, y: 46, label: <>Every step, <b>in the right order</b>. A tick means <b>done</b>.</> },
    { x: 94, y: 84, label: <>This is <b>what to do next</b>.</> },
    { x: 50, y: 90, label: <>The <b>video you need</b> is already here.</> },
  ],
};

const SIDE: Shot[] = [
  {
    id: "sola",
    img: solaPng,
    alt: "The Ask Sola panel proposing plan changes to accept or dismiss",
    beats: [
      // Sit beside the text, not on top of it. The cursor points, it shouldn't cover.
      { x: 20, y: 17, label: <><b>Just ask</b>, in your own words.</> },
      { x: 13, y: 49, label: <>It shows you <b>what it would change</b>.</> },
      { x: 24, y: 91, label: <><b>Nothing changes</b> unless you agree.</> },
    ],
  },
  {
    id: "focus",
    img: focusPng,
    alt: "A focus session with a timer and a first-move checklist",
    beats: [
      { x: 67, y: 27, label: <><b>One thing</b>, and a timer.</> },
      { x: 52, y: 68, label: <>It tells you <b>exactly how to start</b>.</> },
      { x: 45, y: 81, label: <><b>Tick them off</b> as you go.</> },
    ],
  },
];

/** Document order: the order the relay hands off in (left to right, top down). */
const ORDER = [MAP.id, ...SIDE.map((s) => s.id)];

// Gold, faintly glowing key words, the same treatment the old captions used.
const MARK = "[&_b]:font-semibold [&_b]:text-accent [&_b]:[text-shadow:0_0_14px_rgba(230,184,119,0.55)]";

// Unhurried, but not sleepy: the cursor takes its time getting there, and each
// note sits long enough to read comfortably.
const GLIDE_MS = 1150;
const HOLD_MS = 4600;
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
 * One screenshot. It only animates while it holds the section's single "turn":
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
    if (!active || reduced) {
      // Park back at the first beat the moment the turn ends. Otherwise the next
      // turn mounts the cursor at the LAST beat's coordinates and it snaps across
      // the shot to the start: the teleport.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setI(0);
      return;
    }
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
  const n = shot.beats.length;
  const idx = active ? i : 0; // an idle shot rests on its first note
  const counter = (unit: string) => <span className={cn("raised-btn ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 font-mono font-semibold text-accent/70", unit)}>{idx + 1}/{n}</span>;

  return (
    <figure ref={ref} data-journey={`shot-${shot.id}`} className={cn("panel-2 mx-auto w-full rounded-3xl p-2 md:p-3", compact ? "max-w-[320px]" : "max-w-[720px]")}>
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
            {/* the cursor: its tip lands on the point. It fades in when this shot
                takes its turn rather than popping into existence. */}
            <MousePointer2
              size={18}
              className="animate-fade-in pointer-events-none absolute z-10 text-white"
              style={{
                left: `${at.x}%`,
                top: `${at.y}%`,
                transition: GLIDE,
                fill: "rgba(255,255,255,0.9)",
                filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.7))",
              }}
            />
            {/* the chip. Keyed on the beat and delayed by the glide, so it is hidden
                while the cursor travels and fades in where it lands. Desktop only:
                on a narrow phone it would run off the image, so mobile reads the
                note as a line under the shot instead (below). */}
            <span
              key={i}
              className={cn("chrome pointer-events-none absolute z-10 hidden rounded-xl px-3 py-2 text-left leading-snug text-ink sm:block", compact ? "text-[12px]" : "text-[13px]", MARK)}
              style={{
                left: `${at.x}%`,
                top: `${at.y}%`,
                maxWidth: compact ? 180 : 250,
                width: "max-content",
                transform: `translate(${toLeft ? "calc(-100% - 16px)" : "16px"}, ${above ? "calc(-100% - 12px)" : "12px"})`,
                animation: `fade-in 0.45s ease ${GLIDE_MS}ms both`,
              }}
            >
              {at.label}{counter("text-[10px]")}
            </span>
          </>
        )}

        <button
          onClick={() => onZoom(shot)}
          className="raised-btn absolute right-2 top-2 z-20 grid h-9 w-9 place-items-center rounded-full text-muted opacity-0 hover:text-ink group-hover:opacity-100"
          // raised-btn's own transition list omits opacity and, being unlayered
          // CSS, beats the transition-opacity utility. Inline keeps the fade
          // reveal plus every raised-btn hover/press transition.
          style={{ transition: "opacity 0.2s ease, background 0.15s ease, box-shadow 0.15s ease, transform 0.06s ease, color 0.15s ease" }}
          aria-label="Enlarge screenshot"
        >
          <Maximize2 size={15} />
        </button>
      </div>

      {/* Screen readers always get the whole list, at any size. */}
      <figcaption className="sr-only">
        {shot.beats.map((b, k) => (
          <React.Fragment key={k}>{b.label} </React.Fragment>
        ))}
      </figcaption>

      {reduced ? (
        // No motion: print every note, for everyone.
        <p className={cn("px-2 pb-1 pt-4 text-center text-[14px] leading-relaxed text-muted", MARK)}>
          {shot.beats.map((b, k) => (
            <React.Fragment key={k}>{b.label} </React.Fragment>
          ))}
        </p>
      ) : (
        // Mobile reads the current note here, under the image, where nothing clips.
        <p aria-hidden className={cn("px-2 pb-1 pt-3 text-center text-[13.5px] leading-relaxed text-muted sm:hidden", MARK)}>
          <span key={idx} className="animate-fade-in">{shot.beats[idx].label}</span>
          {counter("text-[11px]")}
        </p>
      )}
    </figure>
  );
}

export function AppShots() {
  const [zoom, setZoom] = React.useState<Shot | null>(null);
  const [inView, setInView] = React.useState<Record<string, boolean>>({});
  const [active, setActive] = React.useState<string | null>(null);

  // True only during the short breath between one shot finishing and the next
  // starting, so the auto-pick below doesn't cut the pause short.
  const handingRef = React.useRef(false);

  const onInView = React.useCallback((id: string, v: boolean) => {
    setInView((prev) => (prev[id] === v ? prev : { ...prev, [id]: v }));
  }, []);

  // Only one shot animates on the whole page: whichever is on screen. If the one
  // holding the turn scrolls away, the turn moves to the first visible shot.
  React.useEffect(() => {
    if (handingRef.current) return;
    const visible = ORDER.filter((id) => inView[id]);
    setActive((cur) => (cur && inView[cur] ? cur : (visible[0] ?? null)));
  }, [inView]);

  // Finished its beats. Hand the turn to the next visible shot, left to right.
  // The cursor leaves first and the next one arrives after a beat of nothing, so
  // it reads as moving on rather than teleporting across the page.
  const onDone = React.useCallback((id: string) => {
    const visible = ORDER.filter((v) => inView[v]);
    if (!visible.length) return;
    const next = visible.length <= 1 ? id : visible[(visible.indexOf(id) + 1) % visible.length];
    handingRef.current = true;
    setActive(null);
    window.setTimeout(() => {
      handingRef.current = false;
      setActive(next);
    }, 700);
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
        {/* The map shot is a desktop capture, roughly 2900px wide. Squeezed into a
            phone column it is a pretty but unreadable thumbnail, and the landing
            already shows a live, tappable map higher up the page, so on small
            screens it is dropped rather than shown illegibly. The relay skips it
            automatically, because a hidden figure never reports as in view. */}
        <div className="hidden sm:block">
          <ShotTour shot={MAP} active={active === MAP.id} onInView={onInView} onDone={onDone} onZoom={setZoom} />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {SIDE.map((s) => (
            <ShotTour key={s.id} shot={s} compact active={active === s.id} onInView={onInView} onDone={onDone} onZoom={setZoom} />
          ))}
        </div>
      </div>

      {zoom && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/90 p-4 backdrop-blur-md" onClick={() => setZoom(null)} role="dialog" aria-modal="true" aria-label={zoom.alt}>
          <button onClick={() => setZoom(null)} className="raised-btn absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full text-muted hover:text-ink" aria-label="Close">
            <X size={22} />
          </button>
          {/* Full-res raw asset scaled to fit: most reliable for a lightbox. */}
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
