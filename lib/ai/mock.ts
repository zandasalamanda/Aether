// Deterministic, dependency-free mock generators.
// These run whenever no AI key is configured so the app is fully usable in
// preview. Outputs are structured to match the real AI contract exactly.

import type {
  GoalMapInput,
  GoalMapResult,
  GeneratedNode,
  DailyPlanInput,
  DailyPlanResult,
  PlannedBlock,
  SortInboxInput,
  SortInboxResult,
  SortedItem,
  ReviewInput,
  ReviewResult,
} from "./types";
import type { Difficulty, GoalNode, InboxCategory } from "@/types";
import { parseDeadline } from "@/lib/kairo/deadline";
import { adherence, isRecurring } from "@/lib/kairo/practice";

// ---------- helpers ----------

function cleanTitle(prompt: string): string {
  const t = prompt.trim().replace(/\s+/g, " ").replace(/[.…]+$/, "");
  if (!t) return "New goal";
  const capped = t.charAt(0).toUpperCase() + t.slice(1);
  return capped.length > 80 ? capped.slice(0, 77) + "…" : capped;
}

type SubStep = {
  title: string;
  est: number;
  reason: string;
  /** the exact sub-10-minute opening move */
  first: string;
  /** the observable done-test */
  done: string;
  res?: { kind: "watch" | "read" | "practice"; label: string; query: string };
};

interface TemplateNode {
  title: string;
  est: number;
  reason: string;
  /** the exact sub-10-minute opening move */
  first: string;
  /** the observable done-test */
  done: string;
  /** Concrete do-this-now sub-steps that branch off this phase. */
  sub?: SubStep[];
}

interface Template {
  match: RegExp;
  description: (title: string) => string;
  rhythm: string;
  weeks: number;
  icon: string;
  nodes: TemplateNode[];
}

