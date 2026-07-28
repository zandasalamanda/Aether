-- Recurring practices: a step can be a practice kept on a cadence ("gym 4x a
-- week", "20 minutes of Spanish daily") rather than a one-shot task. `kind`
-- separates the two, `target_per_week` is the cadence, and `checkins` records
-- the local days a session was actually logged. Absent/default values leave
-- every existing node meaning exactly what it meant.
alter table public.goal_nodes
  add column if not exists kind text not null default 'once' check (kind in ('once','recurring')),
  add column if not exists target_per_week integer check (target_per_week between 1 and 7),
  add column if not exists checkins jsonb not null default '[]'::jsonb;

comment on column public.goal_nodes.kind is
  'once = a one-shot step; recurring = a practice kept on a weekly cadence.';
comment on column public.goal_nodes.target_per_week is
  'Recurring only: sessions the practice asks for per week (7 = daily).';
comment on column public.goal_nodes.checkins is
  'Recurring only: JSON array of local days ("YYYY-MM-DD") with a logged session.';
