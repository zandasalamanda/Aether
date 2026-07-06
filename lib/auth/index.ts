import type { Plan } from "@/types";
import { buildSeed } from "@/lib/mock/seed";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  initials: string;
}

/**
 * Returns the current user. Clerk integration point: when Clerk is configured,
 * resolve the signed-in user here. In demo mode we return the seeded user so
 * every protected route is reachable and the preview is fully explorable.
 */
export async function getSessionUser(): Promise<SessionUser> {
  const p = buildSeed().profile;
  const initials = p.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return { id: p.id, name: p.displayName, email: p.email, plan: p.plan, initials };
}
