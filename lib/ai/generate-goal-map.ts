import { generateJson, isObj, isClient, viaRoute } from "./provider";
import { mockGoalMap } from "./mock";
import { parseDeadline } from "@/lib/kairo/deadline";
import { GOAL_ICON_KEYS } from "@/lib/kairo/goal-icon-keys";
import type { GoalMapInput, GoalMapResult, GeneratedNode } from "./types";
import type { NodeResource, ResourceKind } from "@/types";

const SYSTEM = `You are Sola, an execution planner and coach. Turn the user's goal into a DETAILED, DIRECT, step-by-step plan they can start with ZERO further thinking. The goal may include the user's answers to a few quick questions (deadline, level, budget, etc.). Honor them.

Return JSON: {"title":string,"description":string,"suggestedTargetDate":ISO8601,"nodes":[{"title":string,"description":string,"status":"in_motion"|"not_started","estimatedMinutes":number,"priority":number,"aiReason":string,"parentIndex":number|null,"firstAction":string,"successCriterion":string,"resource":{"kind":"watch"|"read"|"practice","label":string,"query":string}|null,"kind":"once"|"recurring"(optional),"targetPerWeek":number(optional, recurring only)}],"firstNextAction":string,"weeklyRhythm":string,"icon":string}.

FORMAT. Nodes form a TREE where DEPTH = TIME:
- ONE chronological SPINE of 4-5 milestones. The first has "parentIndex": null; every later milestone's parentIndex is the milestone right before it in time (a chain: later work hangs off earlier work, never a sibling of it).
- Each milestone MUST have 2-3 concrete sub-steps as children (parentIndex = that milestone's index). Total 14-18 nodes. Every parentIndex references an EARLIER index.

STEP TITLES stay short (they label the map): a concrete first action like "Draft the 3 core screens in Figma", never a vague theme like "Design". The "description" is where you HOLD THEIR HAND: 2-4 sentences that are genuinely useful on their own: exactly what to do and how. ALWAYS ground it with 2-3 concrete specifics or REAL NAMED examples (actual tools, companies, people, techniques, places, communities, or numbers relevant to THIS goal), especially for steps with no attached resource. E.g. "Cut your three biggest money leaks" → name where to look (the subscriptions tab in their banking app, Rocket Money, last month's statement), the number that counts as a leak (anything unused over $10/mo), and the first cancellation to make today. Never vague filler like "quick wins fund the goal".

FIRST MOVE + DONE TEST. Every node MUST also carry:
- "firstAction": the exact physical opening move, startable in under a minute and finished in 5-10 minutes. Verb-first, names the real tool, app, or place. "Open your banking app and write down last month's total spending", never "Get started" or "Begin researching".
- "successCriterion": the observable test that the step is DONE. Binary or a number, something you could show another person, never a feeling. "An automatic 150/month transfer exists and the first one is scheduled", never "Feel more in control of money".

PRACTICES. Some goals are KEPT rather than finished: fitness, a language, an instrument, meditation, a reading habit. For a practice-shaped goal, keep the spine to a SMALL number of once-milestones (setup, first assessment, a mid-point check) and ALSO include one or two recurring practice nodes: "kind":"recurring" with "targetPerWeek" (integer 1 to 7, where 7 means daily). A recurring node's title names one repeatable session ("Practice Spanish 20 minutes", "Gym session"), estimatedMinutes is the length of ONE session, and it hangs off the milestone that unlocks it. Recurring nodes are logged day by day, never marked done, so do not restate them as sub-steps. Every other node is a once-step; omit "kind" for those. nodes[0] must always be a once-step so the first next action is something they can finish today. Pure projects get no recurring nodes.

RESOURCES. Be generous: for MOST sub-steps where any external content (a tutorial, guide, template, tool, or calculator) would help them DO it, add "resource": {"kind","label","query"}. "kind": "watch" for a video/tutorial, "practice" for a drill/workout/exercise routine, "read" for an article/guide. "label" is a short human name (≤5 words). "query" is the exact phrase someone would search (specific to the goal, e.g. "winger agility ladder drills soccer"). Set "resource": null for steps where no external content helps (e.g. "email the designer"). Never invent URLs, only a search query.

ICON. Also return "icon": the ONE key from this list that best fits the goal: ${GOAL_ICON_KEYS.join(", ")}. Use "target" only if none fit.

nodes[0] is the first milestone with status "in_motion"; all others "not_started". priority ascends along the spine. suggestedTargetDate is after today; resolve any named deadline. Be detailed and direct, no motivation-speak.`;

const ICONS: ReadonlySet<string> = new Set(GOAL_ICON_KEYS);
const KINDS: ReadonlySet<string> = new Set<ResourceKind>(["watch", "read", "practice"]);

function cleanResource(r: unknown): NodeResource | null {
  if (!isObj(r)) return null;
  const kind = String(r.kind ?? "");
  const query = String(r.query ?? "").trim();
  if (!KINDS.has(kind) || !query) return null;
  const label = String(r.label ?? "").trim() || query;
  return { kind: kind as ResourceKind, label: label.slice(0, 60), query: query.slice(0, 120) };
}

