# Solaspace AI revamp: implementation spec

**Working title:** Sola runs your life. **Backbone:** step-depth-first (the unit of value is one step, upgraded from a title to a briefing). **Grafted from profile-first:** the post-map interview, field-gated context injection, the granularity dial, the "What Sola knows" screen. **Grafted from life-loop:** persisted intake, the weekly review over Mirror numbers, the slip check, the step-event log.

Five phases. Each is independently shippable, keyless-safe (mocks), additive on the schema, and ends at the CLAUDE.md Definition of Done (typecheck, build, test, works in app, preview URL).

**Standing rules for every phase**

- No em dashes in any user-facing copy. Calm, direct, premium. No hustle language.
- Never invent facts about the user. Every prompt that receives context carries the instruction to use only stated facts.
- Every new AI output shape gets: a type in `lib/ai/types.ts`, a `valid()` guard, an exported sanitizer with clamps, a deterministic mock, and colocated unit tests.
- Migrations are additive and **must be applied to prod manually**; they never run on deploy (this already broke goal creation once). Each phase that ships a migration lists "apply migration" as an explicit release step.
- Latency contract: never more than 2 serial AI calls before the user sees a map (clarify + goal-map, same as today). Everything else is lazy or fire-and-forget.
- Prompt worked examples use money, fitness, language, and home life. Nothing "ship an app" flavored (broad consumer audience, older users included).

**Key files (absolute)**

| Area | Path |
|---|---|
| AI types | `/Users/zander/Documents/KairoApp/lib/ai/types.ts` |
| Map generator | `/Users/zander/Documents/KairoApp/lib/ai/generate-goal-map.ts` (+ `.test.ts`) |
| Clarify + fallback | `/Users/zander/Documents/KairoApp/lib/ai/clarify.ts`, `lib/ai/clarifiers.ts` |
| Mocks | `/Users/zander/Documents/KairoApp/lib/ai/mock.ts` (+ `mock.test.ts`) |
| Guard / provider | `/Users/zander/Documents/KairoApp/lib/ai/guard.ts`, `lib/ai/provider.ts` |
| Research | `/Users/zander/Documents/KairoApp/lib/ai/research.ts` |
| Node assist (expand/ask/unblock) | `/Users/zander/Documents/KairoApp/lib/ai/node-assist.ts` |
| Persistence | `/Users/zander/Documents/KairoApp/lib/data/actions.ts`, `lib/data/mappers.ts`, `lib/data/profile.ts` |
| Routes | `/Users/zander/Documents/KairoApp/app/api/ai/*/route.ts` |
| Map UI | `/Users/zander/Documents/KairoApp/components/kairo/GalaxyMap.tsx` (NodeSheet ~2535, createGoal ~1094, finishCreate ~1055, addSteps ~1111) |
| Onboarding | `/Users/zander/Documents/KairoApp/components/kairo/OnboardingFlow.tsx` (runMap ~54, finishQuestions ~117) |
| Today | `/Users/zander/Documents/KairoApp/components/kairo/TodayPlanner.tsx` (build ~187) |
| Mirror | `/Users/zander/Documents/KairoApp/lib/kairo/review-insights.ts` |
| Cron | `/Users/zander/Documents/KairoApp/app/api/cron/notifications/route.ts` |
| Migrations | `/Users/zander/Documents/KairoApp/supabase/migrations/` (next free: 0018) |
| Settings | `/Users/zander/Documents/KairoApp/app/app/settings/` |
| App types | `/Users/zander/Documents/KairoApp/types/index.ts` |

---

## Phase 1: The depth floor. No step is ever just a title again

Every generated node, from every source (map, break-down, make-smaller, replan), carries an exact first move and an observable done-test. Works keyless. No profile, no new routes.

### Types (`lib/ai/types.ts`)

Add two required fields to `GeneratedNode`:

```ts
export interface GeneratedNode {
  // ...existing fields unchanged...
  /**
   * REQUIRED. The exact physical opening move: startable in under a minute,
   * finished in 5-10 minutes, verb-first, names the real tool/app/place.
   * "Open your banking app and write down last month's total spending."
   */
  firstAction: string;
  /**
   * REQUIRED. The observable test that this step is done: binary or a number,
   * something you could show another person, never a feeling.
   * "An automatic 150/month transfer exists and the first one is scheduled."
   */
  successCriterion: string;
}
```

`ExpandNodeResult` steps and `ReplanProposal` gain the same two fields (optional in those contracts, clamped the same way):

