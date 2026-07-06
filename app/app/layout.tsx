import { getSessionUser } from "@/lib/auth";
import { getGoals } from "@/lib/data";
import { computeNextMove } from "@/lib/kairo/next-move";
import { KairoShell } from "@/components/layout/KairoShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, goals] = await Promise.all([getSessionUser(), getGoals()]);
  // No goals? The galaxy map (home) is the first-run experience — it invites
  // you to create your first goal right there, so no forced onboarding detour.
  const nextMove = computeNextMove(goals);
  return (
    <KairoShell user={user} nextMove={nextMove}>
      {children}
    </KairoShell>
  );
}
