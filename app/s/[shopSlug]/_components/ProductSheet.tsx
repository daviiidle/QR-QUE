"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/types/domain";
import type { CartItem, CartModifier } from "@/stores/cart";
import { ProductImage } from "@/components/ProductImage";

export function ProductSheet({
  product,
  currency,
  onAdd,
  onClose,
}: {
  product: Product;
  currency: string;
  onAdd: (item: CartItem) => void;
  onClose: () => void;
}) {
  // Map<groupId, Set<optionId>>
  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const g of product.modifier_groups) {
      if (g.selection_type === "single" && g.is_required && g.options[0]) {
        init[g.id] = [g.options[0].id];
      } else {
        init[g.id] = [];
      }
    }
    return init;
  });
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const { errors, unitPrice, selectedMods } = useMemo(() => {
    const errs: string[] = [];
    const mods: CartModifier[] = [];

    for (const g of product.modifier_groups) {
      const picked = selections[g.id] ?? [];
      if (g.is_required && picked.length < g.min_select) {
        errs.push(`${g.name}: pick at least ${g.min_select}`);
      }
      if (picked.length > g.max_select) {
        errs.push(`${g.name}: pick at most ${g.max_select}`);
      }
      for (const oid of picked) {
        const o = g.options.find((x) => x.id === oid);
        if (o) {
          mods.push({
            groupId: g.id,
            groupName: g.name,
            optionId: o.id,
            optionName: o.name,
            priceDeltaCents: o.price_delta_cents,
          });
        }
      }
    }
    const unit = product.base_price_cents + mods.reduce((s, m) => s + m.priceDeltaCents, 0);
    return { errors: errs, unitPrice: unit, selectedMods: mods };
  }, [selections, product]);

  function toggle(groupId: string, optionId: string, type: "single" | "multi", maxSelect: number) {
    setSelections((cur) => {
      const existing = cur[groupId] ?? [];
      if (type === "single") return { ...cur, [groupId]: [optionId] };
      const has = existing.includes(optionId);
      if (has) return { ...cur, [groupId]: existing.filter((x) => x !== optionId) };
      if (existing.length >= maxSelect) return cur;
      return { ...cur, [groupId]: [...existing, optionId] };
    });
  }

  function handleAdd() {
    if (errors.length) return;
    const id =
      globalThis.crypto?.randomUUID?.() ??
      `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    onAdd({
      id,
      productId: product.id,
      productName: product.name,
      basePriceCents: product.base_price_cents,
      quantity,
      modifiers: selectedMods,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-neutral-100 p-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold">{product.name}</h3>
            {product.description && (
              <p className="mt-1 text-sm text-neutral-500">{product.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100">
            <ProductImage name={product.name} imageUrl={product.image_url} />
          </div>

          {product.modifier_groups.map((g) => (
            <div key={g.id} className="mb-5">
              <div className="mb-2 flex items-baseline justify-between">
                <h4 className="font-medium">
                  {g.name}
                  {g.is_required && <span className="ml-1 text-xs text-brand-600">Required</span>}
                </h4>
                <span className="text-xs text-neutral-400">
                  {g.selection_type === "single"
                    ? "Pick 1"
                    : `Pick up to ${g.max_select}`}
                </span>
              </div>
              <ul className="space-y-1">
                {g.options.map((o) => {
                  const checked = (selections[g.id] ?? []).includes(o.id);
                  return (
                    <li key={o.id}>
                      <label
                        className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 ${
                          checked
                            ? "border-brand-400 bg-brand-50"
                            : "border-neutral-200 bg-white hover:border-neutral-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type={g.selection_type === "single" ? "radio" : "checkbox"}
                            name={g.id}
                            checked={checked}
                            onChange={() =>
                              toggle(g.id, o.id, g.selection_type, g.max_select)
                            }
                            className="accent-brand-600"
                          />
                          <span>{o.name}</span>
                        </div>
                        {o.price_delta_cents !== 0 && (
                          <span className="text-sm text-neutral-500">
                            {o.price_delta_cents > 0 ? "+" : ""}
                            {formatMoney(o.price_delta_cents, currency)}
                          </span>
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="mb-4">
            <label className="label" htmlFor="notes">Special instructions</label>
            <textarea
              id="notes"
              className="input mt-1"
              rows={2}
              maxLength={200}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. less sweet, extra pearls"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="label">Quantity</span>
            <div className="flex items-center rounded-xl border border-neutral-200">
              <button
                type="button"
                className="px-3 py-2 text-lg"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="w-10 text-center">{quantity}</span>
              <button
                type="button"
                className="px-3 py-2 text-lg"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              >
                +
              </button>
            </div>
          </div>

          {errors.length > 0 && (
            <ul className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              {errors.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          )}
        </div>

        <div className="border-t border-neutral-100 p-4">
          <button
            type="button"
            disabled={errors.length > 0}
            onClick={handleAdd}
            className="btn-primary w-full"
          >
            Add — {formatMoney(unitPrice * quantity, currency)}
          </button>
        </div>
      </div>
    </div>
  );
}
