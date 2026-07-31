# Today, rebuilt: the Day Rail

The buildable spec. Backbone is the timeline design (real projected clock times, a now line, a wrap line), grafted with the agenda's single-hero hierarchy and the ritual's Commit / Live / Settle arc. Every judge flaw named below is closed by an explicit decision, not by hand-waving.

---

## 0. Corrections to the brief before anyone writes code

I read the files. Two things in the audit are stale and one is worse than stated.

1. **The four "translucent yellowish" fills named in the brief are already gone.** `TodayPlanner.tsx:125` is `raised-btn text-accent`, `TimeSlider.tsx:79` is `raised-btn text-accent` with an inline accent rim, line 412 is `.panel`, line 451 is `.panel` with a warn rim, line 547 is `raised-btn text-accent`, line 557 is `raised-btn`, line 384 is `.panel`. There is no `bg-accent/*`, no `color-mix` accent fill, and no `bg-warn/*` left in `TodayPlanner.tsx` or `TimeSlider.tsx`.

2. **What actually still reads as "vibe coded" is the opposite problem: the unselected chips are flat.** `TodayPlanner.tsx:125` and `TimeSlider.tsx:79` render unselected pills as `border border-line text-muted`, a bare 1px outline, sitting in the same row as one lifted `raised-btn`. Six flat outlines and one lifted chip is exactly the inconsistency the owner is pointing at. The fix is the reverse of what the audit proposed: make every pill `raised-btn`, always, and carry selection with a gold rim plus a gold label.

3. **The real remaining wash is in `FocusOverlay.tsx`**: `bg-white/[0.03]` at lines 256, 259, 326 and `bg-white/5` at 244, 245, 246, 276, 277, 278.

So Phase 1 is smaller and different from what all three designs assumed. It is still worth doing first, and it still ships alone.

---

## 1. The one thesis

Today becomes **one object in three moments**: an empty day you fill (Commit), a day you are inside of (Live), a day you close (Settle). The same rail renders all three. The screen answers "what now" in under a second, and it answers "how much of my day is left" without arithmetic.

The structural unlock is one line of arithmetic that is already typed and hardcoded `null`: `PlannedBlock.startTime` (set to `null` at `lib/ai/mock.ts:468`, `:552`, `:593`). Fill it from a start anchor by cumulative sum, and the screen acquires a clock, a now line, a wrap line, and drift. No AI, no network, no calendar, still instant, still deterministic.

---

## 2. Five decisions that fix the flaws in the ranked designs

**D1. Time is real. Height is not.**
The timeline design's proportional heights break at 375px: a 15 minute block at 2.2px per minute is 33px, under the 44px tap floor, so short blocks get inflated and the proportion is already a lie. A 12 hour day would be four screens of mostly nothing. Decision: rows are **tiered by duration** (three fixed heights, monotonic), and **proportion lives in one place**, the day strip in the header, which is the existing "shape of today" bar promoted from 16px to 24px. Clock labels in the gutter carry the truth; card height carries a hint.

**D2. The now line never draws inside a card.**
It sits only in the gaps between rows, positioned by comparing now to each block's start and end. The hero card can stretch to any height without the ruler lying. This kills the timeline design's own caveat.

**D3. Times are projections, never commitments.**
Copy is "about 10:25", the header says "runs to about 12:10", and a single `Reflow from now` control re-stamps the remaining planned blocks. No calendar, no fixed commitments in v1, but `anchorMinutes` and per-block `startTime` leave the door open.

**D4. Rhythms are never pinned to the clock by default.**
The flexible-routine evidence says a rigid slot is what kills a practice. Rhythms live in a chip rail with one-tap keep. They only take a station in the rail when the planner books them under the cap, or when the user gives one a slot on purpose.

**D5. Nothing on this screen is a wall of dead cards.**
Done collapses to one line, pushed collapses to one line and moves to a tray, unfittable work is a compact list under the wrap line rather than ghost cards, and the closed day is always reopenable.

---

## 3. Screen states

```
   no goals ─────────────────────► EMPTY

   no plan for the local day ────► COMMIT ◄──── "Adjust" (non destructive)
                                     │ commit
                                     ▼
                                   SETTLING (950ms, skipped under reduced motion)
                                     │
                                     ▼
                                   LIVE  (before start / mid day / all clear)
                                     │  "Close the day", or auto offer after 20:00 local
                                     ▼
                                   SETTLE (one card per open item, then one optional line)
                                     │
                                     ▼
                                   RECEIPT (until tomorrow's COMMIT; "Reopen today" always available)
```

`SETTLING` is the existing 950ms `GoalCore` narration at `TodayPlanner.tsx:331-344`, retargeted from "Build my day" to "Commit". Copy changes from generic to true: `FITTING 3 STEPS INTO 2H 30M`.

---

## 4. Geometry

```
content width      335px at 375px viewport (PageContainer is max-w-2xl px-5)
gutter             46px, mono 11px tabular-nums, right aligned, text-faint
spine              1px bg-line at left-[15px]   (reuse TodayPlanner.tsx:494)
bead               24px at left-[3px]           (reuse the recipe at :523-540)
row left padding   pl-11                        (reuse)

row heights
  break                 28   hairline row, no chip, no icon
  open / slack          48   dashed row
  done or pushed        44   one line
  ahead, <= 20m         56
  ahead, 21 to 50m      68
  ahead, > 50m          80
  NOW card              auto, ~280 to 320
tap targets            every control min-h-11 / min-w-11
```

Start time renders above each row, aligned to its top edge. End time renders only on the NOW card and on the last row before the wrap line. `formatClock` in `lib/utils.ts:18` already accepts `"HH:MM"` and returns `"3:30 PM"`, so rendering is free once the engine stamps the field.

---

## 5. Wireframes at 375px

`▓` raised gold, `░` inset well, `[ ]` raised-btn, `═` panel-2 with focus-accent.

### A. Empty, no goals

Unchanged from `TodayPlanner.tsx:348-359`, copy retuned.

