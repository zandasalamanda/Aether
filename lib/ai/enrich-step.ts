import { generateJson, isObj, isClient, viaRouteResult, raiseIfBlocked } from "./provider";
import { mockEnrichStep } from "./mock";
import type { EnrichStepInput, StepBriefing, StepMistake } from "./types";

// The briefing: open a step, get a plan FOR that step. One AI call per node,
// cached forever on the row (goal_nodes.briefing), so a step is expensive once
// and instant every time after.

export const SYSTEM = `You are Sola, an execution coach writing a briefing for ONE step of the user's goal. They are about to do this step and want zero guesswork. Write for a smart, busy adult, not an expert.

Return JSON: {"firstAction":string,"successCriterion":string,"whenWhereCue":string|null,"commonMistakes":[{"mistake":string,"fix":string}],"ifStuck":string,"whatYoullNeed":string[],"personalNote":string|null}

- "firstAction": the exact physical opening move, startable in under a minute, done in 5-10 minutes. Verb-first. Name the real tool, app, or place.
- "successCriterion": the observable test that this step is done. Binary or a number, never a feeling.
- "whenWhereCue": one suggested trigger tied to an existing routine ("after dinner, at the kitchen table"). Prefer event cues over clock times. Use the user's stated free hours when given; otherwise null. Never invent their schedule.
- "commonMistakes": 1-3 real failure modes for THIS step, each with the concrete fix. Like "Most people pick a gym 20 minutes away and quit; pick one under 10 minutes from home."
- "ifStuck": a 5-minute fallback version of this step for a low-energy day.
- "whatYoullNeed": 0-4 real prerequisites ("a library card", "about $30"). Empty array when none.
- "personalNote": one short sentence naming which of the user's own stated facts shaped this briefing, or null if none did. Never invent facts about the user.
Ground everything in named tools, places, numbers, and techniques specific to this goal. No motivation-speak, no filler.`;

const clamp = (v: unknown, n: number): string => String(v ?? "").trim().slice(0, n);

/**
 * Defensive pass over raw model output. `providedFacts` are the fact VALUES the
 * user actually gave (intake answers, context fields); personalNote is nulled
 * unless it quotes at least one of them, so the note can never cite a fact that
 * was not given. Sources are forced empty below the "researched" level: only a
 * real research merge may attach citations.
 */
export function sanitizeBriefing(raw: unknown, providedFacts: string[] = []): StepBriefing | null {
  if (!isObj(raw)) return null;
  const firstAction = clamp(raw.firstAction, 160);
  const successCriterion = clamp(raw.successCriterion, 120);
  if (!firstAction || !successCriterion) return null;

  const mistakes: StepMistake[] = (Array.isArray(raw.commonMistakes) ? raw.commonMistakes : [])
    .filter(isObj)
    .map((m) => ({ mistake: clamp(m.mistake, 120), fix: clamp(m.fix, 120) }))
    .filter((m) => m.mistake && m.fix)
    .slice(0, 3);

  const need = (Array.isArray(raw.whatYoullNeed) ? raw.whatYoullNeed : [])
    .map((x) => clamp(x, 60))
    .filter(Boolean)
    .slice(0, 4);

  let personalNote: string | null = clamp(raw.personalNote, 140) || null;
  if (personalNote) {
    const note = personalNote.toLowerCase();
    const cited = providedFacts.some((f) => f.trim().length > 2 && note.includes(f.trim().toLowerCase()));
    if (!cited) personalNote = null;
  }

  const level = raw.level === "researched" || raw.level === "mock" ? raw.level : "enriched";
  const sources =
    level === "researched" && Array.isArray(raw.sources)
      ? raw.sources
          .filter(isObj)
          .map((s) => ({ title: clamp(s.title, 120), url: clamp(s.url, 400) }))
          .filter((s) => s.title && s.url)
          .slice(0, 8)
      : [];

  return {
    firstAction,
    successCriterion,
    whenWhereCue: clamp(raw.whenWhereCue, 100) || null,
    commonMistakes: mistakes,
    ifStuck: clamp(raw.ifStuck, 160),
    whatYoullNeed: need,
    personalNote,
    sources,
    level,
    briefedAt: typeof raw.briefedAt === "string" ? raw.briefedAt : new Date().toISOString(),
  };
}

/**
 * Client entry. Remote accounts go through the route (which loads canonical
 * rows, spends one credit, and caches the result on the node); the keyless demo
 * returns the deterministic mock immediately, so the sheet always fills.
 */
export async function enrichStep(input: EnrichStepInput): Promise<StepBriefing> {
  if (isClient()) {
    const res = await viaRouteResult<StepBriefing>("/api/ai/enrich-step", input);
    if (res.data) {
      const cleaned = sanitizeBriefing(res.data);
      if (cleaned) return { ...cleaned, level: res.data.level ?? cleaned.level };
    }
    // Rate-limit / upgrade responses surface to the caller instead of silently
    // degrading to a mock that pretends the call worked.
    raiseIfBlocked(res);
  }
  return mockEnrichStep(input.nodeTitle ?? "", input.goalTitle ?? "");
}

/** Server-side generation against canonical text (used by the route). */
export async function generateBriefing(args: {
  goalTitle: string;
  nodeTitle: string;
  nodeDescription: string;
  intakeLines?: string;
  notes?: string;
}): Promise<StepBriefing | null> {
  const user = [
    `Goal: ${args.goalTitle}`,
    `Step: ${args.nodeTitle}`,
    args.nodeDescription ? `Step notes: ${args.nodeDescription}` : "",
    args.intakeLines ? `Goal answers: ${args.intakeLines}` : "",
    args.notes ? `Notebook: ${args.notes.slice(0, 600)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const raw = await generateJson<StepBriefing>(SYSTEM, user, { maxTokens: 1600 });
  return sanitizeBriefing(raw);
}
