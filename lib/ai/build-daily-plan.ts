import { features } from "@/lib/config";
import { mockDailyPlan } from "./mock";
import type { DailyPlanInput, DailyPlanResult } from "./types";

/**
 * Build the most efficient plan for today from available time, energy, and
 * current goal state. Real LLM when configured; deterministic mock otherwise.
 */
export async function buildDailyPlan(input: DailyPlanInput): Promise<DailyPlanResult> {
  if (features.ai) {
    // Integration point: prompt the model with goal/node context + budget,
    // require JSON matching DailyPlanResult, validate, return.
  }
  return mockDailyPlan(input);
}
