import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { getPlan } from "@/lib/data";
import { getAiUsage } from "@/lib/ai/usage";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/kairo/PageHeader";
import { AdminPanel } from "@/components/kairo/AdminPanel";

export const metadata: Metadata = { title: "Admin · Solaspace" };

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/app");
  const user = await getSessionUser();
  const plan = await getPlan();
  const usage = await getAiUsage(user.id, plan);
  return (
    <PageContainer user={user}>
      <PageHeader eyebrow="Dev" title="Admin" description="Testing tools — visible only to you." />
      <AdminPanel usage={usage} email={user.email} />
    </PageContainer>
  );
}
