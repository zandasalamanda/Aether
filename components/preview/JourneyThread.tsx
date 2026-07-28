"use client";

import * as React from "react";

// The page's spine: one continuous dotted thread, in the exact vocabulary the
// goal map uses for "your next step" (gold, dasharray 3 8, the same marching
// `dash` keyframe), rooted in the hero's tree and growing down the page as you
// scroll. It weaves left and right between sections, loops the screenshots in a
// ring, and ends at the final CTA as a node that completes. The landing page is
// itself a goal map, and scrolling it is walking the path.
//
// Geometry is measured from the real DOM ([data-journey] anchors), rebuilt on
// resize, and drawn with a mask trick: the visible path is dotted, and a solid
// twin inside a <mask> has its dashoffset driven by scroll, so the dots are
// revealed progressively without fighting their own dash pattern. Reduced
// motion renders the thread fully drawn and still.

interface Stop {
  id: string;
  at: "top" | "bottom" | "left" | "right";
  /** px outward from the box edge */
  off?: number;
  /** curve bow ARRIVING here: + bows right of the direction of travel */
  bow?: number;
  /** render a step node here */
  dot?: boolean;
  /** only when the wide (desktop) shots layout is present */
  ringOnly?: boolean;
  /** the closing node: bigger, completes with a check */
  terminal?: boolean;
}

// Order matters: this is the walk. Every section stop rides a LEFT RAIL in the
// gutter (never inside the text column: an earlier weave crossed paragraphs,
// invisibly on wide screens and right through them on phones). The thread only
// travels horizontally inside the wide screenshots section (the ring) and in
// the whitespace between sections, and it finishes beside the closing button.
const WALK: Stop[] = [
  { id: "tree", at: "bottom", off: -36 },
  { id: "s-plan", at: "left", off: 30, bow: 26, dot: true },
  { id: "s-day", at: "left", off: 30, bow: -30, dot: true },
  { id: "s-look", at: "left", off: 30, bow: 28, dot: true },
  // The ring: down the outside of the left card, under both, up the outside of
  // the right card. Every bow is positive because each leg turns the same way,
  // which is what closes the circle.
  { id: "shot-map", at: "bottom", off: 16, bow: -50, dot: true, ringOnly: true },
  { id: "shot-sola", at: "top", off: 14, bow: 40, dot: true },
  { id: "shot-sola", at: "bottom", off: 30, bow: 120, ringOnly: true },
  { id: "shot-focus", at: "bottom", off: 30, bow: 60, ringOnly: true },
  { id: "shot-focus", at: "top", off: 14, bow: 120, dot: true, ringOnly: true },
  { id: "keeps", at: "left", off: 30, bow: 40, dot: true },
  { id: "price", at: "left", off: 30, bow: -30, dot: true },
  { id: "close", at: "left", off: 24, bow: 0, terminal: true },
];

interface Node { x: number; y: number; len: number; dot: boolean; terminal: boolean }

const GOLD = "#e6b877";

