import { generateJson, isObj, isClient, viaRoute } from "./provider";
import { mockGoalMap } from "./mock";
import { parseDeadline } from "@/lib/kairo/deadline";
import type { GoalMapInput, GoalMapResult, GeneratedNode } from "./types";

const SYSTEM = `You are Aether, an execution planner. Turn the user's goal into a DETAILED, branching, step-by-step plan they can follow with ZERO further thinking — as if a sharp friend already worked out exactly what to do, in what order, and broke it into sittings small enough to just start.

Return JSON: {"title":string,"description":string,"suggestedTargetDate":ISO8601,"nodes":[{"title":string,"description":string,"status":"in_motion"|"not_started","estimatedMinutes":number,"priority":number,"aiReason":string,"parentIndex":number|null}],"firstNextAction":string,"weeklyRhythm":string}.

Shape the nodes as a TREE:
- 4-6 top-level PHASES in order, each with "parentIndex": null.
- Under each phase, 2-3 concrete DO-THIS-NOW sub-steps, each with "parentIndex" = the array index of its phase. A sub-step is one sitting of work (15-120 min), never a vague theme.
- Every parentIndex must reference an EARLIER index in the array. Aim for 12-20 nodes total.

Rules: nodes[0] is a top-level phase and the only node with status "in_motion"; every other node is "not_started". "title" is imperative and specific ("Draft the 3 core screens" — not "Design"). "description" is ONE sentence saying concretely HOW to do it. "estimatedMinutes" is realistic. "priority" ascends across phases (1..5). "aiReason" is a short phrase on why it matters. "firstNextAction" is the literal first thing to open/do. "suggestedTargetDate" must be after today's date; resolve any named deadline (e.g. "by December") to its next occurrence. No motivation-speak, no filler.`;

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

/** Ensure every parentIndex is null or points to a strictly-earlier node. */
function normalizeTree(r: GoalMapResult): GoalMapResult {
  const nodes = r.nodes.map((n, i) => {
    const p = n.parentIndex;
    const parentIndex = typeof p === "number" && Number.isInteger(p) && p >= 0 && p < i ? p : null;
    return { ...n, parentIndex, status: i === 0 ? "in_motion" : n.status === "done" ? "done" : "not_started" } as GeneratedNode;
  });
  return { ...r, nodes };
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

function finish(r: GoalMapResult, prompt: string): GoalMapResult {
  return normalizeTree(fixDate(r, prompt));
}

export async function generateGoalMap(input: GoalMapInput): Promise<GoalMapResult> {
  if (isClient()) {
    const j = await viaRoute<GoalMapResult>("/api/ai/goal-map", input);
    return valid(j) ? finish(j, input.prompt) : mockGoalMap(input);
  }
  const today = new Date().toISOString().slice(0, 10);
  const r = await generateJson<GoalMapResult>(SYSTEM, `Today's date: ${today}\nGoal: ${input.prompt}`);
  return valid(r) ? finish(r, input.prompt) : mockGoalMap(input);
}