const TEMPLATES: Template[] = [
  {
    match: /\b(launch|build|ship|app|startup|product|project|website|business)\b/i,
    description: (t) =>
      `A focused build toward "${t}". Solaspace mapped the path from a clear MVP to your first real users, ordered so momentum compounds.`,
    rhythm: "3 focus blocks / week · ~90 min each",
    weeks: 9,
    icon: "rocket",
    nodes: [
      { title: "Define the MVP", est: 60, reason: "Scope tightly so you can move", first: "Open a blank note and write the one sentence your product must prove", done: "A one-line promise and three features are written down", sub: [
        { title: "List every feature you imagine", est: 20, reason: "Get it all out of your head", first: "Set a 10-minute timer and brain-dump every feature into one list", done: "A list of 15+ features exists, nothing held back" },
        { title: "Circle the 3 that prove the idea", est: 20, reason: "Everything else is later", first: "Read your list once and mark the 3 a stranger would pay for", done: "Exactly 3 features are circled; the rest are labeled later" },
      ] },
      { title: "Design the core flows", est: 90, reason: "Know what you're building before you build it", first: "Grab paper and draw the first screen a new user sees", done: "Every core screen exists as a sketch you could hand to someone", sub: [
        { title: "Sketch the 3 key screens", est: 45, reason: "Paper is faster than code", first: "Draw three rectangles on paper and label what each screen does", done: "Three screen sketches with labeled buttons exist", res: { kind: "watch", label: "App wireframing basics", query: "app wireframing tutorial for beginners" } },
        { title: "Pick colors and type", est: 30, reason: "One look, decided once", first: "Open coolors.co and lock a 3-colour palette you like", done: "One palette and one font pairing are written in your notes" },
      ] },
      { title: "Build the foundation", est: 120, reason: "The load-bearing work everything sits on", first: "Create the project and make the first commit, empty is fine", done: "The app runs locally and a repository exists", sub: [
        { title: "Set up auth + database", est: 90, reason: "Every feature leans on this", first: "Create the database project and paste its keys into your env file", done: "You can sign in and see a row written to the database", res: { kind: "watch", label: "Auth setup walkthrough", query: "next.js auth database setup tutorial" } },
        { title: "Ship one flow end to end", est: 90, reason: "Prove the stack works", first: "Pick the smallest flow and build only its first screen", done: "One complete flow works from tap to saved result" },
      ] },
      { title: "Test with real users", est: 60, reason: "Reality checks the plan early", first: "Message three people you know and book 15 minutes with each", done: "Three sessions are on the calendar", sub: [
        { title: "Watch 3 people use it", est: 45, reason: "You'll see what to fix instantly", first: "Hand the first person your phone and say nothing while they try it", done: "Three sessions done and the top 3 stumbles are written down" },
      ] },
      { title: "Craft the landing page", est: 75, reason: "You need a front door before launch", first: "Write the headline as the promise your 3 features make", done: "A live page with a headline and a signup button exists" },
      { title: "Launch", est: 90, reason: "Ship it. Done beats perfect", first: "Pick the launch day and write the announcement post now", done: "The product is public and the post is published" },
      { title: "Win first customers", est: 60, reason: "Proof the thing matters", first: "Personally message the 10 most likely people with one honest line", done: "Someone you do not know has signed up or paid" },
    ],
  },
  {
    match: /\b(study|exam|finals?|learn|school|course|class|degree|test)\b/i,
    description: (t) =>
      `A calm study path toward "${t}". Solaspace turned it into a rhythm you can actually hold, weighted toward your weak spots.`,
    rhythm: "5 study blocks / week · ~45 min each",
    weeks: 6,
    icon: "school",
    nodes: [
      { title: "Map the syllabus", est: 45, reason: "See the whole terrain first", first: "Open the course outline and copy every topic into one list", done: "Every examinable topic is on one page", sub: [
        { title: "List every topic to cover", est: 25, reason: "Nothing hides until exam day", first: "Go through the syllabus line by line and write each topic down", done: "The topic list matches the syllabus end to end" },
        { title: "Mark the 5 you're shakiest on", est: 15, reason: "That's where the points are", first: "Read your list and star everything you could not explain aloud", done: "Five topics carry a star and a one-line why" },
      ] },
      { title: "Gather your materials", est: 30, reason: "Remove friction before it starts", first: "Put every book, slide deck, and past paper into one folder", done: "Everything you need opens from one place" },
      { title: "Build a study rhythm", est: 45, reason: "Consistency beats cramming", first: "Open your calendar and place the first study block tomorrow", done: "Five recurring blocks exist in the calendar", sub: [
        { title: "Block 5 study slots this week", est: 15, reason: "A time on the calendar is a promise", first: "Open your calendar and add the first 45-minute slot", done: "Five slots this week, each with a topic attached" },
      ] },
      { title: "Drill the weak spots", est: 60, reason: "Spend time where it moves the grade", first: "Take the first starred topic and do 10 practice questions on it", done: "Each starred topic has a practice set scored above passing" },
      { title: "Take a mock test", est: 90, reason: "Practice under real conditions", first: "Print a past paper, set a timer for exam length, phone in another room", done: "One full past paper completed under time and marked" },
      { title: "Final review pass", est: 60, reason: "Consolidate before the day", first: "Rewrite your one-page summary from memory, then check it", done: "You can reproduce the summary sheet without looking" },
    ],
  },
  {
    match: /\b(save|money|budget|debt|finance|invest|spend)\b/i,
    description: (t) =>
      `A steady plan toward "${t}". Solaspace broke it into small, repeatable moves so progress compounds without stress.`,
    rhythm: "2 money blocks / week · ~30 min each",
    weeks: 12,
    icon: "money",
    nodes: [
      { title: "Map current spending", est: 45, reason: "You can't change what you can't see", first: "Open your banking app and write down last month's total spending", done: "One number on paper: what last month actually cost" },
      { title: "Set a clear target", est: 30, reason: "A number gives the plan direction", first: "Write the amount and the date: how much, by when", done: "A target amount and month are written where you will see them" },
      { title: "Cut three leaks", est: 45, reason: "Quick wins fund the goal", first: "Open the subscriptions tab in your banking app and cancel the first unused one", done: "Three cancellations confirmed by email" },
      { title: "Automate saving", est: 30, reason: "Make progress happen without willpower", first: "Open your bank's transfers tab and start a new recurring transfer", done: "An automatic monthly transfer exists and the first date is set" },
      { title: "Build a buffer", est: 60, reason: "Safety keeps the plan alive", first: "Open a separate savings space and name it Buffer", done: "One month of essentials sits in an account you do not touch" },
      { title: "Review monthly", est: 30, reason: "Small corrections keep you on track", first: "Put a 30-minute money check-in on the first Sunday of next month", done: "The check-in recurs monthly and the first one happened" },
    ],
  },
  {
    match: /\b(routine|habit|organi[sz]e|health|fit|fitness|gym|run|sleep|clean)\b/i,
    description: (t) =>
      `A grounded path toward "${t}". Solaspace started small and stackable so the routine sticks instead of stalling.`,
    rhythm: "Daily anchor · ~20 min",
    weeks: 8,
    icon: "habit",
    nodes: [
      { title: "Define the routine", est: 30, reason: "Decide once, not every day", first: "Write one sentence: I will do X, at time Y, in place Z", done: "The sentence exists with a real time and place in it" },
      { title: "Prep the environment", est: 30, reason: "Make the right move the easy move", first: "Put the thing you need where you will trip over it tonight", done: "Starting takes under a minute from where you usually are" },
      { title: "Start small, daily", est: 20, reason: "Tiny and repeated beats big and rare", first: "Do the two-minute version right now, today counts", done: "Seven days in a row of any size at all" },
      { title: "Track for two weeks", est: 20, reason: "Data shows what's working", first: "Put a tick on a calendar for today", done: "Fourteen days of ticks and misses, honestly recorded" },
      { title: "Adjust the plan", est: 30, reason: "Tune it to your real life", first: "Look at your misses and move the routine to when they were not", done: "One concrete change made to time, place, or size" },
      { title: "Lock it in", est: 20, reason: "Make it automatic", first: "Attach the routine to something you already do every day", done: "Four weeks running without needing the reminder" },
    ],
  },
];

