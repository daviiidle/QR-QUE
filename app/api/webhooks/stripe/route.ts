import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";
// Stripe signature verification needs the raw body — disable any body parsing.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("missing sig", { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "bad signature";
    return new NextResponse(`webhook error: ${msg}`, { status: 400 });
  }

  const db = supabaseService();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const orderId = s.metadata?.order_id;
        if (!orderId) break;
        if (s.payment_status !== "paid") break;

        const paymentIntentId =
          typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? null;

        // Idempotent: only promote an order still waiting for payment.
        await db
          .from("orders")
          .update({
            status: "received",
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntentId,
          })
          .eq("id", orderId)
          .eq("status", "pending_payment");
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const orderId = s.metadata?.order_id;
        if (!orderId) break;
        await db
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", orderId)
          .eq("status", "pending_payment");
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("webhook handler error", event.type, e);
    return new NextResponse("handler error", { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
