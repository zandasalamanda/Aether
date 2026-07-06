import { features } from "@/lib/config";
import { mockSortInbox } from "./mock";
import type { SortInboxInput, SortInboxResult } from "./types";

/**
 * Sort loose inbox items into must-do / high-impact / quick-win / can-wait /
 * not-worth-doing. Real LLM when configured; deterministic mock otherwise.
 */
export async function sortInbox(input: SortInboxInput): Promise<SortInboxResult> {
  if (features.ai) {
    // Integration point: classify each item with the model, require JSON
    // matching SortInboxResult, validate, return.
  }
  return mockSortInbox(input);
}
