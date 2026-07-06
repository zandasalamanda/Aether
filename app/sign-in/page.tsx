import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { features } from "@/lib/config";
import { OrbBackground } from "@/components/kairo/OrbBackground";
import { AuthCard } from "@/components/kairo/AuthCard";
import { clerkAppearance } from "@/lib/clerk/appearance";

export const metadata: Metadata = { title: "Sign in · Kairo" };

export default function SignInPage() {
  return (
    <div className="relative grid min-h-screen place-items-center px-5 py-12">
      <OrbBackground />
      {features.clerk ? (
        <SignIn routing="hash" signUpUrl="/sign-up" fallbackRedirectUrl="/app/today" appearance={clerkAppearance} />
      ) : (
        <AuthCard mode="sign-in" />
      )}
    </div>
  );
}
