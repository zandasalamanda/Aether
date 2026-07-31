All repo facts verified. Writing the spec now as my final output.

# Solaspace Notebook Revamp: The Build Spec

Backbone: the **goal-native** design (markdown-canonical notes, honesty-first phasing, library plus note page, per-note privacy, citations). Grafted in: the **docs-lite** derived `Goal.notes` compatibility mapper (all eight per-node AI call sites keep working unmodified) and its document-screen shape; the **boards** quick-capture bar, the "Add to notebook" chip on Sola replies, and the board view kept as a final earn-it phase so the Milanote half of the ask has a home without blocking anything.

Positioning line for copy and decisions alike: **the notebook your assistant reads.** Docs cannot copy that; Milanote cannot copy that. Every phase either makes notes better to live in or makes Sola visibly use them.

---

## Locked decisions

1. **Markdown is the canonical stored format** (`notes.body text`). The repo already has a safe, dependency-free renderer (`components/kairo/Markdown.tsx`, mermaid included), AI drafts already emit markdown, the legacy `goals.notes` blobs import with zero conversion, and mock mode plus Sola context stay plain strings. No ProseMirror jsonb, no second renderer, no derived `text_plain` mirror to maintain.
2. **Editor: Tiptap v3**, lazy-loaded, phase 3 only. StarterKit + TaskList/TaskItem + Link + Placeholder + `tiptap-markdown` for round-trip. MIT, headless (wears the raised-chip gold/black system), roughly 109 KB min+gz in one `next/dynamic` chunk that only `/app/notebook/[id]` in edit mode ever loads. Rejected: BlockNote (231 KB plus Mantine, paid AI packages, un-themeable), Lexical (open Android IME regressions, pre-1.0 DIY), Plate (shadcn-style copy-in UI, the exact case-insensitive-filesystem clobber class CLAUDE.md warns about). Until phase 3, editing stays the existing textarea plus preview, which is already acceptable on phones.
3. **No RAG, no embeddings.** A user has a handful of goals and dozens of notes; pinned-plus-recent selection under a character budget beats a vector stack on latency and noise at this scale. The schema leaves room to add a `tsvector` column later; nothing depends on it.
4. **Privacy model:** per-note `pinned` ("Stays on top. Sola always sees it.") and `sola_private` ("Private. Sola does not read this note."), plus one plainly worded sentence in the library footer: "Sola reads this notebook to plan with you. Private notes stay out. Notes are never used to train anything." Private notes are excluded at selection time, before any payload is built.
5. **Compatibility strategy:** `Goal.notes` stays in the type but becomes a derived AI-context digest (pinned then recent note bodies for that goal, capped 4000 chars). All eight existing per-node AI call sites (`GalaxyMap.tsx` 1133/1162/1212/2458/2473/2488/2503, `TodayPlanner.tsx` 304) and `extract-steps` keep compiling and improve for free, because the digest is relevance-ordered instead of the first 600 chars of a blob.
6. **Additive schema only.** `goals.notes` column is never dropped; it stops being written after phase 1 and remains archival. Migrations are applied manually via the Supabase MCP tools before each deploy (they never auto-run; this has bitten prod before).
7. **Demo mode** gets a real notebook for the first time: goal-less notes in localStorage (`kairo.notebook.v1` via `lib/store/persist.ts`), server actions stay `NO_OP` exactly like every other action. The vestigial `kairo.notes.v1` branch is deleted.

---

## Data model

### Migration: `supabase/migrations/0019_notes.sql`

(0018_step_depth.sql exists; 0019 is next. `user_id` is uuid to `users_profile`, and RLS uses `public.current_profile_id()`, matching `0016_node_evidence.sql` exactly.)

