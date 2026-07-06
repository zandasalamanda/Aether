import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { features } from "@/lib/config";
import { OrbBackground } from "@/components/kairo/OrbBackground";
import { AuthCard } from "@/components/kairo/AuthCard";
import { clerkAppearance } from "@/lib/clerk/appearance";

export const metadata: Metadata = { title: "Sign up · Kairo" };

export default function SignUpPage() {
  return (
    <div className="relative grid min-h-screen place-items-center px-5 py-12">
      <OrbBackground />
      {features.clerk ? (
        <SignUp routing="hash" signInUrl="/sign-in" fallbackRedirectUrl="/onboarding" appearance={clerkAppearance} />
      ) : (
        <AuthCard mode="sign-up" />
      )}
    </div>
  );
}
