import { NextResponse } from "next/server";
import { research } from "@/lib/ai/research";
import { guardAi, clampText } from "@/lib/ai/guard";
import { getScopedClient } from "@/lib/supabase/scoped";
import type { StepBriefing } from "@/lib/ai/types";

export async function POST(req: Request) {
  // Grounded search is the priciest call: Pro-only, higher weight.
  const denied = await guardAi({ weight: 4, feature: "research", featureFreeDaily: 1, featureLabel: "deep research" });
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as { goalTitle?: unknown; nodeTitle?: unknown; context?: unknown; question?: unknown; nodeId?: unknown };
  const result = await research({
    goalTitle: clampText(body.goalTitle, 200),
    nodeTitle: clampText(body.nodeTitle, 200),
    context: body.context ? clampText(body.context, 2000) : undefined,
    question: body.question ? clampText(body.question, 500) : undefined,
  });

  // Research used to die when the sheet closed. With a nodeId it persists on
  // the row: the scoped client's RLS proves ownership (an unowned id updates
  // zero rows), and the stored briefing gains the citations at the
  // "researched" level, the only level allowed to carry sources.
  const nodeId = clampText(body.nodeId, 60);
  if (nodeId && result.sources.length > 0) {
    const scoped = await getScopedClient();
    if (scoped) {
      const cur = await scoped.supabase.from("goal_nodes").select("briefing").eq("id", nodeId).maybeSingle();
      const briefing = (cur.data?.briefing ?? null) as StepBriefing | null;
      await scoped.supabase
        .from("goal_nodes")
        .update({
          research: { answer: result.answer, sources: result.sources, fetchedAt: new Date().toISOString() },
          ...(briefing ? { briefing: { ...briefing, sources: result.sources.slice(0, 8), level: "researched" as const } } : {}),
        })
        .eq("id", nodeId);
    }
  }

  return NextResponse.json(result);
}
