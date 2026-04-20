import { notFound } from "next/navigation";
import { supabaseService } from "@/lib/supabase/service";
import { OrderStatus } from "./_components/OrderStatus";
import type { Order } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ shortCode: string }>;
}) {
  const { shortCode } = await params;
  const db = supabaseService();

  const { data } = await db
    .from("orders")
    .select(
      `id, short_code, order_number, status, customer_name, customer_phone,
       subtotal_cents, tax_cents, tip_cents, total_cents, paid_at, created_at, shop_id,
       order_items ( id, product_name_snapshot, base_price_cents_snapshot, quantity,
                     line_total_cents, notes,
                     order_item_modifiers (modifier_group_name, modifier_option_name, price_delta_cents) )`
    )
    .eq("short_code", shortCode)
    .maybeSingle();

  if (!data) notFound();

  const { data: shop } = await db
    .from("shops")
    .select("name, currency")
    .eq("id", data.shop_id)
    .maybeSingle();

  return (
    <OrderStatus
      initial={data as unknown as Order}
      shopName={shop?.name ?? ""}
      currency={shop?.currency ?? "AUD"}
    />
  );
}
