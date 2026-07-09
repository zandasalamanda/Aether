import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { features } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase/server";

// Stripe subscription sync. Runs with the SERVICE-ROLE client (never the public
// anon key) so plan changes can't be forged, verifies the webhook signature,
// checks every DB write, and returns HTTP 500 on failure so Stripe retries
// (instead of silently leaving a paid user on Free).

// A subscription in any of these states keeps Pro. past_due / unpaid are the
// dunning grace window — we keep access until Stripe finally cancels.
const PRO_STATUSES = new Set(["active", "trialing", "past_due", "unpaid"]);
const planFromStatus = (status: string): "free" | "pro" => (PRO_STATUSES.has(status) ? "pro" : "free");

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!features.stripe) {
    return NextResponse.json({ received: true, note: "billing not configured" });
  }
  if (!secret) {
    // Stripe is enabled but the signing secret is missing — 500 so Stripe retries.
    // (A 200 here would make Stripe drop the event permanently.)
    console.error("[stripe.webhook] STRIPE_WEBHOOK_SECRET missing while Stripe is enabled");
    return NextResponse.json({ error: "webhook secret not configured" }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  const StripeCtor = (await import("stripe")).default;
  const stripe = new StripeCtor(process.env.STRIPE_SECRET_KEY!);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (e) {
    console.error("[stripe.webhook] invalid signature:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error("[stripe.webhook] SUPABASE_SERVICE_ROLE_KEY missing — cannot apply", event.type, event.id);
    return NextResponse.json({ error: "server not configured" }, { status: 500 });
  }

  // Update the profile the subscription belongs to. Prefer the profileId we
  // tagged at checkout; fall back to the stored Stripe customer id.
  const apply = async (where: { profileId?: string | null; customerId?: string | null }, patch: Record<string, unknown>) => {
    let q = admin.from("users_profile").update(patch);
    if (where.profileId) q = q.eq("id", where.profileId);
    else if (where.customerId) q = q.eq("stripe_customer_id", where.customerId);
    else throw new Error("no profileId or customer to map the subscription to");
    const { error } = await q;
    if (error) throw error;
  };

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const profileId = s.client_reference_id ?? (s.metadata?.profileId as string | undefined) ?? null;
      const customer = typeof s.customer === "string" ? s.customer : s.customer?.id ?? null;
      let status = "active";
      let price: string | null = null;
      if (s.subscription) {
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        status = sub.status;
        price = sub.items.data[0]?.price?.id ?? null;
      }
      if (!profileId) throw new Error(`checkout.session.completed ${s.id} has no profileId`);
      await apply(
        { profileId },
        { plan: planFromStatus(status), subscription_status: status, stripe_customer_id: customer, subscription_price_id: price }
      );
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const evSub = event.data.object as Stripe.Subscription;
      // Re-fetch so redelivered / out-of-order events always write Stripe's
      // current truth instead of a stale payload (a late "active" can't undo a cancel).
      const sub = await stripe.subscriptions.retrieve(evSub.id);
      const status = sub.status;
      const customer = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
      const price = sub.items?.data?.[0]?.price?.id ?? null;
      const profileId = (sub.metadata?.profileId as string | undefined) ?? (evSub.metadata?.profileId as string | undefined) ?? null;
      const patch: Record<string, unknown> = {
        plan: planFromStatus(status),
        subscription_status: status,
        subscription_price_id: price,
      };
      if (customer) patch.stripe_customer_id = customer;
      await apply({ profileId, customerId: customer }, patch);
    }
    return NextResponse.json({ received: true, type: event.type });
  } catch (e) {
    console.error("[stripe.webhook] handler error", event.type, event.id, e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }
}
