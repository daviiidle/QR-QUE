import { requireShopMember } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { OrdersBoard } from "./_components/OrdersBoard";
import type { Order } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function OrdersDashboardPage() {
  const { shopId } = await requireShopMember();
  const sb = await supabaseServer();

  const { data } = await sb
    .from("orders")
    .select(
      `id, short_code, order_number, status, customer_name, customer_phone,
       subtotal_cents, tax_cents, tip_cents, total_cents, paid_at, created_at, shop_id,
       order_items ( id, product_name_snapshot, base_price_cents_snapshot, quantity,
                     line_total_cents, notes,
                     order_item_modifiers (modifier_group_name, modifier_option_name, price_delta_cents) )`
    )
    .eq("shop_id", shopId)
    .neq("status", "pending_payment")
    .order("created_at", { ascending: false })
    .limit(100);

  return <OrdersBoard shopId={shopId} initial={(data ?? []) as unknown as Order[]} />;
}