```sql
-- Notebook v2: many titled notes per user, goal/step-linkable, Sola-readable.
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  node_id uuid references public.goal_nodes(id) on delete set null,
  title text not null default '',
  body text not null default '',                -- markdown, canonical
  kind text not null default 'note' check (kind in ('note','daily')),
  source text not null default 'user' check (source in ('user','sola','focus','import')),
  day date,                                     -- set when kind = 'daily'
  pinned boolean not null default false,        -- top of library + always in Sola context
  sola_private boolean not null default false,  -- Sola never reads this note
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index if not exists notes_user_idx on public.notes(user_id, updated_at desc);
create index if not exists notes_goal_idx on public.notes(goal_id) where goal_id is not null;
create unique index if not exists notes_daily_idx on public.notes(user_id, day) where kind = 'daily';

alter table public.notes enable row level security;
create policy notes_own on public.notes
  for all using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());

-- Backfill: each goal's existing blob becomes that goal's first note. Idempotent.
insert into public.notes (user_id, goal_id, title, body, source, created_at)
select g.user_id, g.id, 'Imported notes', g.notes, 'import', now()
from public.goals g
where coalesce(trim(g.notes), '') <> ''
  and not exists (select 1 from public.notes n where n.goal_id = g.id and n.source = 'import');
```

Check `0001_init.sql` for an `updated_at` trigger convention on goals; if none exists, `updateNote` sets `updated_at: new Date().toISOString()` explicitly.

### Types: `types/index.ts`

```ts
export type NoteKind = "note" | "daily";
export type NoteSource = "user" | "sola" | "focus" | "import";
export interface Note {
  id: string;
  goalId: string | null;
  nodeId: string | null;
  title: string;
  /** markdown, canonical */
  body: string;
  kind: NoteKind;
  source: NoteSource;
  /** YYYY-MM-DD when kind = "daily" */
  day: string | null;
  pinned: boolean;
  solaPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}
```

`Goal.notes` keeps its `string` type; its doc comment changes to "derived AI-context digest of this goal's notes (pinned first, recent next, private excluded, capped 4000)".

---

## The Sola context contract

One pure module owns every budget: `lib/kairo/note-context.ts` (colocated `note-context.test.ts`). Nothing else slices note text.

```ts
/** Per-goal digest for Goal.notes and per-node AI calls. Pinned first, then
 *  updated_at desc. Excludes solaPrivate and archived. Format per note:
 *  "[title]\nbody" joined by blank lines. Hard cap 4000 chars. */
export function deriveGoalContext(notes: Note[], goalId: string): string;

/** Chat selection. Order: (1) pinned, newest first, body clamp 1200;
 *  (2) today's daily note, clamp 800; (3) notes whose goalId is in the plan,
 *  newest first, clamp 600. Stop at 12 entries or 6000 total body chars.
 *  Excludes solaPrivate and archived. Title clamp 120, goal title clamp 80. */
export function selectNotesForSola(notes: Note[], planGoalIds: string[], todayIso: string): SolaNotebookEntry[];

/** Phase 4: node-scoped relevance. nodeId-linked notes first, then pinned,
 *  then goal recency, same format and cap as deriveGoalContext. */
export function buildNodeContext(notes: Note[], goalId: string, nodeId: string | null): string;
```

Wire contract with `lib/ai/ask-sola.ts` and its route:

```ts
// lib/ai/types.ts
export interface SolaNotebookEntry { id: string; title: string; goal?: string; body: string }
export interface AskSolaInput { message: string; plan: SolaPlanGoal[]; notebook?: SolaNotebookEntry[] }
export interface AskSolaResult { reply: string; changes: SolaChange[]; sources?: string[] }
```

- `buildUser()` appends after the plan: `Notebook:\nNOTE [id] "title" (goal: X)\nbody` per entry, or nothing when empty.
- Route (`app/api/ai/ask-sola/route.ts`) re-clamps server-side with the existing `clampText` idiom: max 12 entries, id 60, title 120, goal 80, body 1200 each, and drops entries once summed bodies pass 6000. Never trust the client.
- SYSTEM gains (phase 2): return `"sources": [ids]` of Notebook notes actually used, only ids present in Notebook, empty or omitted when none; plus one behavioral line, "Ground your reply in the Notebook when relevant; do not quote notes back at length."
- `clean(r, plan, notebookIds)` filters `sources` to known ids, caps at 4.
- Guard: rides the existing ask-sola meter (weight 2, `featureFreeDaily: 2`) untouched. No new endpoints anywhere in phases 0 to 4, so no new meters and no new App Store 3.1.1 surface; the native-shell upgrade-stripping in `guardAi` keeps applying as-is.
- Write-back is always proposed, never silent: phase 2 adds a client "Add to notebook" chip on Sola replies; phase 4 adds a `note` change kind to the existing accept/dismiss diff.
- Per-node calls: phase 1 gives them the derived digest through `Goal.notes` with zero call-site edits; phase 2 raises the route context clamps (ask-node 1200 to 2000; draft, work-session, unblock, research 600 to 1500; replan 600 to 1000) so the digest is not amputated; phase 4 upgrades the call sites to `buildNodeContext` for node-linked relevance. `extract-steps` keeps its types and 4000 clamp, now fed `note.body`.

