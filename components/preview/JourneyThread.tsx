"use client";

import * as React from "react";
import { useSvgId } from "@/lib/kairo/svg-id";

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
  /**
   * Overrides applied at phone width. On a wide screen the text column has a
   * gutter either side and the thread can swing out to a centred stop without
   * touching anything. At 375px there is no gutter, so the same swing cuts
   * diagonally straight through the paragraph. Stops that leave the rail must
   * declare how they behave when there is no room to leave it.
   */
  compact?: { at?: Stop["at"]; off?: number; bow?: number };
}

// Order matters: this is the walk. Every section stop rides a LEFT RAIL in the
// gutter (never inside the text column: an earlier weave crossed paragraphs,
// invisibly on wide screens and right through them on phones). The thread only
// travels horizontally inside the wide screenshots section (the ring) and in
// the whitespace between sections, and it finishes beside the closing button.
const WALK: Stop[] = [
  // Two stops on the tree: the thread is born deep at the trunk and curves out
  // from under it, rather than starting abruptly in open space.
  { id: "tree", at: "bottom", off: -110 },
  { id: "tree", at: "bottom", off: -8, bow: 36, compact: { at: "left", off: 26, bow: 20 } },
  { id: "s-plan", at: "left", off: 30, bow: 26, dot: true },
  { id: "s-day", at: "left", off: 30, bow: -30, dot: true },
  { id: "s-look", at: "left", off: 30, bow: 28, dot: true },
  // The ring: down the outside of the left card, under both, up the outside of
  // the right card. Every bow is positive because each leg turns the same way,
  // which is what closes the circle.
  { id: "shot-map", at: "bottom", off: 16, bow: -50, dot: true, ringOnly: true },
  { id: "shot-sola", at: "top", off: 14, bow: 40, dot: true, compact: { at: "left", off: 26, bow: 16 } },
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
  const maskId = useSvgId("journey-reveal");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const maskRef = React.useRef<SVGPathElement>(null);
  const tipRef = React.useRef<SVGGElement>(null);
  const [geo, setGeo] = React.useState<{
    d: string; w: number; h: number; total: number; nodes: Node[];
    start: { x: number; y: number };
    /** phone-width layout: the rail hugs the edge, so the discs shrink to fit */
    compact: boolean;
    /** monotonic (y, length) checkpoints for the scroll mapping */
    marks: { y: number; len: number }[];
    /** document-space top of the container, so the frame loop never reads layout */
    rootTop: number;
  } | null>(null);
  // How far the thread is drawn lives in a ref, NOT in state. It changes every
  // animation frame, and putting it in state re-rendered this whole component
  // (including every node in the walk) 60 times a second while scrolling, which
  // is what made the thread stutter on a phone. The frame loop writes the mask
  // and the tip straight to the DOM instead.
  const drawnRef = React.useRef(0);
  // The only things a frame can change that actually need React: how many nodes
  // have been reached, and whether the walk is over. Both change a handful of
  // times over the whole page instead of once a frame.
  const [lit, setLit] = React.useState(0);
  const [finished, setFinished] = React.useState(false);
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
    // Document-space top, captured once. The frame loop needs the container's
    // offset, and reading it per frame would force a layout on every frame
    // right after the loop has written styles. window.scrollY is free.
    const rootTop = cr.top + window.scrollY;

    const rectOf = (id: string): DOMRect | null => {
      const el = root.querySelector<HTMLElement>(`[data-journey="${id}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return r.width < 2 || r.height < 2 ? null : r; // display:none (mobile map)
    };
    const ringLive = !!rectOf("shot-map");

    const compact = w < 640;
    const pts: (Stop & { x: number; y: number })[] = [];
    for (const raw of WALK) {
      if (raw.ringOnly && !ringLive) continue;
      const r = rectOf(raw.id);
      if (!r) continue;
      const s = compact && raw.compact ? { ...raw, ...raw.compact } : raw;
      const off = s.off ?? 0;
      let x = r.left + r.width / 2 - cr.left;
      let y = r.top + r.height / 2 - cr.top;
      if (s.at === "top") y = r.top - cr.top - off;
      if (s.at === "bottom") y = r.bottom - cr.top + off;
      if (s.at === "left") x = r.left - cr.left - off;
      if (s.at === "right") x = r.right - cr.left + off;
      x = Math.max(compact ? 18 : 14, Math.min(w - 14, x));
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
      // Bows are tuned for a wide screen, where swinging 30-40px sideways happens
      // in empty gutter. At phone width that same swing lands in the paragraph,
      // so the whole family is scaled down and the walk stays a near-vertical
      // rail. Measured: unscaled, the thread crossed 20 separate text blocks.
      const bow = (b.bow ?? 0) * (compact ? 0.28 : 1);
      const cx = (a.x + b.x) / 2 + (-dy / dist) * bow;
      const cy = (a.y + b.y) / 2 + (dx / dist) * bow;
      d += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      record(b);
    }
    scratch.setAttribute("d", d);
    setGeo({ d, w, h, total: scratch.getTotalLength(), nodes, marks, compact, start: { x: pts[0].x, y: pts[0].y }, rootTop });
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
  // ---- one frame loop drives the whole reveal ----
  //
  // Everything below writes to the DOM directly. The previous version pushed the
  // drawn length through React state on every frame, so scrolling re-rendered
  // this component (and re-created every node in the walk) sixty times a second.
  // That is what made the thread stutter on a phone.
  React.useEffect(() => {
    const mask = maskRef.current;
    if (!geo || !mask) return;
    const tip = tipRef.current;
    const { marks, total, nodes, rootTop, h } = geo;

    if (reduced) {
      // Complete and still: no loop, no timers, nothing to animate.
      mask.style.strokeDashoffset = "0";
      if (tip) tip.style.opacity = "0";
      drawnRef.current = total;
      setLit(nodes.length);
      setFinished(true);
      return;
    }

    // Where the scroll says the thread should have reached.
    const targetFor = (scrollY: number) => {
      // The reveal line sits at 78% of the viewport: the tip stays just below
      // what you are reading, always arriving as the section does.
      const reveal = window.innerHeight * 0.78 - (rootTop - scrollY);
      if (reveal <= marks[0].y) return 0;
      if (reveal >= marks[marks.length - 1].y) return total;
      for (let i = 1; i < marks.length; i++) {
        if (reveal <= marks[i].y) {
          const a = marks[i - 1], b = marks[i];
          const f = (reveal - a.y) / Math.max(1, b.y - a.y);
          return a.len + (b.len - a.len) * Math.max(0, Math.min(1, f));
        }
      }
      return total;
    };

    let live = true;
    let raf = 0;
    let litNow = -1;
    let doneNow = false;

    const frame = () => {
      if (!live) return;
      raf = requestAnimationFrame(frame);

      const sy = window.scrollY;
      let target = targetFor(sy);
      // Reaching the bottom means the walk is over, whatever the reveal-line
      // arithmetic says: tall viewports otherwise leave the last few px undrawn
      // and the terminal node never completes.
      if (sy + window.innerHeight >= h - 2) target = total;

      // Monotonic on purpose. Scrolling back up must not unwalk the path: two
      // sections earlier the page promises that falling behind loses nothing.
      if (target <= drawnRef.current) return;

      // Ease toward the target rather than snapping to it. A per-frame
      // exponential approach is what makes this read as smooth: it absorbs
      // momentum-scroll jumps and the long ring leg, without the stutter a CSS
      // transition produces when every frame restarts it.
      const next = drawnRef.current + (target - drawnRef.current) * 0.16;
      drawnRef.current = target - next < 0.5 ? target : next;
      const eff = drawnRef.current;

      mask.style.strokeDashoffset = String(Math.max(0, total - eff));

      if (tip) {
        if (eff > 4 && eff < total - 4) {
          const pt = mask.getPointAtLength(eff);
          tip.style.transform = `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px)`;
          tip.style.opacity = "1";
        } else {
          tip.style.opacity = "0";
        }
      }

      // React only when the lighting actually changes: a handful of times over
      // the whole page instead of once a frame.
      let count = 0;
      while (count < nodes.length && eff >= nodes[count].len - 2) count++;
      if (count !== litNow) { litNow = count; setLit(count); }
      const done = eff >= total - 4;
      if (done !== doneNow) { doneNow = done; setFinished(done); }
    };

    raf = requestAnimationFrame(frame);
    return () => { live = false; cancelAnimationFrame(raf); };
  }, [geo, reduced]);


  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none absolute inset-0">
      {geo && (
        <svg width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} className="absolute left-0 top-0">
          <defs>
            <radialGradient id={`${maskId}-birth`}>
              <stop offset="0%" stopColor="#000" stopOpacity="1" />
              <stop offset="55%" stopColor="#000" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            <mask id={`${maskId}-start`} maskUnits="userSpaceOnUse" x="0" y="0" width={geo.w} height={geo.h}>
              <rect x="0" y="0" width={geo.w} height={geo.h} fill="#fff" />
              <circle cx={geo.start.x} cy={geo.start.y} r={140} fill={`url(#${maskId}-birth)`} />
            </mask>
            <radialGradient id={`${maskId}-orb`} cx="38%" cy="32%" r="75%">
              <stop offset="0%" stopColor="#4a3820" />
              <stop offset="60%" stopColor="#261b0d" />
              <stop offset="100%" stopColor="#161006" />
            </radialGradient>
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
              />
            </mask>
          </defs>

          <g mask={`url(#${maskId}-start)`}>
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
                style={reduced ? undefined : { animation: "dash 2.6s linear infinite", ...(geo.compact ? null : { filter: `drop-shadow(0 0 4px ${GOLD}66)` }) }}
              />
            </g>
          </g>

          {/* step nodes: lit once the thread reaches them */}
          {geo.nodes.map((n, i) => {
            const reached = i < lit;
            const R = geo.compact ? { outer: 4.6, inner: 1.8, term: 8.5, check: 0.72 } : { outer: 6.5, inner: 2.4, term: 11, check: 1 };
            if (n.terminal) {
              return (
                <g key={i} transform={`translate(${n.x} ${n.y})`} style={{ opacity: reached ? 1 : 0.3, transition: "opacity .5s ease" }}>
                  <circle r={R.term} fill={GOLD} opacity={0.14} />
                  <circle r={R.term} fill="none" stroke={GOLD} strokeWidth={1.5} />
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
              <g key={i} transform={`translate(${n.x} ${n.y})`} style={{ opacity: reached ? 1 : 0.28, transition: "opacity .5s ease" }}>
                <circle r={R.outer} fill={GOLD} opacity={0.16} />
                <circle r={R.outer} fill="none" stroke={GOLD} strokeWidth={1.4} />
                <circle r={R.inner} fill={GOLD} style={reached && !reduced && !geo.compact ? { filter: `drop-shadow(0 0 5px ${GOLD})` } : undefined} />
              </g>
            );
          })}

          {/* the tip: an empty goal orb, you, walking the path right now */}
          <g ref={tipRef} style={{ opacity: 0, transition: "opacity .3s ease" }}>
            <circle r={13} fill={GOLD} opacity={0.16} className={reduced ? undefined : "animate-pulse-soft"} />
            <circle r={7} fill={`url(#${maskId}-orb)`} stroke={GOLD} strokeWidth={1.4} style={{ filter: `drop-shadow(0 0 6px ${GOLD}55)` }} />
            <ellipse cx={-2.2} cy={-2.6} rx={2.2} ry={1.5} fill="#ffffff" opacity={0.3} />
          </g>
        </svg>
      )}
    </div>
  );
}