```ts
export interface ExpandNodeResult {
  steps: { title: string; estimatedMinutes: number; aiReason: string; firstAction?: string; successCriterion?: string }[];
}
export interface ReplanProposal {
  // ...existing...
  firstAction?: string;
  successCriterion?: string;
}
```

`types/index.ts` `GoalNode` gains:

```ts
  /** exact sub-10-minute opening move for this step ("" on legacy rows) */
  firstAction?: string;
  /** observable done-test ("" on legacy rows) */
  successCriterion?: string;
```

### Migration `supabase/migrations/0018_step_depth.sql`

```sql
-- A step is a briefing, not a title. first_action and success_criterion are
-- real columns (the map, Today, and the scheduler read them on every node
-- without parsing). briefing and research are filled lazily in later phases;
-- null means "not yet enriched". Absent/default values leave every existing
-- node meaning exactly what it meant.
alter table public.goal_nodes
  add column if not exists first_action text not null default '',
  add column if not exists success_criterion text not null default '',
  add column if not exists briefing jsonb,
  add column if not exists research jsonb;

comment on column public.goal_nodes.first_action is
  'The exact sub-10-minute opening move for this step, verb-first.';
comment on column public.goal_nodes.success_criterion is
  'Observable done-test: binary or numeric, never a feeling.';
comment on column public.goal_nodes.briefing is
  'StepBriefing jsonb (Phase 2), null = not enriched yet.';
comment on column public.goal_nodes.research is
  'Persisted ResearchResult + fetchedAt (Phase 2), null = never researched.';
```

(RLS: `nodes_own` from 0001 already covers new columns. Briefing/research columns land now so Phase 2 needs no second manual migration.)

### Prompt changes (`lib/ai/generate-goal-map.ts`)

1. In the `Return JSON` contract line, extend each node with `"firstAction":string,"successCriterion":string`.
2. Insert this section after STEP TITLES:

```
FIRST MOVE + DONE TEST. Every node MUST also carry:
- "firstAction": the exact physical opening move, startable in under a minute and finished in 5-10 minutes. Verb-first, names the real tool, app, or place. "Open your banking app and write down last month's total spending", never "Get started" or "Begin researching".
- "successCriterion": the observable test that the step is DONE. Binary or a number, something you could show another person, never a feeling. "An automatic 150/month transfer exists and the first one is scheduled", never "Feel more in control of money".
```

3. Replace the aerospace worked example in STEP TITLES with a broad-consumer one:

```
E.g. "Cut your three biggest money leaks" -> name where to look (the subscriptions tab in their banking app, Rocket Money, last month's statement), the number that counts as a leak (anything unused over $10/mo), and the first cancellation to make today.
```

4. Raise the call budget: `{ maxTokens: 6144 }` (two new strings times 14-18 nodes; 4096 was already tight).

`node-assist.ts`: both `EXPAND_SYSTEM` and `TINY_EXPAND_SYSTEM` JSON contracts gain `"firstAction":string,"successCriterion":string` per step plus one line: `Every step carries "firstAction" (the exact sub-10-minute opening move) and "successCriterion" (the observable done-test).` Same one-liner in `replan.ts`.

### Sanitizer (`sanitizeGoalMap`, exported, tested)

- `firstAction`: trim, clamp 160 chars. Empty or missing: fallback `` `Open what "${title}" needs and do the first 10 minutes` ``.
- `successCriterion`: trim, clamp 120 chars. Empty: fallback `` `"${title}" has a visible result you could show someone` ``.
- Shared helper `clampStepDepth(n)` exported so expand/replan cleaners reuse the same clamps and fallbacks.

### Persistence

- `lib/data/actions.ts` `persistGoalFromMap` node rows gain `first_action: n.firstAction ?? ""`, `success_criterion: n.successCriterion ?? ""`.
- `addNode` input gains optional `firstAction`, `successCriterion` (written to the columns); `GalaxyMap.addSteps` (~1111) and `acceptProposal` pass them through instead of creating bare nodes.
- `lib/data/mappers.ts`: row type gains `first_action: string | null; success_criterion: string | null; briefing: unknown; research: unknown;` and the mapping fills `firstAction: r.first_action ?? ""`, `successCriterion: r.success_criterion ?? ""` (briefing/research mapped in Phase 2).

### Mock strategy (`lib/ai/mock.ts`)

