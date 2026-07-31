All grounding verified. Delivering the spec as my final output.

# Solaspace Map Redesign, Buildable Spec: CHAPTERS

Backbone: the winning **chapters** design (numbered chapter cards on one vertical thread). Grafted in: the **open** design's gate moment (milestone successCriterion as a visible pass test and the "close the chapter" step), **orbit-lanes** Phase A (icons and first moves ship on the current map first, before any layout change) and its "chapter n of N" planet line, and **trail**'s icon precedence (recurring nodes keep a semantic icon, recurrence is furniture) and its collision-ordered keyword table. Every judge-raised flaw has a named fix in Section 10.

All file paths are absolute. All findings below were re-verified against the code on branch `feat/emotional-design-traction` before writing this.

---

## 0. Decisions made

| Question | Decision |
|---|---|
| Node icon source | **Deterministic keyword resolver now** (`lib/kairo/node-icon.ts`, zero AI cost, works on every legacy row and mock). AI-chosen key ships later as a nullable override (Phase 6, optional). Rationale in Section 3. |
| Chronology model | One vertical thread of numbered chapter cards. Chapters derive from the AI's **chain** structure (verified: `generate-goal-map.ts` lines 12 to 14 emit each milestone as a child of the previous milestone), not from `parentId === null`. Derivation algorithm in Section 2. |
| Milestone completion | A chapter's own node becomes the gold "Close this chapter" row once its steps are done, using its `successCriterion` as the pass test. This changes walker order (today the milestone is only offered after its entire downstream subtree, verified trace in Section 10, flaw C). |
| Recurring practices | Never numbered, never in the thread sequence. Rhythm strip at the bottom of their host chapter card; goal-level rhythm strip under the planet for recurring roots. Weekly pips from `checkins` vs `targetPerWeek`. |
| Fallback icon | Chapter: `Flag`. Step: `ArrowRight`. The bare dot is eliminated. |
| Control language | Chip / OptionChip / `raised-btn` / `raised-gold` only. No new control family. |
| Theme | Chapter components are theme-aware exactly like the rest of GalaxyMap: semantic tokens (`panel`, `chrome`, `text-ink/muted/faint`, `border-line`) plus the existing `light` prop for hue mixes. The map already threads `light` everywhere; the new components must too. |
| Gestures | No internal scrolling anywhere in map space. Rows use the planet's existing down/up movement-threshold pattern (`onPlanetDown`/`onPlanetUp` in `GoalCluster`), never `stopPropagation` on pointerdown, so pan and pinch always reach the shell. |

---

## 1. The design

### Mobile, 375px, one goal expanded

```
              .   *          .
            (( PLANET ))            existing PlanetOrb: surface, embossed
             Learn guitar           goal icon, charge ring, "62%"
          Chapter 2 of 5 - due Oct  <- new line (graft from orbit-lanes)
                 ||                 thread: lit segment (done)
   +--(1)- Foundations --------- ok +   collapsed done chapter: 48px row,
   +--------------------------------+   check at right, lit thread above
                 ||
   +================================+
   | (2) Chords that carry songs 40%|   EXPANDED card (one at a time)
   |  Done when: G to C switch is   |   <- milestone successCriterion,
   |  clean at tempo                |      one faint line (graft from open)
   | ------------------------------ |
   |  [pen] Learn G, C and D    ok  |   done step: icon tile + check
   |  [rpt] Smooth chord changes    |   <- gold "you are here" row:
   |    First move: play G to C     |      firstAction preview
   |    slowly, ten times           |
   |    [ Focus ]  [ Details ]      |   raised-gold + raised-btn chips
   |  [book] Read strumming primer  |   future step: dim, icon + title
   | ------------------------------ |
   |  [gtr] Practice 20 min - 4x/wk |   rhythm strip, pips oo..
   +================||==============+
                    ::                  gold dashed, animate-flow
   +--(3)- First full song ---------+   collapsed future: dim 0.68
   +--(4)- Play for someone --------+
                 |
                flag                    goal summit marker
```

