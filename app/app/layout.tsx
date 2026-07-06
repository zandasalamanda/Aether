import { getSessionUser } from "@/lib/auth";
import { getGoals } from "@/lib/data";
import { computeNextMove } from "@/lib/kairo/next-move";
import { KairoShell } from "@/components/layout/KairoShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, goals] = await Promise.all([getSessionUser(), getGoals()]);
  const nextMove = computeNextMove(goals);
  return (
    <KairoShell user={user} nextMove={nextMove}>
      {children}
    </KairoShell>
  );
}
