import { mockDailyPlan } from "./mock";
import type { DailyPlanInput, DailyPlanResult } from "./types";

/**
 * Building today's plan is scheduling, not language understanding — a greedy
 * fit of the user's live nodes into their time + energy budget. We do it
 * locally: instant, free, and deterministic. (Only goal-map generation, which
 * turns arbitrary prose into a real plan, still calls the AI.)
 */
export async function buildDailyPlan(input: DailyPlanInput): Promise<DailyPlanResult> {
  return mockDailyPlan(input);
}
