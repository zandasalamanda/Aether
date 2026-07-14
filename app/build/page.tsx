import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrbBackground } from "@/components/kairo/OrbBackground";
import { GuestBuild } from "@/components/kairo/GuestBuild";
import { isRemote } from "@/lib/data";
import { features } from "@/lib/config";

export const metadata: Metadata = { title: "Build your first map · Solaspace" };

// A top-level (un-gated) route so anonymous visitors can build a real starter map
// before signing up. Route protection is layout-based (only /app/* is gated), so
// this page is reachable without an account by design. Signed-in users don't need
// it — send them to their map.
export default async function BuildPage() {
  if (features.clerk) {
    const { auth } = await import("@clerk/nextjs/server");
    if ((await auth()).userId) redirect("/app/map");
  }
  return (
    <div className="relative">
      <OrbBackground />
      <GuestBuild remote={isRemote} />
    </div>
  );
}