```
┌───────────────────────────────────────────────┐
│                    ( ◉ )                      │
│            Nothing to plan yet                │
│    Map a goal first. Then Sola builds the     │
│    day around it.                             │
│        ┌─────────────────────────────┐        │
│        │       Create a goal         │  gold  │
│        └─────────────────────────────┘        │
└───────────────────────────────────────────────┘
```

The `!hasWork` notice (every step done or blocked) stays, moves into an `inset-well`, and the commit button stays disabled.

### B. COMMIT

The centered `max-w-md text-center` column at `:376` dies. Left aligned, and the prose promise paragraph is replaced by a live rail that redraws on every slider move. `mockDailyPlan` is pure and instant, so this is a `useMemo`, not a build.

```
◈ FRIDAY, JULY 31

Plan today
Six hours of live work is waiting. Tell Sola
what today actually has.

┌ FROM YESTERDAY ───────────────────────────────┐   only when carry exists
│ ↺ Draft the FAQ copy      25m      [ Keep ]   │
└───────────────────────────────────────────────┘

┌ THIS MONTH ───────────────────────────────────┐   only when at risk or closing
│ ▤ Send the investor update        0 of 1      │
│   July closes in 1 day.       [ Put it in ]   │
└───────────────────────────────────────────────┘

KEEPING                                          ← rhythm rail, one line, scroll-x
[ ◍ Spanish  20m ] [ ◍ Gym  2 of 4 ] [ ● Read ✓ ]

TIME TODAY                              2h 30m
░▓▓▓▓▓▓▓▓▓▓●░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
[30m] [2h] [4h] [6h] [8h] [12h]                  ← every pill raised, one gold rimmed

ENERGY                                   Normal
░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓●░░░░░░░░░░░░░░░░░░░░░░░░
[  Low  ] [ Normal ] [  High  ]
A balanced day.                                  ← ENERGY_OPTIONS[].hint, finally rendered

START AT                                  9:40a
[ Now ] [ 10:00 ] [ 11:00 ] [ Set… ]

───────────────────────────────────────────────
THE SHAPE OF TODAY
░▓▓▓▓▓▒▓▓▓▓▓▓▓▓▓▒▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░
3 steps · 2 rhythms · 25m kept open

Your live steps need 6h 20m. This window holds
2h 30m. Three of them fit.

 9:40 ┌─────────────────────────────────────────┐
      │ 1  Write the three headline numbers 45m │  ghost, opacity 45
10:25 └─────────────────────────────────────────┘
      · · · break 10m · · · · · · · · · · · · ·
10:35 ┌─────────────────────────────────────────┐
      │ 2  Spanish, 20 minutes              20m │
10:55 └─────────────────────────────────────────┘
      · · · break 10m · · · · · · · · · · · · ·
11:05 ┌─────────────────────────────────────────┐
      │ 3  Email the three beta users       20m │
11:25 └─────────────────────────────────────────┘
      ┆    Open. Kept clear on purpose.     25m ┆
12:10 ══════ WRAP 12:10p ═══════════════════════

        ┌─────────────────────────────┐
        │   Commit to these three     │  gold
        └─────────────────────────────┘

Nothing here is locked. You can adjust the day
any time.
```

`Start at` is one 44px chip row with a native `<input type="time">` behind `Set…`, defaulting to now rounded up to the next 5 minutes. It is not a second slider. The wrap time is derived, never typed.

### C. LIVE, before the first block

```
◈ FRIDAY, JULY 31                     [ Adjust ]
Today
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ← day strip, h-6, proportional
9:40a to 12:10p · 0 of 3 done · 2h 10m of focus

KEEPING                             1 of 3 kept
[ ◍ Spanish  20m ] [ ◍ Gym  2 of 4 ] [ ● Read ✓ ]

──── NOW 9:40 ─────────────────────────────────

 9:40 ╔═══════════════════════════════════════╗
      ║ NOW                      45m · DEEP   ║
      ║                                       ║
      ║ Open last quarter's sheet and write   ║   ← firstAction, 21px, the headline
      ║ the three headline numbers.           ║
      ║                                       ║
      ║ Q3 PRICING MODEL · SHIP THE PRICING   ║   ← node · goal, mono 11 faint
      ║                                       ║
      ║ ░ WHERE  after coffee, at the desk  ░ ║   ← briefing.whenWhereCue
      ║ ░ DONE   three numbers on the page  ░ ║   ← successCriterion
      ║                                       ║
      ║ ┌─────────────┐ ┌──────┐ ┌───┐ ┌───┐  ║
      ║ │  ▶ Start    │ │ Done │ │ ✂ │ │ ↷ │  ║
      ║ └─────────────┘ └──────┘ └───┘ └───┘  ║
10:25 ╚═══════════════════════════════════════╝
      · · · break 10m · · · · · · · · · · · ·
10:35 ┌─────────────────────────────────────────┐
      │ 2  Spanish, 20 minutes    ◍        20m  │
10:55 └─────────────────────────────────────────┘
      · · · break 10m · · · · · · · · · · · ·
11:05 ┌─────────────────────────────────────────┐
      │ 3  Email the three beta users      20m  │
11:25 └─────────────────────────────────────────┘
      ┆    Open. Kept clear on purpose.    25m  ┆
12:10 ══════ WRAP 12:10p ═══════════════════════

        [ Close the day ]      [ ⌖ Map ]
```

### D. LIVE, mid day, one done, one pushed, running late