function isNode(n: unknown): n is GeneratedNode {
  return isObj(n) && typeof n.title === "string";
}

function valid(r: unknown): r is GoalMapResult {
  return (
    isObj(r) &&
    typeof r.title === "string" &&
    Array.isArray(r.nodes) &&
    r.nodes.length > 0 &&
    r.nodes.every(isNode) &&
    typeof r.firstNextAction === "string"
  );
}

/**
 * Practice fields, defensively. Unknown kinds are omitted (the node falls back
 * to a once-step), targetPerWeek only survives on a recurring node and is
 * clamped to a 1..7 integer. nodes[0] is forced to a once-step so the "first
 * next action" stays something the user can actually finish.
 */
function cleanPractice(
  n: GeneratedNode,
  index: number
): Pick<GeneratedNode, "kind" | "targetPerWeek"> {
  const rawKind: unknown = (n as { kind?: unknown }).kind;
  const kind =
    rawKind === "recurring" && index > 0 ? "recurring" : rawKind === "once" ? "once" : undefined;
  if (kind !== "recurring") return { kind, targetPerWeek: undefined };
  const raw: unknown = (n as { targetPerWeek?: unknown }).targetPerWeek;
  const targetPerWeek =
    typeof raw === "number" && Number.isFinite(raw)
      ? Math.max(1, Math.min(7, Math.round(raw)))
      : null;
  return { kind, targetPerWeek };
}

/**
 * The depth floor. Every step ships with an exact opening move and an
 * observable done-test; a model that omits them gets deterministic fallbacks
 * derived from the title, so no node is ever just a label again. Exported so
 * the expand/replan cleaners apply the identical clamps.
 */
export function clampStepDepth(n: { title?: unknown; firstAction?: unknown; successCriterion?: unknown }): {
  firstAction: string;
  successCriterion: string;
} {
  const title = String(n.title ?? "").trim() || "this step";
  const fa = String(n.firstAction ?? "").trim().slice(0, 160);
  const sc = String(n.successCriterion ?? "").trim().slice(0, 120);
  return {
    firstAction: fa || `Open what "${title}" needs and do the first 10 minutes`,
    successCriterion: sc || `"${title}" has a visible result you could show someone`,
  };
}

/** Normalize parent links, statuses, practice fields, resources, and the icon. */
function normalize(r: GoalMapResult): GoalMapResult {
  const nodes = r.nodes.map((n, i) => {
    const p = n.parentIndex;
    const parentIndex = typeof p === "number" && Number.isInteger(p) && p >= 0 && p < i ? p : null;
    return {
      ...n,
      ...cleanPractice(n, i),
      ...clampStepDepth(n),
      parentIndex,
      status: i === 0 ? "in_motion" : n.status === "done" ? "done" : "not_started",
      resource: cleanResource(n.resource),
    } as GeneratedNode;
  });
  const icon = typeof r.icon === "string" && ICONS.has(r.icon) ? r.icon : "target";
  return { ...r, nodes, icon };
}

// Guard against the model returning a past/invalid target date (it may not know today).
function fixDate(r: GoalMapResult, prompt: string): GoalMapResult {
  const t = new Date(r.suggestedTargetDate).getTime();
  if (Number.isFinite(t) && t > Date.now()) return r;
  const parsed = parseDeadline(prompt);
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 56);
  fallback.setHours(12, 0, 0, 0);
  return { ...r, suggestedTargetDate: parsed ? parsed.iso : fallback.toISOString() };
}

/** The full response-sanitising pass. Exported so tests can feed it raw model output. */
export function sanitizeGoalMap(r: GoalMapResult, prompt: string): GoalMapResult {
  return normalize(fixDate(r, prompt));
}

export async function generateGoalMap(input: GoalMapInput): Promise<GoalMapResult> {
  if (isClient()) {
    const j = await viaRoute<GoalMapResult>("/api/ai/goal-map", input);
    return valid(j) ? sanitizeGoalMap(j, input.prompt) : { ...mockGoalMap(input), isMock: true };
  }
  const today = new Date().toISOString().slice(0, 10);
  // Answers arrive structured and render as labeled lines rather than being
  // folded into the prompt string: the model reads them more reliably, and the
  // same pairs persist to goals.intake for every later per-step call.
  const answerLines = (input.answers ?? [])
    .filter((a) => a.answer.trim())
    .map((a) => `- ${a.question.replace(/\?$/, "")}: ${a.answer}`);
  if (input.freeText?.trim()) answerLines.push(`- Also: ${input.freeText.trim()}`);
  const user = [`Today's date: ${today}`, `Goal: ${input.prompt}`, answerLines.length ? `Answers:\n${answerLines.join("\n")}` : ""]
    .filter(Boolean)
    .join("\n");
  // 14-18 nodes each with a grounded description PLUS a first move and a done
  // test need real headroom: 4096 already ran tight before the two new strings,
  // and a truncated JSON dead-ends onboarding.
  const r = await generateJson<GoalMapResult>(SYSTEM, user, { maxTokens: 6144 });
  return valid(r) ? sanitizeGoalMap(r, input.prompt) : { ...mockGoalMap(input), isMock: true };
}
