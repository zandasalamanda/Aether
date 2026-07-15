import type { EnergyLevel } from "@/types";

// The single source of truth for "how much time and energy do you have today?" —
// consumed by the Today planner. Realistic day-scale amounts, not focus-timer
// lengths: from a quick 30 minutes to a full 6-hour block. The day-plan engine
// (mockDailyPlan) slices whatever you pick into focus blocks with breaks.

export interface TimeOption {
  minutes: number;
  label: string;
}

export const TIME_OPTIONS: TimeOption[] = [
  { minutes: 30, label: "30m" },
  { minutes: 60, label: "1h" },
  { minutes: 120, label: "2h" },
  { minutes: 180, label: "3h" },
  { minutes: 240, label: "4h" },
  { minutes: 360, label: "6h+" },
];

export const DEFAULT_BUDGET_MINUTES = 120;
export const DEFAULT_ENERGY: EnergyLevel = "normal";

export interface EnergyOption {
  value: EnergyLevel;
  label: string;
  hint: string;
}

export const ENERGY_OPTIONS: EnergyOption[] = [
  { value: "low", label: "Low", hint: "Short, gentle blocks" },
  { value: "normal", label: "Normal", hint: "A balanced day" },
  { value: "high", label: "High", hint: "Deep work first" },
];

/** A human label for any minute amount (falls back cleanly off the preset list). */
export function budgetLabel(minutes: number): string {
  const preset = TIME_OPTIONS.find((t) => t.minutes === minutes);
  if (preset) return preset.label;
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  if (minutes > 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes}m`;
}
