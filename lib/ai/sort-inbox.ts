import { mockSortInbox } from "./mock";
import type { SortInboxInput, SortInboxResult } from "./types";

/**
 * Inbox triage is a keyword/impact heuristic — instant and good enough that an
 * API round-trip would only add latency. Kept local by design.
 */
export async function sortInbox(input: SortInboxInput): Promise<SortInboxResult> {
  return mockSortInbox(input);
}
