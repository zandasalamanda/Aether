"use client";

import * as React from "react";

// The comet's tail, stroked ON the actual orbit ellipse so it follows the curve
// exactly (a stroke is one continuous line — never separate orbs). Many finely
// graded stroked copies share a leading edge with different dash lengths, so the
// width and opacity taper smoothly from a fat bright head to a thin faint tail,
// with no visible banding. The path is CLOSED and each dash tiles the loop
// exactly (dash L + gap P-L = P), so it slides around seamlessly with no flash or
// gap when it comes back around.

export const ELLIPSE_D = "M 174 108 A 66 40 0 1 1 42 108 A 66 40 0 1 1 174 108 Z";
const PERIOD = 11000;
const N = 20;
const LAYERS = Array.from({ length: N }, (_, i) => {
  const f = i / (N - 1); // 0 at the head, 1 at the tail tip
  return {
    L: 11 + f * 86, // dash length reaches further back
    w: 9.5 - f * 8.3, // fat at the head, thin at the tail
    o: 0.4 * Math.pow(1 - f, 1.5) + 0.015, // opacity fades out
  };
});

export function OrbitComet() {
  const refs = React.useRef<(SVGPathElement | null)[]>([]);

  React.useEffect(() => {
    const first = refs.current[0];
    if (!first) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const P = first.getTotalLength();
    const anims: Animation[] = [];
    LAYERS.forEach((ly, i) => {
      const el = refs.current[i];
      if (!el) return;
      // dash L, gap P-L → the pattern tiles the closed loop exactly once, so the
      // comet slides around with no seam.
      el.setAttribute("stroke-dasharray", `${ly.L} ${P - ly.L}`);
      if (reduce) {
        el.style.strokeDashoffset = String(ly.L - 0.08 * P);
        return;
      }
      // dashoffset L -> L-P slides the dash once forward per loop; its leading
      // edge always sits at the head's path position.
      anims.push(
        el.animate([{ strokeDashoffset: ly.L }, { strokeDashoffset: ly.L - P }], {
          duration: PERIOD,
          iterations: Infinity,
          easing: "linear",
        })
      );
    });
    return () => anims.forEach((a) => a.cancel());
  }, []);

  return (
    <svg viewBox="0 0 216 216" className="absolute inset-0 h-full w-full" style={{ overflow: "visible" }} aria-hidden>
      {LAYERS.map((ly, i) => (
        <path
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          d={ELLIPSE_D}
          fill="none"
          stroke="#ecc084"
          strokeWidth={ly.w}
          strokeLinecap="round"
          opacity={ly.o}
        />
      ))}
    </svg>
  );
}
