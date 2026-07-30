// One quiet, premium color per goal, shared across the map and every other
// tab so a goal (and its tasks) read the same everywhere. Desaturated tones so
// the app stays calm rather than rainbow.

export const GOAL_PALETTE = [
  { name: "Gold", hex: "#e6b877" },
  { name: "Sage", hex: "#8fae9f" },
  { name: "Coral", hex: "#d5896f" },
  { name: "Periwinkle", hex: "#9aa6d4" },
  { name: "Lilac", hex: "#c39bd0" },
  { name: "Teal", hex: "#7fb0ad" },
  { name: "Amber", hex: "#d9a86c" },
  { name: "Rose", hex: "#cf9ba6" },
] as const;

/**
 * localStorage key for per-goal color overrides.
 * A value is either a palette index (number) or, since the colour wheel, a
 * custom hex string like "#7fb0ad". Old stores hold only numbers, which is why
 * the union rather than a new key: existing choices keep working unmigrated.
 */
export const GOAL_COLORS_KEY = "kairo.colors.v1";
export type GoalColorOverride = number | string;

/** Stable default palette slot for a goal, from its id. */
export function goalColorIndex(goalId: string): number {
  let h = 0;
  for (let i = 0; i < goalId.length; i++) h = (h * 31 + goalId.charCodeAt(i)) >>> 0;
  return h % GOAL_PALETTE.length;
}

/** The hex for a goal: a custom hex, the chosen slot, or the stable default. */
export function goalColorHex(goalId: string, override?: GoalColorOverride): string {
  if (typeof override === "string") return override;
  const raw = override ?? goalColorIndex(goalId);
  const idx = ((raw % GOAL_PALETTE.length) + GOAL_PALETTE.length) % GOAL_PALETTE.length;
  return GOAL_PALETTE[idx].hex;
}
