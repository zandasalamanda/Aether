"use client";

import * as React from "react";
import { Play, BookOpen, X, ArrowUpRight } from "lucide-react";
import type { ShowcaseMap } from "@/lib/kairo/showcase-maps";
import { PlanetOrb } from "./PlanetOrb";
import { cn, truncate } from "@/lib/utils";

// A static rendering of the real in-app goal map, drawn EXACTLY as the live map draws
// it: the same fishbone layout + collision relaxation, DOM node orbs and an SVG
// connector layer in one coordinate space, the whole tree measured and framed so it
// sits centred at any size. `interactive` makes every node tappable, opening a
// research sheet (real Watch + Read links) — a live showcase of the app's research.
//
// Orientation: the spine flows UP on narrow screens (a tall trunk) and to the RIGHT
// on wide screens (a roadmap), matching the app's own map on each form factor.

const SPINE_RAD = 168, LEAF_RAD = 128, SPINE_ARC = 0.04;

type LNode = { id: string; parentId: string | null; title: string; sub: boolean };
interface Placed { node: LNode; x: number; y: number; px: number; py: number; spine: boolean }

const ytUrl = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const readUrl = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

function layout(nodes: LNode[], baseDir: number): Placed[] {
  const ids = new Set(nodes.map((n) => n.id));
  const kids = new Map<string | null, LNode[]>();
  for (const n of nodes) {
    const p = n.parentId && ids.has(n.parentId) ? n.parentId : null;
    (kids.get(p) ?? kids.set(p, []).get(p)!).push(n);
  }
  const hasKids = (id: string) => (kids.get(id)?.length ?? 0) > 0;
  const out: Placed[] = [];
  // `lead` sets which side a milestone's FIRST sub-step hangs on; it flips at every
  // milestone so single-sub milestones alternate sides, keeping the tree balanced.
  const place = (parentId: string | null, cx: number, cy: number, dir: number, lead: number) => {
    const children = kids.get(parentId) ?? [];
    const leaves = children.filter((c) => !hasKids(c.id));
    const spineKids = children.filter((c) => hasKids(c.id));
    leaves.forEach((leaf, i) => {
      const side = (i % 2 === 0 ? 1 : -1) * lead, rank = Math.floor(i / 2);
      const angle = dir + side * (Math.PI / 2 - 0.08) + side * rank * 0.32;
      const rad = LEAF_RAD + rank * 46;
      out.push({ node: leaf, x: cx + Math.cos(angle) * rad, y: cy + Math.sin(angle) * rad, px: cx, py: cy, spine: false });
    });
    spineKids.forEach((cont, i) => {
      const fan = spineKids.length > 1 ? (i - (spineKids.length - 1) / 2) * 0.6 : 0;
      const angle = dir + SPINE_ARC + fan;
      const x = cx + Math.cos(angle) * SPINE_RAD, y = cy + Math.sin(angle) * SPINE_RAD;
      out.push({ node: cont, x, y, px: cx, py: cy, spine: true });
      place(cont.id, x, y, angle, -lead);
    });
  };
  const roots = kids.get(null) ?? [];
  roots.forEach((root) => {
    const spine = hasKids(root.id), rad = spine ? SPINE_RAD : LEAF_RAD;
    const x = Math.cos(baseDir) * rad, y = Math.sin(baseDir) * rad;
    out.push({ node: root, x, y, px: 0, py: 0, spine });
    if (spine) place(root.id, x, y, baseDir, 1);
  });
  return relax(out);
}

