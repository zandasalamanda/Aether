-- Clarifier answers used to be folded into one prompt string and thrown away.
-- Persist them per goal so every later per-step call (briefings, research,
-- replans) can use what the user already said without asking again.
--
-- REMINDER: migrations are never applied automatically. Apply to production
-- by hand before deploying code that writes this column.
alter table public.goals
  add column if not exists intake jsonb not null default '{}'::jsonb;
comment on column public.goals.intake is
  'Clarifier question -> answer pairs captured at goal creation, plus freeText.';
