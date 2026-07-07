import { NextResponse } from "next/server";
import { clarifyGoal } from "@/lib/ai/clarify";
import { guardAi, clampText } from "@/lib/ai/guard";

export async function POST(req: Request) {
  const denied = await guardAi();
  if (denied) return denied;
  const b = (await req.json().catch(() => ({}))) as { prompt?: unknown };
  const clarifiers = await clarifyGoal(clampText(b.prompt));
  return NextResponse.json({ clarifiers });
}