`SubStep` and `TemplateNode` gain `first` and `done` strings; every template node gets real ones (no generic filler; this kills the current one-clause descriptions). Examples for the money template:

- "Map current spending": first `Open your banking app and write down last month's total spending`, done `One number on paper: what last month actually cost`.
- "Automate saving": first `Open your bank's transfers tab and start a new recurring transfer`, done `An automatic monthly transfer exists and the first date is set`.

`mockGoalMap` emits `firstAction`/`successCriterion` from these; unnamed sub-steps derive via the sanitizer fallbacks so no mock node ships empty.

### Tests

- `generate-goal-map.test.ts`: raw output missing the fields gets deterministic fallbacks; clamps hold at 160/120; every mock map node has non-empty `firstAction` and `successCriterion`.
- `mock.test.ts`: for each template class, assert no `firstAction` equals another node's (no copy-paste filler) and none matches the generic fallback.

### What the user sees

- NodeSheet (GalaxyMap ~2557): above the description, two compact rows: **First move** (accent card, with the existing Focus chip meaning "start it") and **Done when**. Legacy rows with `""` render nothing.
- Today: each focus block shows the node's `firstAction` as its subtitle (via `nodeFor` lookup in `TodayPlanner`), so the day reads as actions, not labels.

---

## Phase 2: The briefing. Open a step, get a plan for it

A cached, per-step briefing: the likely mistake, the 5-minute fallback, what you'll need, a when/where cue. Clarifier answers stop leaking away. Research results stop dying on sheet close.

### Types (`lib/ai/types.ts`)

```ts
// ---------- Step briefing ----------
export interface StepMistake { mistake: string; fix: string } // each <= 120 chars

export interface StepBriefing {
  firstAction: string;            // may refine the skeleton value; <= 160
  successCriterion: string;       // <= 120
  /** Suggested trigger tied to an existing routine ("after dinner, at the kitchen table"). Null if none fits. */
  whenWhereCue: string | null;    // <= 100
  commonMistakes: StepMistake[];  // 1-3
  /** The 5-minute fallback version for a bad day. Powers Make it smaller and the miss path. */
  ifStuck: string;                // <= 160
  whatYoullNeed: string[];        // 0-4, each <= 60
  /** One sentence naming which stored facts shaped this ("Sized for your evenings and a tight budget"). Null when none. */
  personalNote: string | null;    // <= 140
  sources: { title: string; url: string }[]; // filled only by research merge
  level: "enriched" | "researched" | "mock";
  briefedAt: string;              // ISO
}

export interface EnrichStepInput {
  goalId: string;
  nodeId: string;
  // Demo-mode fallbacks (server ignores these and loads canonical rows):
  goalTitle?: string;
  nodeTitle?: string;
  nodeDescription?: string;
}

export interface GoalMapInput {
  prompt: string;
  /** Structured clarifier answers; persisted to goals.intake. */
  answers?: { question: string; answer: string }[];
  freeText?: string;
}
```

`Goal` in `types/index.ts` gains `intake?: Record<string, string> | null;`. `GoalNode` gains `briefing?: StepBriefing | null; research?: { answer: string; sources: { title: string; url: string }[]; fetchedAt: string } | null;`.

### Migration `supabase/migrations/0019_goal_intake.sql`

```sql
-- Clarifier answers used to be folded into one prompt string and thrown away.
-- Persist them per goal so every later per-step call can use them.
alter table public.goals
  add column if not exists intake jsonb not null default '{}'::jsonb;
comment on column public.goals.intake is
  'Clarifier question -> answer pairs captured at goal creation, plus freeText.';
```

### New file `lib/ai/enrich-step.ts`

`SYSTEM` prompt, verbatim:

```
You are Sola, an execution coach writing a briefing for ONE step of the user's goal. They are about to do this step and want zero guesswork. Write for a smart, busy adult, not an expert.

Return JSON: {"firstAction":string,"successCriterion":string,"whenWhereCue":string|null,"commonMistakes":[{"mistake":string,"fix":string}],"ifStuck":string,"whatYoullNeed":string[],"personalNote":string|null}

- "firstAction": the exact physical opening move, startable in under a minute, done in 5-10 minutes. Verb-first. Name the real tool, app, or place.
- "successCriterion": the observable test that this step is done. Binary or a number, never a feeling.
- "whenWhereCue": one suggested trigger tied to an existing routine ("after dinner, at the kitchen table"). Prefer event cues over clock times. Use the user's stated free hours when given; otherwise null. Never invent their schedule.
- "commonMistakes": 1-3 real failure modes for THIS step, each with the concrete fix. Like "Most people pick a gym 20 minutes away and quit; pick one under 10 minutes from home."
- "ifStuck": a 5-minute fallback version of this step for a low-energy day.
- "whatYoullNeed": 0-4 real prerequisites ("a library card", "about $30"). Empty array when none.
- "personalNote": one short sentence naming which of the user's own stated facts shaped this briefing, or null if none did. Never invent facts about the user.
Ground everything in named tools, places, numbers, and techniques specific to this goal. No motivation-speak, no filler.
```