function relax(placed: Placed[]): Placed[] {
  if (placed.length < 2) return placed;
  const pts = placed.map((p) => ({ ...p }));
  const idx = new Map<string, number>();
  pts.forEach((p, i) => idx.set(p.node.id, i));
  const MIN_SPINE = 122, MIN_LEAF = 92, CORE_CLEAR = 128;
  for (let iter = 0; iter < 90; iter++) {
    let moved = false;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j], min = a.spine || b.spine ? MIN_SPINE : MIN_LEAF;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001;
      if (d < min) { const push = (min - d) / 2, ux = dx / d, uy = dy / d; a.x -= ux * push; a.y -= uy * push; b.x += ux * push; b.y += uy * push; moved = true; }
    }
    for (const p of pts) { const d = Math.hypot(p.x, p.y) || 0.001; if (d < CORE_CLEAR) { const push = CORE_CLEAR - d; p.x += (p.x / d) * push; p.y += (p.y / d) * push; moved = true; } }
    if (!moved) break;
  }
  for (const p of pts) { const pi = p.node.parentId ? idx.get(p.node.parentId) : undefined; if (pi !== undefined) { p.px = pts[pi].x; p.py = pts[pi].y; } else { p.px = 0; p.py = 0; } }
  return pts;
}

interface Frame { minX: number; minY: number; w: number; h: number }

