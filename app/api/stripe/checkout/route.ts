import { NextResponse } from "next/server";
import { features, pricing } from "@/lib/config";

export async function POST(req: Request) {
  if (!features.stripe) {
    return NextResponse.json({
      error: "Stripe test mode isn't configured yet. Add STRIPE_SECRET_KEY + price IDs to enable checkout.",
    });
  }

  const { interval } = (await req.json().catch(() => ({}))) as { interval?: "monthly" | "yearly" };
  const priceId = interval === "yearly" ? pricing.yearly.priceId : pricing.monthly.priceId;

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/app/billing?status=success`,
      cancel_url: `${origin}/app/billing?status=cancelled`,
    });
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Checkout could not be created. Check your Stripe test price IDs." });
  }
}
