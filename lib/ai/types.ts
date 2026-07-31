import type {
  NodeStatus,
  Difficulty,
  EnergyLevel,
  InboxCategory,
  GoalWithNodes,
  DailyPlanWithBlocks,
  NodeResource,
} from "@/types";

// ---------- Goal map generation ----------
export interface GoalMapInput {
  prompt: string;
  /** Structured clarifier answers; persisted to goals.intake, injected into later per-step calls. */
  answers?: { question: string; answer: string }[];
  /** The optional free-text "tell me more". */
  freeText?: string;
  /** ABOUT THE USER block, built SERVER-SIDE by the route. Never client-supplied. */
  contextBlock?: string;
}

export interface GeneratedNode {
  title: string;
  description: string;
  status: NodeStatus;
  estimatedMinutes: number;
  priority: number;
  aiReason: string;
  /**
   * Index (within this same nodes array) of this node's parent, or null for a
   * top-level phase branching off the goal core. Must reference an earlier
   * index. The map renders the tree from these links.
   */
  parentIndex: number | null;
  /** Optional pointer to content that helps do this step (a search intent). */
  resource?: NodeResource | null;
  /**
   * "recurring" marks a practice: a step done again and again (daily Spanish,
   * gym sessions) rather than finished once. Practices carry a weekly cadence
   * and are logged per day instead of being marked done. Absent means "once".
   */
  kind?: "once" | "recurring";
  /** recurring only: sessions per week the plan calls for (7 = daily). */
  targetPerWeek?: number | null;
  /**
   * REQUIRED after sanitizing. The exact physical opening move: startable in
   * under a minute, finished in 5-10 minutes, verb-first, names the real tool,
   * app, or place. "Open your banking app and write down last month's total
   * spending", never "Get started".
   */
  firstAction: string;
  /**
   * REQUIRED after sanitizing. The observable test that this step is done:
   * binary or a number, something you could show another person, never a
   * feeling. "An automatic 150/month transfer exists and the first one is
   * scheduled", never "Feel more in control".
   */
  successCriterion: string;
}

/** A short question the AI can pose to sharpen the plan (answered with a tap). */
export interface Clarifier {
  question: string;
  options: string[];
}

export interface GoalMapResult {
  title: string;
  description: string;
  suggestedTargetDate: string;
  nodes: GeneratedNode[];
  firstNextAction: string;
  weeklyRhythm: string;
  clarifiers?: Clarifier[];
  /** An icon key from GOAL_ICON_KEYS that fits the goal. */
  icon?: string | null;
  /** True when this is the deterministic placeholder (AI unavailable / failed). */
  isMock?: boolean;
}

export interface ResearchInput {
  goalTitle: string;
  nodeTitle: string;
  context?: string;
  question?: string;
  /** When present (and owned), the server persists the result on the node. */
  goalId?: string;
  nodeId?: string;
  /** ABOUT THE USER block, built SERVER-SIDE by the route. Never client-supplied. */
  contextBlock?: string;
  /** Stored region, SERVER-injected via the research gate. Never client-supplied. */
  region?: string;
}
export interface ResearchResult {
  answer: string;
  sources: { title: string; url: string }[];
}



// ---------- User context (what Sola knows; all optional, user-editable) ----------
export type AgeBand = "under_18" | "18_24" | "25_34" | "35_44" | "45_54" | "55_64" | "65_plus";
export type ScheduleShape = "mornings" | "evenings" | "weekends" | "varies";
export type StepGranularity = "big_moves" | "standard" | "very_small";
export type BudgetComfort = "tight" | "some_room" | "flexible" | "private";

export interface UserContext {
  ageBand?: AgeBand;
  scheduleShape?: ScheduleShape;
  /** default behavior = "standard" */
  granularity?: StepGranularity;
  /** City or region as free text ("Leiden, NL"). Never GPS, never precise. */
  region?: string;
  budgetComfort?: BudgetComfort;
  /** Life shape in the user's words: "full-time job, two kids under 5". */
  busyWith?: string;
  /** Question keys skipped; never re-asked. */
  skipped?: string[];
  updatedAt?: string;
}

export type AiFeature =
  | "goal-map" | "clarify" | "enrich" | "research" | "expand" | "replan"
  | "session" | "draft" | "ask-node" | "unblock" | "ask-sola";

// ---------- Step briefing (per-step enrichment, cached on the node) ----------
export interface StepMistake { mistake: string; fix: string } // each <= 120 chars

export interface StepBriefing {
  /** may refine the skeleton value; <= 160 */
  firstAction: string;
  /** <= 120 */
  successCriterion: string;
  /** Suggested trigger tied to an existing routine ("after dinner, at the kitchen table"). Null if none fits. */
  whenWhereCue: string | null; // <= 100
  /** 1-3 real failure modes for THIS step, each with the concrete fix. */
  commonMistakes: StepMistake[];
  /** The 5-minute fallback version for a bad day. */
  ifStuck: string; // <= 160
  /** 0-4 real prerequisites ("a library card", "about $30"). */
  whatYoullNeed: string[]; // each <= 60
  /** One sentence naming which stored facts shaped this, or null when none did. */
  personalNote: string | null; // <= 140
  /** filled only by a research merge */
  sources: { title: string; url: string }[];
  level: "enriched" | "researched" | "mock";
  briefedAt: string; // ISO
}

