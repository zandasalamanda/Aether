-- Stripe billing hardening (launch).
--
-- 1) Remove the anon-callable apply_subscription RPC. Plan changes now happen
--    ONLY server-side, via the service-role client in the Stripe webhook — so a
--    client holding the public anon key can no longer self-grant Pro.
-- 2) Widen subscription_status to accept every Stripe subscription status, so a
--    real webhook update can never be rejected by the CHECK constraint.

drop function if exists public.apply_subscription(uuid, text, text, text, text);

alter table public.users_profile
  drop constraint if exists users_profile_subscription_status_check;

alter table public.users_profile
  add constraint users_profile_subscription_status_check
  check (subscription_status in (
    'inactive','trialing','active','past_due','canceled',
    'unpaid','paused','incomplete','incomplete_expired'
  ));
