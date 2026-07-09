import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { LIMITS, type Plan } from "./guard";

const DAY = 86_400_000;
const MONTH = 2_592_000_000;

export interface AiUsage {
  plan: Plan;
  dayUsed: number;
  dayLimit: number;
  monthUsed: number;
  monthLimit: number;
  proDay: number;
  proMonth: number;
}

/** The signed-in user's current AI credit usage vs. their plan's limits. */
export async function getAiUsage(clerkUserId: string, plan: Plan): Promise<AiUsage> {
  const L = LIMITS[plan];
  const usage: AiUsage = {
    plan,
    dayUsed: 0,
    dayLimit: L.day,
    monthUsed: 0,
    monthLimit: L.month,
    proDay: LIMITS.pro.day,
    proMonth: LIMITS.pro.month,
  };
  const admin = getSupabaseAdmin();
  if (!admin || !clerkUserId) return usage;
  const { data } = await admin
    .from("rate_limits")
    .select("key, count, window_start")
    .in("key", [`ai:cd:${clerkUserId}`, `ai:cmo:${clerkUserId}`]);
  const now = Date.now();
  for (const r of (data ?? []) as { key: string; count: number; window_start: string }[]) {
    const fresh = now - new Date(r.window_start).getTime();
    if (r.key.startsWith("ai:cd:")) usage.dayUsed = fresh < DAY ? r.count : 0;
    else if (r.key.startsWith("ai:cmo:")) usage.monthUsed = fresh < MONTH ? r.count : 0;
  }
  return usage;
}
