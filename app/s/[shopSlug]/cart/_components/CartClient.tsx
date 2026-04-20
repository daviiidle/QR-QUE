"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart, lineTotalCents, unitPriceCents } from "@/stores/cart";
import { formatMoney } from "@/lib/money";
import type { Shop } from "@/types/domain";

export function CartClient({ shop }: { shop: Shop }) {
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const clear = useCart((s) => s.clear);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(() => items.reduce((s, i) => s + lineTotalCents(i), 0), [items]);
  const tax = Math.round((subtotal * shop.tax_rate_bps) / 10_000);
  const total = subtotal + tax;

  async function handlePay() {
    setError(null);
    if (!name.trim()) return setError("Enter your name.");
    if (!items.length) return setError("Your cart is empty.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          customerName: name.trim(),
          customerPhone: phone.trim() || undefined,
          lines: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            modifierOptionIds: i.modifiers.map((m) => m.optionId),
            notes: i.notes,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Checkout failed");
        return;
      }
      // Clear cart on successful session creation so user isn't re-charged.
      clear();
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your order</h1>
        <Link href={`/s/${shop.slug}`} className="text-sm text-brand-700 underline">
          Add more
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="card">
          <p className="text-neutral-600">Your cart is empty.</p>
          <Link href={`/s/${shop.slug}`} className="btn-primary mt-4 inline-flex">
            Browse menu
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((i) => (
              <li key={i.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{i.productName}</div>
                    {i.modifiers.length > 0 && (
                      <div className="mt-1 text-sm text-neutral-500">
                        {i.modifiers.map((m) => `${m.groupName}: ${m.optionName}`).join(" · ")}
                      </div>
                    )}
                    {i.notes && (
                      <div className="mt-1 text-sm italic text-neutral-500">“{i.notes}”</div>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-neutral-200 text-sm">
                        <button
                          type="button"
                          className="px-2 py-1"
                          onClick={() => updateQuantity(i.id, i.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="w-8 text-center">{i.quantity}</span>
                        <button
                          type="button"
                          className="px-2 py-1"
                          onClick={() => updateQuantity(i.id, i.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(i.id)}
                        className="text-sm text-neutral-500 underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-semibold">
                      {formatMoney(lineTotalCents(i), shop.currency)}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {formatMoney(unitPriceCents(i), shop.currency)} ea
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="card mt-4">
            <div className="space-y-3">
              <div>
                <label className="label" htmlFor="name">Name (for pickup)</label>
                <input
                  id="name"
                  className="input mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="label" htmlFor="phone">Phone (optional)</label>
                <input
                  id="phone"
                  className="input mt-1"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={30}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatMoney(subtotal, shop.currency)}</dd>
              </div>
              {tax > 0 && (
                <div className="flex justify-between">
                  <dt>Tax</dt>
                  <dd>{formatMoney(tax, shop.currency)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-neutral-100 pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatMoney(total, shop.currency)}</dd>
              </div>
            </dl>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}

          <button
            type="button"
            className="btn-primary mt-4 w-full"
            onClick={handlePay}
            disabled={submitting}
          >
            {submitting ? "Starting checkout…" : `Pay ${formatMoney(total, shop.currency)}`}
          </button>
          <p className="mt-2 text-center text-xs text-neutral-400">
            Secured by Stripe. Final price is recomputed server-side.
          </p>
        </>
      )}
    </main>
  );
}
