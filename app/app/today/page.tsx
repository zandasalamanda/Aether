import type { Metadata } from "next";
import { getGoals, isRemote } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import { PageContainer } from "@/components/layout/PageContainer";
import { TodayPlanner } from "@/components/kairo/TodayPlanner";

export const metadata: Metadata = { title: "Today · Solaspace" };

export default async function TodayPage() {
  const [goals, user] = await Promise.all([getGoals(), getSessionUser()]);
  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const dayKey = now.toISOString().slice(0, 10);
  return (
    <PageContainer user={user}>
      <TodayPlanner goals={goals} remote={isRemote} dayKey={dayKey} dateLabel={dateLabel} />
    </PageContainer>
  );
}
