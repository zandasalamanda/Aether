// The fixed vocabulary of goal icons the AI may choose from. Kept lucide-free so
// the server AI code can validate against it without pulling in the icon set.
// The client maps these keys to components in lib/kairo/goal-icon.ts.
export const GOAL_ICON_KEYS = [
  "rocket", "code", "design", "music", "fitness", "trophy", "study", "school",
  "writing", "career", "money", "growth", "health", "habit", "cooking", "travel",
  "home", "photo", "speaking", "language", "community", "target",
] as const;

export type GoalIconKey = (typeof GOAL_ICON_KEYS)[number];