const DEFAULT_TEMPLATE: Template = {
  match: /.*/,
  description: (t) =>
    `A clear path toward "${t}". Solaspace broke it into ordered steps so you always know the next move.`,
  rhythm: "3 focus blocks / week · ~60 min each",
  weeks: 8,
  icon: "target",
  nodes: [
    { title: "Clarify the outcome", est: 45, reason: "Define what done looks like", first: "Write one sentence describing the day this goal is finished", done: "The sentence names something you could photograph", sub: [
      { title: "Write the goal in one sentence", est: 20, reason: "If you can't, it's not clear yet", first: "Open your notes and finish the line: this is done when...", done: "One sentence, no and, no or" },
      { title: "Name how you'll know it's done", est: 25, reason: "A finish line you can see", first: "Write the number or artifact that proves it is finished", done: "A measurable finish line is written down" },
    ] },
    { title: "Break it into parts", est: 45, reason: "Big goals move as small pieces", first: "List the big chunks on paper, aim for five", done: "3-5 named parts cover the whole goal", sub: [
      { title: "List the 3-5 big chunks", est: 30, reason: "Each becomes its own branch", first: "Write the first chunk that has to happen before anything else", done: "Each chunk has a name and a rough order" },
    ] },
    { title: "Set the first milestone", est: 60, reason: "A near target creates momentum", first: "Pick a result you can reach within two weeks and write its date", done: "A dated two-week milestone exists" },
    { title: "Do the core work", est: 90, reason: "The part that actually matters", first: "Open the first chunk and start its smallest piece for 25 minutes", done: "The first chunk is finished and visible" },
    { title: "Review progress", est: 30, reason: "Catch drift before it compounds", first: "Compare where you are against the two-week milestone date", done: "You know if you are ahead or behind, in writing" },
    { title: "Finish strong", est: 60, reason: "Close it out cleanly", first: "List everything between you and done, smallest first", done: "The finish-line artifact from step one exists" },
  ],
};