### Desktop (>= 640px)

Same column, wider (420px), because time always reads downward in the app. Collapsed chapters gain a micro progress bar and step count. The galaxy around it is unchanged: planets, drag, organize, tidy, constellations, search. Expanding a goal dims all other clusters (existing `dimmed` at opacity 0.32) and raises the expanded cluster's z-index.

### Landing (ShowcaseTree)

Horizontal roadmap of chapter cards at >= 640px (its existing orientation rule), vertical stack below. Same card components via a `variant="showcase"` prop. Its research-sheet interactivity and auto-fit measurement survive.

---

## 2. Data derivation: the one chronology authority

New file: `/Users/zander/Documents/KairoApp/lib/kairo/chapters.ts`

The verified data shape: the AI emits ONE chain. Milestone i+1 is a child of milestone i (`generate-goal-map.ts` line 13: "every later milestone's parentIndex is the milestone right before it in time"). Sub-steps are childless children. Recurring nodes hang off the milestone that unlocks them (line 22). So `parentId === null` finds only milestone 1, which is why GoalList is currently broken (Section 10, flaw B).

```ts
export interface Chapter {
  node: GoalNode;            // the milestone; its own row is the "close" gate
  steps: Step[];             // ordered, once-kind
  rhythms: GoalNode[];       // recurring children -> rhythm strip
}
export interface Step { node: GoalNode; subs: Step[] }  // subs = broken-down moves, indented rows
export interface ChapterizedGoal {
  chapters: Chapter[];       // numbered 1..N in order
  goalRhythms: GoalNode[];   // recurring roots -> strip under the planet
}

export function deriveChapters(nodes: GoalNode[]): ChapterizedGoal
```

Algorithm (deterministic, array order preserved everywhere):

1. Group children by `parentId` (orphaned parentIds normalize to null, same guard `layoutTree` uses today).
2. Roots in array order: recurring roots go to `goalRhythms`; each other root starts a chain.
3. `chain(n)`: children of `n` split into
   - `rhythms`: `kind === "recurring"`,
   - `continuation`: the LAST childful non-recurring child in array order (the AI appends the next milestone after the sub-steps; this is the chain link),
   - everything else: `steps`. A childful non-continuation child (a step Sola broke down) stays a step whose own children render as indented sub-rows, depth capped at one visual level.
4. Emit `{ node: n, steps, rhythms }`, then recurse into `continuation`.
5. Chapter numbers are the emit order, 1..N. Recurring nodes never take a number.

Degradation is defined, not accidental: if a model ever emits the continuation not-last, the true milestone renders as an inline step group and the other childful child becomes the next chapter; still ordered, still navigable. A goal of flat roots (hand-built) yields one chapter per root. A single childless root yields one chapter whose only row is its own gate.

Unit tests (colocated `chapters.test.ts`): AI chain shape, flat roots, broken-down step mid-chain, broken-down step under the last milestone, recurring root, recurring under milestone, single-node goal, orphaned parentId.

### The unified walker

Rewrite `/Users/zander/Documents/KairoApp/lib/kairo/next-move.ts` on top of `deriveChapters`. Delete `nextId` from GalaxyMap (lines 107 to 148).

```
sequence(goal):
  for each chapter in order:
    for each step in order: step.subs (in order), then step itself,
      with rhythms interleaved at their array position among siblings
    then chapter.node                      // the gate: "close this chapter"

nextNodeForGoal(goal):
  live = nodes with status in_motion or at_risk,
         sorted by rank (in_motion 0, at_risk 1) then priority   // preserved from nextId
  if live: return live[0]
  return first item in sequence where open(item)
  open(n) = status not done, not blocked,
            and not (recurring and checkins includes dayKey(now))  // preserved verbatim

computeNextMove(goals):                    // Today's cross-goal beacon
  candidates = active goals' nextNodeForGoal results
  sort by status rank then priority; return first
```

