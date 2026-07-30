import type { Metadata } from "next";
import { OrbBackground } from "@/components/kairo/OrbBackground";
import { OnboardingFlow } from "@/components/kairo/OnboardingFlow";
import { isRemote } from "@/lib/data";
import { features } from "@/lib/config";

export const metadata: Metadata = {
  title: "Create your first goal · Solaspace",
  description:
    "Say your goal in plain words and watch Solaspace map every step, with the videos and guides you need to get there.",
  alternates: { canonical: "/onboarding" },
};

// Anonymous visitors can still type their goal here. We just capture it and send
// them to sign up before generating (see OnboardingFlow). Sign-in is resolved on
// the server so the client never needs Clerk hooks (not mounted in demo mode).
export default async function OnboardingPage() {
  let signedIn = false;
  if (features.clerk) {
    const { auth } = await import("@clerk/nextjs/server");
    signedIn = !!(await auth()).userId;
  }
  return (
    <div data-theme="dark" className="cockpit relative min-h-[100dvh]">
      <OrbBackground />
      <OnboardingFlow remote={isRemote} signedIn={signedIn} />
    </div>
  );
}
