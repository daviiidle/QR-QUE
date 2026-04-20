import "server-only";
import { supabaseService } from "./supabase/service";

export type CartLine = {
  productId: string;
  quantity: number;
  modifierOptionIds: string[];
  notes?: string;
};

export type PricedLine = {
  productId: string;
  productName: string;
  basePriceCents: number;
  quantity: number;
  modifiers: { groupName: string; optionName: string; priceDeltaCents: number }[];
  lineTotalCents: number;
  notes?: string;
};

export type PricedCart = {
  priced: PricedLine[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
};

/**
 * Re-price a cart on the server from authoritative DB values.
 * Never trust client-supplied prices.
 */
export async function priceCart(shopId: string, lines: CartLine[]): Promise<PricedCart> {
  if (!lines.length) throw new Error("empty cart");

  const db = supabaseService();
  const productIds = [...new Set(lines.map((l) => l.productId))];
  const optionIds = [...new Set(lines.flatMap((l) => l.modifierOptionIds))];

  const [{ data: products, error: pErr }, optionsRes, { data: shop, error: sErr }] =
    await Promise.all([
      db
        .from("products")
        .select("id, shop_id, name, base_price_cents, is_active")
        .in("id", productIds),
      optionIds.length
        ? db
            .from("modifier_options")
            .select(
              "id, name, price_delta_cents, is_active, group_id, modifier_groups!inner(shop_id, name)"
            )
            .in("id", optionIds)
        : Promise.resolve({ data: [] as OptionRow[], error: null }),
      db.from("shops").select("tax_rate_bps, currency").eq("id", shopId).single(),
    ]);

  if (pErr) throw pErr;
  if (sErr) throw sErr;
  if (optionsRes.error) throw optionsRes.error;
  if (!products || !shop) throw new Error("lookup failed");

  for (const p of products) {
    if (p.shop_id !== shopId) throw new Error("product/shop mismatch");
    if (!p.is_active) throw new Error(`product unavailable: ${p.name}`);
  }
  const options = (optionsRes.data ?? []) as OptionRow[];
  for (const o of options) {
    if (o.modifier_groups.shop_id !== shopId) throw new Error("option/shop mismatch");
    if (!o.is_active) throw new Error(`option unavailable: ${o.name}`);
  }

  const productById = new Map(products.map((p) => [p.id, p]));
  const optionById = new Map(options.map((o) => [o.id, o]));

  const priced: PricedLine[] = lines.map((l) => {
    const p = productById.get(l.productId);
    if (!p) throw new Error("product not found");
    if (l.quantity <= 0 || l.quantity > 20) throw new Error("bad quantity");

    const mods = l.modifierOptionIds.map((oid) => {
      const o = optionById.get(oid);
      if (!o) throw new Error("option not found");
      return {
        groupName: o.modifier_groups.name,
        optionName: o.name,
        priceDeltaCents: o.price_delta_cents,
      };
    });

    const unit = p.base_price_cents + mods.reduce((s, m) => s + m.priceDeltaCents, 0);
    return {
      productId: p.id,
      productName: p.name,
      basePriceCents: p.base_price_cents,
      quantity: l.quantity,
      modifiers: mods,
      lineTotalCents: unit * l.quantity,
      notes: l.notes?.slice(0, 200),
    };
  });

  const subtotalCents = priced.reduce((s, l) => s + l.lineTotalCents, 0);
  const taxCents = Math.round((subtotalCents * shop.tax_rate_bps) / 10_000);
  const totalCents = subtotalCents + taxCents;
  return { priced, subtotalCents, taxCents, totalCents };
}

type OptionRow = {
  id: string;
  name: string;
  price_delta_cents: number;
  is_active: boolean;
  group_id: string;
  modifier_groups: { shop_id: string; name: string };
};
