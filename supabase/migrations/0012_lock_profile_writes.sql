-- Close the self-grant-Pro hole at the privilege level.
--
-- A signed-in user holds two public things: the anon key
-- (NEXT_PUBLIC_SUPABASE_ANON_KEY) and their own Clerk session JWT. Supabase
-- grants UPDATE on public tables to the `authenticated` role by default, and the
-- users_profile RLS policy is row-level (own row) with no column restriction —
-- so a user could PATCH their own row and set plan='pro' directly via PostgREST,
-- with no Stripe event.
--
-- The app never updates users_profile as the user (only INSERT in ensureProfile,
-- DELETE in deleteAccount). The ONLY update is the Stripe webhook via the
-- service-role client, which bypasses these grants. So revoke UPDATE entirely.
-- (If a user-editable profile field is ever added, switch to a per-column grant,
--  e.g. `grant update (display_name) on public.users_profile to authenticated;`.)

revoke update on public.users_profile from anon, authenticated;
