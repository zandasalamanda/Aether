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
  // so the colour cannot be transitioned on one element; instead each slot
  // holds a whole core and only opacity animates. Slot 0 shows the even steps
  // and slot 1 the odd ones, which means a slot's contents only ever change
  // while it is invisible, and the swap is never seen.
  const slots = [0, 1].map((slot) => {
    const step = i % 2 === slot ? i : i - 1;
    const stop = STOPS[((step % STOPS.length) + STOPS.length) % STOPS.length];
    return { stop, front: i % 2 === slot };
  });

  const iconSize = Math.round(size * 0.24);

  return (
    <div className={className} style={{ width: size, height: size, position: "relative" }} aria-hidden>
      {slots.map(({ stop, front }, slot) => {
        const Icon = goalIcon(stop.icon);
        return (
          <div
            key={slot}
            className="absolute inset-0"
            style={{
              opacity: reduce ? (slot === 0 ? 1 : 0) : front ? 1 : 0,
              transition: reduce ? undefined : `opacity ${FADE}ms ease-in-out`,
            }}
          >
            <GoalCore size={size} hex={stop.hex} pulse={!reduce}>
              <Icon size={iconSize} strokeWidth={1.7} />
            </GoalCore>
          </div>
        );
      })}
    </div>
  );
}
