import { getSessionUser } from "@/lib/auth";
import { KairoShell } from "@/components/layout/KairoShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return <KairoShell user={user}>{children}</KairoShell>;
}
