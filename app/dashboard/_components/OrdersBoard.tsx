"use client";

import { useEffect, useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { setOrderStatus } from "@/actions/orders";
import { formatMoney, formatOrderNumber } from "@/lib/money";
import type { Order, OrderStatus } from "@/types/domain";

const NEXT: Record<OrderStatus, OrderStatus | null> = {
  pending_payment: null,
  received: "making",
  making: "ready",
  ready: "completed",
  completed: null,
  cancelled: null,
};

const LABEL: Record<OrderStatus, string> = {
  pending_payment: "Pending payment",
  received: "Received",
  making: "Making",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

export function OrdersBoard({
  shopId,
  initial,
}: {
  shopId: string;
  initial: Order[];
}) {
  const [orders, setOrders] = useState<Order[]>(initial);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const sb = supabaseBrowser();
    const channel = sb
      .channel(`shop:${shopId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `shop_id=eq.${shopId}` },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const neu = payload.new as Order;
            if (neu.status === "pending_payment") return;
            // Fetch full row with items via service-backed API (or refetch via sb).
            const { data } = await sb
              .from("orders")
              .select(
                `id, short_code, order_number, status, customer_name, customer_phone,
                 subtotal_cents, tax_cents, tip_cents, total_cents, paid_at, created_at, shop_id,
                 order_items ( id, product_name_snapshot, base_price_cents_snapshot, quantity,
                               line_total_cents, notes,
                               order_item_modifiers (modifier_group_name, modifier_option_name, price_delta_cents) )`
              )
              .eq("id", neu.id)
              .maybeSingle();
            if (data)
              setOrders((cur) => [data as unknown as Order, ...cur.filter((o) => o.id !== neu.id)]);
          } else if (payload.eventType === "UPDATE") {
            const neu = payload.new as Order;
            setOrders((cur) => {
              const existing = cur.find((o) => o.id === neu.id);
              if (!existing) {
                if (neu.status !== "pending_payment") {
                  // newly promoted from pending -> received: fetch full row
                  sb.from("orders")
                    .select(
                      `id, short_code, order_number, status, customer_name, customer_phone,
                       subtotal_cents, tax_cents, tip_cents, total_cents, paid_at, created_at, shop_id,
                       order_items ( id, product_name_snapshot, base_price_cents_snapshot, quantity,
                                     line_total_cents, notes,
                                     order_item_modifiers (modifier_group_name, modifier_option_name, price_delta_cents) )`
                    )
                    .eq("id", neu.id)
                    .maybeSingle()
                    .then(({ data }) => {
                      if (data)
                        setOrders((c) => [data as unknown as Order, ...c.filter((o) => o.id !== neu.id)]);
                    });
                  return cur;
                }
                return cur;
              }
              return cur.map((o) => (o.id === neu.id ? { ...o, ...neu } : o));
            });
          }
        }
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, [shopId]);

  const open = orders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled" && o.status !== "pending_payment"
  );
  const done = orders.filter((o) => o.status === "completed" || o.status === "cancelled");

  function advance(order: Order) {
    const next = NEXT[order.status];
    if (!next) return;
    startTransition(async () => {
      await setOrderStatus(order.id, next);
    });
  }

  function cancel(order: Order) {
    if (!confirm(`Cancel ${formatOrderNumber(order.order_number)}?`)) return;
    startTransition(async () => {
      await setOrderStatus(order.id, "cancelled");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Open orders ({open.length})</h2>
        </div>
        {open.length === 0 ? (
          <div className="card text-neutral-500">No open orders right now.</div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {open.map((o) => (
              <li key={o.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xl font-bold">{formatOrderNumber(o.order_number)}</div>
                    <div className="text-sm text-neutral-500">{o.customer_name}</div>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
                    {LABEL[o.status]}
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {(o.order_items ?? []).map((it) => (
                    <li key={it.id}>
                      <div className="font-medium">
                        {it.quantity}× {it.product_name_snapshot}
                      </div>
                      {it.order_item_modifiers.length > 0 && (
                        <div className="text-xs text-neutral-500">
                          {it.order_item_modifiers
                            .map((m) => `${m.modifier_group_name}: ${m.modifier_option_name}`)
                            .join(" · ")}
                        </div>
                      )}
                      {it.notes && (
                        <div className="text-xs italic text-neutral-500">“{it.notes}”</div>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
                  <span>{timeAgo(o.created_at)}</span>
                  <span>{formatMoney(o.total_cents)}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  {NEXT[o.status] && (
                    <button
                      type="button"
                      onClick={() => advance(o)}
                      disabled={pending}
                      className="btn-primary flex-1"
                    >
                      Mark {LABEL[NEXT[o.status]!]}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => cancel(o)}
                    disabled={pending}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recently closed</h2>
        <ul className="space-y-2">
          {done.slice(0, 20).map((o) => (
            <li key={o.id} className="card text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">{formatOrderNumber(o.order_number)}</span>
                <span className="text-neutral-500">{LABEL[o.status]}</span>
              </div>
              <div className="text-xs text-neutral-400">
                {o.customer_name} · {formatMoney(o.total_cents)} · {timeAgo(o.created_at)}
              </div>
            </li>
          ))}
          {done.length === 0 && (
            <li className="card text-sm text-neutral-500">Nothing here yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
