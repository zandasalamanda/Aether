import { NextResponse } from "next/server";
import { clarifyGoal } from "@/lib/ai/clarify";
import { guardAi, clampText } from "@/lib/ai/guard";
import { buildContextBlock } from "@/lib/ai/context";
import { loadUserContext } from "@/lib/data/profile";

export async function POST(req: Request) {
  const denied = await guardAi();
  if (denied) return denied;
  const b = (await req.json().catch(() => ({}))) as { prompt?: unknown };
  // Server-built: known facts ride along so Sola never asks what it was told.
  const contextBlock = buildContextBlock(await loadUserContext(), null, "clarify");
  const clarifiers = await clarifyGoal(clampText(b.prompt), contextBlock);
  return NextResponse.json({ clarifiers });
}
