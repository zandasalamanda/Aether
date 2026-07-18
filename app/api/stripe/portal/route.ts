import { NextResponse } from "next/server";
import { features } from "@/lib/config";
import { ensureProfile } from "@/lib/data/profile";
import { isNativeRequest } from "@/lib/native";

// Stripe Billing Portal: lets a subscriber update their card, view invoices, or
// cancel. Requires the customer portal to be enabled once in the Stripe
// dashboard (Settings → Billing → Customer portal).
export async function POST(req: Request) {
  // App Store Guideline 3.1.1: no route to external billing management from the
  // native shell. Checked first so nothing else can run.
  if (await isNativeRequest()) {
    return NextResponse.json({ error: "Not available in the app." }, { status: 403 });
  }
  if (!features.stripe) {
    return NextResponse.json({ error: "Billing isn't configured yet." }, { status: 400 });
  }
  const profile = await ensureProfile();
  if (!profile) return NextResponse.json({ error: "Sign in to manage billing." }, { status: 401 });
  if (!profile.stripeCustomerId) {
    return NextResponse.json({ error: "You don't have a subscription to manage yet." }, { status: 400 });
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripeCustomerId,
      return_url: `${origin}/app/billing`,
      ...(process.env.STRIPE_PORTAL_CONFIG_ID ? { configuration: process.env.STRIPE_PORTAL_CONFIG_ID } : {}),
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[stripe.portal]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not open the billing portal. Try again." }, { status: 500 });
  }
}
