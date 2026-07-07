-- A step can carry a "resource" — a search intent (not a URL, to avoid dead
-- links) the UI turns into a one-tap "Watch / Read / Practice" chip. Folded
-- into the goal-map AI output; persisted here so it survives reloads.
alter table public.goal_nodes
  add column if not exists resource_kind text check (resource_kind in ('watch','read','practice')),
  add column if not exists resource_label text,
  add column if not exists resource_query text;
