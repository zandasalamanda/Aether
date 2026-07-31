import "server-only";
import { cache } from "react";
import { getScopedClient } from "@/lib/supabase/scoped";
import { rowToProfile, type ProfileRow } from "./mappers";
import type { UserProfile } from "@/types";

/**
 * Ensure a `users_profile` row exists for the signed-in user and return it.
 * Runs on the user's first authenticated request (RLS lets a user insert only
 * their own row). Memoized per request. Returns null in demo mode.
 */
export const ensureProfile = cache(async (): Promise<UserProfile | null> => {
  const scoped = await getScopedClient();
  if (!scoped) return null;
  const { supabase, clerkUserId } = scoped;

  const existing = await supabase
    .from("users_profile")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  if (existing.data) return rowToProfile(existing.data as ProfileRow);

  const { currentUser } = await import("@clerk/nextjs/server");
  const u = await currentUser();
  const email = u?.primaryEmailAddress?.emailAddress ?? "";
  const displayName = u?.fullName || u?.firstName || u?.username || "You";

  const inserted = await supabase
    .from("users_profile")
    .insert({ clerk_user_id: clerkUserId, email, display_name: displayName })
    .select()
    .single();
  if (inserted.data) return rowToProfile(inserted.data as ProfileRow);

  // Lost a race with a concurrent request. The row now exists; read it back.
  const retry = await supabase
    .from("users_profile")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  return retry.data ? rowToProfile(retry.data as ProfileRow) : null;
});

/** The signed-in user's profile id (the uuid goals/inbox are keyed on). */
export const currentProfileId = cache(async (): Promise<string | null> => {
  const p = await ensureProfile();
  return p?.id ?? null;
});

/**
 * What Sola knows, for server-side prompt injection. Cached per request like
 * ensureProfile; returns null when signed out or in demo mode (the demo
 * mirrors context in localStorage and injects client-side instead).
 */
export const loadUserContext = cache(async (): Promise<import("@/lib/ai/types").UserContext | null> => {
  const scoped = await getScopedClient();
  const profile = await ensureProfile();
  if (!scoped || !profile) return null;
  const res = await scoped.supabase.from("users_profile").select("context").eq("id", profile.id).maybeSingle();
  return (res.data?.context as import("@/lib/ai/types").UserContext | null) ?? null;
});