User message: `Goal: <title>\nStep: <node title>\nStep notes: <node description>\nGoal answers: <intake pairs>\nNotebook: <goal.notes slice 600>` (context lines omitted when empty; Phase 3 prepends the ABOUT THE USER block).

Exports: `enrichStep(input)` (client goes `viaRouteResult("/api/ai/enrich-step", ...)` with `raiseIfBlocked`; keyless/demo path returns `mockEnrichStep`), `sanitizeBriefing(raw, providedFacts: string[])` (all clamps above; `commonMistakes` max 3 with empty pairs dropped; `sources` forced `[]` at level `enriched`/`mock`; `level` whitelisted; `personalNote` nulled unless at least one provided fact value of length > 2 appears in it case-insensitively, so notes can never cite facts that were not given).

### New route `app/api/ai/enrich-step/route.ts`

Pattern of the existing routes: `guardAi({ weight: 1 })`, then load the node + goal **with the scoped client** (RLS proves ownership), build the prompt server-side from canonical rows, `generateJson` (maxTokens 1600), sanitize, then **write the cache server-side**: `goal_nodes.briefing = <StepBriefing>`, and update `first_action`/`success_criterion` columns from the briefing so the skeleton fields stay canonical. Returns the briefing. A second call for an already-briefed node returns the stored briefing without spending AI (idempotent; the client also checks `node.briefing` before calling).

### Call sites

- **Lazy:** NodeSheet open with `node.briefing == null` renders the skeleton fields immediately, shows shimmer on the briefing sections, fires one `enrichStep`. Cached forever after.
- **Eager:** after `commitMap` (GalaxyMap ~1078) and after onboarding persist (OnboardingFlow ~74), fire-and-forget `enrichStep` for `nodes[0]` and the first recurring node, so the first sheet the user opens is already full. Worst-case goal creation: 1 + 3 + 2 = 6 credits, well inside free day 80.
- **Intake persists:** `finishQuestions` (OnboardingFlow ~117) and `finishCreate` (GalaxyMap ~1055) now call `runMap(prompt, answers, extra)` / `createGoal(prompt, answers, extra)`; `generateGoalMap` renders answers as labeled lines in the user message (`Answers:\n- Target date: 3 months\n- Monthly income: $2-4k`); `persistGoalFromMap` accepts `intake` and writes `goals.intake`.
- **Research persists:** `/api/ai/research` accepts optional `goalId`/`nodeId`; when present (scoped-client ownership check) it writes `goal_nodes.research = { answer, sources, fetchedAt }` and merges `sources` + `level: "researched"` into the stored briefing. NodeSheet seeds its research state from `node.research` instead of losing it on close.

### Miss path (no AI cost)

In TodayPlanner, pushing a block whose node has `briefing.ifStuck` offers two chips under calm copy: `Recoverable. One push changes nothing.` with **Do the 5-minute version** (swaps the block title to `ifStuck`, duration 5-10 min) and **Move it to Monday** (reschedules to the next week start). Practices already show rolling adherence; never zero anything.

### Mock strategy

`mockEnrichStep(nodeTitle, goalTitle)` in `mock.ts`: deterministic template engine keyed on the same keyword classes as `clarifiersFor` (money / fitness / learning / build / default). Every field filled and specific, e.g. fitness: firstAction `Put your gym shoes by the door and book one class for this week`, mistake `Going hard the first week and quitting the second; cap week one at three short sessions`, ifStuck `Do 10 minutes of the session at home instead`. `level: "mock"`, `personalNote: null`, `sources: []`.

### Tests

New `lib/ai/enrich-step.test.ts`: sanitizer clamps; mistake list capped at 3; `personalNote` nulled when it names an unprovided fact and kept when it quotes a provided one; `sources` stripped at level `enriched`; mock briefings non-empty for every keyword class and distinct across classes.

### What the user sees

