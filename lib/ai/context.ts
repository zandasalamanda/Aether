import type { UserContext, AiFeature, AgeBand, ScheduleShape, StepGranularity, BudgetComfort } from "./types";

// The one place user facts become prompt text. Every AI feature sees only the
// fields its gate lists: region flows ONLY through enrich and research (where
// local options genuinely help) and never through map generation or drafts, so
// a leaked prompt from one feature can never carry more than that feature was
// allowed to know. Injection happens server-side in each /api/ai route; the
// client cannot omit or forge the block. Demo mode mirrors the context in
// localStorage and builds the same block in front of the mocks.

const FIELD_GATE: Record<AiFeature, (keyof UserContext)[]> = {
  "goal-map": ["ageBand", "scheduleShape", "granularity", "budgetComfort", "busyWith"],
  "clarify": ["ageBand", "scheduleShape", "granularity", "busyWith"],
  "enrich": ["ageBand", "scheduleShape", "granularity", "region", "budgetComfort", "busyWith"],
  "research": ["ageBand", "region", "budgetComfort"],
  "expand": ["scheduleShape", "granularity"],
  "replan": ["scheduleShape", "granularity"],
  "session": ["scheduleShape", "granularity"],
  "draft": ["busyWith"],
  "ask-node": ["scheduleShape", "budgetComfort", "busyWith"],
  "unblock": ["scheduleShape", "granularity", "busyWith"],
  "ask-sola": ["ageBand", "scheduleShape", "granularity", "budgetComfort", "busyWith"],
};

const AGE_LABEL: Record<AgeBand, string> = {
  under_18: "under 18", "18_24": "18-24", "25_34": "25-34", "35_44": "35-44",
  "45_54": "45-54", "55_64": "55-64", "65_plus": "65+",
};
const SCHEDULE_LABEL: Record<ScheduleShape, string> = {
  mornings: "mornings", evenings: "evenings", weekends: "weekends", varies: "varies day to day",
};
const GRAIN_LABEL: Record<StepGranularity, string> = {
  big_moves: "big moves", standard: "standard", very_small: "very small steps",
};
const BUDGET_LABEL: Record<BudgetComfort, string> = {
  tight: "tight", some_room: "some room", flexible: "flexible", private: "",
};

/**
 * The ABOUT THE USER block, or "" when nothing is known. Placed at the FRONT
 * of the user message so provider prefix caching hits across calls.
 */
export function buildContextBlock(
  ctx: UserContext | null,
  intake: Record<string, string> | null,
  feature: AiFeature,
): string {
  const gate = new Set(FIELD_GATE[feature]);
  const facts: string[] = [];
  if (ctx) {
    if (gate.has("scheduleShape") && ctx.scheduleShape) facts.push(`Free time: ${SCHEDULE_LABEL[ctx.scheduleShape]}.`);
    if (gate.has("ageBand") && ctx.ageBand) facts.push(`Age: ${AGE_LABEL[ctx.ageBand]}.`);
    if (gate.has("granularity") && ctx.granularity && ctx.granularity !== "standard") facts.push(`Prefers ${GRAIN_LABEL[ctx.granularity]}.`);
    if (gate.has("region") && ctx.region?.trim()) facts.push(`Area: ${ctx.region.trim()}.`);
    // "private" is an answer, not a fact: it must never reach a prompt.
    if (gate.has("budgetComfort") && ctx.budgetComfort && ctx.budgetComfort !== "private") facts.push(`Budget: ${BUDGET_LABEL[ctx.budgetComfort]}.`);
  }
  const life = ctx && gate.has("busyWith") && ctx.busyWith?.trim() ? `- Life: ${ctx.busyWith.trim()}\n` : "";
  const intakePairs = Object.entries(intake ?? {})
    .map(([q, a]) => `${q.replace(/\?$/, "")}: ${a}`)
    .join("; ");
  const goalAnswers = intakePairs ? `- Goal answers: ${intakePairs}\n` : "";

  if (facts.length === 0 && !life && !goalAnswers) return "";

  const factLine = facts.length ? `- ${facts.join(" ")}\n` : "";
  let block =
    `ABOUT THE USER (facts they gave Solaspace; use them silently and naturally):\n` +
    factLine + life + goalAnswers +
    `Use only the facts above. If a fact is absent, write the step without it. Never invent, guess, or restate facts as questions.\n`;

  // The one behavioral instruction a fact carries: sizing. Only where steps
  // are being generated.
  if (ctx?.granularity === "very_small" && (feature === "goal-map" || feature === "expand" || feature === "replan")) {
    block += `Size steps small: no once-step over 30 minutes.\n`;
  }
  return block;
}

/** The fact VALUES a personalNote may cite (see sanitizeBriefing's gate). */
export function providedFactValues(ctx: UserContext | null, intake: Record<string, string> | null): string[] {
  const out: string[] = [];
  if (ctx?.scheduleShape) out.push(SCHEDULE_LABEL[ctx.scheduleShape]);
  if (ctx?.ageBand) out.push(AGE_LABEL[ctx.ageBand]);
  if (ctx?.granularity) out.push(GRAIN_LABEL[ctx.granularity]);
  if (ctx?.region?.trim()) out.push(ctx.region.trim());
  if (ctx?.budgetComfort && ctx.budgetComfort !== "private") out.push(BUDGET_LABEL[ctx.budgetComfort]);
  if (ctx?.busyWith?.trim()) out.push(ctx.busyWith.trim());
  for (const v of Object.values(intake ?? {})) out.push(v);
  return out.filter(Boolean);
}

/** localStorage key for the demo-mode context mirror. */
export const DEMO_CONTEXT_KEY = "kairo.context.v1";

/** The demo's context, client-side only ("" server). Remote accounts use the DB. */
export function readDemoContext(): UserContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEMO_CONTEXT_KEY);
    return raw ? (JSON.parse(raw) as UserContext) : null;
  } catch {
    return null;
  }
}
