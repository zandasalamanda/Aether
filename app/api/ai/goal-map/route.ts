import { NextResponse } from "next/server";
import { generateGoalMap } from "@/lib/ai/generate-goal-map";
import { guardAi, clampText } from "@/lib/ai/guard";
import { buildContextBlock } from "@/lib/ai/context";
import { loadUserContext } from "@/lib/data/profile";

export async function POST(req: Request) {
  const denied = await guardAi({ weight: 3 });
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as { prompt?: unknown; answers?: unknown; freeText?: unknown };
  // Answers arrive structured; clamp each pair defensively and cap the list so
  // a hostile client cannot stuff the prompt.
  const answers = (Array.isArray(body.answers) ? body.answers : [])
    .slice(0, 8)
    .map((a) => ({ question: clampText((a as Record<string, unknown>)?.question, 160), answer: clampText((a as Record<string, unknown>)?.answer, 160) }))
    .filter((a) => a.question && a.answer);
  // Server-built, never from the body: the client cannot forge or omit it.
  const contextBlock = buildContextBlock(await loadUserContext(), null, "goal-map");
  const result = await generateGoalMap({
    prompt: clampText(body.prompt),
    answers,
    freeText: clampText(body.freeText, 400) || undefined,
    contextBlock,
  });
  return NextResponse.json(result);
}