Opening any step now reads, in order: **First move** (with Focus/Start), **Done when**, description, **Watch out for**, **You'll need**, **If it stalls**, then the existing resource block, with `personalNote` as a quiet line under the title once Phase 3 lands. Research survives closing the sheet. Pushed steps offer a smaller version instead of guilt.

---

## Phase 3: Sola learns your life. Interview, never a form

Three questions after the first map renders, two more asked only at the moment they are needed, everything stored, visible, editable, deletable. Every AI call is injected server-side with a field-gated context block.

### Types (`lib/ai/types.ts`)

```ts
// ---------- User context (what Sola knows; all optional, user-editable) ----------
export type AgeBand = "under_18" | "18_24" | "25_34" | "35_44" | "45_54" | "55_64" | "65_plus";
export type ScheduleShape = "mornings" | "evenings" | "weekends" | "varies";
export type StepGranularity = "big_moves" | "standard" | "very_small";
export type BudgetComfort = "tight" | "some_room" | "flexible" | "private";

export interface UserContext {
  ageBand?: AgeBand;
  scheduleShape?: ScheduleShape;
  granularity?: StepGranularity;      // default behavior = "standard"
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
  | "session" | "draft" | "ask-node" | "unblock" | "ask-sola" | "weekly-review" | "slip-check";
```

### Migration `supabase/migrations/0020_user_context.sql`

```sql
-- What Sola knows about the user: optional, user-editable, RLS-scoped facts
-- that personalize plans. 0012 revoked UPDATE on users_profile entirely and
-- documented the escape hatch for user-editable fields: a per-column grant.
-- The profile_self policy (own row) still applies, so this restores writes to
-- exactly one column on the user's own row and nothing else (plan/stripe
-- columns stay locked).
alter table public.users_profile
  add column if not exists context jsonb not null default '{}'::jsonb;
comment on column public.users_profile.context is
  'UserContext jsonb: age band, schedule shape, step size, region, budget comfort. Optional, user-editable, never precise location.';
grant update (context) on public.users_profile to authenticated;
```

### New file `lib/ai/context.ts`

```ts
const FIELD_GATE: Record<AiFeature, (keyof UserContext)[]> = {
  "goal-map":     ["ageBand", "scheduleShape", "granularity", "budgetComfort", "busyWith"],
  "clarify":      ["ageBand", "scheduleShape", "granularity", "busyWith"],
  "enrich":       ["ageBand", "scheduleShape", "granularity", "region", "budgetComfort", "busyWith"],
  "research":     ["ageBand", "region", "budgetComfort"],
  "expand":       ["scheduleShape", "granularity"],
  "replan":       ["scheduleShape", "granularity"],
  "session":      ["scheduleShape", "granularity"],
  "draft":        ["busyWith"],
  "ask-node":     ["scheduleShape", "budgetComfort", "busyWith"],
  "unblock":      ["scheduleShape", "granularity", "busyWith"],
  "ask-sola":     ["ageBand", "scheduleShape", "granularity", "budgetComfort", "busyWith"],
  "weekly-review":["scheduleShape", "granularity", "busyWith"],
  "slip-check":   ["scheduleShape", "granularity"],
};

export function buildContextBlock(ctx: UserContext | null, intake: Record<string, string> | null, feature: AiFeature): string
```

Output (empty string when nothing is known), placed at the **front of the user message** so Gemini implicit prefix caching hits:

```
ABOUT THE USER (facts they gave Solaspace; use them silently and naturally):
- Free time: evenings. Age: 45-54. Prefers very small steps. Budget: tight.
- Life: full-time job, two kids under 5.
- Goal answers: Target date: 3 months; Monthly income: $2-4k.
Use only the facts above. If a fact is absent, write the step without it. Never invent, guess, or restate facts as questions.
```

Region flows only through `enrich` and `research`. `granularity: very_small` additionally appends one behavior line for map/expand features: `Size steps small: no once-step over 30 minutes.`

Injection is **server-side in each `/api/ai/*` route**: a shared helper `loadUserContext()` in `lib/data/profile.ts` (cached, scoped client, `select context`) plus per-route `buildContextBlock(...)` prepended to the user message. Clients cannot omit or forge it. Demo mode (no Clerk/DB) mirrors the context in `localStorage` (`kairo.context.v1`) and builds the block client-side before the mock runs. `clarify.ts` gains the block plus one prompt line: `Never ask about anything already listed under ABOUT THE USER; ask the next most valuable unknown instead.` Money clarifier options in `clarifiers.ts` gain `"Prefer not to say"`.

