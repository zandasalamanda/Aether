import type { Metadata } from "next";
import { getGoals } from "@/lib/data";
import { PageHeader } from "@/components/kairo/PageHeader";
import { TodayBuilder } from "@/components/kairo/TodayBuilder";

export const metadata: Metadata = { title: "Today · Kairo" };

export default async function TodayPage() {
  const goals = await getGoals();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <>
      <PageHeader eyebrow={today} title="Build today around what matters." description="Tell Kairo your time and energy. It maps the most efficient plan for the hours you actually have." />
      <TodayBuilder goals={goals} />
    </>
  );
}