export function ShowcaseTree({ map, interactive = false, onOpenChange }: { map: ShowcaseMap; interactive?: boolean; onOpenChange?: (open: boolean) => void }) {
  const hex = map.color;
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const treeRef = React.useRef<HTMLDivElement>(null);
  const sRef = React.useRef(1);
  const [cw, setCw] = React.useState(0);
  const [on, setOn] = React.useState(false);
  const [frame, setFrame] = React.useState<Frame | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Wide → flow right (a roadmap); narrow → flow up (a trunk). Matches the real app.
  const orientation: "up" | "right" = cw >= 640 ? "right" : "up";
  const baseDir = orientation === "right" ? 0 : -Math.PI / 2;

  const { placed, maxDist } = React.useMemo(() => {
    const nodes: LNode[] = [];
    map.milestones.slice(0, 5).forEach((m, i) => {
      nodes.push({ id: `m${i}`, parentId: i > 0 ? `m${i - 1}` : null, title: m.title, sub: false });
      m.subs.slice(0, 2).forEach((sub, j) => nodes.push({ id: `m${i}s${j}`, parentId: `m${i}`, title: sub, sub: true }));
    });
    const p = layout(nodes, baseDir);
    const md = Math.max(1, ...p.map((n) => Math.hypot(n.x, n.y)));
    return { placed: p, maxDist: md };
  }, [map, baseDir]);

  // Derive the open node from its id, so a map/orientation change (which rebuilds
  // `placed`) can't leave a stale sheet — no reset effect needed.
  const selected = selectedId ? placed.find((p) => p.node.id === selectedId)?.node ?? null : null;

  // Let a parent pause its auto-cycle while a research sheet is open, so exploring a
  // step is never yanked out from under the reader.
  React.useEffect(() => { onOpenChange?.(selectedId !== null); }, [selectedId, onOpenChange]);

  // Measure the real rendered content in LAYOUT units (every visual piece is tagged
  // [data-vis]), divide by the current scale, and frame exactly that.
  React.useLayoutEffect(() => {
    const tree = treeRef.current;
    if (!tree) return;
    const measure = () => {
      const sc = sRef.current || 1;
      const base = tree.getBoundingClientRect();
      let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
      tree.querySelectorAll<HTMLElement>("[data-vis]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width && !r.height) return;
        a = Math.min(a, (r.left - base.left) / sc);
        b = Math.min(b, (r.top - base.top) / sc);
        c = Math.max(c, (r.right - base.left) / sc);
        d = Math.max(d, (r.bottom - base.top) / sc);
      });
      if (!isFinite(a)) return;
      setFrame((f) =>
        f && Math.abs(f.minX - a) < 0.5 && Math.abs(f.minY - b) < 0.5 && Math.abs(f.w - (c - a)) < 0.5 && Math.abs(f.h - (d - b)) < 0.5
          ? f
          : { minX: a, minY: b, w: c - a, h: d - b }
      );
    };
    measure();
    const raf = requestAnimationFrame(measure);
    if (document.fonts && document.fonts.status !== "loaded") {
      document.fonts.ready.then(() => requestAnimationFrame(measure)).catch(() => {});
    }
    return () => cancelAnimationFrame(raf);
  }, [placed, cw]);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const apply = () => setCw(el.getBoundingClientRect().width);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    const raf = requestAnimationFrame(() => setOn(true));
    const timer = window.setTimeout(() => setOn(true), 80);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); clearTimeout(timer); };
  }, []);

  const MAXH = orientation === "right" ? 460 : 420, PAD = 16;
  const ready = !!frame && cw > 0;
  // Anchor the box on the CORE along the flow axis so the trunk stays centred, and
  // frame the perpendicular axis to the measured content.
  const isRight = orientation === "right";
  const halfW = frame ? Math.max(-frame.minX, frame.minX + frame.w) + PAD : 0;
  const halfH = frame ? Math.max(-frame.minY, frame.minY + frame.h) + PAD : 0;
  const W0 = isRight ? (frame ? frame.w + PAD * 2 : 0) : halfW * 2;
  const H0 = isRight ? halfH * 2 : (frame ? frame.h + PAD * 2 : 0);
  const s = ready ? Math.min(cw / W0, MAXH / H0) : 1;
  React.useLayoutEffect(() => { sRef.current = s; });
  const tx = isRight ? (frame ? (PAD - frame.minX) * s : 0) : halfW * s;
  const ty = isRight ? halfH * s : (frame ? (PAD - frame.minY) * s : 0);

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="relative mx-auto" style={ready ? { width: W0 * s, height: H0 * s } : { height: MAXH }}>
        <div
          ref={treeRef}
          className="absolute left-0 top-0"
          style={{ transform: ready ? `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(4)})` : "none", transformOrigin: "0 0", opacity: ready ? 1 : 0 }}
        >
          {/* connectors — same math and offsets as the live map, so lines meet the orbs */}
          <svg width={1} height={1} className="absolute left-0 top-0" style={{ overflow: "visible" }} aria-hidden>
            {placed.map((p) => {
              const isNext = p.node.id === "m0";
              const CORE_R = p.px === 0 && p.py === 0 ? 44 : 22;
              const NODE_R = p.spine ? 23 : 17;
              const dx = p.x - p.px, dy = p.y - p.py, d = Math.hypot(dx, dy) || 1;
              const sx = p.px + (dx / d) * CORE_R, sy = p.py + (dy / d) * CORE_R;
              const ex = p.x - (dx / d) * NODE_R, ey = p.y - (dy / d) * NODE_R;
              const mx = (sx + ex) / 2 + dy * 0.08, my = (sy + ey) / 2 - dx * 0.08;
              const len = Math.hypot(ex - sx, ey - sy) * 1.15 + 4;
              const delay = (Math.hypot(p.x, p.y) / maxDist) * 0.55;
              return (
                <path
                  key={p.node.id}
                  d={`M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`}
                  fill="none" stroke={hex} strokeWidth={isNext ? 1.9 : p.spine ? 1.6 : 1.0} strokeLinecap="round"
                  strokeDasharray={isNext ? "3 7" : len}
                  className={isNext ? "animate-flow" : undefined}
                  style={isNext ? { opacity: 0.85 } : { strokeDashoffset: on ? 0 : len, transition: `stroke-dashoffset 0.5s ease ${delay.toFixed(2)}s`, opacity: 0.5 }}
                />
              );
            })}
          </svg>

          {/* node orbs — the app's NodeOrb styling. Tappable when interactive. */}
          {placed.map((p) => {
            const isNext = p.node.id === "m0";
            const size = p.spine ? 50 : 38;
            const isSel = selectedId === p.node.id;
            const glow = isNext || isSel ? `0 0 26px ${hex}80` : `0 0 13px ${hex}3a`;
            const bg = `radial-gradient(circle at 40% 34%, ${hex}33, rgba(12,14,18,0.94) 72%)`;
            const delay = (Math.hypot(p.x, p.y) / maxDist) * 0.55 + 0.16;
            return (
              <div
                key={p.node.id}
                className={cn("group absolute -translate-x-1/2 -translate-y-1/2", interactive && "cursor-pointer")}
                style={{ left: p.x, top: p.y, opacity: on ? 1 : 0, transition: `opacity .45s ease ${delay.toFixed(2)}s` }}
                onClick={interactive ? (e) => { e.stopPropagation(); setSelectedId(p.node.id); } : undefined}
                role={interactive ? "button" : undefined}
                aria-label={interactive ? `Research: ${p.node.title}` : undefined}
              >
                <div className="relative grid place-items-center" style={{ width: size, height: size }}>
                  {(isNext || isSel) && <span className="absolute inset-0 animate-pulse-soft rounded-full" style={{ boxShadow: `0 0 0 4px ${hex}22, 0 0 24px ${hex}66`, margin: -4 }} />}
                  <span
                    data-vis
                    className={cn("grid place-items-center rounded-full border transition-transform", interactive && "group-hover:scale-110")}
                    style={{ width: size, height: size, borderColor: isNext || isSel ? hex : `${hex}88`, background: bg, boxShadow: glow, opacity: isNext || isSel ? 1 : 0.94 }}
                  >
                    <span className="rounded-full" style={{ width: p.spine ? 9 : 7, height: p.spine ? 9 : 7, background: hex, boxShadow: `0 0 8px ${hex}` }} />
                  </span>
                  <span className="pointer-events-none absolute left-1/2 top-full mt-1.5 max-w-[110px] -translate-x-1/2 text-center leading-tight">
                    <span data-vis className={cn("block truncate", p.spine ? "text-[13px] font-semibold text-ink" : "text-[11px] text-muted")} style={{ textShadow: "0 1px 10px rgba(8,9,11,0.96), 0 0 4px rgba(8,9,11,0.9)" }}>
                      {truncate(p.node.title, p.spine ? 22 : 26)}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}

          {/* the goal core — the real glossy planet, scaling with everything else */}
          <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: 0, top: 0, opacity: on ? 1 : 0, transition: "opacity .5s ease" }}>
            <div data-vis className="grid">
              <PlanetOrb hex={hex} size={92} icon={map.icon} seed={map.id} />
            </div>
          </div>
        </div>
      </div>

      {/* research sheet — tapping a node opens real, step-specific Watch + Read links,
          the same "every step comes with research" capability the app ships. */}
      {interactive && selected && (
        <div className="absolute inset-0 z-20 flex items-end justify-center p-3" onClick={() => setSelectedId(null)}>
          <div className="absolute inset-0 bg-canvas/50 backdrop-blur-[2px]" />
          <div className="chrome animate-sheet-up relative w-full max-w-sm rounded-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{selected.sub ? "Step" : "Milestone"} · research</div>
                <h4 className="mt-0.5 font-display text-[15px] font-semibold leading-snug text-ink">{selected.title}</h4>
              </div>
              <button onClick={() => setSelectedId(null)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-faint transition-colors hover:text-ink" aria-label="Close"><X size={15} /></button>
            </div>
            <div className="mt-3 space-y-2">
              <a href={ytUrl(selected.title)} target="_blank" rel="noopener noreferrer" className="raised-btn flex items-center gap-3 rounded-xl px-3 py-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: "#ff000018", color: "#ff4d4d" }}><Play size={15} fill="currentColor" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-ink">Watch a hand-picked video</span>
                  <span className="block truncate text-[11px] text-faint">Best of YouTube for this step</span>
                </span>
                <ArrowUpRight size={15} className="shrink-0 text-faint" />
              </a>
              <a href={readUrl(`${selected.title} guide`)} target="_blank" rel="noopener noreferrer" className="raised-btn flex items-center gap-3 rounded-xl px-3 py-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `${hex}1f`, color: hex }}><BookOpen size={15} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-ink">Read the guides</span>
                  <span className="block truncate text-[11px] text-faint">Cited articles &amp; how-tos</span>
                </span>
                <ArrowUpRight size={15} className="shrink-0 text-faint" />
              </a>
            </div>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-faint">Every step in your map comes with research picked for it.</p>
          </div>
        </div>
      )}
    </div>
  );
}
