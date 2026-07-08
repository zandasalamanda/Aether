import type { Clarifier } from "./types";

// Clarifiers are chosen LOCALLY (keyword match) and shown BEFORE generating, so
// the whole flow costs exactly one AI call — the answers are folded into that
// single goal-map prompt. No separate before/after generations.

const DEADLINE: Clarifier = { question: "Target date?", options: ["1 month", "3 months", "6 months", "1 year", "2+ years", "No deadline"] };

interface Rule {
  match: RegExp;
  qs: Clarifier[];
}

const RULES: Rule[] = [
  {
    match: /\b(save|saving|savings|money|budget|afford|buy|purchase|debt|invest|cash|fund|\$)\b/i,
    qs: [
      { question: "Monthly income?", options: ["<$2k", "$2-4k", "$4-7k", "$7k+"] },
      { question: "Save per month?", options: ["<$200", "$200-500", "$500-1k", "$1k+"] },
    ],
  },
  {
    match: /\b(fit|fitness|gym|run|running|workout|muscle|weight|lift|marathon|soccer|basketball|climb|climbing|sport|train|athlete)\b/i,
    qs: [
      { question: "Current level?", options: ["Beginner", "Some", "Advanced"] },
      { question: "Days per week?", options: ["1-2", "3-4", "5+"] },
    ],
  },
  {
    match: /\b(learn|study|exam|language|instrument|music|piano|guitar|sing|code|coding|program|skill|draw|paint|cook|write|writing)\b/i,
    qs: [
      { question: "Current level?", options: ["Beginner", "Some", "Advanced"] },
      { question: "Time per week?", options: ["1-3 hrs", "4-7 hrs", "8+ hrs"] },
    ],
  },
  {
    match: /\b(launch|build|ship|startup|business|app|product|side project|company|freelance|sell|brand)\b/i,
    qs: [
      { question: "Working solo?", options: ["Solo", "Small team"] },
      { question: "Hours per week?", options: ["<5", "5-15", "15+"] },
    ],
  },
];

const DEFAULT_QS: Clarifier[] = [
  { question: "Your level?", options: ["New to this", "Some experience", "Experienced"] },
  { question: "Time per week?", options: ["1-3 hrs", "4-7 hrs", "8+ hrs"] },
];

/** Deadline + up to two goal-specific questions, chosen by keyword. Deterministic, no AI. */
export function clarifiersFor(prompt: string): Clarifier[] {
  const rule = RULES.find((r) => r.match.test(prompt));
  return [DEADLINE, ...(rule ? rule.qs : DEFAULT_QS)].slice(0, 3);
}