export function JourneyThread() {
  const maskId = `journey-reveal-${React.useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const rootRef = React.useRef<HTMLDivElement>(null);
  const maskRef = React.useRef<SVGPathElement>(null);
  const tipRef = React.useRef<SVGGElement>(null);
  const [geo, setGeo] = React.useState<{
    d: string; w: number; h: number; total: number; nodes: Node[];
    /** phone-width layout: the rail hugs the edge, so the discs shrink to fit */
    compact: boolean;
    /** monotonic (y, length) checkpoints for the scroll mapping */
    marks: { y: number; len: number }[];
  } | null>(null);
  const [drawn, setDrawn] = React.useState(0);
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(m.matches);
    read();
    m.addEventListener("change", read);
    return () => m.removeEventListener("change", read);
  }, []);

  // ---- measure and build ----
  const rebuild = React.useCallback(() => {
    const root = rootRef.current?.parentElement; // the page container
    if (!root) return;
    const cr = root.getBoundingClientRect();
    const w = cr.width;
    const h = root.scrollHeight;

    const rectOf = (id: string): DOMRect | null => {
      const el = root.querySelector<HTMLElement>(`[data-journey="${id}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return r.width < 2 || r.height < 2 ? null : r; // display:none (mobile map)
    };
    const ringLive = !!rectOf("shot-map");

    const pts: (Stop & { x: number; y: number })[] = [];
    for (const s of WALK) {
      if (s.ringOnly && !ringLive) continue;
      const r = rectOf(s.id);
      if (!r) continue;
      const off = s.off ?? 0;
      let x = r.left + r.width / 2 - cr.left;
      let y = r.top + r.height / 2 - cr.top;
      if (s.at === "top") y = r.top - cr.top - off;
      if (s.at === "bottom") y = r.bottom - cr.top + off;
      if (s.at === "left") x = r.left - cr.left - off;
      if (s.at === "right") x = r.right - cr.left + off;
      x = Math.max(w < 640 ? 12 : 14, Math.min(w - 14, x));
      pts.push({ ...s, x, y });
    }
    if (pts.length < 3) return;

    // Quadratic legs, control point pushed perpendicular to the travel
    // direction by the arriving stop's bow. This is the same family of curve
    // the tree draws its branches with.
    const scratch = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    const nodes: Node[] = [];
    const marks: { y: number; len: number }[] = [];
    let yMono = pts[0].y;
    const record = (p: (typeof pts)[number]) => {
      scratch.setAttribute("d", d);
      const len = scratch.getTotalLength();
      if (p.dot || p.terminal) nodes.push({ x: p.x, y: p.y, len, dot: !!p.dot, terminal: !!p.terminal });
      yMono = Math.max(yMono, p.y);
      marks.push({ y: yMono, len });
    };
    record(pts[0]);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 1;
      const bow = b.bow ?? 0;
      const cx = (a.x + b.x) / 2 + (-dy / dist) * bow;
      const cy = (a.y + b.y) / 2 + (dx / dist) * bow;
      d += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      record(b);
    }
    scratch.setAttribute("d", d);
    setGeo({ d, w, h, total: scratch.getTotalLength(), nodes, marks, compact: w < 640 });
  }, []);

  React.useEffect(() => {
    // Twice: once now, once after fonts and images settle the layout.
    rebuild();
    const t = window.setTimeout(rebuild, 600);
    const root = rootRef.current?.parentElement;
    const ro = root ? new ResizeObserver(() => rebuild()) : null;
    if (root && ro) ro.observe(root);
    return () => { window.clearTimeout(t); ro?.disconnect(); };
  }, [rebuild]);

  // ---- scroll drives the reveal ----
  React.useEffect(() => {
    if (!geo || reduced) return; // reduced motion renders fully drawn, no listener
    let raf = 0;
    const tick = () => {
      const root = rootRef.current?.parentElement;
      if (!root) return;
      const top = root.getBoundingClientRect().top; // negative once scrolled
      // The reveal line sits at 78% of the viewport: the thread's tip stays
      // just below what you are reading, always arriving as the section does.
      const reveal = window.innerHeight * 0.78 - top;
      const { marks, total } = geo;
      let len = 0;
      if (reveal <= marks[0].y) len = 0;
      else if (reveal >= marks[marks.length - 1].y) len = total;
      else {
        for (let i = 1; i < marks.length; i++) {
          if (reveal <= marks[i].y) {
            const a = marks[i - 1], b = marks[i];
            const f = (reveal - a.y) / Math.max(1, b.y - a.y);
            len = a.len + (b.len - a.len) * Math.max(0, Math.min(1, f));
            break;
          }
        }
      }
      // Scrolled to the bottom means the walk is over, whatever the reveal-line
      // arithmetic says: very tall viewports otherwise leave the last few px
      // undrawn and the terminal check never fires.
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) len = geo.total;
      // Monotonic on purpose. Scrolling back up must not unwalk the path: two
      // sections earlier the page promises that falling behind loses nothing.
      setDrawn((prev) => Math.max(prev, len));
    };
    // A delta-poll instead of a scroll listener. One rAF loop comparing a single
    // number per frame costs nothing measurable, and it works in every scrolling
    // situation a listener can miss: nested scroll containers, iOS momentum
    // frames after the finger lifts, and embedded webviews that swallow scroll
    // events entirely (the in-app browser this page will live inside is one).
    let live = true;
    let lastTop = Number.NaN;
    let lastH = 0;
    const loop = () => {
      if (!live) return;
      const root = rootRef.current?.parentElement;
      const top = root ? root.getBoundingClientRect().top : 0;
      const vh = window.innerHeight;
      if (top !== lastTop || vh !== lastH) { lastTop = top; lastH = vh; tick(); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { live = false; if (raf) cancelAnimationFrame(raf); };
  }, [geo, reduced]);

  // Tip follows the drawn end of the path. Imperative to keep scroll cheap.
  React.useEffect(() => {
    const mask = maskRef.current, tip = tipRef.current;
    if (!mask || !tip || !geo) return;
    const eff = reduced ? geo.total : drawn;
    mask.style.strokeDashoffset = String(Math.max(0, geo.total - eff));
    if (!reduced && eff > 4 && eff < geo.total - 4) {
      const p = mask.getPointAtLength(eff);
      // style.transform, not the transform attribute: only the style property
      // honours the CSS transition, which keeps the tip glued to the animating
      // mask edge when the ring's long up-leg draws in one scroll step.
      tip.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
      tip.style.opacity = "1";
    } else {
      tip.style.opacity = "0";
    }
  }, [drawn, geo, reduced]);

  // Reduced motion never runs the scroll listener; the thread is simply complete.
  const shown = reduced && geo ? geo.total : drawn;
  const finished = geo ? shown >= geo.total - 4 : false;

  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none absolute inset-0">
      {geo && (
        <svg width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} className="absolute left-0 top-0">
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={geo.w} height={geo.h}>
              <path
                ref={maskRef}
                d={geo.d}
                fill="none"
                stroke="#fff"
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={geo.total}
                strokeDashoffset={reduced ? 0 : geo.total}
                style={{ transition: "stroke-dashoffset 0.25s linear" }}
              />
            </mask>
          </defs>

          {/* the faint full route, so the path ahead reads as "still to come" */}
          <path d={geo.d} fill="none" stroke={GOLD} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="3 8" opacity={0.28} />

          {/* the walked thread: the tree's own next-step line, revealed by scroll */}
          <g mask={`url(#${maskId})`}>
            <path
              d={geo.d}
              fill="none"
              stroke={GOLD}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="3 8"
              opacity={0.75}
              style={reduced ? undefined : { animation: "dash 2.6s linear infinite", filter: `drop-shadow(0 0 4px ${GOLD}66)` }}
            />
          </g>

          {/* step nodes: lit once the thread reaches them */}
          {geo.nodes.map((n, i) => {
            const lit = shown >= n.len - 2;
            const R = geo.compact ? { outer: 4.6, inner: 1.8, term: 8.5, check: 0.72 } : { outer: 6.5, inner: 2.4, term: 11, check: 1 };
            if (n.terminal) {
              return (
                <g key={i} transform={`translate(${n.x} ${n.y})`} style={{ opacity: lit ? 1 : 0.3, transition: "opacity .5s ease" }}>
                  <circle r={R.term} fill="#0a0b0d" stroke={GOLD} strokeWidth={1.5} />
                  <circle r={R.term} fill={GOLD} opacity={finished ? 1 : 0} style={{ transition: "opacity .45s ease" }} />
                  {finished ? (
                    <path d={`M ${-4.5 * R.check} ${0.5 * R.check} L ${-1.5 * R.check} ${3.5 * R.check} L ${4.5 * R.check} ${-3.5 * R.check}`} fill="none" stroke="#0d1a14" strokeWidth={2.4 * R.check} strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <circle r={3 * R.check} fill={GOLD} />
                  )}
                </g>
              );
            }
            return (
              <g key={i} transform={`translate(${n.x} ${n.y})`} style={{ opacity: lit ? 1 : 0.28, transition: "opacity .5s ease" }}>
                <circle r={R.outer} fill="#0a0b0d" stroke={GOLD} strokeWidth={1.4} />
                <circle r={R.inner} fill={GOLD} style={lit && !reduced ? { filter: `drop-shadow(0 0 5px ${GOLD})` } : undefined} />
              </g>
            );
          })}

          {/* the tip: where you are on the path right now */}
          <g ref={tipRef} style={{ opacity: 0, transition: "opacity .3s ease, transform .25s linear" }}>
            <circle r={9} fill={GOLD} opacity={0.22} className={reduced ? undefined : "animate-pulse-soft"} />
            <circle r={3.4} fill={GOLD} style={{ filter: `drop-shadow(0 0 6px ${GOLD})` }} />
          </g>
        </svg>
      )}
    </div>
  );
}
