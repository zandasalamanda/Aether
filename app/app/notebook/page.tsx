import type { Metadata } from "next";
import { getGoals, getNotes, isRemote } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/kairo/PageHeader";
import { NotebookApp } from "@/components/kairo/NotebookApp";

export const metadata: Metadata = { title: "Notebook · Solaspace" };

export default async function NotebookPage({ searchParams }: { searchParams: Promise<{ goal?: string }> }) {
  const [goals, notes, user, { goal }] = await Promise.all([getGoals(), getNotes(), getSessionUser(), searchParams]);
  return (
    <PageContainer user={user}>
      <PageHeader
        title="Notebook"
        description="Everything you want to keep. Sola reads it when it plans with you, unless you mark a note private."
      />
      <NotebookApp notes={notes} goals={goals} remote={isRemote} initialGoalId={goal} />
    </PageContainer>
  );
}
