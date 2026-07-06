import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The floating 3D goal core — a luminous orb. Kairo's signature focal object.
 * Used on the landing hero, onboarding, and at the center of the living map.
 */
export function GoalCore({
  size = 120,
  hex = "#2dd6e8",
  pulse = true,
  orbit = true,
  className,
  children,
}: {
  size: number;
  hex?: string;
  pulse?: boolean;
  orbit?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const sphere = Math.round(size * 0.6);
  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }} aria-hidden>
      {/* ambient glow */}
      <div
        className={cn("absolute rounded-full blur-2xl", pulse && "animate-pulse-glow")}
        style={{ width: size, height: size, background: `radial-gradient(circle, ${hex}66, transparent 62%)` }}
      />
      {/* orbit rings */}
      {orbit && (
        <>
          <div className="absolute animate-float-slow rounded-full border" style={{ width: size * 0.94, height: size * 0.94, borderColor: `${hex}33` }} />
          <div className="absolute rounded-full border" style={{ width: size * 1.14, height: size * 1.14, borderColor: "rgba(255,255,255,0.06)" }} />
        </>
      )}
      {/* sphere */}
      <div
        className="relative grid place-items-center rounded-full"
        style={{
          width: sphere,
          height: sphere,
          background: `radial-gradient(circle at 34% 26%, #ffffff 0%, ${hex} 44%, #0a1220 100%)`,
          boxShadow: `inset 0 -10px 26px rgba(0,0,0,0.55), inset 0 4px 10px rgba(255,255,255,0.35), 0 0 46px ${hex}55`,
        }}
      >
        {/* specular highlight */}
        <span
          className="absolute rounded-full bg-white/70 blur-[3px]"
          style={{ width: sphere * 0.18, height: sphere * 0.14, top: sphere * 0.16, left: sphere * 0.24 }}
        />
        {children != null && <div className="relative z-10 text-[#04121c]">{children}</div>}
      </div>
    </div>
  );
}
