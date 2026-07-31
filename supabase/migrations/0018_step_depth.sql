-- A step is a briefing, not a title. first_action and success_criterion are
-- real columns (the map, Today, and the scheduler read them on every node
-- without parsing). briefing and research land now but are filled lazily by a
-- later phase; null means "not yet enriched". Absent/default values leave
-- every existing node meaning exactly what it meant.
--
-- REMINDER: migrations are never applied automatically. Apply this to the
-- production project by hand before deploying code that selects these columns,
-- or goal creation breaks exactly the way 0017 broke it.
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
  'StepBriefing jsonb (enrichment phase), null = not enriched yet.';
comment on column public.goal_nodes.research is
  'Persisted ResearchResult + fetchedAt, null = never researched.';
