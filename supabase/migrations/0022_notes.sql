-- Notebook v2: many titled notes per user, goal- and step-linkable, and
-- readable by Sola as working memory.
--
-- The old notebook was ONE textarea per goal, stored in goals.notes. You could
-- not have two notes about a goal, could not write a note that belonged to no
-- goal, and had nothing to title or find. goals.notes is never dropped: it
-- stops being written after this and stays as an archival column, and every
-- existing blob is imported below as that goal's first note.
--
-- REMINDER: migrations never run on deploy. Apply this by hand to production
-- before shipping code that reads the table.
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
  pinned boolean not null default false,        -- top of the library, always in Sola's context
  sola_private boolean not null default false,  -- Sola never reads this note
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists notes_user_idx on public.notes(user_id, updated_at desc);
create index if not exists notes_goal_idx on public.notes(goal_id) where goal_id is not null;
create unique index if not exists notes_daily_idx on public.notes(user_id, day) where kind = 'daily';

alter table public.notes enable row level security;
drop policy if exists notes_own on public.notes;
create policy notes_own on public.notes
  for all using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());

comment on table public.notes is
  'Notebook v2. Markdown is canonical. sola_private excludes a note from every AI context.';

-- Backfill: each goal's existing blob becomes that goal's first note. Idempotent.
insert into public.notes (user_id, goal_id, title, body, source, created_at)
select g.user_id, g.id, 'Imported notes', g.notes, 'import', now()
from public.goals g
where coalesce(trim(g.notes), '') <> ''
  and not exists (select 1 from public.notes n where n.goal_id = g.id and n.source = 'import');
