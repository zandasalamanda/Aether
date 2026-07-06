import { features } from "@/lib/config";
import { mockReview } from "./mock";
import type { ReviewInput, ReviewResult } from "./types";

/**
 * Summarize what changed, what's at risk, whether the plan is recoverable, and
 * the single next best move. Real LLM when configured; deterministic mock otherwise.
 */
export async function generateReview(input: ReviewInput): Promise<ReviewResult> {
  if (features.ai) {
    // Integration point: summarize goal/plan deltas with the model, require
    // JSON matching ReviewResult, validate, return.
  }
  return mockReview(input);
}
