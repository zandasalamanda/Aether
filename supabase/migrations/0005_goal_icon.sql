-- A goal carries an AI-chosen icon key (from a fixed vocabulary — see
-- lib/kairo/goal-icon-keys.ts) for a bit of identity next to its name.
alter table public.goals add column if not exists icon text;