```
◈ FRIDAY, JULY 31                     [ Adjust ]
Today
░▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░│░░░░░░░░░░░░░░░░░░  ← the │ is the now needle
55m left in your window · 1 of 3 done

KEEPING                             2 of 3 kept
[ ● Spanish ✓ ] [ ◍ Gym  2 of 4 ] [ ● Read ✓ ]

✓ Done today (1)                              ▾   ← collapsed, 44px

10:35 │ ↷ Spanish, 20 minutes    settles tonight   ← pushed, one line, 44px
      · · · break 10m · · · · · · · · · · · ·
──── NOW 11:12 ────────────────────────────────
11:05 ╔═══════════════════════════════════════╗
      ║ NOW                      20m · LIGHT  ║
      ║ Open the beta list and send the same  ║
      ║ three line note to each name.         ║
      ║ BETA OUTREACH · FIRST TEN USERS       ║
      ║ ░ DONE  all three have a reply thread ░║
      ║ ┌─────────────┐ ┌──────┐ ┌───┐ ┌───┐  ║
      ║ │  ▶ Start    │ │ Done │ │ ✂ │ │ ↷ │  ║
      ║ └─────────────┘ └──────┘ └───┘ └───┘  ║
11:25 ╚═══════════════════════════════════════╝
      ┆    Open. Kept clear on purpose.   25m  ┆
12:10 ══════ WRAP 12:10p ═══════════════════════

┌───────────────────────────────────────────────┐
│ ⏱ You are 7m past. Sola can slide the rest    │
│   down.                  [ Reflow from now ]  │
└───────────────────────────────────────────────┘

        [ Close the day ]      [ ⌖ Map ]
```

### E. Over committed

```
TIME TODAY                                  1h
░▓▓▓▓●░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

┌───────────────────────────────────────────────┐
│ ⚠ 7 live steps need 8h 10m. This window holds │
│   1h. Two of them fit.                        │
│   [ Longer day ]   [ Make a step smaller ]    │
└───────────────────────────────────────────────┘

 9:40 ┌─────────────────────────────────────────┐
      │ 1  Write the three headline numbers 45m │
10:25 └─────────────────────────────────────────┘
10:40 ══════ WRAP 10:40a ═══════════════════════
      ░ DOES NOT FIT TODAY                    ░
      ░ Spanish 20m · Gym 45m · Hero line 25m  ░   ← one compact list, not cards
      ░ They stay on the map and come back     ░
      ░ tomorrow first.                        ░
```

The spill is a **single `inset-well` block with a compact list**, not a stack of ghost cards. That is the fix for "a rough day becomes a wall of dead cards", which the timeline design reintroduced with its spill zone.

### F. All clear

```
◈ FRIDAY, JULY 31                     [ Adjust ]
Today
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░
3 of 3 done · you left 25m unspent

╔═══════════════════════════════════════════════╗
║                   ( ◉ )                       ║
║           You cleared your day                ║
║   Pricing page moved 3 steps. Spanish kept.   ║
║   ┌───────────────────────┐ [ Add one more ]  ║
║   │    Close the day      │ gold              ║
║   └───────────────────────┘                   ║
╚═══════════════════════════════════════════════╝

✓ Done today (3)                              ▾
```

`Add one more` runs the engine again against the leftover queue with a small budget and appends one block. It never destroys state.

### G. SETTLE

One card per unresolved item, three full width 52px choices.

```
◈ CLOSING FRIDAY                          1 of 2

This one is still open.

┌───────────────────────────────────────────────┐
│ ◆ SHIP THE PRICING PAGE               25m     │
│   Draft the FAQ copy                          │
│   Pushed at 10:41a                            │
└───────────────────────────────────────────────┘

Where does it go?
┌───────────────────────────────────────────────┐
│  →  Tomorrow, first thing                     │
└───────────────────────────────────────────────┘
┌───────────────────────────────────────────────┐
│  ✂  Smaller tomorrow                          │
│     "Read the chapter once, no edits"         │   ← previews briefing.ifStuck
└───────────────────────────────────────────────┘
┌───────────────────────────────────────────────┐
│  ⌁  Not this week                             │
└───────────────────────────────────────────────┘

Three choices, no wrong one. Deciding is what
makes tomorrow honest.

[ Skip the rest ]
```

Then one optional line, then the receipt.

### H. RECEIPT

```
╔═══════════════════════════════════════════════╗
║                   ( ◉ )                       ║
║           Friday is closed.                   ║
║                                               ║
║   You kept 2 of 3 and moved 1.                ║
║   Pricing page is 3 steps further than this   ║
║   morning. Spanish is 4 of 7 this week.       ║
║                                               ║
║   Tomorrow opens with the FAQ copy.           ║
╚═══════════════════════════════════════════════╝

[ Reopen today ]   [ ⌖ Map ]   [ ◷ Review ]
```

No confetti, no score, no streak. Reopen is always there so closing is never a trap.

---

## 6. The engine: `mockDailyPlan` v2

Stays in `lib/ai/mock.ts`, stays local, instant, deterministic, no AI. Signature and result grow.

```ts
// lib/ai/types.ts
export interface DailyPlanInput {
  availableMinutes: number;
  energy: EnergyLevel;
  context: string;
  goals: GoalWithNodes[];
  /** local ms for "now". The caller owns the clock. Falls back to Date.now(). */
  nowMs?: number;
  /** minutes past local midnight the day starts at. Default: now rounded up to 5. */
  anchorMinutes?: number;
  /** steps carried from a previous day. They jump the queue, in order. */
  carry?: CarryItem[];
}

export interface PlannedBlock {
  kind: "focus" | "break" | "open";     // "open" is new
  title: string;
  description: string;
  goalId: string | null;
  nodeId: string | null;
  durationMinutes: number;
  startTime: string | null;             // now filled: "HH:MM", local 24h
  endTime: string | null;               // new
  difficulty: Difficulty;
  reason: string;
  practice: boolean;                    // new: the node is recurring
  cadence: Cadence | null;              // new
}

export interface DailyPlanResult {
  summary: string;
  blocks: PlannedBlock[];
  explanation: string;
  recoveryNote: string | null;
  anchorMinutes: number;                // echoed
  wrapMinutes: number;                  // anchor + availableMinutes
  holdMinutes: number;                  // round5(availableMinutes * 0.85)
  needMinutes: number;                  // total outstanding live work
  fitCount: number;                     // distinct nodes that got a block
  unfit: { goalId: string; nodeId: string; title: string; minutes: number }[];
  railOnly: { goalId: string; nodeId: string }[];   // rhythms that got no time
}
```

### Algorithm, in order

