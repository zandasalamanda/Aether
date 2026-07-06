import type { Metadata } from "next";
import { OrbBackground } from "@/components/kairo/OrbBackground";
import { OnboardingFlow } from "@/components/kairo/OnboardingFlow";

export const metadata: Metadata = { title: "Create your first goal · Kairo" };

export default function OnboardingPage() {
  return (
    <div className="relative">
      <OrbBackground />
      <OnboardingFlow />
    </div>
  );
}
