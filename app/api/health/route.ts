import { NextResponse } from "next/server";
import { features } from "@/lib/config";
import { getSupabaseServer } from "@/lib/supabase/server";

// Lightweight health probe for an uptime monitor (UptimeRobot, BetterStack…).
// Returns 200 when the app + database are reachable, 503 when the DB is down.
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = { app: "ok" };
  let healthy = true;

  if (features.supabase) {
    try {
      const sb = getSupabaseServer();
      // Anon HEAD count: RLS returns no rows (fine) but a real outage errors.
      const { error } = sb
        ? await sb.from("users_profile").select("id", { head: true, count: "exact" }).limit(1)
        : { error: { message: "no client" } };
      checks.db = error ? "error" : "ok";
      if (error) healthy = false;
    } catch (e) {
      checks.db = "error";
      healthy = false;
      console.error("[health] db check failed:", e instanceof Error ? e.message : e);
    }
  }

  return NextResponse.json({ status: healthy ? "ok" : "degraded", checks }, { status: healthy ? 200 : 503 });
}