function pickTemplate(prompt: string): Template {
  return TEMPLATES.find((t) => t.match.test(prompt)) ?? DEFAULT_TEMPLATE;
}

// ---------- practice detection ----------

// Practice-shaped goals (kept, not finished) get a recurring node alongside the
// milestones: a repeatable session with a weekly cadence, logged day by day.
interface PracticeSpec {
  match: RegExp;
  title: string;
  est: number;
  perWeek: number;
  reason: string;
  first: string;
  done: string;
}

const PRACTICES: PracticeSpec[] = [
  {
    match: /\b(language|spanish|french|german|italian|japanese|mandarin|chinese|korean|portuguese|vocab|duolingo)\b/i,
    title: "Practice 20 minutes",
    est: 20,
    perWeek: 7,
    reason: "A short daily session beats a long weekly one for retention",
    first: "Open your language app and start today's first lesson",
    done: "Today's session is logged, streak intact",
  },
  {
    match: /\b(gym|workout|lift|lifting|strength|fitness|exercise|train|training)\b/i,
    title: "Training session",
    est: 45,
    perWeek: 4,
    reason: "Four sessions a week builds strength without burning out",
    first: "Put your gym clothes on and pack the bag, that is the real start",
    done: "The session happened and is logged for today",
  },
  {
    // bare "run" only when not "run a business / run my startup" shaped
    match: /\b(running|jog|jogging|5k|10k|marathon)\b|\brun\b(?!\s+(a|an|my|the|our)\b)/i,
    title: "Go for a run",
    est: 30,
    perWeek: 3,
    reason: "Three runs a week builds the base with room to recover",
    first: "Put your running shoes on and step outside, distance decided later",
    done: "The run happened and is logged for today",
  },
  {
    match: /\b(guitar|piano|violin|drums|bass|instrument|sing|singing)\b/i,
    title: "Practice session",
    est: 25,
    perWeek: 5,
    reason: "Frequent short practice is how the hands learn",
    first: "Take the instrument out of its case and play one scale",
    done: "Today's practice is logged, even five minutes counts",
  },
  {
    match: /\b(meditat\w*|mindful\w*|journal\w*|breathwork)\b/i,
    title: "Sit for 10 minutes",
    est: 10,
    perWeek: 7,
    reason: "The practice works through repetition, not duration",
    first: "Sit down where you are and take three slow breaths",
    done: "Today's sit is logged",
  },
  {
    match: /\b(read|reading|books?)\b/i,
    title: "Read 20 minutes",
    est: 20,
    perWeek: 6,
    reason: "Twenty minutes most days finishes more books than any sprint",
    first: "Pick the book up and read one page, momentum does the rest",
    done: "Today's reading is logged",
  },
];

/** At most two practices per goal, mirroring the real prompt's contract. */
function practicesFor(prompt: string): PracticeSpec[] {
  return PRACTICES.filter((p) => p.match.test(prompt)).slice(0, 2);
}

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

// ---------- goal map ----------

