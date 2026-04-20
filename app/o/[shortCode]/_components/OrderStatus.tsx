"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney, formatOrderNumber } from "@/lib/money";
import type { Order, OrderStatus as Status } from "@/types/domain";

const STEPS: { key: Status; label: string }[] = [
  { key: "received",  label: "Received" },
  { key: "making",    label: "Making" },
  { key: "ready",     label: "Ready for pickup" },
];

const STATUS_LABEL: Record<Status, string> = {
  pending_payment: "Waiting for payment…",
  received: "Order received",
  making: "Making your drink",
  ready: "Ready for pickup!",
  completed: "Thanks — enjoy!",
  cancelled: "Cancelled",
};

export function OrderStatus({
  initial,
  shopName,
  currency,
}: {
  initial: Order;
  shopName: string;
  currency: string;
}) {
  const [order, setOrder] = useState<Order>(initial);
  const stopRef = useRef(false);

  useEffect(() => {
    // Poll the server-backed endpoint. No anon DB read needed, no RLS hole.
    // Cadence: 2s until order reaches a terminal state, then stop.
    let cancelled = false;
    stopRef.current = false;

    async function tick() {
      if (cancelled || stopRef.current) return;
      try {
        const res = await fetch(`/api/orders/${initial.short_code}`, { cache: "no-store" });
        if (res.ok) {
          const next = (await res.json()) as Order;
          setOrder(next);
          if (next.status === "completed" || next.status === "cancelled") {
            stopRef.current = true;
          }
        }
      } catch {
        /* network blip — just try again next tick */
      }
      if (!stopRef.current && !cancelled) {
        setTimeout(tick, 2000);
      }
    }
    const t = setTimeout(tick, 2000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [initial.short_code]);

  const currentStepIdx = STEPS.findIndex((s) => s.key === order.status);
  const isTerminal = order.status === "cancelled" || order.status === "completed";

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <div className="text-center">
        <div className="text-xs uppercase tracking-wide text-neutral-500">{shopName}</div>
        <div className="mt-1 text-4xl font-bold">{formatOrderNumber(order.order_number)}</div>
        <div className="mt-2 text-neutral-600">{STATUS_LABEL[order.status]}</div>
      </div>

      {!isTerminal && order.status !== "pending_payment" && (
        <ol className="mt-8 space-y-3">
          {STEPS.map((step, i) => {
            const done = i < currentStepIdx;
            const active = i === currentStepIdx;
            return (
              <li
                key={step.key}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  active
                    ? "border-brand-400 bg-brand-50"
                    : done
                    ? "border-neutral-200 bg-white opacity-60"
                    : "border-neutral-200 bg-white"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    done
                      ? "bg-green-600 text-white"
                      : active
                      ? "bg-brand-600 text-white"
                      : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="font-medium">{step.label}</span>
              </li>
            );
          })}
        </ol>
      )}

      {order.status === "pending_payment" && (
        <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Still confirming your payment. This normally takes a few seconds — don't close this tab.
        </div>
      )}

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">Your order</h2>
        <ul className="space-y-2">
          {(order.order_items ?? []).map((it) => (
            <li key={it.id} className="card">
              <div className="flex justify-between gap-3">
                <div>
                  <div className="font-medium">
                    {it.quantity}× {it.product_name_snapshot}
                  </div>
                  {it.order_item_modifiers.length > 0 && (
                    <div className="mt-1 text-sm text-neutral-500">
                      {it.order_item_modifiers
                        .map((m) => `${m.modifier_group_name}: ${m.modifier_option_name}`)
                        .join(" · ")}
                    </div>
                  )}
                  {it.notes && (
                    <div className="mt-1 text-sm italic text-neutral-500">“{it.notes}”</div>
                  )}
                </div>
                <div className="shrink-0 font-medium">
                  {formatMoney(it.line_total_cents, currency)}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <dl className="card mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatMoney(order.subtotal_cents, currency)}</dd>
          </div>
          {order.tax_cents > 0 && (
            <div className="flex justify-between">
              <dt>Tax</dt>
              <dd>{formatMoney(order.tax_cents, currency)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-neutral-100 pt-2 font-semibold">
            <dt>Total</dt>
            <dd>{formatMoney(order.total_cents, currency)}</dd>
          </div>
        </dl>
      </section>

      <p className="mt-6 text-center text-xs text-neutral-400">
        Keep this page open — it updates automatically.
      </p>
    </main>
  );
}
