import { buildSeed } from "@/lib/mock/seed";
import type {
  GoalWithNodes,
  InboxItem,
  UserProfile,
  DailyPlanWithBlocks,
} from "@/types";

// Data-access seam. In demo mode (no Supabase configured) these serve seeded
// data. When Supabase is wired, each function queries the signed-in user's
// rows with RLS instead — the call sites (server components) don't change.

export async function getProfile(): Promise<UserProfile> {
  return buildSeed().profile;
}

export async function getGoals(): Promise<GoalWithNodes[]> {
  return buildSeed().goals;
}

export async function getGoal(id: string): Promise<GoalWithNodes | null> {
  return buildSeed().goals.find((g) => g.id === id) ?? null;
}

export async function getPrimaryGoal(): Promise<GoalWithNodes | null> {
  return buildSeed().goals[0] ?? null;
}

export async function getInbox(): Promise<InboxItem[]> {
  return buildSeed().inbox;
}

export async function getTodayPlan(): Promise<DailyPlanWithBlocks | null> {
  return buildSeed().todayPlan;
}
