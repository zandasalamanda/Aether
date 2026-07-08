"use client";

import * as React from "react";

// The landing signature: a lit goal-planet with a fishbone path that grows out of
// it and lights up node by node on load — the app's core metaphor (a goal becomes
// a planet with a route). Pure Canvas, DPR-aware, honours reduced motion.

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

interface Planet { cx: number; cy: number; R: number }
interface Pt { x: number; y: number; f: number }
interface Rib { bx: number; by: number; nx: number; ny: number; t: number }

export function HeroPlanet({ className }: { className?: string }) {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, raf = 0;
    let stars: { x: number; y: number; r: number; ph: number }[] = [];
    let planet: Planet = { cx: 0, cy: 0, R: 0 };
    let spine: Pt[] = [];
    let ribs: Rib[] = [];
    const t0 = performance.now();

    const buildPath = (p: Planet, mobile: boolean) => {
      const { cx, cy, R } = p;
      const startX = cx + R * 0.7;
      const startY = cy - R * 0.62;
      const ang = mobile ? -0.32 : -0.16; // radians, gently upward
      const maxReach = Math.min((w - 20) - startX, mobile ? (startY - 20) / Math.max(0.2, Math.sin(-ang)) : Infinity);
      const reach = clamp(Math.min(maxReach, R * 3.4), 110, 520);
      const N = 4;
      spine = [];
      for (let i = 0; i <= N; i++) {
        const f = i / N;
        const bow = Math.sin(f * Math.PI) * -R * 0.22;
        spine.push({
          x: clamp(startX + Math.cos(ang) * reach * f, 14, w - 14),
          y: clamp(startY + Math.sin(ang) * reach * f + bow, 14, h - 14),
          f,
        });
      }
      ribs = [];
      for (let i = 1; i <= N; i++) {
        const base = spine[i];
        const side = i % 2 ? 1 : -1;
        const len = R * 0.62;
        ribs.push({
          bx: base.x, by: base.y,
          nx: clamp(base.x + Math.cos(ang + Math.PI / 2) * len * side, 14, w - 14),
          ny: clamp(base.y + Math.sin(ang + Math.PI / 2) * len * side, 14, h - 14),
          t: base.f,
        });
      }
    };

    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      if (w === 0 || h === 0) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = clamp(Math.round((w * h) / 9000), 40, 160);
      stars = Array.from({ length: count }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.2 + 0.2, ph: Math.random() * Math.PI * 2 }));
      const mobile = w < 760;
      const R = clamp(mobile ? w * 0.26 : Math.min(w, h) * 0.2, 74, 230);
      planet = { cx: mobile ? w * 0.5 : w * 0.66, cy: mobile ? h * 0.34 : h * 0.5, R };
      buildPath(planet, mobile);
    };

    const drawPlanet = (t: number) => {
      const { cx, cy, R } = planet;
      const lx = cx - R * 0.4, ly = cy - R * 0.44;
      // atmosphere glow
      const glow = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 2.4);
      glow.addColorStop(0, "rgba(230,184,119,0.22)");
      glow.addColorStop(0.5, "rgba(230,184,119,0.06)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, cy, R * 2.4, 0, Math.PI * 2); ctx.fill();
      // sphere
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
      const body = ctx.createRadialGradient(lx, ly, R * 0.08, cx, cy, R * 1.2);
      body.addColorStop(0, "#fff6e6");
      body.addColorStop(0.28, "#f2d6a4");
      body.addColorStop(0.6, "#e6b877");
      body.addColorStop(0.85, "#7c592f");
      body.addColorStop(1, "#241708");
      ctx.fillStyle = body;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      // rotating surface bands
      const rot = reduce ? 0 : t * 0.14;
      ctx.globalAlpha = 0.09;
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = i % 2 ? "#3a2913" : "#fbe6c2";
        ctx.lineWidth = R * 0.13;
        ctx.beginPath();
        ctx.ellipse(cx + Math.sin(rot + i) * R * 0.28, cy + (i - 1.5) * R * 0.42, R * 1.1, R * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // night side
      const term = ctx.createRadialGradient(lx, ly, R * 0.2, cx + R * 0.32, cy + R * 0.36, R * 1.5);
      term.addColorStop(0, "transparent");
      term.addColorStop(0.68, "rgba(6,5,3,0.16)");
      term.addColorStop(1, "rgba(3,2,1,0.72)");
      ctx.fillStyle = term;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      // specular
      const sp = ctx.createRadialGradient(lx, ly, 0, lx, ly, R * 0.55);
      sp.addColorStop(0, "rgba(255,251,240,0.5)");
      sp.addColorStop(1, "transparent");
      ctx.fillStyle = sp;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.restore();
      // lit rim
      ctx.strokeStyle = "rgba(255,236,200,0.45)";
      ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(cx, cy, R - 0.7, Math.PI * 0.92, Math.PI * 1.72); ctx.stroke();
    };

    const drawPath = (p: number, t: number) => {
      if (spine.length < 2) return;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(230,184,119,0.55)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(230,184,119,0.5)";
      ctx.shadowBlur = 8;
      // spine grows with progress
      const seg = spine.length - 1;
      const prog = p * seg;
      ctx.beginPath();
      ctx.moveTo(spine[0].x, spine[0].y);
      for (let i = 1; i < spine.length; i++) {
        if (prog >= i) { ctx.lineTo(spine[i].x, spine[i].y); }
        else { const f = prog - (i - 1); if (f > 0) ctx.lineTo(spine[i - 1].x + (spine[i].x - spine[i - 1].x) * f, spine[i - 1].y + (spine[i].y - spine[i - 1].y) * f); break; }
      }
      ctx.stroke();
      // ribs sprout after the spine reaches them
      for (const r of ribs) {
        const rp = clamp((p - r.t) / 0.18, 0, 1);
        if (rp <= 0) continue;
        ctx.beginPath();
        ctx.moveTo(r.bx, r.by);
        ctx.lineTo(r.bx + (r.nx - r.bx) * rp, r.by + (r.ny - r.by) * rp);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      // nodes light up as reached
      const nodes: { x: number; y: number; t: number; big: boolean }[] = [];
      for (let i = 1; i < spine.length; i++) nodes.push({ x: spine[i].x, y: spine[i].y, t: spine[i].f, big: true });
      for (const r of ribs) nodes.push({ x: r.nx, y: r.ny, t: r.t + 0.18, big: false });
      for (const n of nodes) {
        const appear = clamp((p - n.t) / 0.1, 0, 1);
        if (appear <= 0) continue;
        const pulse = reduce ? 1 : 0.85 + 0.15 * Math.sin(t * 2 + n.x * 0.05);
        const rad = (n.big ? 4.4 : 2.9) * appear * pulse;
        ctx.fillStyle = "rgba(230,184,119,0.22)";
        ctx.beginPath(); ctx.arc(n.x, n.y, rad * 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = n.big ? "#f6e2bd" : "#e6b877";
        ctx.beginPath(); ctx.arc(n.x, n.y, rad, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fffaf0";
        ctx.beginPath(); ctx.arc(n.x, n.y, rad * 0.42, 0, Math.PI * 2); ctx.fill();
      }
    };

    const frame = (now: number) => {
      if (w === 0 || h === 0) { layout(); }
      const t = (now - t0) / 1000;
      const p = reduce ? 1 : easeOut(clamp((now - t0) / 2200, 0, 1));
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = reduce ? 0.5 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.4 + s.ph));
        ctx.globalAlpha = tw * 0.7;
        ctx.fillStyle = "#cbd2df";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      drawPlanet(t);
      drawPath(p, t);
      if (!reduce) raf = requestAnimationFrame(frame);
    };

    layout();
    if (reduce) frame(performance.now());
    else raf = requestAnimationFrame(frame);

    const onResize = () => { layout(); if (reduce) frame(performance.now()); };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
