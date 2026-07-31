import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { getProfile, getPlan } from "@/lib/data";
import { getAiUsage } from "@/lib/ai/usage";
import { clerkPublic } from "@/lib/config";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader, SectionLabel } from "@/components/kairo/PageHeader";
import { SettingsForm } from "@/components/kairo/SettingsForm";
import { ThemeToggle } from "@/components/kairo/ThemeToggle";
import { NotificationSettings } from "@/components/kairo/NotificationSettings";
import { UsageMeter } from "@/components/kairo/UsageMeter";

export const metadata: Metadata = { title: "Settings · Solaspace" };

const LEGAL_LINKS: { href: string; label: string; hint: string }[] = [
  { href: "/privacy", label: "Privacy Policy", hint: "What we store, and what we never do with it" },
  { href: "/terms", label: "Terms of Service", hint: "The agreement covering your use of Solaspace" },
];

export default async function SettingsPage() {
  const user = await getSessionUser();
  const profile = clerkPublic ? await getProfile() : null;
  const plan = clerkPublic ? await getPlan() : "free";
  const usage = clerkPublic ? await getAiUsage(user.id, plan) : null;
  const admin = clerkPublic ? await isAdmin() : false;
  return (
    <PageContainer user={user}>
      <PageHeader eyebrow="You & Solaspace" title="Settings" description="Tune how Solaspace plans and speaks." />
      <div className="space-y-5">
        <SettingsForm user={user} />
        <ThemeToggle />
        {usage && <UsageMeter {...usage} native={user.native} />}
        {profile && (
          <NotificationSettings
            initial={{
              email: profile.notifyEmail ?? true,
              deadlines: profile.notifyDeadlines ?? true,
              nudges: profile.notifyNudges ?? true,
              digest: profile.notifyDigest ?? true,
            }}
          />
        )}
        {/* App Store Guideline 5.1.1(i): a privacy policy must be reachable from inside
            the binary. Deliberately NOT gated on `user.native` so it exists on every
            platform, and internal routes so nothing leaves the WKWebView. */}
        <div className="panel rounded-2xl p-6">
          <SectionLabel className="mb-1.5">Legal</SectionLabel>
          <p className="mb-4 text-[13px] text-muted">How Solaspace handles your data, and the terms you use it under.</p>
          <div className="inset-well grid gap-1.5 rounded-2xl p-1.5">
            {LEGAL_LINKS.map(({ href, label, hint }) => (
              <Link
                key={href}
                href={href}
                className="raised-btn flex min-h-[44px] items-center justify-between gap-3 rounded-xl px-4 py-3 text-muted hover:text-ink"
              >
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-ink">{label}</span>
                  <span className="block text-[12px] text-faint">{hint}</span>
                </span>
                <ChevronRight size={17} className="shrink-0 text-faint" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
        {admin && (
          <Link href="/app/admin" className="raised-btn mx-auto flex min-h-11 w-fit items-center rounded-xl px-5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ink">
            Admin panel &rarr;
          </Link>
        )}
      </div>
    </PageContainer>
  );
}