1. `budget = max(0, round(availableMinutes))`, `hold = round5(budget * 0.85)`, `rhythmCap = round5(hold * 0.3)`.
2. **Carry first.** Items in `input.carry` jump the once-step queue in the given order. `mode: "smaller"` uses `briefing.ifStuck` as the title and `min(10, estimatedMinutes)` as the size.
3. **Rhythms, capped.** Candidates are recurring nodes where `dueToday(node, nowMs)` and `!standing.loggedToday`, sorted by risk (behind first, then daily, weekly, monthly). A rhythm with `estimatedMinutes < 15` never books time; it is rail only by definition. Book while `rhythmUsed + chunk <= rhythmCap`; everything else goes to `railOnly`. This is the fix for `mock.ts:538-557`, where every unlogged practice books first at full size and three daily 20 minute practices eat a 60 minute day whole.
4. **Once steps.** `candidateNodes` as today, with one addition: `dueDate` finally enters the sort, ahead of `priority` and behind status rank. A step due in three days must outrank one due in three months. Round robin, `taper`, `MIN_FOCUS`, all unchanged, but the loop runs against `hold`, not `budget`.
5. **Breaks scale to the block they follow.** `deep` gets 15, `moderate` 10, `light` 5. Long break cadence (`longBreakEvery`, `longBreakLen`) unchanged. Trailing breaks still trimmed.
6. **Slack is a block.** `openMinutes = budget - used`. If `>= 10`, push a `kind: "open"` block titled `Open. Kept clear on purpose.` with reason `Slack keeps the plan true when something runs long.` `spare` at `mock.ts:617` stops being a computed value that only ever appears in prose.
7. **Stamp the clock.** `cursor = anchorMinutes`; for each block set `startTime = hhmm(cursor % 1440)`, `endTime = hhmm((cursor + d) % 1440)`, `cursor += d`.
8. **Report what did not fit.** Every queue entry with `remaining >= 10` lands in `unfit`. `needMinutes` is the sum of all initial remainders plus due rhythm minutes.
9. `nowMs` comes from the caller. `mock.ts:537`'s bare `Date.now()` goes away, so the component, the engine, and the server can finally agree on what today is.

### Reflow

Pure arithmetic in `lib/kairo/day-plan.ts`, no rebuild, nothing destroyed:

```ts
reflowFrom(blocks, fromMinutes): BlockState[]
// completed and pushed blocks keep their stamps.
// every planned block from the current one onward is re-stamped by cumulative
// sum starting at fromMinutes. Order and durations are untouched.
```

---

## 7. Daily, weekly, and monthly rhythms

### 7.1 Data

```ts
// types/index.ts
export type Cadence = "daily" | "weekly" | "monthly";

interface GoalNode {
  // ...existing
  kind?: NodeKind;                 // unchanged: "once" | "recurring"
  targetPerWeek?: number | null;   // unchanged, still the legacy weekly cadence
  checkins?: string[];             // unchanged: local "YYYY-MM-DD" days
  cadence?: Cadence | null;        // new, recurring only
  targetPerPeriod?: number | null; // new: weekly 1..7, monthly 1..31, daily always 1
  anchorDay?: number | null;       // new, monthly only: "on the 5th". Optional.
}
```

Migration `supabase/migrations/0022_cadence.sql`:

```sql
alter table public.goal_nodes
  add column if not exists cadence text check (cadence in ('daily','weekly','monthly')),
  add column if not exists target_per_period integer check (target_per_period between 1 and 31),
  add column if not exists anchor_day integer check (anchor_day between 1 and 31);
```

Do **not** widen `target_per_week`, which carries a `check (target_per_week between 1 and 7)` from `0017_recurring_practices.sql`. A monthly count of 10 would violate it. Monthly counts live in `target_per_period`.

Two hard notes. Migrations in this repo are **not applied on deploy** (prod has drifted before and broke goal creation), so 0022 must be run manually against prod **before** the phase that reads the columns ships. And `lib/data/actions.ts` uses explicit select lists (`:156`, `:212`), so the columns must be added to those selects in the same commit, not earlier.

### 7.2 Choosing a cadence

Derivation, so every shipped practice keeps its exact meaning with zero migration of data:

```ts
// lib/kairo/practice.ts
export function cadenceOf(n: Pick<GoalNode, "cadence" | "targetPerWeek">): Cadence {
  if (n.cadence === "daily" || n.cadence === "weekly" || n.cadence === "monthly") return n.cadence;
  return Math.round(n.targetPerWeek ?? 7) >= 7 ? "daily" : "weekly";
}

export function targetOf(n, cadence: Cadence): number {
  if (cadence === "daily") return 1;
  if (cadence === "weekly") return clamp(Math.round(n.targetPerPeriod ?? n.targetPerWeek ?? 3), 1, 7);
  return clamp(Math.round(n.targetPerPeriod ?? 1), 1, 31);
}
```

Where cadence comes from, in order of authority:
1. The user, on the node editor: three raised chips, Daily / Weekly / Monthly, plus a count stepper. This is the only place cadence is authored by hand.
2. The AI, at map generation. `lib/ai/generate-goal-map.ts` gains `"cadence"` and `"targetPerPeriod"` to the JSON contract and to `sanitizePractice` (`:67-77`), with the same clamping discipline: cadence must be one of the three literals or it is dropped, `targetPerPeriod` clamped by cadence.
3. The derivation above, for everything already in the database.

### 7.3 Periods, and the Todoist trap

```ts
export function periodKeyOf(cadence: Cadence, day: string): string {
  if (cadence === "daily")   return day;             // "2026-07-31"
  if (cadence === "monthly") return day.slice(0, 7); // "2026-07"
  return isoWeekKey(day);                            // "2026-W31", Monday start, local
}
```

**Credit by containing period, never by delta from the completion date.** Check-ins are already local day strings, so a session logged for `2026-07-29` counts toward July even if the tap happens on August 2. No period is ever silently skipped. This is the exact failure people wrote scripts to work around in Todoist, and the storage format we already have makes avoiding it free.