export interface EnrichStepInput {
  goalId: string;
  nodeId: string;
  // Demo-mode fallbacks (the server ignores these and loads canonical rows):
  goalTitle?: string;
  nodeTitle?: string;
  nodeDescription?: string;
}

// ---------- Daily plan ----------
export interface DailyPlanInput {
  availableMinutes: number;
  energy: EnergyLevel;
  context: string;
  goals: GoalWithNodes[];
}

export interface PlannedBlock {
  /** "focus" = real work on a node; "break" = a rest block (no goal/node). */
  kind: "focus" | "break";
  title: string;
  description: string;
  goalId: string | null;
  nodeId: string | null;
  durationMinutes: number;
  startTime: string | null;
  difficulty: Difficulty;
  reason: string;
}

export interface DailyPlanResult {
  summary: string;
  blocks: PlannedBlock[];
  explanation: string;
  recoveryNote: string | null;
}

// ---------- Inbox sorting ----------
export interface SortInboxInput {
  items: { id: string; content: string }[];
}

export interface SortedItem {
  id: string;
  category: InboxCategory;
  reason: string;
}

export interface SortInboxResult {
  items: SortedItem[];
  reasoning: string;
}

// ---------- node assist (ask / go deeper) ----------
export interface ExpandNodeInput {
  goalTitle: string;
  nodeTitle: string;
  nodeDescription: string;
  /** optional personalization: the user's inline detail + the goal's notebook context */
  context?: string;
  /** "make it smaller": break into tiny, almost-silly micro-steps to kill activation energy */
  tiny?: boolean;
}
export interface ExpandNodeResult {
  steps: { title: string; estimatedMinutes: number; aiReason: string; firstAction?: string; successCriterion?: string }[];
}

export interface AskNodeInput {
  goalTitle: string;
  nodeTitle: string;
  question: string;
  /** the goal's notebook context, so answers use what the user has told Solaspace */
  context?: string;
}
export interface AskNodeResult {
  answer: string;
}

// ---------- work session (co-work on one step) ----------
export interface WorkSessionInput {
  goalTitle: string;
  nodeTitle: string;
  nodeDescription: string;
  /** how long the session is, so the checklist fits the time */
  minutes: number;
  /** the goal's notebook context, so the session is personal */
  context?: string;
}
export interface WorkSessionResult {
  /** "desk" = screen/paper work Solaspace can co-produce; "coach" = physical work it can only brief. */
  kind: "desk" | "coach";
  /** the single smallest action to begin right now */
  firstMove: string;
  /** an ordered checklist of 2-4 micro-actions sized to the session */
  steps: string[];
}

export interface UnblockInput {
  goalTitle: string;
  nodeTitle: string;
  context?: string;
}
export interface UnblockResult {
  answer: string;
}

// ---------- adaptive replan (the living map) ----------
export type ReplanKind = "onramp" | "substep" | "milestone" | "stretch";
export interface ReplanInput {
  goalTitle: string;
  /** the current steps with their status, so proposals match reality */
  nodes: { title: string; status: NodeStatus }[];
  context?: string;
}
export interface ReplanProposal {
  kind: ReplanKind;
  /** title of an existing step to attach under, or null for a new top-level phase */
  parentTitle: string | null;
  title: string;
  estimatedMinutes: number;
  reason: string;
  firstAction?: string;
  successCriterion?: string;
}
export interface ReplanResult {
  proposals: ReplanProposal[];
}

// ---------- extract steps (notebook → map) ----------
export interface ExtractStepsInput {
  goalTitle: string;
  notes: string;
}
export interface ExtractStepsResult {
  steps: string[];
}

// ---------- Ask Sola (agentic plan assistant) ----------
export type SolaChangeKind = "add" | "edit" | "status" | "deadline" | "split";
export interface SolaChange {
  kind: SolaChangeKind;
  goalId: string;
  /** target node for edit/status/split */
  nodeId?: string;
  /** parent for add (null = top-level under the goal) */
  parentId?: string | null;
  title?: string;
  status?: NodeStatus;
  /** deadline as plain text ("in 6 weeks") or ISO */
  date?: string;
  /** split: the sub-step titles */
  into?: string[];
  reason: string;
}
export interface SolaPlanNode {
  id: string;
  parentId: string | null;
  title: string;
  status: NodeStatus;
}
export interface SolaPlanGoal {
  id: string;
  title: string;
  targetDate: string | null;
  nodes: SolaPlanNode[];
}
export interface AskSolaInput {
  message: string;
  plan: SolaPlanGoal[];
}
export interface AskSolaResult {
  reply: string;
  changes: SolaChange[];
}

// ---------- draft (a co-produced artifact for a desk step) ----------
export interface DraftInput {
  goalTitle: string;
  nodeTitle: string;
  nodeDescription: string;
  context?: string;
  /** optional steer from the user, e.g. "make it more formal" */
  instruction?: string;
}
export interface DraftResult {
  /** a 2-4 word label, e.g. "Cover letter draft" */
  title: string;
  /** the actual draft, plain text with line breaks */
  content: string;
}

// ---------- Review ----------
export interface ReviewInput {
  goals: GoalWithNodes[];
  recentPlan?: DailyPlanWithBlocks | null;
}

export interface ReviewResult {
  summary: string;
  changes: string[];
  risks: string[];
  recoverability: string;
  nextBestMove: string;
}
