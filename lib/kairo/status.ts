import type {
  NodeStatus,
  BlockStatus,
  InboxCategory,
  EnergyLevel,
  Difficulty,
  GoalStatus,
} from "@/types";

export interface StatusMeta {
  label: string;
  /** raw accent for SVG strokes, glows, halos */
  hex: string;
  /** tailwind bg class for a solid status dot */
  dot: string;
  /** tailwind text color class */
  text: string;
  /** tailwind tint + text + border for a chip/pill */
  chip: string;
}

// NOTE: class strings are written as literals (not built from template
// strings) so Tailwind's scanner generates each utility.

export const nodeStatusMeta: Record<NodeStatus, StatusMeta> = {
  not_started: { label: "Not Started", hex: "#5a6885", dot: "bg-faint", text: "text-faint", chip: "bg-white/5 text-muted border border-line" },
  in_motion: { label: "In Motion", hex: "#35d6a4", dot: "bg-green", text: "text-green", chip: "bg-green/10 text-green border border-green/25" },
  blocked: { label: "Blocked", hex: "#fb6b7c", dot: "bg-rose", text: "text-rose", chip: "bg-rose/10 text-rose border border-rose/25" },
  at_risk: { label: "At Risk", hex: "#f2b44a", dot: "bg-amber", text: "text-amber", chip: "bg-amber/10 text-amber border border-amber/25" },
  done: { label: "Done", hex: "#4c8dff", dot: "bg-blue", text: "text-blue", chip: "bg-blue/10 text-blue border border-blue/25" },
};

export const blockStatusMeta: Record<BlockStatus, StatusMeta> = {
  planned: { label: "Planned", hex: "#5a6885", dot: "bg-faint", text: "text-muted", chip: "bg-white/5 text-muted border border-line" },
  in_progress: { label: "In Progress", hex: "#2dd6e8", dot: "bg-cyan", text: "text-cyan", chip: "bg-cyan/10 text-cyan border border-cyan/25" },
  completed: { label: "Completed", hex: "#35d6a4", dot: "bg-green", text: "text-green", chip: "bg-green/10 text-green border border-green/25" },
  pushed: { label: "Pushed", hex: "#f2b44a", dot: "bg-amber", text: "text-amber", chip: "bg-amber/10 text-amber border border-amber/25" },
  skipped: { label: "Skipped", hex: "#5a6885", dot: "bg-faint", text: "text-faint", chip: "bg-white/5 text-faint border border-line" },
};

export const inboxCategoryMeta: Record<InboxCategory, StatusMeta> = {
  unsorted: { label: "Unsorted", hex: "#5a6885", dot: "bg-faint", text: "text-muted", chip: "bg-white/5 text-muted border border-line" },
  must_do: { label: "Must Do", hex: "#fb6b7c", dot: "bg-rose", text: "text-rose", chip: "bg-rose/10 text-rose border border-rose/25" },
  high_impact: { label: "High Impact", hex: "#9a7cff", dot: "bg-violet", text: "text-violet", chip: "bg-violet/10 text-violet border border-violet/25" },
  quick_win: { label: "Quick Win", hex: "#2dd6e8", dot: "bg-cyan", text: "text-cyan", chip: "bg-cyan/10 text-cyan border border-cyan/25" },
  can_wait: { label: "Can Wait", hex: "#4c8dff", dot: "bg-blue", text: "text-blue", chip: "bg-blue/10 text-blue border border-blue/25" },
  not_worth_doing: { label: "Not Worth Doing", hex: "#5a6885", dot: "bg-faint", text: "text-faint", chip: "bg-white/5 text-faint border border-line" },
};

export const inboxCategoryOrder: InboxCategory[] = [
  "must_do",
  "high_impact",
  "quick_win",
  "can_wait",
  "not_worth_doing",
];

export const energyMeta: Record<EnergyLevel, StatusMeta> = {
  low: { label: "Low", hex: "#f2b44a", dot: "bg-amber", text: "text-amber", chip: "bg-amber/10 text-amber border border-amber/25" },
  normal: { label: "Normal", hex: "#2dd6e8", dot: "bg-cyan", text: "text-cyan", chip: "bg-cyan/10 text-cyan border border-cyan/25" },
  high: { label: "High", hex: "#35d6a4", dot: "bg-green", text: "text-green", chip: "bg-green/10 text-green border border-green/25" },
};

export const difficultyMeta: Record<Difficulty, StatusMeta> = {
  light: { label: "Light", hex: "#35d6a4", dot: "bg-green", text: "text-green", chip: "bg-green/10 text-green border border-green/25" },
  moderate: { label: "Moderate", hex: "#2dd6e8", dot: "bg-cyan", text: "text-cyan", chip: "bg-cyan/10 text-cyan border border-cyan/25" },
  deep: { label: "Deep", hex: "#9a7cff", dot: "bg-violet", text: "text-violet", chip: "bg-violet/10 text-violet border border-violet/25" },
};

export const goalStatusMeta: Record<GoalStatus, StatusMeta> = {
  active: { label: "In motion", hex: "#2dd6e8", dot: "bg-cyan", text: "text-cyan", chip: "bg-cyan/10 text-cyan border border-cyan/25" },
  paused: { label: "Paused", hex: "#f2b44a", dot: "bg-amber", text: "text-amber", chip: "bg-amber/10 text-amber border border-amber/25" },
  done: { label: "Done", hex: "#4c8dff", dot: "bg-blue", text: "text-blue", chip: "bg-blue/10 text-blue border border-blue/25" },
  archived: { label: "Archived", hex: "#5a6885", dot: "bg-faint", text: "text-faint", chip: "bg-white/5 text-faint border border-line" },
};