Writes go through a new server action `setUserContext(patch: Partial<UserContext>)` in `lib/data/profile.ts` (scoped client update of the one granted column; merges, stamps `updatedAt`).

### The interview (new `components/kairo/LifeQuestions.tsx`)

Shown once, as a Sola card over the map, immediately after the first map renders (OnboardingFlow step "result", and in GalaxyMap for existing accounts when `context` is empty and the card was never dismissed). One question per screen, existing `OptionChip` pattern, progress dots, every screen has **Skip** (recorded in `skipped`, never re-asked).

Intro line: **"Your map is live. Three quick questions and Sola fits it to your actual life. Skip anything."**

Verbatim questions and why-copy:

1. **"When is your time usually yours?"**
   Chips: `Mornings` `Evenings` `Weekends` `It varies`
   Why line: *"Sola gives each step a real slot in your day instead of sometime."*
2. **"Roughly how old are you?"**
   Chips: `Under 18` `18-24` `25-34` `35-44` `45-54` `55-64` `65+`
   Why line: *"Pacing and examples change with life stage. This stays private, and you can delete it anytime."*
   `Under 18` routes to a calm stop screen: **"Solaspace is built for adults 18 and up. Thanks for trying it."** with the existing account deletion offered. No verification infrastructure.
3. **"What size steps suit you?"**
   Chips: `Big moves` `Standard` `Very small`
   Why line: *"Very small steps still finish goals. Sola sizes the whole plan to match."*

**The live echo (the Noom trick, zero AI):** on answering question 1, the visible first step's cue line updates in place from a deterministic helper `cueFor(scheduleShape)` in `lib/kairo/day-budget.ts` (`evenings` -> "This evening, after dinner"), held until a real briefing overwrites it. On answering question 3, the map subtitle updates ("Building this in very small steps").

### Just-in-time asks (each once, each skippable, stored on answer)

- **Region**, inline sheet before the first research call when `region` is unset:
  **"Which city or area are you in?"** (free text, placeholder `City or region`, buttons `Use it` / `Skip`)
  Why line: *"Deep research can find real options near you: classes, banks, gyms, prices. A place name is all Sola stores, never your precise location."*
- **Budget comfort**, the first time a step briefing has a nonzero `whatYoullNeed` cost and `budgetComfort` is unset:
  **"How is money right now?"** Chips: `Tight` `Some room` `Flexible` `Prefer not to say`
  Why line: *"Steps that cost money should fit your budget. When money is tight, Sola plans the free version first."*
- **busyWith** is harvested, never asked: when goal free-text or notebook text describes life shape, Sola proposes one tap: *"Remember 'full-time job, two kids' so every plan accounts for it?"* (`Save` / `No`).

Skipped questions never return; the Review page instead gets a quiet **"Sharpen my plan"** card offering at most one unanswered question with its why line.

### Settings: "What Sola knows" (new `components/kairo/WhatSolaKnows.tsx` in `app/app/settings`)

Every stored fact as an editable row with delete, plus goal intake under each goal. Header copy: **"Everything here shapes your plans. Edit or delete anything and Sola forgets it everywhere."** This is the trust feature and the anti-ChatGPT pitch: your plan lives in a database, it never forgets, you never re-prompt.

### Mock and tests

Mocks read the same context block: `mockEnrichStep` fills `whenWhereCue` from `scheduleShape` and `personalNote` from provided facts; `mockGoalMap` honors `granularity` (very_small caps once-step estimates at 30). New `lib/ai/context.test.ts`: field gating (region never appears in a goal-map or draft block), empty context yields `""`, intake renders, the standing instruction is always appended. Extend `enrich-step.test.ts`: keyless run with empty context produces `whenWhereCue: null` (no invented schedules).

### What the user sees

Answer three taps and the map visibly reacts. Steps start saying things like *"Sized for your evenings and a tight budget."* Settings shows the receipts.

---

## Phase 4: Deep research becomes the Pro spine

Nobody in the category ships per-step grounded, cited research. Solaspace already has it; this phase localizes it, persists it (done in Phase 2), auto-runs it for Pro, and markets it loudly.

### Changes

- **`lib/ai/research.ts`:** input gains `region?: string` (server-injected via the `research` gate, never client-supplied). When present, append to the prompt:
  `The user is in <region>. When options, classes, services, banks, or prices differ by place, use real ones available there and say so.`
  Sources cap stays 8; result persists per Phase 2.
