"use client";

import * as React from "react";

// A small planet flying a smooth elliptical orbit, drawn on a canvas so its trail
// is a real fading comet tail (each frame gently erases the last, so past
// positions melt away) rather than a string of discrete dots. Gold, fading out to
// transparent. Sits behind the core, so the orbit reads as passing behind it.
export function CometCanvas({ size, className }: { size: number; className?: string }) {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const rx = size * 0.33;
    const ry = size * 0.22; // rounder than a hard-tilted ellipse, smoother turns
    const period = 9000; // ms per orbit
    let theta = 0; // start at the right side, in the clear
    let last = 0;
    let raf = 0;

    const head = () => {
      const x = cx + rx * Math.cos(theta);
      const y = cy + ry * Math.sin(theta);
      const depth = (Math.sin(theta) + 1) / 2; // 0 = top/far, 1 = bottom/near
      const r = 3.6 + depth * 3.4; // a touch larger as it swings toward you

      // soft halo
      const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 2.8);
      halo.addColorStop(0, "rgba(230,184,119,0.45)");
      halo.addColorStop(1, "rgba(230,184,119,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, r * 2.8, 0, Math.PI * 2);
      ctx.fill();

      // the planet itself — a round gold bead
      const body = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      body.addColorStop(0, "#fff6e6");
      body.addColorStop(0.55, "#e6b877");
      body.addColorStop(1, "#a9803f");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const frame = (t: number) => {
      const dt = last ? Math.min(t - last, 50) : 16;
      last = t;
      theta += ((Math.PI * 2) / period) * dt;
      // erase a sliver each frame → the trail melts away behind the head
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, size, size);
      ctx.globalCompositeOperation = "source-over";
      head();
      raf = requestAnimationFrame(frame);
    };

    head(); // paint one frame immediately
    if (!reduce) raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return <canvas ref={ref} style={{ width: size, height: size }} className={className} aria-hidden />;
}