---

## Phase 0: make the promise true (1 day)

The Notebook UI has claimed "Solaspace reads these notes" while `buildUser()` sent zero note content. Close the gap before building anything.

**Files**
- `lib/ai/types.ts`: add `SolaNotebookEntry`, `AskSolaInput.notebook?`.
- `lib/ai/ask-sola.ts`: Notebook section in `buildUser()`.
- `app/api/ai/ask-sola/route.ts`: parse and clamp `b.notebook` per the contract above.
- `components/kairo/AskSola.tsx`: in `send()`, build `notebook` from the goals prop, one entry per active goal with non-empty `notes` (`id: g.id, title: "Notes", goal: g.title, body: g.notes.slice(0, 1000)`).
- `lib/ai/mock.ts` (or wherever the deterministic ask-sola mock lives): when `notebook` is non-empty, the mock reply references the first entry so no-key mode demos the behavior.

**Tests:** new `lib/ai/ask-sola.test.ts` asserting `buildUser` renders the Notebook section and omits it when empty; route clamp unit on entry and total budgets.

**What the user sees:** ask Sola "what did I write about my race nutrition" and it answers from the notebook. No visual change.

## Phase 1: many notes, not one blob (4 to 6 days)

**Migration:** apply `0019_notes.sql` via Supabase MCP first; verify backfill row count against goals with non-empty notes.