- **Pro auto-research:** after `commitMap` for a Pro user, fire-and-forget one `research` call for `nodes[0]` (weight 4, inside Pro's 600/day). The first step of every Pro goal arrives researched with sources before it is opened. Free keeps the existing 1/day taste (`feature: "research", featureFreeDaily: 1`).
- **Refresh:** the existing Redo button overwrites `goal_nodes.research`; add a small "Researched <relative time>" stamp from `fetchedAt`.
- **Billing copy** (`components/kairo/BillingPlans.tsx`, `UpgradeModal.tsx`), calm voice, the Pro line:
  **"Every next step arrives researched, with sources, written for your city, your schedule, and your budget."**
  Feature bullets: `Unlimited goals` / `Deep research on every step, with sources` / `Research that knows your area` / `Plans built from your answers`. (Native shell: unchanged suppression rules; no paid-tier naming.)
- **Landing truth-up:** `ShowcaseTree` currently fakes richer nodes than the product ships; after this phase, regenerate its hardcoded examples from real briefing + research output so marketing equals product, and mention deep research on the landing feature row (owner asked for it to be talked about more).

### Tests / what the user sees

Route test: region reaches the research prompt only when stored, never from the request body. The user sees the phase's flagship moment: a step reading *"Three beginner classes near Leiden run under 25 euro; two have evening slots, which fits your free evenings"* with cited sources, still there tomorrow.

---

## Phase 5: The week runs itself

Generation is table stakes; the loop is why people stay. Deterministic triggers, AI only at the moment of contact.

### Migration `supabase/migrations/0021_life_loop.sql`

```sql
-- The loop's memory: a weekly Mirror snapshot + narrative, and a record of what
-- actually happened to steps (check-ins, pushes, misses) so slip detection is
-- data, not inference.
create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  week_start date not null,
  insights jsonb not null,
  ai jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);
alter table public.weekly_reviews enable row level security;
create policy weekly_reviews_own on public.weekly_reviews
  for all using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());

create table if not exists public.step_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete cascade,
  node_id uuid references public.goal_nodes(id) on delete cascade,
  kind text not null check (kind in ('done','push','shrink','checkin','miss')),
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists step_events_user_idx on public.step_events(user_id, created_at desc);
alter table public.step_events enable row level security;
create policy step_events_own on public.step_events
  for all using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());
```

### New file `lib/ai/weekly-review.ts` (route `/api/ai/weekly-review`, `guardAi({ weight: 3, pro: true })`)

```ts
export interface WeeklyReviewInput {
  insights: ReviewInsights;                                  // exact deterministic Mirror output
  goals: { id: string; title: string; targetDate: string | null }[];
  focusActuals: { estimated: number; actual: number }[];     // from focus_sessions
}
export interface WeeklyReviewResult {
  headline: string;                                          // <= 120, must quote an input number
  verdicts: { goalId: string; state: "believable" | "needs_cut" | "protect"; note: string }[];
  changes: SolaChange[];                                     // <= 6, existing diff format, apply on approval only
  protectOne: string;
  freshStart: string | null;
  isMock?: boolean;
}
```

`SYSTEM`, verbatim:

```
You are Sola, reviewing the user's week over REAL numbers computed by the app. Every claim you make MUST cite a number present in the input. Never guess, never motivate, never guilt: misses are recoverable and you say so plainly.
Return JSON: {"headline":string,"verdicts":[{"goalId":string,"state":"believable"|"needs_cut"|"protect","note":string}],"changes":[<change objects>],"protectOne":string,"freshStart":string|null}
- "headline": one line, under 120 characters, quoting the week's most important number.
- "verdicts": one per goal. "needs_cut" means the path is not believable at the current pace; propose the cut in "changes" (shrink a step, move a deadline, lower a practice target). "protect" marks what is going well and must not be traded away this week.
- "changes": at most 6, using the given change format with ids only from the input. Small and additive; never delete finished work.
- "protectOne": the single practice or step to protect next week, and the day it fits.
- "freshStart": when the week went badly, one calm sentence offering Monday as a clean restart. Null when the week went fine.
```

Sanitizer validates every `SolaChange` id against the input plan (reuse the ask-sola validator). Result stored in `weekly_reviews`. Free tier gets `mockWeeklyReview(input)`: pure templates over the Mirror numbers (already genuinely useful because `computeReviewInsights` is real arithmetic), no route call. Review page renders the narrative + one-tap `changes` diff above the existing Mirror for Pro, mock summary for Free.

### Slip check (inside `app/api/cron/notifications/route.ts`)

Deterministic trigger, max one per user per week, deduped via the existing `notifications_log` pattern (`kind: 'slip'`, `ref: goalId + weekStamp`), gated by `notify_nudges`: fires when a goal first crosses `behind` pace, or practice adherence drops below 40% with 2+ weeks of history, or a step stalls 10+ days with a deadline inside 30 days. One `generateJson` call (service-side; charge `ai:global` directly via `rate_limit_hit_cost`), prompt verbatim:

```
You are Sola. One goal just fell behind and you are checking in, briefly. Two sentences maximum, then one shrunk step. State the specific numbers given, offer the 10-minute version, no exclamation marks, no guilt.
Return JSON: {"message":string,"shrinkTo":string}
```

Delivered by the existing `sendEmail` plus an in-app card on Today. Free: 1/month. Pro: weekly.

### Step events

`TodayPlanner.finishStep` / push / shrink and practice check-ins each insert one `step_events` row (new server action `logStepEvent`, fire-and-forget alongside the existing localStorage update). Later phases read it; Phase 5 already uses pushes to sharpen slip detection, and a derived observation lands in "What Sola knows": *"Observed: your 20 minute steps take about 35"* (median actual/estimated from `focus_sessions`, shown with a "forget this" control, used to pad displayed estimates as ranges).

### Tests

`weekly-review.test.ts`: change ids validated against plan; mock quotes input numbers; headline clamp. Cron test: dedupe key prevents a second slip email in the same week.

### What the user sees

Sunday: *"Spanish happened 3 of 5 times, all three after dinner. Rome fund: 60% of the time gone, 58% saved, on pace. Protect the evening practice this week."* One tap applies the proposed cuts. Wednesday, only when a number actually slipped: a two-sentence email with tonight's 10-minute version.

---

## Free vs Pro

Positioning: **Free shows you the way. Pro walks it with you.** The paywall sits exactly where marginal cost lives (grounded research, localization, the AI loop). The upgrade moment stays post-value: after the first personalized map renders, never before.

| | Free | Pro ($10-12/mo) |
|---|---|---|
| Active goals | 2 | Unlimited |
| Skeleton depth (first move + done test on every step) | Yes | Yes |
| Step briefings (lazy, cached) | Yes, inside existing credit caps (80/day) | Yes, higher caps (600/day) |
| Interview + What Sola knows + personalization | Full (the hook is never paywalled) | Full |
| Deep research with sources | 1/day | Every step, auto-researched first step per goal, localized to your area, refreshable |
| Weekly review | Mirror numbers + template summary | Full Sola review with one-tap changes |
| Slip check-in | 1/month | Weekly |
| Daily builder, miss path, granularity | Full (local, free to serve) | Full |

---

## Cost per user per month (Gemini, current pricing posture)

Assumptions: `gemini-3.1-flash-lite` at roughly $0.0005 per small call (repo's measured anchor), ~$0.003 per 6k-token goal map, grounded research ~$0.02-0.035 per call (model tokens + $14 per 1,000 search queries, 1-2 queries per call). Context blocks ride the cached prefix (~10% input price, negligible).

| Scenario | Monthly usage | Est. cost |
|---|---|---|
| Free, typical | 1 map (clarify+map+2 enrich), ~15 enrich/ask calls, 2 research | ~$0.06 |
| Free, maxed | 3 maps, 40 small calls, 20 research (1/day cap, ~$0.025 ea) | ~$0.55 |
| Pro, typical | 3 maps + auto-research, ~80 small calls, 15 research, 4 weekly reviews, 2 slip checks | ~$0.50 |
| Pro, heavy | 8 maps, 200 small calls, 50 research, 4 reviews, 4 slips | ~$1.60 |

Worst-case Pro stays under ~15% of a $10 subscription; typical Pro is ~5%. The free tier's ceiling is set by the existing `guardAi` weights (goal-map 3, research 4, enrich 1, weekly-review 3) and the `AI_GLOBAL_DAILY_CAP` backstop, both unchanged. New env vars: none required (optional `AI_REVIEW_MODEL` later).

**Release checklist per phase:** run `npm run typecheck && npm run build && npm run test`, verify in preview, **apply the phase's migration to prod manually** (0018, 0019, 0020, 0021; they never run on deploy), then confirm the Vercel preview URL before calling the phase done.