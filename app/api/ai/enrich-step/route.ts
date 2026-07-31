import { NextResponse } from "next/server";
import { guardAi, clampText } from "@/lib/ai/guard";
import { generateBriefing } from "@/lib/ai/enrich-step";
import { getScopedClient } from "@/lib/supabase/scoped";
import { ensureProfile } from "@/lib/data/profile";
import type { StepBriefing } from "@/lib/ai/types";
import { buildContextBlock, providedFactValues } from "@/lib/ai/context";
import { loadUserContext } from "@/lib/data/profile";

// One briefing per step, cached on the row. The prompt is built from CANONICAL
// rows loaded with the scoped client (RLS proves ownership), never from the
// request body, so a client cannot brief a node it does not own or feed the
// model invented context. A second call for an already-briefed node returns
// the stored briefing without spending AI.

export async function POST(req: Request) {
  const denied = await guardAi();
  if (denied) return denied;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const nodeId = clampText(b.nodeId, 60);
  if (!nodeId) return NextResponse.json({ error: "Missing nodeId" }, { status: 400 });

  const scoped = await getScopedClient();
  const profile = await ensureProfile();
  if (!scoped || !profile) return NextResponse.json({ error: "No session" }, { status: 401 });

  const nodeRes = await scoped.supabase
    .from("goal_nodes")
    .select("id,goal_id,title,description,briefing")
    .eq("id", nodeId)
    .maybeSingle();
  const node = nodeRes.data as { id: string; goal_id: string; title: string; description: string; briefing: StepBriefing | null } | null;
  if (!node) return NextResponse.json({ error: "Step not found" }, { status: 404 });

  // Idempotent: the cache is the contract, so retries and double-opens are free.
  if (node.briefing) return NextResponse.json(node.briefing);

  const goalRes = await scoped.supabase
    .from("goals")
    .select("id,title,notes,intake")
    .eq("id", node.goal_id)
    .eq("user_id", profile.id)
    .maybeSingle();
  const goal = goalRes.data as { id: string; title: string; notes: string | null; intake: Record<string, string> | null } | null;
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  // The block carries the user's stored context AND this goal's intake: the
  // whole point of persisting both is that a briefing months later still
  // knows them. providedFacts gates personalNote to facts actually given.
  const ctx = await loadUserContext();
  const briefing = await generateBriefing({
    goalTitle: goal.title,
    nodeTitle: node.title,
    nodeDescription: node.description ?? "",
    contextBlock: buildContextBlock(ctx, goal.intake ?? null, "enrich"),
    providedFacts: providedFactValues(ctx, goal.intake ?? null),
    notes: goal.notes ?? "",
  });
  if (!briefing) return NextResponse.json({ error: "Sola couldn't brief this step. Try again." }, { status: 502 });

  // Cache server-side, and let the briefing refine the skeleton columns so the
  // map and Today read the sharper version everywhere.
  await scoped.supabase
    .from("goal_nodes")
    .update({
      briefing,
      first_action: briefing.firstAction,
      success_criterion: briefing.successCriterion,
      updated_at: new Date().toISOString(),
    })
    .eq("id", node.id);

  return NextResponse.json(briefing);
}