**Data layer**
- `lib/data/mappers.ts`: `NoteRow`, `rowToNote`.
- `lib/data/index.ts`: `getNotes = cache(...)` (user's non-archived notes, `updated_at desc`; `[]` when `!isRemote`, matching `getGoals`). `getGoals` calls `getNotes()` and overwrites each goal's `notes` with `deriveGoalContext(...)`, falling back to the legacy column when a goal has no note rows.
- `lib/data/actions.ts`: `createNote` (client-supplied `id` via `newId()` like `addNode`; title slice 200, body slice 40000; revalidates `/app/notebook` only), `updateNote` (no revalidate, same reasoning as the old `setGoalNotes` comment: do not clobber the debounced editor), `setNoteFlags` ({pinned?, solaPrivate?}), `archiveNote` (sets `archived_at`, revalidates `/app/notebook`). Delete `setGoalNotes` once its three callers are gone.
- `lib/kairo/note-context.ts` with `deriveGoalContext` and `selectNotesForSola`.

**Screens**
- `app/app/notebook/page.tsx`: fetches `getGoals()`, `getNotes()`, `?goal=`; renders `NotebookLibrary`.
- `components/kairo/NotebookLibrary.tsx` (client): capture bar at top (Input + existing `MicButton` + one raised-gold "New note"); search-as-you-type over title and body (client-side filter); chip row All, one per goal (existing goal icon and color idiom), Loose; note rows as `panel` cards, pinned first, each with title, one-line snippet, goal chip, relative time in mono micro-label, a small lock glyph when private. Footer carries the trust sentence. Empty states: no goals still points to the map; a filtered goal with no notes offers "Start a note for this goal".
- `app/app/notebook/[id]/page.tsx` + `components/kairo/NotePage.tsx` (client): borderless font-display title input; body as read view (existing `Markdown.tsx`) with Edit toggle to the textarea; the current 700ms debounce, flush-on-blur, "Saved / Saving" mono label, all lifted from today's `Notebook.tsx`; footer row with goal link picker, Pin, Private, "Turn into steps" (existing `extractSteps` flow, hidden for goal-less notes), "Open in map", Archive.
- Demo: both screens hydrate from `kairo.notebook.v1` via `usePersistentState` when `!remote`; the demo notebook finally works instead of showing EmptyState.

**Writer retargeting:** `GalaxyMap.appendGoalNote` (lines 1192 to 1203) and `TodayPlanner.appendNote` (lines 266 to 272) stop concatenating `--- Label ---` stamps and instead call `createNote({goalId, nodeId, title: label, body, source: "sola" | "focus"})`. The "Saved to notebook" toast stays. `components/kairo/Notebook.tsx` is deleted.

**Tests:** `note-context.test.ts` (digest ordering, private exclusion, 4000 cap); mapper defaults; a library filter unit; keep `extract-steps` tests green.

**What the user sees:** the notebook becomes a real notes app: titled, searchable, goal-linked notes with instant reading on a phone, and every Sola draft saved from the map or a focus session becomes a findable note instead of vanishing into a blob.

## Phase 2: Sola reads it properly, with receipts (3 to 4 days)

**Files**
- `components/kairo/AskSola.tsx` and `components/kairo/MapView.tsx`: MapView passes a `notes` prop (map page fetches `getNotes()`); `send()` switches from goal blobs to `selectNotesForSola(...)`; replies render source chips "From your notes: {title}" linking `/app/notebook/[id]`, and an "Add to notebook" chip on any reply that creates a note (`source: "sola"`, goal-scoped when a cited note or change targets one goal).
- `lib/ai/ask-sola.ts`: SYSTEM sources instruction; `clean()` validates `sources` against sent ids.
- Route clamp raises in `app/api/ai/ask-node`, `draft`, `work-session`, `unblock`, `research`, `replan` route files per the contract table.
- `NotePage` flag toggles wired to `setNoteFlags`; library shows the pinned and private states.
- Mock ask-sola output emits a valid `sources` array when notebook entries are present.

**Tests:** `selectNotesForSola` budget math and ordering; `clean()` drops invented source ids; chip rendering unit for a reply with sources.

**What the user sees:** Sola cites the exact note it used, by name, tappable. Pin a note and Sola always knows it; mark one private and it provably never leaves the device toward a model.

## Phase 3: the real editor (5 to 7 days)

**Dependencies:** `@tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-task-list @tiptap/extension-task-item @tiptap/extension-link @tiptap/extension-placeholder tiptap-markdown`.

**Files**
- `components/kairo/NoteEditor.tsx`: the only file importing Tiptap. Markdown in, markdown out (`tiptap-markdown`, `html: false`); input rules for `#`, `-`, `1.`, `[]`, `>`, backticks; a slim fixed toolbar of raised-btn chips (bold, italic, H2, bullet, numbered, task, quote, code, link) docked above the keyboard on mobile, respecting `--sa-bottom`. No slash menus, no bubble menus; quiet is the brand.
- `components/kairo/NotePage.tsx`: `const NoteEditor = dynamic(() => import("./NoteEditor"), { ssr: false })`, mounted only when the user enters edit mode; read view stays `Markdown.tsx` and costs zero editor bytes; textarea remains the fallback if the chunk fails to load. Autosave pipeline unchanged (serialize to markdown into the same debounce).
- `components/kairo/Markdown.tsx`: render `- [ ]` / `- [x]` task items; optional `onToggleTask(index, checked)` prop makes them tappable in read view, and NotePage flips the nth marker in the body and saves. Checking off a to-do on a phone never loads the editor.

**Bundle verification (gate to merge):** `npm run build` route table before and after; `/app/map` and `/app/today` first-load JS unchanged; the Tiptap chunk appears only under the note route. Run `impeccable` on the two notebook screens. Budget a full day of real-device mobile typing QA (IME, autocorrect, keyboard toolbar).

**Tests:** markdown round-trip fixtures through the editor's serialize/parse (headings, nested lists, tasks, links, code, and a ```mermaid fence surviving untouched); Markdown task-index mapping unit.

**What the user sees:** editing feels like Bear or Notion-lite in Solaspace's own skin, and nothing anywhere else got slower.

## Phase 4: the day loop and deeper Sola (4 to 5 days)

- Daily note: `ensureDailyNote` action (insert `kind: "daily"`, `day` from the client's local date, tolerate the unique-index race by re-selecting); "Today's note" one-line entry on the Today screen; daily note header shows the date and a link to yesterday's.
- Ambient resurfacing: NodeSheet in `GalaxyMap.tsx` shows a "From your notebook" row (up to 2 title-plus-snippet links) when notes match the node or goal, using the `notes` prop already flowing since phase 2. Same treatment in `FocusOverlay`.
- `buildNodeContext` lands in `note-context.ts` and replaces the derived-digest reads at the eight per-node call sites, so a step's own linked notes outrank everything.
- Sola proposes notes: `SolaChangeKind` gains `"note"` (`{kind: "note", goalId?, title, body, reason}`, title clamp 90, body clamp 4000) in SYSTEM, `clean()`, the `META` map (NotebookPen icon), and `apply()` (calls `createNote`). "Save that as a note for my marathon" now goes through the same accept/dismiss diff as plan changes. Mock emits one on a "save this" style message.

**Tests:** `buildNodeContext` ordering; `clean()` validation of the note change kind; daily uniqueness action unit.

**What the user sees:** the notebook participates in the daily rhythm, notes surface next to the step being worked, and Sola can file a note only when the user approves it.

## Phase 5: images (2 to 3 days)

Private Supabase Storage bucket `notebook-images` with per-user path RLS (first folder = profile id). Server action issues a signed upload URL; the editor's image button and the capture bar's photo button upload and insert `![alt](path)`; the note page resolves paths to signed display URLs server-side and passes the map to `Markdown.tsx`, which renders images only for the app's storage host. Image upload disabled in demo with a one-line hint.

## Phase 6: the board, only if usage earns it (5 to 7 days)

The Milanote answer, deferred until phases 1 to 4 prove retention. Additive migration `notes` columns `x, y, w double precision, color text`; extract the map's proven pointer/pinch/wheel transform logic into a shared `usePanZoom` hook; `SegmentedControl` List | Board on the library; unplaced notes sit in a collapsible edge tray until dragged out, so list and board stay one dataset. Phones keep list as default. Skip connector lines and card kinds until the board itself is used.

---

## Explicitly out, at every phase

Realtime collaboration, comments, public share links for notes, folders (goal chips are the folders), tables-as-databases, embeddings, auto-filing of anything without an accept step. Those are Docs' and Notion's turf and the wrong fight for a single-user execution app.

## Definition of done, every phase

`npm run typecheck`, `npm run build`, `npm run test` (vitest) green; feature verified in the running app including demo mode (`dev:demo`); migration applied manually to Supabase before deploy; working Vercel preview URL. Core scope (phases 0 to 4) is roughly 3.5 to 4.5 working weeks for one developer, and every phase ships alone: phase 0 makes the app honest in a day, phase 1 retires the blob, phase 2 delivers the moat, and everything after that compounds it.

Key files: `/Users/zander/Documents/KairoApp/components/kairo/Notebook.tsx` (deleted in phase 1), `/Users/zander/Documents/KairoApp/app/app/notebook/page.tsx`, `/Users/zander/Documents/KairoApp/components/kairo/AskSola.tsx`, `/Users/zander/Documents/KairoApp/components/kairo/MapView.tsx`, `/Users/zander/Documents/KairoApp/components/kairo/GalaxyMap.tsx`, `/Users/zander/Documents/KairoApp/components/kairo/TodayPlanner.tsx`, `/Users/zander/Documents/KairoApp/components/kairo/FocusOverlay.tsx`, `/Users/zander/Documents/KairoApp/components/kairo/Markdown.tsx`, `/Users/zander/Documents/KairoApp/lib/ai/ask-sola.ts`, `/Users/zander/Documents/KairoApp/lib/ai/types.ts`, `/Users/zander/Documents/KairoApp/app/api/ai/ask-sola/route.ts`, `/Users/zander/Documents/KairoApp/lib/data/actions.ts`, `/Users/zander/Documents/KairoApp/lib/data/index.ts`, `/Users/zander/Documents/KairoApp/lib/data/mappers.ts`, `/Users/zander/Documents/KairoApp/types/index.ts`, `/Users/zander/Documents/KairoApp/lib/kairo/note-context.ts` (new), `/Users/zander/Documents/KairoApp/supabase/migrations/0019_notes.sql` (new).