import * as React from "react";
import { OrbBackground } from "@/components/kairo/OrbBackground";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";
import type { SessionUser } from "@/lib/auth";

export function KairoShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <OrbBackground />
      <Sidebar user={user} className="hidden md:flex" />
      <div className="md:pl-[248px]">
        <TopBar user={user} className="md:hidden" />
        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 md:px-8 md:pb-14 md:pt-9">{children}</main>
      </div>
      <BottomNav className="md:hidden" />
    </div>
  );
}
