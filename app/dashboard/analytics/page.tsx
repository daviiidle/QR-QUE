import { requireShopMember } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const { shopId } = await requireShopMember();
  const sb = await supabaseServer();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [todayRes, weekRes, topRes] = await Promise.all([
    sb
      .from("orders")
      .select("total_cents, status, created_at")
      .eq("shop_id", shopId)
      .gte("created_at", todayStart.toISOString())
      .neq("status", "pending_payment")
      .neq("status", "cancelled"),
    sb
      .from("orders")
      .select("id")
      .eq("shop_id", shopId)
      .gte("created_at", weekStart.toISOString())
      .neq("status", "pending_payment")
      .neq("status", "cancelled"),
    sb
      .from("order_items")
      .select("product_name_snapshot, quantity, orders!inner(shop_id, status, created_at)")
      .eq("orders.shop_id", shopId)
      .gte("orders.created_at", weekStart.toISOString())
      .neq("orders.status", "pending_payment")
      .neq("orders.status", "cancelled"),
  ]);

  const todayOrders = todayRes.data ?? [];
  const ordersToday = todayOrders.length;
  const revenueToday = todayOrders.reduce((s, o) => s + o.total_cents, 0);
  const ordersWeek = (weekRes.data ?? []).length;

  const topMap = new Map<string, number>();
  for (const row of topRes.data ?? []) {
    topMap.set(row.product_name_snapshot, (topMap.get(row.product_name_snapshot) ?? 0) + row.quantity);
  }
  const topItems = [...topMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="card">
        <div className="text-sm text-neutral-500">Orders today</div>
        <div className="mt-1 text-3xl font-bold">{ordersToday}</div>
      </div>
      <div className="card">
        <div className="text-sm text-neutral-500">Revenue today</div>
        <div className="mt-1 text-3xl font-bold">{formatMoney(revenueToday)}</div>
      </div>
      <div className="card">
        <div className="text-sm text-neutral-500">Orders last 7 days</div>
        <div className="mt-1 text-3xl font-bold">{ordersWeek}</div>
      </div>
      <div className="card lg:col-span-3">
        <h3 className="mb-3 text-lg font-semibold">Top items (7d)</h3>
        {topItems.length === 0 ? (
          <p className="text-sm text-neutral-500">No data yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="py-1">Item</th>
                <th className="py-1 text-right">Sold</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map(([name, qty]) => (
                <tr key={name} className="border-t border-neutral-100">
                  <td className="py-2">{name}</td>
                  <td className="py-2 text-right">{qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
