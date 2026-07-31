"use client";

import * as React from "react";
import { useSvgId } from "@/lib/kairo/svg-id";

// The page's spine: one continuous dotted thread, in the exact vocabulary the
// goal map uses for "your next step" (gold, dasharray 3 8, the same marching
// `dash` keyframe), entering above the page's first pixel and growing down as you
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
  /**
   * Anchor the y to an edge too, instead of the box's middle. Without this a
   * stop can only ever be an edge MIDPOINT, so a loop meant to go around a card
   * is forced through its centre. With it, `at` picks the x and `atY` picks the
   * y, which addresses a corner.
   */
  atY?: "top" | "bottom";
  offY?: number;
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
  // The hero is the first section of the map, not a poster above it. The thread
  // enters ABOVE the page's first pixel (h-rail sits at page y 0, and off:40
  // puts the first point at y -40, outside the viewBox), so it is already
  // mid-stroke at the top edge with no visible cap. The birth mask fades it up
  // out of black over the first ~140px, which lands it behind the header and
  // fully lit by the tagline.
  //
  // h-mark, h-title, h-start and h-picks are all block children of the same
  // padded column, so their rect.left is identical and every one of them
  // resolves to the SAME rail x as every section below. That is the whole idea:
  // the hero rail and the page rail are one line.
  { id: "h-rail", at: "top", off: 40 },
  { id: "h-mark", at: "left", off: 30, bow: 14 },
  { id: "h-title", at: "left", off: 30, bow: -26, dot: true },
  { id: "h-start", at: "left", off: 30, bow: 16, dot: true },
  { id: "h-picks", at: "left", off: 30, bow: -22 },
  { id: "tree", at: "left", off: 30, bow: 16, dot: true },
  // Bows corrected from 26 / 28 / 40. Travelling down, the belly sits at
  // rail_x - bow/2, so on a phone (rail clamped to 18) the old values put the
  // belly at or past the canvas edge and the rail visibly flattened against it.
  { id: "s-plan", at: "left", off: 30, bow: 16, dot: true },
  { id: "s-day", at: "left", off: 30, bow: -30, dot: true },
  { id: "s-look", at: "left", off: 30, bow: 16, dot: true },
  // Stay on the rail all the way down to the shots section. Without this the
  // thread left the rail at s-look and dived diagonally into the ring, straight
  // through the paragraph it was leaving.
  // Anchored to the section's TOP, not its middle. The shots section is 1000px
  // tall, so a centre anchor put this stop below the ring's entry corner and the
  // thread walked down past the paragraph and then back up through it.
  { id: "shots", at: "left", off: 30, atY: "top", offY: 20, bow: 12 },
  // The ZIGZAG through the screenshots. It weaves rather than sweeping a
  // rectangle, which is what made this section feel alive, but every leg is
  // routed through a measured corridor so it never draws over a card or a
  // caption:
  //   - above the wide map card (its top edge minus 20)
  //   - down the right of the map (x past its right edge, still inside the
  //     section box)
  //   - LEFT along the 20px band between the map's bottom and the lower row
  //     (offY on a "top" anchor moves UP, on a "bottom" anchor moves DOWN, so
  //     both ends of that band leg use a positive offY). The map's own
  //     caption overflows its bottom edge by 8px, so the usable band is 12px
  //     and the leg is centred in what is actually free, not in the gap.
  //   - down the gap between the two lower cards (x 536-736 at desktop)
  //   - out along the bottom, below both lower cards
  // atY is what makes the corners expressible: "top"/"bottom" alone resolve to
  // a box's CENTRE x, which is how an earlier version ended up drawing down the
  // middle of a screenshot.
  { id: "shots", at: "left", off: 30, atY: "top", offY: 20, bow: 12, dot: true, ringOnly: true },
  { id: "shot-map", at: "right", off: 30, atY: "top", offY: 20, bow: -14, ringOnly: true },
  { id: "shot-map", at: "right", off: 30, atY: "bottom", offY: 14, bow: -14, dot: true, ringOnly: true },
  { id: "shot-sola", at: "right", off: 100, atY: "top", offY: 6, bow: 0, ringOnly: true },
  { id: "shot-sola", at: "right", off: 100, atY: "bottom", offY: 30, bow: 10, dot: true, ringOnly: true },
  // Not ringOnly: on a phone the zigzag is skipped entirely and this is the one
  // rail stop the thread uses to get past the screenshots.
  { id: "shots", at: "left", off: 30, atY: "bottom", offY: 30, bow: -18, dot: true },
  { id: "keeps", at: "left", off: 30, bow: 20, dot: true },
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
    /** evenly spaced points along the path, so the tip never calls getPointAtLength */
    sample: { x: number; y: number }[];
  } | null>(null);
  // How far the thread is drawn lives in a ref, NOT in state. It changes every
  // animation frame, and putting it in state re-rendered this whole component
  // (including every node in the walk) 60 times a second while scrolling, which
  // is what made the thread stutter on a phone. The frame loop writes the mask
  // and the tip straight to the DOM instead.
  const drawnRef = React.useRef(0);
  // Progress in SCROLL units. Path lengths are invalidated by every rebuild;
  // how far down the page you have been is not.
  const maxScrollRef = React.useRef(0);
  const bottomRef = React.useRef(false);
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
      if (s.atY === "top") y = r.top - cr.top - (s.offY ?? 0);
      if (s.atY === "bottom") y = r.bottom - cr.top + (s.offY ?? 0);
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
    const total = scratch.getTotalLength();

    // Sample the path once, here, so the frame loop can interpolate instead of
    // walking the geometry every frame.
    const SAMPLES = 400;
    const sample: { x: number; y: number }[] = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const pt = scratch.getPointAtLength((total * i) / SAMPLES);
      sample.push({ x: pt.x, y: pt.y });
    }

    // Identical geometry means nothing to do. ResizeObserver fires on a phone
    // every time the URL bar collapses or a caption rewraps, and each rebuild
    // otherwise allocated a new geo, tore down the frame loop and re-rendered
    // every node in the walk.
    setGeo((prev) =>
      prev && prev.d === d && prev.w === w && prev.h === h
        ? prev
        : { d, w, h, total, nodes, marks, compact, start: { x: pts[0].x, y: pts[0].y }, rootTop, sample },
    );
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

  // ---- one frame loop drives the whole reveal ----
  //
  // Everything below writes to the DOM directly. Pushing the drawn length
  // through React state re-rendered this component (and re-created every node
  // in the walk) sixty times a second while scrolling, which is what made the
  // thread stutter on a phone.
  React.useEffect(() => {
    const mask = maskRef.current;
    if (!geo || !mask) return;
    const tip = tipRef.current;
    const { marks, total, nodes, rootTop, h, sample } = geo;

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

    // The high-water mark is kept in SCROLL units, not path units. Path units
    // are invalidated by every rebuild: crossing 640px drops the whole
    // screenshot ring (thousands of px of path), so a stale drawn length could
    // exceed the new total, the monotonic guard could never be satisfied again,
    // and the thread froze for the rest of the session. Scroll position means
    // the same thing before and after a re-measure.
    const currentTarget = () => {
      const sy = window.scrollY;
      if (sy > maxScrollRef.current) maxScrollRef.current = sy;
      // Reaching the bottom means the walk is over, whatever the reveal-line
      // arithmetic says: tall viewports otherwise leave the last few px undrawn
      // and the terminal node never completes.
      if (sy + window.innerHeight >= h - 2) bottomRef.current = true;
      return bottomRef.current ? total : targetFor(maxScrollRef.current);
    };

    if (reduced) {
      // Complete and still: no loop, no timers, nothing to animate. bottomRef
      // rather than drawnRef, so turning Reduce Motion back off re-anchors to
      // the real scroll position instead of staying pinned at the end.
      bottomRef.current = true;
      mask.style.strokeDashoffset = "0";
      if (tip) tip.style.opacity = "0";
      setLit(nodes.length);
      setFinished(true);
      return;
    }

    // Re-anchor to the new geometry immediately, so a rebuild mid-scroll picks
    // up exactly where the eye already is rather than replaying the walk.
    drawnRef.current = currentTarget();
    mask.style.strokeDashoffset = String(Math.max(0, total - drawnRef.current));

    // Position along the path, from a table sampled once at build time.
    // getPointAtLength walks the path from zero on every call, and this path is
    // thousands of px across ~20 quadratic legs, so calling it per frame was a
    // full synchronous geometry walk per frame on the main thread.
    const pointAt = (len: number) => {
      const f = Math.max(0, Math.min(1, len / total)) * (sample.length - 1);
      const i = Math.min(sample.length - 2, Math.floor(f));
      const t = f - i;
      const a = sample[i], b = sample[i + 1];
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    };

    let live = true;
    let raf = 0;
    let litNow = -1;
    let doneNow = false;
    let last = performance.now();

    const frame = (now: number) => {
      if (!live) return;
      raf = requestAnimationFrame(frame);

      // Elapsed time, not frames. The 0.16 coefficient was tuned at 60Hz; applied
      // per frame it smooths twice as fast on a 120Hz ProMotion iPhone and half as
      // fast on a throttled one, a 4x spread on the same gesture. Clamped so
      // returning to a backgrounded tab cannot produce one huge dt and snap.
      const dt = Math.min(64, now - last);
      last = now;

      const target = currentTarget();
      const gap = target - drawnRef.current;
      if (Math.abs(gap) < 0.5) {
        drawnRef.current = target;
      } else {
        drawnRef.current += gap * (1 - Math.pow(1 - 0.16, dt / 16.667));
      }
      const eff = drawnRef.current;

      mask.style.strokeDashoffset = String(Math.max(0, total - eff));

      if (tip) {
        if (eff > 4 && eff < total - 4) {
          const pt = pointAt(eff);
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
            {/* The birth fade, as a PAINT SERVER rather than a mask.
                It used to be a page-sized <mask> holding a full-page white rect,
                which forced the browser to allocate an offscreen buffer the
                height of the whole landing page and composite every pixel of
                the thread through it, on a phone, forever. A gradient stroke
                costs nothing and fades the same 160px. */}
            <linearGradient
              id={`${maskId}-birth`}
              gradientUnits="userSpaceOnUse"
              x1="0" y1={geo.start.y} x2="0" y2={geo.start.y + 160}
            >
              <stop offset="0%" stopColor={GOLD} stopOpacity="0" />
              <stop offset="55%" stopColor={GOLD} stopOpacity="0.55" />
              <stop offset="100%" stopColor={GOLD} stopOpacity="1" />
            </linearGradient>
            <radialGradient id={`${maskId}-orb`} cx="36%" cy="30%" r="72%">
              <stop offset="0%" stopColor="#fff6e6" />
              <stop offset="45%" stopColor="#f0d49a" />
              <stop offset="100%" stopColor="#c79246" />
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

          <g>
            {/* the faint full route, so the path ahead reads as "still to come" */}
            <path d={geo.d} fill="none" stroke={`url(#${maskId}-birth)`} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="3 8" opacity={0.28} />

            {/* the walked thread: the tree's own next-step line, revealed by scroll */}
            <g mask={`url(#${maskId})`}>
              <path
                d={geo.d}
                fill="none"
                stroke={`url(#${maskId}-birth)`}
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
            <circle r={7} fill={`url(#${maskId}-orb)`} style={{ filter: `drop-shadow(0 0 7px ${GOLD}aa)` }} />
            <ellipse cx={-2.2} cy={-2.6} rx={2.2} ry={1.5} fill="#ffffff" opacity={0.55} />
          </g>
        </svg>
      )}
    </div>
  );
}
