import type { Metadata } from "next";
import { OrbBackground } from "@/components/kairo/OrbBackground";
import { AuthCard } from "@/components/kairo/AuthCard";

export const metadata: Metadata = { title: "Sign up · Kairo" };

export default function SignUpPage() {
  return (
    <div className="relative grid min-h-screen place-items-center px-5 py-12">
      <OrbBackground />
      <AuthCard mode="sign-up" />
    </div>
  );
}