export function mockGoalMap(input: GoalMapInput): GoalMapResult {
  const title = cleanTitle(input.prompt);
  const tpl = pickTemplate(input.prompt);

  // Flatten depth-first into a chronological SPINE: each milestone chains off
  // the previous one (parentIndex = previous milestone), and its sub-steps hang
  // off it. Depth = time, so nothing sequential ends up as a sibling at the root.
  const flat: { title: string; est: number; reason: string; first: string; done: string; parentIndex: number | null; res?: SubStep["res"] }[] = [];
  let prevPhase: number | null = null;
  tpl.nodes.forEach((phase) => {
    const phaseIndex = flat.length;
    flat.push({ title: phase.title, est: phase.est, reason: phase.reason, first: phase.first, done: phase.done, parentIndex: prevPhase });
    (phase.sub ?? []).forEach((c) => flat.push({ title: c.title, est: c.est, reason: c.reason, first: c.first, done: c.done, parentIndex: phaseIndex, res: c.res }));
    prevPhase = phaseIndex;
  });

  const nodes: GeneratedNode[] = flat.map((n, i) => ({
    title: n.title,
    description: n.reason + ".",
    status: i === 0 ? "in_motion" : "not_started",
    estimatedMinutes: n.est,
    priority: Math.min(5, i + 1),
    aiReason: n.reason,
    parentIndex: n.parentIndex,
    resource: n.res ?? null,
    firstAction: n.first,
    successCriterion: n.done,
  }));

  // Practice-shaped goals also get recurring practice nodes: kept, not
  // finished, logged per day against a weekly cadence. They hang off the first
  // milestone so the habit starts alongside the setup work, never at index 0
  // (the first next action stays a step you can finish today).
  practicesFor(input.prompt).forEach((p) => {
    nodes.push({
      title: p.title,
      description: p.reason + ".",
      status: "not_started",
      estimatedMinutes: p.est,
      priority: 2,
      aiReason: p.reason,
      parentIndex: 0,
      resource: null,
      kind: "recurring",
      targetPerWeek: p.perWeek,
      firstAction: p.first,
      successCriterion: p.done,
    });
  });
  // Honor a deadline written in plain English ("by September", "in 6 weeks");
  // otherwise fall back to the template's suggested horizon.
  const deadline = parseDeadline(input.prompt);
  return {
    title,
    description: tpl.description(title),
    suggestedTargetDate: deadline ? deadline.iso : isoDaysFromNow(tpl.weeks * 7),
    nodes,
    firstNextAction: `Spend 25 minutes to ${tpl.nodes[0].title.toLowerCase()}`,
    weeklyRhythm: tpl.rhythm,
    icon: tpl.icon,
    clarifiers: [
      { question: "Deadline?", options: ["2 weeks", "1 month", "3 months", "No rush"] },
      { question: "Time / week?", options: ["2 hrs", "5 hrs", "10+ hrs"] },
    ],
  };
}

// ---------- daily plan ----------

function difficultyFor(minutes: number, energy: DailyPlanInput["energy"], focusSoFar: number): Difficulty {
  // Deep into a long day, everything lightens. You don't ask someone to go deep
  // in hour five. Fatigue caps the ceiling regardless of the block's length.
  if (energy === "low" || focusSoFar >= 300) return "light";
  let base: Difficulty;
  if (minutes >= 50 && energy === "high") base = "deep";
  else if (minutes >= 40) base = "moderate";
  else if (minutes >= 25) base = "moderate";
  else base = "light";
  if (focusSoFar >= 180 && base === "deep") return "moderate";
  return base;
}

function breakBlock(minutes: number, long: boolean): PlannedBlock {
  return {
    kind: "break",
    title: long ? "Long break" : "Break",
    description: long ? "Step away: walk, eat, reset before the next stretch." : "Stretch, breathe, look away from the screen.",
    goalId: null,
    nodeId: null,
    durationMinutes: minutes,
    startTime: null,
    difficulty: "light",
    reason: "Protects your focus for the block after it",
  };
}

/** Workable once-steps, best-first: in_motion, then at_risk, then not_started.
 *  Recurring practices are excluded here; they get their own daily block. */
function candidateNodes(input: DailyPlanInput): { node: GoalNode; goalId: string; goalTitle: string }[] {
  const rank: Record<string, number> = { in_motion: 0, at_risk: 1, not_started: 2 };
  const out: { node: GoalNode; goalId: string; goalTitle: string }[] = [];
  for (const g of input.goals) {
    for (const n of g.nodes) {
      if (n.status === "done" || n.status === "blocked" || isRecurring(n)) continue;
      out.push({ node: n, goalId: g.id, goalTitle: g.title });
    }
  }
  return out.sort((a, b) => {
    const r = (rank[a.node.status] ?? 3) - (rank[b.node.status] ?? 3);
    if (r !== 0) return r;
    return a.node.priority - b.node.priority;
  });
}

