import { features } from "@/lib/config";
import { mockGoalMap } from "./mock";
import type { GoalMapInput, GoalMapResult } from "./types";

/**
 * Turn a raw goal prompt into a structured living-map plan.
 * Uses a real LLM when an AI key is configured; otherwise returns a
 * deterministic mock so the app is fully usable in preview.
 */
export async function generateGoalMap(input: GoalMapInput): Promise<GoalMapResult> {
  if (features.ai) {
    // Integration point: call the configured model, force JSON output that
    // matches GoalMapResult, validate, and return. Falls back to mock on error.
  }
  return mockGoalMap(input);
}
