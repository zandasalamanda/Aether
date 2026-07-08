import { generateJson, isObj, isClient, viaRoute } from "./provider";
import { clarifiersFor } from "./clarifiers";
import type { Clarifier } from "./types";

// A tiny questions-only AI call: given a goal, return 3 sharp, tailored questions
// a coach would ask — asked BEFORE the plan is generated. The first is ALWAYS a
// deadline question, personalized to the goal, with a "No deadline" option.

const SYSTEM = `You are Solaspace, an execution coach. Given a user's goal, return EXACTLY 3 short questions to make a plan concrete and personal.
Return JSON: {"clarifiers":[{"question":string,"options":string[]}]}.
- Question 1 MUST be about the goal's TIMEFRAME/DEADLINE, personalized to THIS goal — name the real target if one exists (a race day, launch, exam, season, trip). Its options are a few sensible horizons and MUST end with "No deadline".
- Questions 2-3 ask the specifics that materially change the steps or the numbers (current level, budget, frequency, target). Use ranges where a number is needed.
Question ≤6 words. Each option ≤5 words. 2-4 options for Q2-3; up to 6 for Q1.`;

const DEADLINE_RE = /deadline|time ?frame|by when|due|timeline|how long|target date|finish by|\bwhen\b/i;
const NO_DL_RE = /no deadline|no date|no rush|none|whenever|flexible|open-ended|someday/i;
const DEADLINE_FALLBACK: Clarifier = { question: "Target date?", options: ["1 month", "3 months", "6 months", "1 year", "2+ years", "No deadline"] };

function withNoDeadline(c: Clarifier): Clarifier {
  return c.options.some((o) => NO_DL_RE.test(o)) ? c : { ...c, options: [...c.options, "No deadline"].slice(0, 6) };
}

function clean(cs: unknown): Clarifier[] {
  if (!Array.isArray(cs)) return [];
  return cs
    .filter(isObj)
    .map((c) => ({
      question: String(c.question ?? "").trim().slice(0, 50),
      options: Array.isArray(c.options) ? c.options.map((o) => String(o).trim().slice(0, 24)).filter(Boolean).slice(0, 6) : [],
    }))
    .filter((c) => c.question && c.options.length >= 2);
}

/** A personalized deadline question (always first, always with "No deadline") + up to two more. */
export async function clarifyGoal(prompt: string): Promise<Clarifier[]> {
  const build = (ai: Clarifier[]): Clarifier[] => {
    if (!ai.length) return clarifiersFor(prompt);
    const i = ai.findIndex((c) => DEADLINE_RE.test(c.question));
    const deadline = i >= 0 ? withNoDeadline(ai[i]) : DEADLINE_FALLBACK;
    const rest = ai.filter((_, idx) => idx !== i);
    return [deadline, ...rest].slice(0, 3);
  };
  if (isClient()) {
    const j = await viaRoute<{ clarifiers: Clarifier[] }>("/api/ai/clarify", { prompt });
    return build(j ? clean(j.clarifiers) : []);
  }
  const r = await generateJson<{ clarifiers: Clarifier[] }>(SYSTEM, `Goal: ${prompt}`);
  return build(r ? clean(r.clarifiers) : []);
}