// Break blocks count against the window, so the plan fits the real time you have:
// e.g. a 4h budget becomes ~3h of focus with rests woven through, not 4h straight.
const MIN_FOCUS = 15;
const round5 = (n: number) => Math.round(n / 5) * 5;
// Blocks shrink as the day accumulates. Hour one is not hour five.
const taper = (focusSoFar: number) => Math.max(0.65, 1 - focusSoFar / 600);

/** Recurring practices with no session logged today: they still owe the day one. */
function unloggedPractices(input: DailyPlanInput, nowMs: number): { node: GoalNode; goalId: string; goalTitle: string }[] {
  const out: { node: GoalNode; goalId: string; goalTitle: string }[] = [];
  for (const g of input.goals) {
    for (const n of g.nodes) {
      if (!isRecurring(n) || n.status === "blocked" || n.status === "done") continue;
      if (adherence(n, nowMs).loggedToday) continue;
      out.push({ node: n, goalId: g.id, goalTitle: g.title });
    }
  }
  return out;
}

export function mockDailyPlan(input: DailyPlanInput): DailyPlanResult {
  const energy = input.energy;
  const budget = Math.max(0, Math.round(input.availableMinutes || 0));
  const candidates = candidateNodes(input);

  // Each node can span multiple sessions across the day: a 120-min step becomes
  // a few focus blocks with breaks between, not one impossible sitting.
  const queue = candidates.map((c) => ({ ...c, remaining: Math.max(MIN_FOCUS, c.node.estimatedMinutes || 30), sessions: 0 }));

  const baseChunk = energy === "low" ? 25 : energy === "high" ? 55 : 45;
  const shortBreak = energy === "high" ? 5 : 10;
  const longBreakEvery = energy === "low" ? 60 : energy === "high" ? 110 : 90; // focus min between long breaks
  const longBreakLen = energy === "low" ? 20 : 15;

  const blocks: PlannedBlock[] = [];
  let used = 0;        // window consumed (focus + breaks)
  let totalFocus = 0;  // focus minutes so far (drives taper + difficulty)
  let sinceLong = 0;   // focus minutes since the last long break
  let ptr = 0;
  let focusCount = 0;
  const hasWork = () => queue.some((q) => q.remaining >= 10);

  // Practices first: a kept habit is one fixed session, not something to split
  // across the day, so it books its time before the once-steps share the rest.
  // Already-logged practices are skipped entirely; the day's session is done.
  const nowMs = Date.now();
  for (const p of unloggedPractices(input, nowMs)) {
    const room = budget - used;
    if (room < 10) break;
    let chunk = Math.min(Math.max(10, round5(p.node.estimatedMinutes || 20)), room);
    // low energy keeps every block gentle, practices included
    if (energy === "low") chunk = Math.min(chunk, baseChunk);
    const a = adherence(p.node, nowMs);
    blocks.push({
      kind: "focus",
      title: p.node.title,
      description: p.node.description || p.node.aiReason || "",
      goalId: p.goalId,
      nodeId: p.node.id,
      durationMinutes: chunk,
      startTime: null,
      difficulty: difficultyFor(chunk, energy, totalFocus),
      reason: `${p.goalTitle} · ${a.weekDone} of ${a.weekTarget} this week`,
    });
    used += chunk; totalFocus += chunk; sinceLong += chunk; focusCount++;
  }
  // a breather between the practices and the once-steps, if both exist
  if (focusCount > 0 && hasWork() && budget - used >= shortBreak + MIN_FOCUS) {
    blocks.push(breakBlock(shortBreak, false));
    used += shortBreak;
  }

  let guard = 0;
  while (used < budget && hasWork() && guard++ < 80) {
    if (budget - used < MIN_FOCUS) break;
    // rotate to the next candidate that still has work (round-robin keeps a long
    // day varied instead of grinding one node to zero before touching the rest)
    let tries = 0;
    while (queue[ptr % queue.length].remaining < 10 && tries++ < queue.length) ptr++;
    const c = queue[ptr % queue.length];
    if (c.remaining < 10) break;

    const room = budget - used;
    let chunk = Math.min(round5(baseChunk * taper(totalFocus)), c.remaining, room);
    if (chunk < MIN_FOCUS) {
      // a node's small leftover can still be a short closing block; otherwise retire it
      if (c.remaining <= MIN_FOCUS && room >= 10) chunk = Math.min(Math.max(10, round5(c.remaining)), room);
      else { c.remaining = 0; continue; }
    }
    if (chunk < 10) { c.remaining = 0; continue; }

    c.sessions += 1;
    const continued = c.sessions > 1;
    const partialStart = energy === "low" && !continued && c.remaining > chunk;
    blocks.push({
      kind: "focus",
      title: partialStart ? `Make a start: ${c.node.title.toLowerCase()}` : c.node.title,
      description: c.node.description || c.node.aiReason || "",
      goalId: c.goalId,
      nodeId: c.node.id,
      durationMinutes: chunk,
      startTime: null,
      difficulty: difficultyFor(chunk, energy, totalFocus),
      reason: continued ? `${c.goalTitle} · continued` : `${c.goalTitle} · ${c.node.aiReason ?? "keeps the goal moving"}`,
    });
    used += chunk; totalFocus += chunk; sinceLong += chunk; c.remaining -= chunk; focusCount++; ptr++;

    if (used >= budget || !hasWork()) break;
    // a break only earns its place if a real block follows it
    if (sinceLong >= longBreakEvery && budget - used >= longBreakLen + MIN_FOCUS) {
      blocks.push(breakBlock(longBreakLen, true)); used += longBreakLen; sinceLong = 0;
    } else if (budget - used >= shortBreak + MIN_FOCUS) {
      blocks.push(breakBlock(shortBreak, false)); used += shortBreak;
    }
  }

  // A day should never end on a break. Trim any that the loop left dangling.
  while (blocks.length && blocks[blocks.length - 1].kind === "break") {
    used -= blocks[blocks.length - 1].durationMinutes;
    blocks.pop();
  }

  const focusHours = Math.round((totalFocus / 60) * 10) / 10;
  const breakCount = blocks.filter((b) => b.kind === "break").length;
  const atRisk = candidates.find((c) => c.node.status === "at_risk");
  const spare = budget - used;

  const summary =
    focusCount === 0
      ? "No blocks fit today. Add time, or make a step smaller to build a plan."
      : `${focusCount} focus block${focusCount > 1 ? "s" : ""} · ~${focusHours}h of focus${breakCount ? ` · ${breakCount} break${breakCount > 1 ? "s" : ""}` : ""} · ${energy} energy`;

  const base =
    focusCount === 0
      ? "Every workable step needs more room than today's budget. Try a longer window, or make a step smaller."
      : energy === "low"
        ? "Energy is low, so Sola kept the blocks short and gentle. Momentum matters more than volume today."
        : energy === "high"
          ? "Energy is high, so Sola front-loaded the deepest work while you can carry it, then eased off."
          : "Sola balanced the day around what actually moves your goals, with breaks so the focus holds.";
  // Only flag leftover time when real work ran out (not when we simply filled the day).
  const explanation = focusCount > 0 && !hasWork() && spare >= 20
    ? `${base} You've got about ${Math.round(spare / 5) * 5} min to spare. Rest it, or pull a step forward.`
    : base;

  const recoveryNote = atRisk
    ? `"${atRisk.node.title}" is at risk. One of today's blocks targets it to pull the timeline back.`
    : null;

  return { summary, blocks, explanation, recoveryNote };
}

