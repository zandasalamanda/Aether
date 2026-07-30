import { redirect } from "next/navigation";
import type { Plan } from "@/types";
import { buildSeed } from "@/lib/mock/seed";
import { features } from "@/lib/config";
import { isAdminEmail } from "@/lib/admin";
import { ensureProfile } from "@/lib/data/profile";
import { isNativeRequest } from "@/lib/native";

/** True only for the signed-in user if their verified Clerk email is allowlisted. */
export async function isAdmin(): Promise<boolean> {
  if (!features.clerk) return false;
  const { currentUser } = await import("@clerk/nextjs/server");
  const u = await currentUser();
  return isAdminEmail(u?.primaryEmailAddress?.emailAddress);
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  initials: string;
  /**
   * True when the request came from the native iOS shell.
   *
   * `plan` is the user's real plan on every platform — App Store Guideline
   * 3.1.3(b) (multiplatform services) lets an entitlement bought on the web
   * light up on iOS. What the iOS build must never show is a PURCHASE path, so
   * every surface that upsells (upgrade cards, billing links, price text)
   * branches on this flag to stay hidden natively.
   */
  native: boolean;
}

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

/**
 * The current user. Uses Clerk when configured (redirecting anonymous visitors
 * to sign-in); otherwise returns the seeded demo user so the app is explorable.
 */
export async function getSessionUser(): Promise<SessionUser> {
  const native = await isNativeRequest();

  if (features.clerk) {
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
    const u = await currentUser();
    const name = u?.fullName || u?.firstName || u?.username || "You";
    // Provision the Supabase profile on first sign-in and read the real plan.
    const profile = features.supabase ? await ensureProfile() : null;
    return {
      id: userId,
      name,
      email: u?.primaryEmailAddress?.emailAddress ?? "",
      // App Store Guideline 3.1.3(b) (multiplatform services): a subscription
      // bought on the web is honoured in the iOS app too. The native build hides
      // the PURCHASE path (see the `native` flag above), not the entitlement.
      plan: profile?.plan ?? "free",
      initials: initialsOf(name),
      native,
    };
  }

  const p = buildSeed().profile;
  return {
    id: p.id,
    name: p.displayName,
    email: p.email,
    plan: p.plan,
    initials: initialsOf(p.displayName),
    native,
  };
}