`adherence()` is **not touched.** Its rolling 28 day ratio feeds `nodeCompletion`, `progressOf`, and the map, and `lib/kairo/practice.test.ts` asserts on it. It stays the progress truth. A new sibling becomes the display truth:

```ts
export interface Standing {
  cadence: Cadence;
  kept: number;          // check-ins inside the current period
  target: number;
  periodLabel: string;   // "today" | "this week" | "July"
  daysLeft: number;      // days remaining in the period, today included
  loggedToday: boolean;
  behind: boolean;       // target - kept >= daysLeft
  ratio28: number;       // adherence(node, nowMs).ratio, the anti streak ring
  label: string;         // "Kept today" | "2 of 4 this week" | "1 of 2 in July, 9 days left"
  recent: string;        // "4 of the last 7"
}
export function standing(node: PracticeNodeSlice, nowMs: number): Standing;
export function dueToday(node: PracticeNodeSlice, nowMs: number): boolean;
export function monthlySurfaces(node: PracticeNodeSlice, nowMs: number): "hidden" | "leadIn" | "atRisk" | "freshStart";
```

One line in `TodayPlanner.finishStep` (`:225`, the celebration copy) switches from `adherence` to `standing`, and `GalaxyMap.tsx:2127` ("daily" / "Nx a week") switches to `standing().label`. Those are the only two call sites of the weekly copy.

### 7.4 When each cadence appears

| Cadence | In the rhythm rail | Books time in the plan | Surfaces elsewhere |
|---|---|---|---|
| daily | Always, first | Yes when `estimatedMinutes >= 15` and under the cap | never |
| weekly | Always, quiet when not due | Only when `dueToday` (`target - kept >= daysLeft`) and under the cap | never |
| monthly | Never | Never automatically | The month strip, per the rules below |

The rail always shows daily and weekly rhythms so one tap is always available. `dueToday` gates **booking and emphasis**, not visibility. That is what stops a 4x per week practice from either nagging on Monday or being unreachable.

### 7.5 A monthly obligation on the right day

A monthly rhythm never behaves like a task. It is a quota with a horizon and one button. It appears in the **month strip**, above the rhythm rail, only when:

- **leadIn**: `kept < target` and `daysLeft <= 7`. A single day of notice is not enough for a time based obligation with no environmental cue, so the lead in is a week.
- **atRisk**: `kept < target` and `target - kept >= daysLeft`. Mathematically it cannot be met without going today.
- **freshStart**: the local day is the 1st. It reframes rather than nags.
- If `anchorDay` is set ("on the 5th"), leadIn becomes `anchorDay - 3 .. anchorDay` and the copy reads "due on the 5th, in 3 days".

Otherwise it is silent on Today and lives on the map.

```
┌ THIS MONTH ───────────────────────────────────┐   leadIn / atRisk
│ ▤ Send the investor update        0 of 1      │
│   July closes in 1 day.       [ Put it in ]   │
└───────────────────────────────────────────────┘

┌ AUGUST ───────────────────────────────────────┐   freshStart
│ ▤ New month, clean slate. 2 rhythms reset.    │
└───────────────────────────────────────────────┘
```

`Put it in` inserts one real block at the end of the plan. If there is no room it inserts past the wrap and the over capacity read appears, which is honest rather than silent.

### 7.6 How adherence reads, everywhere

- daily: `Kept today` or `Not yet today`, with `4 of the last 7` underneath.
- weekly: `2 of 4 this week`.
- monthly: `1 of 2 in July, 9 days left`.
- The ring around every chip is `ratio28`, the rolling 28 day adherence.
- **Never a streak count. Never "broken".** No single day can fail a rolling number, which is the entire reason the rolling window exists.
- A rhythm is **Kept**, not Done. The button on a rhythm block says `Keep`. The distinction already exists inside `finishStep` (`:215-234`); it has just never been visible on a button.

---

## 8. How the step's own words surface

Three tiers, driven by block state, no toggles.

**NOW card.** The full implementation intention, in this order:

```
firstAction        21px font-display semibold text-ink        THE HEADLINE
node · goal        mono 11px uppercase 0.16em text-faint
WHERE  cue         briefing.whenWhereCue    15px text-muted   inside one inset-well
DONE   criterion   node.successCriterion    15px text-muted   inside the same well
```

`whenWhereCue` and `successCriterion` are currently rendered **nowhere in the app**. This is the largest free win on the screen.

**Ahead rows.** Node title on one line. Tapping expands in place to show `firstAction` plus `Bring forward` and `Later`. It never becomes a second hero.

**Done and pushed rows.** Title and duration only.

**Fallbacks.** No `firstAction` means the node title is the headline, which is exactly today's behaviour on legacy rows. No `whenWhereCue` collapses the well to one row. Neither means no well at all. `b.reason` is dropped from the card entirely (it duplicates the goal title, which is already in the eyebrow) and survives only in the done list expansion. `whatYoullNeed` moves into `FocusOverlay`. `commonMistakes` stays off Today.

**One extra rule:** the `WHERE` row is a tap target. Tapping it offers "Use this as my start anchor", which sets the day's anchor from the cue. It is the cheapest possible bridge from an if then plan to a real clock.

---

## 9. End of day

**Triggers**, any of: tapping `Close the day` (always in the footer during LIVE), every live block resolved (the button promotes into the celebration card), or local hour >= 20 with unresolved blocks (the button gains a soft pulse). Never a modal, never a notification.

**Sequence:** one card per unresolved block, three choices, then one optional line, then the receipt.

| Choice | What it writes |
|---|---|
| Tomorrow, first thing | `carryOut.push({ ..., mode: "first" })` |
| Smaller tomorrow | `carryOut.push({ ..., mode: "smaller" })`, titled from `briefing.ifStuck` |
| Not this week | nothing carries, the map is untouched |

**The record:**

