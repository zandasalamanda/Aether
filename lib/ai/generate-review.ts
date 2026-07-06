import { mockReview } from "./mock";
import type { ReviewInput, ReviewResult } from "./types";

/**
 * The review is computed from goal state (what's done / moving / slipping) —
 * deterministic, so we build it locally instead of calling the AI.
 */
export async function generateReview(input: ReviewInput): Promise<ReviewResult> {
  return mockReview(input);
}
