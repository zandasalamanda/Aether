"use client";

import * as React from "react";
import { goalIcon } from "@/lib/kairo/goal-icon";

function hashN(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** A faint, seeded surface — a tilted band + soft spots — so each planet looks distinct. */
export function PlanetSurface({ hex, seed }: { hex: string; seed: string }) {
  const h = hashN(seed);
  const bandRot = h % 360;
  const bandTop = 22 + (h % 46);
  const sX = 12 + ((h >> 4) % 60);
  const sY = 44 + ((h >> 7) % 40);
  const s2X = 10 + ((h >> 9) % 55);
  const s2Y = 10 + ((h >> 11) % 38);
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full" aria-hidden>
      <span className="absolute -left-1/4 -right-1/4 h-[24%]" style={{ top: `${bandTop}%`, transform: `rotate(${bandRot}deg)`, background: `linear-gradient(90deg, transparent, ${hex}38, transparent)` }} />
      <span className="absolute rounded-full blur-md" style={{ width: "52%", height: "52%", left: `${sX}%`, top: `${sY}%`, background: `radial-gradient(circle, ${hex}45, transparent 70%)` }} />
      <span className="absolute rounded-full blur-[5px]" style={{ width: "22%", height: "22%", left: `${s2X}%`, top: `${s2Y}%`, background: "radial-gradient(circle, rgba(255,255,255,0.20), transparent 70%)" }} />
    </span>
  );
}

/**
 * A glossy goal-planet with an embossed icon — pixel-identical to the real map's
 * core (radial highlight, inset shine, outer glow, seeded surface, embossed lucide
 * icon). Shared by the map and the landing so they read the same.
 */
export function PlanetOrb({ hex, size, icon, seed }: { hex: string; size: number; icon?: string | null; seed: string }) {
  return (
    <span
      className="relative grid place-items-center overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 34% 26%, #fdf3e0 0%, ${hex} 46%, #1a130a 100%)`,
        boxShadow: `inset 0 -8px 22px rgba(0,0,0,0.5), inset 0 3px 9px rgba(255,255,255,0.35), 0 0 ${Math.round(size * 0.5)}px ${hex}44`,
      }}
    >
      <PlanetSurface hex={hex} seed={seed} />
      {icon &&
        React.createElement(goalIcon(icon), {
          size: Math.round(size * 0.46),
          strokeWidth: 1.5,
          className: "relative",
          style: { color: "#ffffff", opacity: 0.72, filter: "drop-shadow(0 1px 2px rgba(50,34,8,0.4))" },
        })}
    </span>
  );
}