```ts
// lib/kairo/day-record.ts
export interface CarryItem { goalId: string; nodeId: string; title: string; minutes: number; mode: "first" | "smaller" }

export interface DayRecord {
  date: string;               // LOCAL "YYYY-MM-DD"
  anchorMinutes: number;
  minutes: number;
  energy: EnergyLevel;
  summary: string; explanation: string; recoveryNote: string | null;
  blocks: BlockState[];
  rhythms: { goalId: string; nodeId: string; kept: boolean }[];
  carryIn: CarryItem[];
  carryOut: CarryItem[];
  note: string | null;
  closedAt: string | null;
}
```

Stored as a ring of the last 14 days under `kairo.today.v2:{userId}`. Tomorrow's COMMIT reads the most recent record with a non empty `carryOut` and renders the `FROM YESTERDAY` block, and passes it to the engine as `carry`. That closes the loop the current per day `StoredPlan` has never closed: today a pushed block simply dies when the day key rolls.

`Reopen today` clears `closedAt` and returns to LIVE. Nothing about closing is punitive or permanent.

---

## 10. Surfaces, exact

**The governing rule: state is carried by elevation and rim. The only gold fills on the screen are `.raised-gold` on the single primary action and the two slider fills.**

**Selection rule (this is the owner's complaint, precisely):** every pill in a row is `raised-btn`, always. The selected one keeps `raised-btn`, gains `text-accent`, and gains an inline accent rim at `color-mix(in srgb, var(--color-accent) 45%, transparent)`. Unselected pills are `raised-btn text-muted`. Nothing is ever filled with translucent accent, and nothing in a row of controls is a bare outline.

| Location | Current | Becomes |
|---|---|---|
| `TodayPlanner.tsx:125` unselected energy pill | `border border-line text-muted` | `raised-btn text-muted` |
| `TimeSlider.tsx:79` unselected jump pill | `border-line text-muted` | `raised-btn text-muted` |
| `TodayPlanner.tsx:125 / TimeSlider.tsx:79` selected | already `raised-btn text-accent` plus rim | unchanged, and the rim moves from an inline style into both files identically |
| `FocusOverlay.tsx:256, 259, 326` | `bg-white/[0.03]` | `inset-well` (they are input and answer surfaces, pressed in is correct) |
| `FocusOverlay.tsx:244-246, 276-278` skeletons | `bg-white/5` | `inset-well` with the existing pulse |
| `TodayPlanner.tsx:412` promise paragraph | `.panel` prose | deleted, replaced by the live rail plus the capacity read |
| `TodayPlanner.tsx:547` "Up next" pill | `raised-btn text-accent` | deleted, replaced by the NOW card being physically larger and wearing `panel-2 focus-accent` |
| `TodayPlanner.tsx:451` recovery note | `.panel` with warn rim | kept as is, it is already correct |
| `TodayPlanner.tsx:384` no work notice | `.panel` | `inset-well` |
| `TodayPlanner.tsx:496-504` break row | `raised-btn` coffee bead plus mono chip | 28px hairline row with a mono caption, no bead, no icon |

New surfaces, all from the existing vocabulary in `globals.css:492-565`:

| Element | Treatment |
|---|---|
| NOW card | `panel-2` plus `focus-accent`, `rounded-3xl`, `p-5`, with a 3px goal coloured left edge. The only `focus-accent` on the page. `globals.css:559` documents it as "the one focal treatment, use sparingly", and this is the job it was written for |
| When / Done well inside it | `inset-well rounded-xl px-3.5 py-3`, mono 11 uppercase labels in `--color-faint`, values 15px `--color-ink` |
| Ahead row | `panel rounded-2xl`, tiered height |
| Done or pushed row | `panel` at `opacity-55`, 44px, one line |
| Open slack row | `panel` with `border-dashed border-line`, the one dashed border on the screen because it is the one thing deliberately empty |
| Spill region | `inset-well` with a compact `text-faint` list |
| Wrap line | 2px rule at `color-mix(in srgb, var(--color-accent) 45%, transparent)` with a `raised-btn` gutter tab carrying the time in `text-accent` |
| Now line | 1px accent rule at 65% opacity with a `raised-btn` gutter tab |
| Day strip | `inset-well h-6 rounded-full p-[3px]`, same construction as the current bar at `:462`, with a 2px light needle at `elapsed / total` |
| Rhythm chip, open | `raised-btn` `h-14` `rounded-2xl`, 2px SVG arc at `ratio28` in the goal colour over `--color-line-strong` |
| Rhythm chip, kept | `raised-btn` with the bead filled by the goal colour radial gradient already used at `:528`, label `text-ink` |
| Month strip | `.panel` with a `raised-btn` action |
| Over capacity read | `.panel` with a 3px left rule in `var(--color-warn)` and warn text. No warn fill anywhere |
| Start | `raised-gold`, one per screen, only on the NOW card |
| Done / Keep / Smaller / Later / Adjust / Reflow | `raised-btn` |
| Commit, Close the day | `raised-gold`, one per state |

Type on the NOW card: headline `font-display` 21px semibold `text-ink`, eyebrow mono 11px `0.16em` `text-faint`, supporting lines 15px `text-muted`.

`DiffMeter` (`:49-58`) survives but appears on the NOW card only, beside the duration. It leaves the ahead rows entirely, which removes two of the six metadata lines that currently stack above every card's buttons.

**Motion:** when a block completes, the NOW card collapses upward into its done line and the next row expands into the NOW slot. One 320ms spring, or a `grid-template-rows` transition. Cross fade under `prefers-reduced-motion`. This single interaction is what makes the screen feel like a working day rather than a static list.

---

## 11. Components and files

New, all under `components/kairo/today/`:

| File | Responsibility |
|---|---|
| `TodayPlanner.tsx` | orchestrator only: state, actions, which moment to render. Moves here from `components/kairo/` |
| `CommitPanel.tsx` | the COMMIT moment: sliders, start anchor, capacity read, ghost rail |
| `DayRail.tsx` | gutter, spine, now line, wrap line, spill region, row ordering |
| `NowCard.tsx` | the hero, the three tier disclosure, the four actions |
| `RailRow.tsx` | ahead / done / pushed / break / open, one component, five variants |
| `RhythmRail.tsx`, `RhythmChip.tsx` | the chips, the ring, one tap keep |
| `MonthStrip.tsx` | leadIn / atRisk / freshStart |
| `CapacityBar.tsx` | shared by COMMIT (what fits) and LIVE (the day strip) |
| `AdjustSheet.tsx` | non destructive re-plan, with `Start over` as a secondary |
| `SmallerSheet.tsx` | the two choice miss path, `ifStuck` preferred |
| `SettleSheet.tsx`, `DayReceipt.tsx` | the close |

New lib, where all the arithmetic lives so it is testable without a DOM (matching the repo's existing `lib/**/*.test.ts` pattern):

| File | Exports |
|---|---|
| `lib/kairo/clock.ts` | `localDayKey(ms)`, `minutesOfDay(ms)`, `hhmm(min)`, `round5` |
| `lib/kairo/day-plan.ts` | `reflowFrom`, `rowHeightFor`, `nowIndexOf`, `dayStripSegments` |
| `lib/kairo/day-record.ts` | the `DayRecord` ring, `readCarry`, `writeCarry`, receipt copy |
| `lib/kairo/practice.ts` (extended) | `cadenceOf`, `targetOf`, `periodKeyOf`, `standing`, `dueToday`, `monthlySurfaces` |

Everything that survives untouched: `FocusOverlay` and the whole focus timer path, `Celebration`, `pickCelebration`, `fireHaptic`, `GoalCore`, `SolaMark`, `EmptyState`, `useGoalColors`, `goalIcon`, `usePersistentState`, `track`, `TimeSlider` and `StepSlider` mechanics, `adherence` and `toggleCheckin`, `finishStep` and its write through (`setNodeStatus`, `logFocusSession`, `togglePracticeCheckin`, `setGoalNotes`), including the rule at `:212` that completing one block closes every block sharing that `nodeId`, `startBlock`, `pushBlock`, `undoPush`, `shrinkBlock`, `shrinkToFallback`, `appendNote`.

Reworked: `rebuild()` (`:202-205`) becomes `Adjust`, which re-plans only unresolved blocks and preserves completed and pushed. The current behaviour silently destroys the day's record and is the worst bug on the screen.

Deleted: the centered `max-w-md text-center` setup column, the promise paragraph, the "Up next" pill, the coffee bead break row, `b.reason` on cards, `TIME_OPTIONS` and `budgetLabel`.

---

## 12. Correctness fixes that the redesign depends on

1. **`dayKey` is UTC.** `app/app/today/page.tsx:13` is `now.toISOString().slice(0,10)`. At UTC-7 the stored plan self destructs at 5pm local. Fix: the server keeps passing `serverDayKey` and `serverDateLabel` for first paint, and `TodayPlanner` computes the local key in a mount effect (`const [today, setToday] = useState<string|null>(null)`, `useEffect(() => setToday(localDayKey(Date.now())), [])`, `const dayKey = today ?? serverDayKey`). No hydration mismatch, because the same pattern already governs `usePersistentState`. **A rail with real clock times cannot ship on a UTC day key.**

2. **The server writes check-ins on its own clock.** `lib/data/actions.ts:232` calls `toggleCheckin(..., Date.now())`, which on Vercel is UTC. A practice logged at 6pm local UTC-7 is credited to tomorrow. Fix: `togglePracticeCheckin(input: { goalId, nodeId, dayKey? })`, validated server side against `/^\d{4}-\d{2}-\d{2}$/` and rejected unless within one day of the server date, so a client cannot rewrite arbitrary history.

3. **`budgetLabel(360)` returns `"6h+"`** because `TIME_OPTIONS` (`day-budget.ts:19`) still describes the retired preset ladder. Exactly 6h reads "6h+" while 6h15 reads "6h 15m", in a 26px readout, next to a jump pill labelled "6h+". `TIME_OPTIONS` is otherwise dead (`TimeSlider` has its own `JUMPS`). Delete both and import `formatDuration` from `lib/utils.ts:10`, which is already the identical function.

4. **The plan is not user scoped.** `usePersistentState("kairo.today.v1", null)` with `enabled` left true in remote mode. Two accounts in one browser share a day. Becomes `kairo.today.v2:{userId}`, with the user id passed from `getSessionUser()` and `"local"` in demo mode.

5. **`FocusOverlay` fires an AI `planSession` call on open** (`:93`) to regenerate a first move and checklist the node already has cached in `briefing`. Read `node.briefing` first and call `planSession` only when it is null. Start is currently the one slow, non deterministic beat on an otherwise instant screen.

6. **`daily_plans` and `daily_plan_blocks` exist in `0001_init.sql` and are referenced by zero lines of code.** `mockReview` reads `recentPlan` (`mock.ts:666`) and only tests ever supply it. Writing the day record through to those tables is Phase 9, optional, and it is what finally gives Review a real day to talk about.

---

## 13. Phases

Each phase is shippable on its own, none breaks the one before it, and the owner sees a difference at the end of every one.

### Phase 1: surfaces (half a day, zero structural risk)
Every pill in both sliders becomes `raised-btn`, selection carried by gold rim plus gold label. The seven `bg-white/*` washes in `FocusOverlay`. `inset-well` on the no-work notice.
**Ships:** the "translucent yellowish buttons" complaint closes.
**Done when:** `grep -n "bg-accent\|bg-warn/\|bg-white/" components/kairo/*.tsx` returns nothing, and no control anywhere on Today is a bare 1px outline.

### Phase 2: one definition of today (small, everything depends on it)
Local `dayKey`, local `dateLabel`, `dayKey` passed to `togglePracticeCheckin` with server validation, storage key to `kairo.today.v2:{userId}`, delete `TIME_OPTIONS` and `budgetLabel`.
**Done when:** a device set to UTC-7 keeps its plan past 5pm local, and a practice logged at 11pm local is credited to that day on the server.

### Phase 3: hierarchy (the biggest visible delta, no engine change)
NOW card with the three tier disclosure. `firstAction` becomes the headline, `whenWhereCue` and `successCriterion` render for the first time, `b.reason` and `DiffMeter` leave the ahead rows. Ahead rows collapse to tiered heights. Done and pushed collapse to one line, pushed moves to a tray. The collapse and promote animation.
**Ships:** it stops looking like six identical cards and starts looking like a day planner.
**Done when:** at 375px the NOW card and the first ahead row are both above the fold on an iPhone SE, and a five block day where three are resolved is under two screens.

### Phase 4: the clock (the structural unlock)
`anchorMinutes` in, `startTime` and `endTime` out, gutter times, wrap line, now line on a 60s interval, day strip promoted to h-6 with a now needle, `Reflow from now`, `Adjust` replacing destructive `Rebuild`, breaks as hairlines.
**Ships:** the screen changes through the day instead of being a list you built at 9am.
**Done when:** `startTime` is monotonic across every block, the now line never renders inside a card, and completing a block then reflowing preserves every completed and pushed stamp.

### Phase 5: COMMIT becomes a day
The setup screen goes left aligned, gains the live ghost rail on slider drag, the capacity read, the start anchor chip row, and `ENERGY_OPTIONS[].hint`. The promise paragraph dies. The building narration is retargeted and its copy made true.
**Done when:** dragging the time slider redraws the ghost rail with no perceptible lag and no network call.

### Phase 6: honest capacity
Plan to 85%, the `open` slack block, the 30% rhythm cap, `unfit` out of the engine, the spill region, the over capacity reads at commit and mid day, `dueDate` into candidate ranking.
**Ships:** the plan stops filling the window to exhaustion and starts telling the truth about what does not fit.
**Done when:** three daily 20 minute practices against a 60 minute budget leave room for at least one once step, which is the live bug at `mock.ts:538-557`.

### Phase 7: cadence
Migration 0022 applied to prod by hand first. `Cadence`, `targetPerPeriod`, `anchorDay`, `cadenceOf`, `targetOf`, `periodKeyOf`, `standing`, `dueToday`, `monthlySurfaces`. The rhythm rail, the month strip, the fresh start framing, `Keep` instead of `Done` on a rhythm. AI contract and `sanitizePractice` extended. Node editor gains the three cadence chips.
**Ships:** "daily or monthly steps in the plan" exists as a first class citizen.
**Done when:** a monthly rhythm logged late for the previous month credits that month, a 4x weekly rhythm is silent on Monday and booked on Thursday, and no screen anywhere shows a streak.

### Phase 8: close the day
`DayRecord`, the settle sequence, the optional line, the receipt, `Reopen today`, carry into tomorrow's COMMIT.
**Ships:** build, run, close, which is the ritual shape every planner people stay with has and this one does not.
**Done when:** a block pushed today appears in tomorrow's `FROM YESTERDAY` and jumps the queue when tomorrow is committed.

### Phase 9 (optional, later): server persistence
Write `DayRecord` through to `daily_plans` and `daily_plan_blocks`, and feed `recentPlan` to `mockReview`. Removes the browser local dead end and gives Review a real day.

---

## 14. Tests, colocated, per phase

| Phase | File | Assertions |
|---|---|---|
| 2 | `lib/kairo/clock.test.ts` | `localDayKey` at a UTC-7 offset, `hhmm` wraps past midnight |
| 4 | `lib/ai/mock.test.ts` | `startTime` monotonic and gapless, no trailing break, anchor echoed, deterministic given a fixed `nowMs` |
| 4 | `lib/kairo/day-plan.test.ts` | `reflowFrom` preserves completed and pushed stamps, order, and durations |
| 6 | `lib/ai/mock.test.ts` | rhythms never exceed 30% of hold, focus plus breaks never exceed 85%, an `open` block is emitted when slack >= 10, `unfit` is non empty when `needMinutes > budget`, three daily practices against 60m leave room for a once step |
| 6 | `lib/ai/mock.test.ts` | `carry` items are planned before any other candidate, in order |
| 7 | `lib/kairo/practice.test.ts` | `cadenceOf` derivation for legacy rows (7 becomes daily, 4 becomes weekly), `standing` for all three cadences, **a monthly check-in written for the previous month credits that month and not the current one**, `dueToday` weekly rule at each day of the week, `monthlySurfaces` at 8 days out, 7 days out, at risk, and on the 1st |
| 8 | `lib/kairo/day-record.test.ts` | ring caps at 14, carry round trips, reopen clears `closedAt`, a day with no `carryOut` is never read as carry |

Existing tests that must keep passing untouched: `lib/kairo/practice.test.ts` (adherence is not modified), `lib/ai/generate-goal-map.test.ts` (the `targetPerWeek` clamp stays, cadence sanitizing is additive), `lib/kairo/next-move.test.ts`, `lib/kairo/chapters.test.ts`.

---

## 15. Files touched

`/Users/zander/Documents/KairoApp/components/kairo/TodayPlanner.tsx` (splits into `components/kairo/today/`), `/Users/zander/Documents/KairoApp/components/kairo/TimeSlider.tsx`, `/Users/zander/Documents/KairoApp/components/kairo/FocusOverlay.tsx`, `/Users/zander/Documents/KairoApp/lib/ai/mock.ts`, `/Users/zander/Documents/KairoApp/lib/ai/types.ts`, `/Users/zander/Documents/KairoApp/lib/ai/generate-goal-map.ts`, `/Users/zander/Documents/KairoApp/lib/kairo/practice.ts`, `/Users/zander/Documents/KairoApp/lib/kairo/day-budget.ts`, `/Users/zander/Documents/KairoApp/lib/data/actions.ts`, `/Users/zander/Documents/KairoApp/types/index.ts`, `/Users/zander/Documents/KairoApp/app/app/today/page.tsx`, `/Users/zander/Documents/KairoApp/app/globals.css` (no new classes needed), `/Users/zander/Documents/KairoApp/components/kairo/GalaxyMap.tsx` (one cadence copy line), and a new `/Users/zander/Documents/KairoApp/supabase/migrations/0022_cadence.sql`.