// ---------- inbox sorting ----------

// Order matters: urgency wins first, then explicit deferral signals
// ("maybe/someday") outrank impact keywords, then impact, then quick wins.
const CATEGORY_RULES: { category: InboxCategory; match: RegExp; reason: string }[] = [
  { category: "must_do", match: /\b(urgent|today|deadline|due|asap|now|pay|bill|email|submit|call)\b/i, reason: "Time-sensitive: do it first" },
  { category: "not_worth_doing", match: /\b(maybe|someday|random|scroll|browse|watch)\b/i, reason: "Low value: let it go" },
  { category: "high_impact", match: /\b(launch|build|design|write|plan|create|ship|grow|study|learn)\b/i, reason: "Moves a goal forward" },
  { category: "quick_win", match: /\b(fix|update|reply|book|send|order|check|rename|tidy)\b/i, reason: "Small and fast: clear it" },
  { category: "can_wait", match: /.*/, reason: "Fine to hold for later" },
];

export function mockSortInbox(input: SortInboxInput): SortInboxResult {
  const items: SortedItem[] = input.items.map((it) => {
    const rule = CATEGORY_RULES.find((r) => r.match.test(it.content)) ?? CATEGORY_RULES[CATEGORY_RULES.length - 1];
    // very short items lean toward quick wins
    const category =
      rule.category === "can_wait" && it.content.trim().split(/\s+/).length <= 2
        ? "quick_win"
        : rule.category;
    return { id: it.id, category, reason: rule.reason };
  });
  const mustDo = items.filter((i) => i.category === "must_do").length;
  const reasoning =
    items.length === 0
      ? "Nothing to sort yet."
      : `Sorted ${items.length} item${items.length > 1 ? "s" : ""} by urgency and impact${mustDo ? `, surfacing ${mustDo} that need attention first` : ""}.`;
  return { items, reasoning };
}

