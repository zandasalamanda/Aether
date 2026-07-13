import { NextResponse } from "next/server";
import { draftForStep } from "@/lib/ai/draft";
import { guardAi, clampText } from "@/lib/ai/guard";

export async function POST(req: Request) {
  // Free users get 2 "Do it for me" drafts/day (matches the plan matrix, caps cost);
  // Pro is unlimited.
  const denied = await guardAi({ weight: 2, feature: "draft", featureFreeDaily: 2, featureLabel: '"Do it for me" drafts' });
  if (denied) return denied;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await draftForStep({
    goalTitle: clampText(b.goalTitle, 300),
    nodeTitle: clampText(b.nodeTitle, 300),
    nodeDescription: clampText(b.nodeDescription, 600),
    context: clampText(b.context, 600),
    instruction: clampText(b.instruction, 300),
  });
  return NextResponse.json(result);
}
