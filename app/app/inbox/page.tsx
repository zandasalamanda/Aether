import type { Metadata } from "next";
import { getInbox } from "@/lib/data";
import { PageHeader } from "@/components/kairo/PageHeader";
import { InboxBoard } from "@/components/kairo/InboxBoard";

export const metadata: Metadata = { title: "Inbox · Kairo" };

export default async function InboxPage() {
  const items = await getInbox();

  return (
    <>
      <PageHeader
        eyebrow="Mental clutter → order"
        title="Inbox"
        description="Drop every loose idea, task, and worry here. Kairo sorts them by what's urgent and what actually matters."
      />
      <InboxBoard initialItems={items} />
    </>
  );
}