// ---------- review ----------

export function mockReview(input: ReviewInput): ReviewResult {
  const allNodes = input.goals.flatMap((g) => g.nodes.map((n) => ({ n, g })));
  const done = allNodes.filter((x) => x.n.status === "done");
  const moving = allNodes.filter((x) => x.n.status === "in_motion");
  const atRisk = allNodes.filter((x) => x.n.status === "at_risk");
  const blocked = allNodes.filter((x) => x.n.status === "blocked");
  const pushed = input.recentPlan?.blocks.filter((b) => b.status === "pushed") ?? [];

  const changes: string[] = [];
  if (done.length) changes.push(`${done.length} step${done.length > 1 ? "s" : ""} completed across your goals`);
  if (moving.length) changes.push(`${moving.length} step${moving.length > 1 ? "s" : ""} now in motion`);
  if (pushed.length) changes.push(`${pushed.length} block${pushed.length > 1 ? "s" : ""} pushed to later`);
  if (changes.length === 0) changes.push("A quiet stretch. Nothing moved yet");

  const risks: string[] = [
    ...atRisk.map((x) => `"${x.n.title}" is slipping in ${x.g.title}`),
    ...blocked.map((x) => `"${x.n.title}" is blocked in ${x.g.title}`),
  ];

  const recoverable = risks.length <= 2;
  const recoverability = recoverable
    ? risks.length === 0
      ? "You're on track. No recovery needed."
      : "The plan is still recoverable. A single focused block pulls it back."
    : "Several things are slipping. Rebuild today's plan around the two that matter most.";

  const next =
    atRisk[0]?.n.title ??
    moving[0]?.n.title ??
    allNodes.find((x) => x.n.status === "not_started")?.n.title ??
    "Review your goal map";

  const summary = pushed.length
    ? `You pushed ${pushed.length} block${pushed.length > 1 ? "s" : ""}. Your estimate moved, but ${recoverable ? "the plan holds" : "it needs a rebuild"}.`
    : done.length
      ? `Good movement: ${done.length} step${done.length > 1 ? "s" : ""} done. Keep the rhythm going.`
      : "Here's where your goals stand and the single best move next.";

  return {
    summary,
    changes,
    risks,
    recoverability,
    nextBestMove: `Add one focused block for "${next}" to keep momentum.`,
  };
}
