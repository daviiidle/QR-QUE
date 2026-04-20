import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params;
  if (!shortCode || shortCode.length > 32) {
    return NextResponse.json({ error: "bad code" }, { status: 400 });
  }

  const db = supabaseService();
  const { data, error } = await db
    .from("orders")
    .select(
      `id, short_code, order_number, status, customer_name, customer_phone,
       subtotal_cents, tax_cents, tip_cents, total_cents,
       paid_at, created_at, shop_id,
       order_items (
         id, product_name_snapshot, base_price_cents_snapshot, quantity,
         line_total_cents, notes,
         order_item_modifiers ( modifier_group_name, modifier_option_name, price_delta_cents )
       )`
    )
    .eq("short_code", shortCode)
    .single();

  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}
