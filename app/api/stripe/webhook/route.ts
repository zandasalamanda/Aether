import { NextResponse } from "next/server";
import { features } from "@/lib/config";

// Subscription status sync. When Stripe test mode is configured, this verifies
// the signature and updates the user's plan in Supabase (integration point).
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!features.stripe || !secret) {
    return NextResponse.json({ received: true, note: "webhook not configured" });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    const event = stripe.webhooks.constructEvent(body, signature, secret);
    switch (event.type) {
      case "checkout.session.completed":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        // Integration point: upsert users_profile subscription fields via Supabase.
        break;
    }
    return NextResponse.json({ received: true, type: event.type });
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }
}
