import type { GoalTemplate } from "./templates";
import type { ShowcaseMap } from "./showcase-maps";
import { GOAL_COLORS_KEY } from "./goal-color";

// Anonymous visitors build a real starter map at /build before creating an account.
// The chosen template (+ colour) waits here, in sessionStorage — never a URL — so it
// stays private and same-origin while they sign up, then gets persisted to their
// account. Only the template id crosses the boundary; the full map is rebuilt with
// `templateToMap` on the other side (no AI, deterministic).
export const PENDING_MAP_KEY = "solaspace:pending-map";

export interface PendingMap {
  templateId: string;
  colorIndex: number;
}

/** Render a starter template as a ShowcaseMap so ShowcaseTree can draw its preview. */
export function templateToShowcaseMap(t: GoalTemplate, colorHex: string): ShowcaseMap {
  return {
    id: t.id,
    title: t.title,
    short: t.category,
    icon: t.icon,
    color: colorHex,
    milestones: t.milestones.map((m) => ({
      title: m.title,
      subs: (m.subs ?? []).map((s) => s.title),
    })),
  };
}

/** Persist the guest's colour choice for the goal once it has a real (server) id. */
export function saveGoalColor(goalId: string, colorIndex: number): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(GOAL_COLORS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    map[goalId] = colorIndex;
    window.localStorage.setItem(GOAL_COLORS_KEY, JSON.stringify(map));
  } catch {
    /* private mode — ignore */
  }
}
