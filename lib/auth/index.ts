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
   * Kept separate from `plan` on purpose. The native build resolves everyone to
   * the free tier (see below), but several surfaces branch on `plan === "free"`
   * to show an *upgrade* prompt, so collapsing the two would switch those
   * prompts on in exactly the build that must never show them.
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
      // App Store Guideline 3.1.1: the iOS build may not unlock paid features
      // bought outside the app. Apple rejects *consuming* an external purchase,
      // not merely selling one, so hiding the upgrade button is not enough. The
      // native build serves the free tier to everyone until StoreKit ships.
      plan: native ? "free" : (profile?.plan ?? "free"),
      initials: initialsOf(name),
      native,
    };
  }

  const p = buildSeed().profile;
  return {
    id: p.id,
    name: p.displayName,
    email: p.email,
    plan: native ? "free" : p.plan,
    initials: initialsOf(p.displayName),
    native,
  };
}
