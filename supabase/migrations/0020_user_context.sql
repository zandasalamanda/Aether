-- What Sola knows about the user: optional, user-editable, RLS-scoped facts
-- that personalize plans. 0012 revoked UPDATE on users_profile entirely and
-- documented the escape hatch for user-editable fields: a per-column grant.
-- The profile_self policy (own row) still applies, so this restores writes to
-- exactly one column on the user's own row and nothing else (plan/stripe
-- columns stay locked).
--
-- REMINDER: apply to production by hand before deploying code that writes it.
alter table public.users_profile
  add column if not exists context jsonb not null default '{}'::jsonb;
comment on column public.users_profile.context is
  'UserContext jsonb: age band, schedule shape, step size, region, budget comfort. Optional, user-editable, never precise location.';
grant update (context) on public.users_profile to authenticated;
