import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSharedGoal } from "@/lib/data/shared";
import { SharedGoalView } from "@/components/kairo/SharedGoalView";

type Params = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token } = await params;
  const shared = await getSharedGoal(token);
  if (!shared) return { title: "Shared plan · Solaspace" };
  const title = `${shared.goal.title} · a plan on Solaspace`;
  const description = shared.goal.description || `A step-by-step goal plan mapped with Solaspace. Map your own version free.`;
  return {
    title,
    description,
    // Opt-in shared maps are anonymous (token URL, no identity) and explicitly shared,
    // so they're indexable — a proud plan is the app's best word-of-mouth surface.
    robots: { index: true, follow: true },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SharedGoalPage({ params }: Params) {
  const { token } = await params;
  const shared = await getSharedGoal(token);
  if (!shared) notFound();
  return <SharedGoalView shared={shared} />;
}
