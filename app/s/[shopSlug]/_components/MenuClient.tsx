"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart, type CartItem, lineTotalCents } from "@/stores/cart";
import { formatMoney } from "@/lib/money";
import type { Category, Product, Shop } from "@/types/domain";
import { ProductSheet } from "./ProductSheet";

export function MenuClient({
  shop,
  categories,
  products,
}: {
  shop: Shop;
  categories: Category[];
  products: Product[];
}) {
  const setShop = useCart((s) => s.setShop);
  const items = useCart((s) => s.items);

  useEffect(() => {
    setShop(shop.id, shop.slug);
  }, [shop.id, shop.slug, setShop]);

  const [active, setActive] = useState<Product | null>(null);

  const byCategory = useMemo(() => {
    const map = new Map<string | null, Product[]>();
    for (const p of products) {
      const arr = map.get(p.category_id) ?? [];
      arr.push(p);
      map.set(p.category_id, arr);
    }
    return map;
  }, [products]);

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = items.reduce((s, i) => s + lineTotalCents(i), 0);

  return (
    <main className="pb-32">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <div className="text-xs text-neutral-500">Order from</div>
            <h1 className="text-lg font-semibold">{shop.name}</h1>
          </div>
          <Link
            href={`/s/${shop.slug}/cart`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition hover:bg-brand-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-700 text-xs font-medium text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-4">
        {categories.map((cat) => {
          const list = byCategory.get(cat.id) ?? [];
          if (!list.length) return null;
          return (
            <section key={cat.id} className="mb-8">
              <h2 className="mb-3 text-base font-semibold text-neutral-800">{cat.name}</h2>
              <ul className="space-y-2">
                {list.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setActive(p)}
                      className="flex w-full items-start justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-left transition hover:border-brand-300"
                    >
                      <div>
                        <div className="font-medium">{p.name}</div>
                        {p.description && (
                          <div className="mt-1 text-sm text-neutral-500 line-clamp-2">
                            {p.description}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-semibold text-brand-700">
                          {formatMoney(p.base_price_cents, shop.currency)}
                        </div>
                        <div className="text-xs text-neutral-400">Customize</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {byCategory.get(null)?.length ? (
          <section className="mb-8">
            <h2 className="mb-3 text-base font-semibold text-neutral-800">Other</h2>
            <ul className="space-y-2">
              {byCategory.get(null)!.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setActive(p)}
                    className="flex w-full items-start justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-left"
                  >
                    <div className="font-medium">{p.name}</div>
                    <div className="font-semibold text-brand-700">
                      {formatMoney(p.base_price_cents, shop.currency)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white p-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <div className="text-sm">
              <div className="font-medium">{cartCount} item{cartCount > 1 ? "s" : ""}</div>
              <div className="text-neutral-500">{formatMoney(cartTotal, shop.currency)} subtotal</div>
            </div>
            <Link href={`/s/${shop.slug}/cart`} className="btn-primary">
              Review & pay
            </Link>
          </div>
        </div>
      )}

      {active && (
        <ProductSheet
          product={active}
          currency={shop.currency}
          onClose={() => setActive(null)}
          onAdd={(item: CartItem) => {
            useCart.getState().addItem(item);
            setActive(null);
          }}
        />
      )}
    </main>
  );
}
