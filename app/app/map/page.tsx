import type { Metadata } from "next";
import { getGoals } from "@/lib/data";
import { PageHeader } from "@/components/kairo/PageHeader";
import { MapExplorer } from "@/components/kairo/MapExplorer";

export const metadata: Metadata = { title: "Map · Kairo" };

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ goal?: string }>;
}) {
  const goals = await getGoals();
  const { goal } = await searchParams;

  return (
    <>
      <PageHeader
        eyebrow="Living map"
        title="Your goal, alive."
        description="Every branch is a step. Kairo pulses the next move and dims what can wait — tap a node to act on it."
      />
      <MapExplorer initialGoals={goals} initialGoalId={goal} />
    </>
  );
}