Consumers: GalaxyMap beacon, GoalList "next" pill, Today. All three finally agree. The current chapter = the chapter containing the walker's result (or hosting the rhythm it points at).

---

## 3. Node icons

**Decision: deterministic resolver now.** It costs zero tokens, needs no schema change or migration (migrations do not auto-apply in this project and prod has drifted before), works retroactively on every legacy row, every user-typed node, and every mock, and is unit-testable. The AI key (Phase 6) is a strict override on top, so nothing shipped now is wasted. AI-only was rejected because it leaves all existing rows iconless without a backfill job and forces a migration on the critical path.

New file: `/Users/zander/Documents/KairoApp/lib/kairo/node-icon.ts`

Resolution order for `nodeIcon(node): LucideIcon`:

1. `resource.kind`: `watch` -> PlayCircle, `read` -> BookOpen, `practice` -> Repeat.
2. First matching rule below, tested against lowercased `title`, then `firstAction` if the title misses. Word-boundary regexes, single ordered array, first match wins.
3. Fallback: chapter node -> `Flag`, step -> `ArrowRight`. Never a dot.

Done state and recurrence are row furniture (check glyph, rhythm strip, cadence label), never the icon slot, so a workout practice reads Dumbbell, not a generic Repeat (graft from trail).

| # | Keywords (word-boundary, first match wins) | Icon |
|---|---|---|
| 1 | practice, drill, rehearse, warm up, reps, run through | Repeat |
| 2 | write, draft, outline, journal, script, essay, blog | PenLine |
| 3 | watch, video, tutorial, course, lecture, episode | PlayCircle |
| 4 | read, article, chapter, docs, guide, textbook | BookOpen |
| 5 | research, find, search, look up, compare, gather, collect | Search |
| 6 | call, phone | Phone |
| 7 | email, message, text, ask, reach out, contact, invite, feedback, meet, interview, talk to | MessageCircle |
| 8 | book a, schedule, appointment, block time, calendar | CalendarClock |
| 9 | sign up, register, apply, enroll, join, subscribe | ClipboardPen |
| 10 | buy, order, purchase, price, budget, save, pay | Wallet |
| 11 | set up, install, configure, download, connect | Wrench |
| 12 | code, debug, deploy, refactor, program | Code |
| 13 | design, sketch, wireframe, mockup, layout, logo, color | Palette |
| 14 | build, make, create, assemble, prototype, put together | Hammer |
| 15 | record, film, shoot, photograph, photo | Camera |
| 16 | learn, memorize, study, flashcard, vocab, quiz | GraduationCap |
| 17 | test, measure, track, weigh, benchmark, review | Gauge |
| 18 | publish, launch, ship, post, submit, release, share | Send |
| 19 | present, pitch, demo, perform, play for, speech, speak | Mic |
| 20 | run, walk, jog, lift, gym, workout, train, stretch, swim, ride | Dumbbell |
| 21 | cook, meal, recipe, bake, prep | Utensils |
| 22 | clean, organize, sort, declutter, tidy | Layers |
| 23 | decide, choose, pick, commit | Scale |
| 24 | plan, map out, list, prioritize, break down, brainstorm | ListChecks |

Ordering is load-bearing and documented in the file: rule 1 before 20 so "run through the set" is practice, not fitness; "book a" (rule 8) exists so "book a court" never needs a bare "book" token, which keeps "read a book" on rule 4; rule 13 before 23 so "pick colors" reads as design. Unit-test exactly these collisions plus the fallback pair. Every icon name above verified present in the installed lucide-react build. Roughly 90 lines including the table.

Rendering: 15px icon inside a 28px `rounded-lg` tile filled `${hex}1f` (the exact tile pattern GoalList already uses for goal icons at 36px), tinted `hex` in dark, `color-mix(in srgb, ${hex} 60%, #2a2f3a)` in light.

### Phase 6, the AI override (optional, skippable indefinitely)

Exact precedent: `generate-goal-map.ts` line 26 asks for the goal icon from an enum and line 112 Set-validates it. Mirror it:

- New `/Users/zander/Documents/KairoApp/lib/kairo/node-icon-keys.ts`: `NODE_ICON_KEYS` = 24 lucide-free keys mirroring the table (same pattern as `goal-icon-keys.ts`).
- `GeneratedNode` in `/Users/zander/Documents/KairoApp/lib/ai/types.ts` gains `icon?: string`; one prompt line in SYSTEM; Set-validate in `normalize()`; mocks in `lib/ai/mock.ts` get hand-set keys.
- Nullable `icon text` column on `goal_nodes`, threaded through `toLocalGoal` and persistence. **The migration must be applied manually; call this out in the PR.**
- Render becomes `validNodeIconKey(node.icon) ?? keywordResolver(node)`. Legacy rows never look broken.

---

## 4. Components: exact inventory

### New

`/Users/zander/Documents/KairoApp/components/kairo/ChapterColumn.tsx`

- `ChapterColumn` props: `{ goal, chapterized, hex, light, nextNodeId, selectedNodeId, poppedId, expandedChapterId, onExpandChapter, onSelectNode, onNodeContext, width, variant?: "map" | "showcase" }`. Renders the goal rhythm strip, then chapters as an `<ol>` with thread segments in the gaps.
- `ChapterCard`: collapsed row (h-12, `panel` surface, number disc 28px in goal hue, node icon tile, title 14px, right slot: check when done, micro progress bar + "2/3" on desktop, dim opacity 0.68 when future). Expanded: `chrome` surface, header (number disc 30px, icon tile, title 15px semibold, "Done when: {successCriterion}" one faint 12px line), divider, `StepRow` list, divider, `RhythmRow` list. The chapter containing the global next, when collapsed, shows one extra line: the next step's title plus its first move, so even fully collapsed the map names the exact opening move.
- `StepRow`: min-h-11 (44px), icon tile 28px, title 13.5px, duration mono 11px right. Done: check in the right slot, opacity 0.7, no strikethrough (strikethrough stays a List idiom). Blocked: amber left tick plus a mono "blocked" microlabel (flaw E). Gold row (walker's next): `${hex}` halo ring, "First move: {firstAction}" in the exact gold-tinted box style NodeSheet already uses at GalaxyMap.tsx lines 2609 to 2613 (`border-accent/20`, accent 6% wash, mono uppercase label), then a chip row: `[ Focus ]` as `raised-gold`, `[ Details ]` as `Chip`. Sub-rows (broken-down moves) indent `pl-9`, same row anatomy. Only one first-move preview exists per map; it is a spotlight, not a wall of text. Rows render nothing for legacy empty `firstAction` (same guard NodeSheet uses).
- `RhythmRow`: h-11, node icon tile, title, cadence ("daily" / "4x a week"), pips: `targetPerWeek` dots filled from this week's `checkins`, kept-today state warm. Takes the gold treatment when the walker points at it. Tap opens NodeSheet's existing log flow.
- `ThreadSegment`: a 2px vertical line filling each 14px gap (n+1 segments, no measurement needed). States: done -> solid `hex` at 0.85 with soft `drop-shadow`; into the current chapter -> `#e6b877` dashed "3 7" with the existing `animate-flow`; future -> `hex` at 0.25. A small `Flag` summit marker after the last chapter, lit when the goal completes.
- The gate row: when all of a chapter's steps are done, the card's final gold row is the chapter node itself, labeled "Close this chapter" with its successCriterion as the body, same Focus/Details chips (graft from open's checkpoint gates).

### Changed

- `/Users/zander/Documents/KairoApp/components/kairo/GalaxyMap.tsx`: `GoalCluster` renders `ChapterColumn` when `expanded` instead of the placed-orb loop and connector SVG. Planet, halo, charge ring, labels stay; the expanded planet's label block gains "Chapter n of N" (graft from orbit-lanes). New cluster state: `expandedChapterId`, defaulting to the chapter containing the walker's next on expand. Search and fly-to-node expand the containing chapter. `poppedId` reroutes to row flash plus lighting the segment above the next card.
- `/Users/zander/Documents/KairoApp/components/kairo/GoalList.tsx`: consume `deriveChapters` and the unified walker (Phase 4, Section 8).
- `/Users/zander/Documents/KairoApp/components/kairo/ShowcaseTree.tsx`: rebuilt on `ChapterCard variant="showcase"` (Phase 5).
- `/Users/zander/Documents/KairoApp/lib/kairo/next-move.ts`: rewritten per Section 2.

### Deleted (Phase 3 unless noted)

- `layoutTree`, `relaxOverlaps`, `Placed`, `SPINE_RAD`, `LEAF_RAD`, `SPINE_ARC` (GalaxyMap lines 150 to 276).
- `nextId` (lines 107 to 148, deleted in Phase 2).
- `NodeOrb` (lines 1997 onward) and the expanded connector SVG block in `GoalCluster` (lines 1852 to 1895).
- ShowcaseTree's fork of the fishbone layout (Phase 5). Both duplicate layout engines die; nothing replaces them, because the column is CSS flow.

### Untouched

Pan/zoom/pinch shell with NaN-safe clamp, `--map-scale` label counter-scaling, fly-to, planet drag plus `kairo.galaxy.v1` persistence, golden-angle `defaultPos`, tidy/organize/category clustering, constellations, search, safe-area chrome, `PlanetOrb`/`PlanetSurface`, charge-ring SVG pattern, `NodeSheet` wholesale (it is the Details target), celebration, reduced-motion kill switch, `Chip`/`OptionChip`/`raised-btn`/`raised-gold`, `components/ui/Chip.tsx`.

---

## 5. Layout maths

The fishbone's computed geometry is replaced by CSS flow. The only remaining maths:

- Column width `W`: 336 map units when viewport < 640px (fits 375px with 19px gutters at zoom 1), else 420.
- Anchor: absolutely positioned child of the cluster's existing positioned div at `left: -W/2, top: 84` (planet center is the cluster origin; expanded planet radius 46 plus charge ring at 52 leaves a 32px gap).
- Vertical rhythm: collapsed row 48px, expanded card content-driven, 14px gaps carrying the thread segments, thread x = column center.
- Height bound: prompt-shaped goals are 4 to 5 chapters of 2 to 3 steps; one card expanded at a time keeps the column near 620 to 700 map px. Worst case is absorbed by the untouched pan/zoom shell.
- Neighbor collision: none computed. One goal open at a time (existing), other clusters dim to 0.32 (existing), expanded cluster gets top z-index. The golden-spiral spacing (250 + 150 * sqrt(i)) keeps cores clear; overlap of a dimmed neighbor by a card is acceptable by design.
- Zoom: cards are map objects and scale with `--map-scale` like everything else; no counter-scaling on cards (the galaxy-label counter-scale at line 1981 stays as is). On expand, fly-to targets `(pos.x, pos.y + 180)` at zoom 1 (0.9 when the column exceeds the viewport), reusing the existing fly-to.
- Gestures, the whole rule: nothing in map space scrolls internally. Rows and chips register pointerdown position and fire on pointerup only if movement stayed under the threshold, the exact `onPlanetDown`/`onPlanetUp` pattern `GoalCluster` already implements, with no `stopPropagation` on pointerdown. Pan and pinch therefore always reach the shell, even when the gesture starts on a card.
- Tap targets: every interactive row min-h-11 (44px), collapsed chapters 48px, chips carry Chip's `before:-inset-1` ring. The 38px NodeOrb violation dies with NodeOrb; Phase 1 patches it in the interim.

Accessibility: the column is an `<ol aria-label="{goal.title} chapters">`, steps an inner `<ol>`, the gold row `aria-current="step"`, thread segments `aria-hidden`. The map becomes a real ordered list to assistive tech, which is the redesign's thesis stated in markup.

Reduced motion: `animate-flow`, grow-in staggers, and the row flash are all zeroed by the existing global kill switch (globals.css). The design never depends on motion: numbers, thread states, and the single gold row carry chronology statically.

---

## 6. Where firstAction and successCriterion surface

| Surface | What shows |
|---|---|
| Gold step row (one per map) | "First move: {firstAction}" plus Focus (`raised-gold`) and Details (`Chip`) |
| Collapsed chapter containing the global next | Next step title plus a one-line first move under the chapter title |
| Expanded chapter header | "Done when: {milestone successCriterion}", one faint line |
| Gate row (steps all done) | "Close this chapter" with the successCriterion as body |
| Done rows in an expanded card | Optional subtle "done: {successCriterion}" line |
| Any other row tap | Existing NodeSheet briefing, unchanged (it already renders both boxes) |
| GoalList next row | Same first-move line plus Focus chip (currently the List renders neither field) |
| Desktop nicety | Hovering a future row reveals its first move as a title tooltip |

Empty legacy strings render nothing (`node.firstAction ? ... : null`, the NodeSheet guard). `clampStepDepth` guarantees all new nodes carry both fields.

---

## 7. ShowcaseTree and GoalList parity

- **GoalList** (Phase 4): swap `!parentId` milestones for `deriveChapters`, swap `nextNodeForGoal` import for the unified walker (same name, new behavior), add the first-move line, render sub-rows from `Step.subs`, render rhythms with pips. Keep its own list chrome (panel rows, strikethrough, "Open in map" chips); it shares the derivation and `nodeIcon`, not the map components.
- **ShowcaseTree** (Phase 5): demo data capped at 4 chapters x 2 steps. `>= 640px`: flex row of cards, one expanded, horizontal thread segments between; below: the vertical column. Auto-fit measurement (`[data-vis]` scale-to-fit) survives; the research sheet and idle hint survive; its layout fork is deleted.

---

## 8. Phases

Each phase ends green on `typecheck`, `build`, `test`, works in the app, and has a Vercel preview URL before the next begins.

**Phase 1: icons and first moves on the CURRENT map (no layout change).** `lib/kairo/node-icon.ts` plus tests; NodeOrb's center glyph becomes icon-first (dot eliminated); NodeOrb button gains Chip's `before:-inset` ring to reach 44px; the Next orb gains a one-line gold first-move plaque under its label; GoalList's next row gains the first-move line. Pure render changes, zero risk to layout. Estimate: 1 day. Users see the repetition fix immediately.

**Phase 2: one chronology authority.** `lib/kairo/chapters.ts` plus tests; `next-move.ts` rewritten (including `computeNextMove`); GalaxyMap's `nextId` deleted and the beacon pointed at the shared walker; GoalList and Today inherit it. Visible intended change: Map and List agree, and a finished chapter's milestone is offered as next before the following chapter's steps. Estimate: 1 day.

**Phase 3: the chapter column (the big one).** `ChapterColumn.tsx`; `GoalCluster` surgery; deletions per Section 4; fly-to framing; "Chapter n of N" planet line; QA at 375px, zoom extremes, drag/pinch, reduced motion, both themes. Land on a feature branch, verify on preview, then merge; no long-lived flag. Estimate: 2.5 to 3 days. Risk concentrates in gesture feel and the 2700-line file's interwoven state; both mitigations are specified (pointer pattern, no internal scroll, untouched shell).

**Phase 4: GoalList parity.** Section 7. Fixes the verified dropped-milestones bug. Estimate: 0.5 day.

**Phase 5: ShowcaseTree roadmap.** Section 7. The landing must match the product; it may lag one release but not more. Estimate: 1 day.

**Phase 6 (optional): AI icon key.** Section 3. Estimate: 0.5 day of code plus a manually applied migration.

Total: roughly 6 to 7 focused days. No new dependencies. Phases 1 to 5 require no schema change and no migration.

---

## 9. What this buys, in the owner's words

Icons on each node (resolver plus tiles), friendlier and more inviting (cards, warm gold you-are-here, one readable line of instruction instead of anonymous dots), easier to follow (numbers, one thread, top-to-bottom time on every screen), less repetitive (adjacent steps read PenLine / MessageCircle / Palette; chapters differ by number, icon, and state), and literally chronological (the render order IS the walker order IS the data's chain). The cosmos identity survives where it lives: the galaxy, the planets, the starfield, the glow of the lit thread.

---

## 10. Judge-flaw ledger

| # | Flaw | Fix |
|---|---|---|
| A | Chapters' "chapter = parentId null" is wrong: the AI verifiably emits milestones as a chain (m2 is a child of m1) | `deriveChapters` chain walk, Section 2, with tests for both chain and flat shapes |
| B | GoalList is currently broken with chain data (verified: it renders milestone 1, its steps, milestone 2 styled as a step, and silently drops milestones 3 to 5 and all their steps) | Phase 4 rebuild on `deriveChapters` |
| C | Verified walker trace: today a milestone is only offered as next after its ENTIRE downstream subtree (all later chapters) is done, so chapters can never be closed in order | Sequence puts the gate row after its own steps; "Close this chapter" moment |
| D | Map (`nextId`) and List (`nextNodeForGoal`) disagree about "next" | One walker in `next-move.ts`, Phase 2; `computeNextMove` reuses it |
| E | 38px leaf buttons under the 44px floor; blocked has no distinct visual | 44px minimum everywhere plus Phase 1 interim inset ring; blocked rows get amber tick plus microlabel |
| F | Card scroll vs map pan gesture conflict | No internal scroll regions; planet's down/up threshold pattern on rows; pan and pinch always reach the shell |
| G | Expanded card sizing under zoom | Cards scale as map objects; fly-to normalizes zoom on expand; no counter-scale complexity |
| H | Identical-dot repetition | Icon resolver with ordered collision-tested table; dot eliminated; fallbacks Flag / ArrowRight |
| I | Recurring practices have no place in a sequence | Rhythm strips in-chapter and under the planet; numbering skips them; kept-today logic preserved verbatim |
| J | Legacy rows carry empty firstAction/successCriterion | Conditional rendering, same guard NodeSheet uses today |
| K | Duplicate layout forks in GalaxyMap and ShowcaseTree | Both deleted; the column is CSS flow, so no shared layout engine is needed |
| L | Losing the constellation poetry | Galaxy view untouched; planet, thread glow, starfield gaps between floating cards carry the brand; collapsed state stays map-like |
| M | Migration risk (prod migrations never auto-apply) | Phases 1 to 5 are migration-free; the only column is optional Phase 6 with an explicit manual-apply step |

---

## Key files

- `/Users/zander/Documents/KairoApp/components/kairo/GalaxyMap.tsx` (cluster surgery, deletions)
- `/Users/zander/Documents/KairoApp/components/kairo/ChapterColumn.tsx` (new)
- `/Users/zander/Documents/KairoApp/lib/kairo/chapters.ts` (new)
- `/Users/zander/Documents/KairoApp/lib/kairo/node-icon.ts` (new)
- `/Users/zander/Documents/KairoApp/lib/kairo/next-move.ts` (rewrite)
- `/Users/zander/Documents/KairoApp/components/kairo/GoalList.tsx` (Phase 4)
- `/Users/zander/Documents/KairoApp/components/kairo/ShowcaseTree.tsx` (Phase 5)
- `/Users/zander/Documents/KairoApp/lib/ai/generate-goal-map.ts`, `/Users/zander/Documents/KairoApp/lib/ai/types.ts`, `/Users/zander/Documents/KairoApp/lib/kairo/goal-icon-keys.ts` (Phase 6 pattern and precedent)
- `/Users/zander/Documents/KairoApp/components/ui/Chip.tsx`, `/Users/zander/Documents/KairoApp/app/globals.css` (control language and motion kill switch, reference only)