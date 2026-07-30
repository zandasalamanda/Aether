"use client";

import * as React from "react";
import { GoalCore } from "./GoalCore";
import { goalIcon } from "@/lib/kairo/goal-icon";
import { GOAL_PALETTE } from "@/lib/kairo/goal-color";

// The orb on "What are we making happen?".
//
// It used to be a single blank gold core, which quietly answered the question
// with "nothing". This one drifts through the kinds of goal you could map, in
// the app's own colours: every hex below is a real slot from GOAL_PALETTE, the
// same one a goal is actually assigned on the map, so the orb is a preview of
// the thing you are about to make rather than decoration.
//
// One pairing per colour, chosen so no two neighbours read alike.
const STOPS: { hex: string; icon: string }[] = [
  { hex: GOAL_PALETTE[0].hex, icon: "target" },   // Gold
  { hex: GOAL_PALETTE[1].hex, icon: "habit" },    // Sage
  { hex: GOAL_PALETTE[2].hex, icon: "fitness" },  // Coral
  { hex: GOAL_PALETTE[3].hex, icon: "language" }, // Periwinkle
  { hex: GOAL_PALETTE[4].hex, icon: "music" },    // Lilac
  { hex: GOAL_PALETTE[5].hex, icon: "travel" },   // Teal
  { hex: GOAL_PALETTE[6].hex, icon: "money" },    // Amber
  { hex: GOAL_PALETTE[7].hex, icon: "writing" },  // Rose
];

const HOLD = 2600; // ms on each goal
const FADE = 900; // ms of overlap between them

export function GoalCoreCycle({ size = 140, className }: { size?: number; className?: string }) {
  const [reduce, setReduce] = React.useState(false);
  const [i, setI] = React.useState(0);

  React.useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduce(m.matches);
    read();
    m.addEventListener("change", read);
    return () => m.removeEventListener("change", read);
  }, []);

  React.useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setI((n) => n + 1), HOLD);
    return () => window.clearInterval(id);
  }, [reduce]);

  // Two fixed slots that ping-pong. A radial-gradient cannot be interpolated,
  // so the colour cannot be transitioned on one element; each layer holds a
  // whole core instead.
  //
  // Crucially the two layers do NOT cross-fade. Fading one out while the other
  // fades in puts both near 50% mid-transition, which lets the page show
  // through the orb and ghosts two icons over each other. Instead the outgoing
  // stop sits underneath at full opacity and the incoming one fades in ON TOP
  // of it, so total coverage is constant and only one icon is ever legible.
  const at = (n: number) => STOPS[((n % STOPS.length) + STOPS.length) % STOPS.length];
  const iconSize = Math.round(size * 0.24);

  const layer = (stop: { hex: string; icon: string }) => {
    const Icon = goalIcon(stop.icon);
    return (
      <GoalCore size={size} hex={stop.hex} pulse={!reduce}>
        {/* White, with a shadow rather than a darker ink: the sphere runs from a
            near-white highlight to a deep shade, so a flat white icon needs the
            shadow to stay legible across all eight hues. */}
        <Icon size={iconSize} strokeWidth={1.7} style={{ color: "#ffffff", filter: "drop-shadow(0 1px 3px rgba(40,26,6,0.7))" }} />
      </GoalCore>
    );
  };

  return (
    <div className={className} style={{ width: size, height: size, position: "relative" }} aria-hidden>
      {/* the stop being left, held at full opacity underneath */}
      <div className="absolute inset-0">{layer(at(reduce ? 0 : i - 1))}</div>
      {/* the stop being arrived at, keyed so it remounts and fades in each time */}
      {!reduce && (
        <div key={i} className="animate-fade-in absolute inset-0" style={{ animationDuration: `${FADE}ms` }}>
          {layer(at(i))}
        </div>
      )}
    </div>
  );
}
