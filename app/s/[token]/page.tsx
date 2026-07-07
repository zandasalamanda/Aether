import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSharedGoal } from "@/lib/data/shared";
import { SharedGoalView } from "@/components/kairo/SharedGoalView";

type Params = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token } = await params;
  const shared = await getSharedGoal(token);
  if (!shared) return { title: "Shared plan · Aether" };
  return {
    title: `${shared.goal.title} · Aether`,
    description: shared.goal.description || `A goal plan mapped with Aether.`,
    robots: { index: false },
  };
}

export default async function SharedGoalPage({ params }: Params) {
  const { token } = await params;
  const shared = await getSharedGoal(token);
  if (!shared) notFound();
  return <SharedGoalView shared={shared} />;
}
