import type { Metadata } from "next";
import { getGoals, getTodayPlan } from "@/lib/data";
import { generateReview } from "@/lib/ai/generate-review";
import { PageHeader } from "@/components/kairo/PageHeader";
import { ReviewPanel } from "@/components/kairo/ReviewPanel";

export const metadata: Metadata = { title: "Review · Kairo" };

export default async function ReviewPage() {
  const [goals, plan] = await Promise.all([getGoals(), getTodayPlan()]);
  const review = await generateReview({ goals, recentPlan: plan });

  return (
    <>
      <PageHeader
        eyebrow="What changed"
        title="Where things stand."
        description="Kairo keeps your plan honest — what moved, what's slipping, and the one best move to stay on track."
      />
      <ReviewPanel review={review} />
    </>
  );
}
