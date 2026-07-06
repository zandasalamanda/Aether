import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { PageHeader } from "@/components/kairo/PageHeader";
import { SettingsForm } from "@/components/kairo/SettingsForm";

export const metadata: Metadata = { title: "Settings · Kairo" };

export default async function SettingsPage() {
  const user = await getSessionUser();
  return (
    <>
      <PageHeader eyebrow="You & Kairo" title="Settings" description="Tune how Kairo plans and speaks. Changes shape every plan it builds." />
      <SettingsForm user={user} />
    </>
  );
}
