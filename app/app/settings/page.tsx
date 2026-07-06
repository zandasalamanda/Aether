import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/kairo/PageHeader";
import { SettingsForm } from "@/components/kairo/SettingsForm";

export const metadata: Metadata = { title: "Settings · Aether" };

export default async function SettingsPage() {
  const user = await getSessionUser();
  return (
    <PageContainer user={user}>
      <PageHeader eyebrow="You & Aether" title="Settings" description="Tune how Aether plans and speaks." />
      <SettingsForm user={user} />
    </PageContainer>
  );
}
