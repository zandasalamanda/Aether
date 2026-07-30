import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { features } from "@/lib/config";
import { AuthShell } from "@/components/kairo/AuthShell";
import { AuthCard } from "@/components/kairo/AuthCard";
import { clerkAppearance } from "@/lib/clerk/appearance";

export const metadata: Metadata = {
  title: "Sign up · Solaspace",
  description:
    "Create a free Solaspace account and map your first goal into clear, doable steps in about a minute.",
  alternates: { canonical: "/sign-up" },
};

export default function SignUpPage() {
  return (
    <AuthShell>
      {features.clerk ? (
        <SignUp routing="hash" signInUrl="/sign-in" fallbackRedirectUrl="/onboarding" appearance={clerkAppearance} />
      ) : (
        <AuthCard mode="sign-up" />
      )}
    </AuthShell>
  );
}
