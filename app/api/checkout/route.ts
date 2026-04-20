import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { priceCart } from "@/lib/pricing";
import { supabaseService } from "@/lib/supabase/service";
import { newShortCode } from "@/lib/shortcode";

export const runtime = "nodejs";

const Body = z.object({
  shopId: z.string().uuid(),
  customerName: z.string().trim().min(1).max(60),
  customerPhone: z.string().trim().max(30).optional().or(z.literal("")),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive().max(20),
        modifierOptionIds: z.array(z.string().uuid()).max(20),
        notes: z.string().max(200).optional(),
      })
    )
    .min(1)
    .max(30),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad request", issues: parsed.error.issues }, { status: 400 });
  }

  const { shopId, customerName, customerPhone, lines } = parsed.data;
  const db = supabaseService();

  // 1. shop sanity check
  const { data: shop, error: shopErr } = await db
    .from("shops")
    .select("id, name, currency, is_active")
    .eq("id", shopId)
    .single();
  if (shopErr || !shop || !shop.is_active) {
    return NextResponse.json({ error: "shop unavailable" }, { status: 404 });
  }

  // 2. re-price from DB
  let priced;
  try {
    priced = await priceCart(shopId, lines);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "pricing error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  if (priced.totalCents < 50) {
    return NextResponse.json({ error: "order total too small" }, { status: 400 });
  }

  // 3. reserve an order number + short code
  const { data: nextNum, error: numErr } = await db.rpc("next_order_number", { p_shop: shopId });
  if (numErr || nextNum == null) {
    return NextResponse.json({ error: "order number alloc failed" }, { status: 500 });
  }
  const shortCode = newShortCode();

  // 4. create order + items + modifier snapshots
  const { data: order, error: orderErr } = await db
    .from("orders")
    .insert({
      shop_id: shopId,
      short_code: shortCode,
      order_number: nextNum,
      status: "pending_payment",
      customer_name: customerName,
      customer_phone: customerPhone || null,
      subtotal_cents: priced.subtotalCents,
      tax_cents: priced.taxCents,
      tip_cents: 0,
      total_cents: priced.totalCents,
    })
    .select("id")
    .single();
  if (orderErr || !order) {
    return NextResponse.json({ error: "order create failed" }, { status: 500 });
  }

  // Insert items one by one so we can attach their modifier rows.
  for (const line of priced.priced) {
    const { data: itemRow, error: itemErr } = await db
      .from("order_items")
      .insert({
        order_id: order.id,
        product_id: line.productId,
        product_name_snapshot: line.productName,
        base_price_cents_snapshot: line.basePriceCents,
        quantity: line.quantity,
        line_total_cents: line.lineTotalCents,
        notes: line.notes ?? null,
      })
      .select("id")
      .single();
    if (itemErr || !itemRow) {
      return NextResponse.json({ error: "item insert failed" }, { status: 500 });
    }
    if (line.modifiers.length) {
      const { error: modErr } = await db.from("order_item_modifiers").insert(
        line.modifiers.map((m) => ({
          order_item_id: itemRow.id,
          modifier_group_name: m.groupName,
          modifier_option_name: m.optionName,
          price_delta_cents: m.priceDeltaCents,
        }))
      );
      if (modErr) {
        return NextResponse.json({ error: "modifier insert failed" }, { status: 500 });
      }
    }
  }

  // 5. create Stripe Checkout session
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: shop.currency.toLowerCase(),
          product_data: {
            name: `${shop.name} — order #${String(nextNum).padStart(4, "0")}`,
          },
          unit_amount: priced.totalCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/o/${shortCode}?paid=1`,
    cancel_url: `${appUrl}/o/${shortCode}?cancelled=1`,
    metadata: { order_id: order.id, shop_id: shopId },
    payment_intent_data: { metadata: { order_id: order.id, shop_id: shopId } },
  });

  await db
    .from("orders")
    .update({ stripe_session_id: session.id })
    .eq("id", order.id);

  return NextResponse.json({ url: session.url, shortCode });
}
