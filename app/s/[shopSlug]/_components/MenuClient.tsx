"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart, type CartItem, lineTotalCents } from "@/stores/cart";
import { formatMoney } from "@/lib/money";
import type { Category, Product, Shop } from "@/types/domain";
import { ProductImage } from "@/components/ProductImage";
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
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const categoryNames = useMemo(() => {
    return new Map(categories.map((cat) => [cat.id, cat.name.toLowerCase()]));
  }, [categories]);

  const visibleProducts = useMemo(() => {
    if (!normalizedSearchQuery) return products;

    return products.filter((product) => {
      const modifierText = product.modifier_groups
        .flatMap((group) => [group.name, ...group.options.map((option) => option.name)])
        .join(" ");
      const categoryName = product.category_id
        ? categoryNames.get(product.category_id) ?? ""
        : "other";
      const searchableText = [
        product.name,
        product.description ?? "",
        categoryName,
        modifierText,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearchQuery);
    });
  }, [categoryNames, normalizedSearchQuery, products]);

  const byCategory = useMemo(() => {
    const map = new Map<string | null, Product[]>();
    for (const p of visibleProducts) {
      const arr = map.get(p.category_id) ?? [];
      arr.push(p);
      map.set(p.category_id, arr);
    }
    return map;
  }, [visibleProducts]);

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = items.reduce((s, i) => s + lineTotalCents(i), 0);
  const hasResults = visibleProducts.length > 0;

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
        <div className="mx-auto max-w-2xl px-4 pb-3">
          <label className="sr-only" htmlFor="menu-search">
            Search menu
          </label>
          <div className="relative">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
              />
            </svg>
            <input
              id="menu-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search menu"
              className="input h-11 pl-10 pr-10"
              autoComplete="off"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-4">
        {!hasResults && (
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
            <div className="font-medium text-neutral-900">No menu items found</div>
            <p className="mt-1 text-sm text-neutral-500">
              Try another product, category, or topping.
            </p>
          </div>
        )}

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
                      className="flex w-full items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-3 text-left transition hover:border-brand-300"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        <ProductImage name={p.name} imageUrl={p.image_url} />
                      </div>
                      <div className="min-w-0 flex-1">
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
                    className="flex w-full items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-3 text-left"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      <ProductImage name={p.name} imageUrl={p.image_url} />
                    </div>
                    <div className="min-w-0 flex-1 font-medium">{p.name}</div>
                    <div className="shrink-0 font-semibold text-brand-700">
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
