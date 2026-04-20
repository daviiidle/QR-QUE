import { notFound } from "next/navigation";
import { supabaseService } from "@/lib/supabase/service";
import { MenuClient } from "./_components/MenuClient";
import type { Category, ModifierGroup, ModifierOption, Product, Shop } from "@/types/domain";

type PageProps = { params: Promise<{ shopSlug: string }> };

export const revalidate = 30;

export default async function MenuPage({ params }: PageProps) {
  const { shopSlug } = await params;
  const db = supabaseService();

  const { data: shop } = await db
    .from("shops")
    .select("id, slug, name, currency, tax_rate_bps")
    .eq("slug", shopSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!shop) notFound();

  const [categoriesRes, productsRes, groupsRes, optionsRes, pmgRes] = await Promise.all([
    db.from("categories").select("id, name, sort_order, is_active").eq("shop_id", shop.id).eq("is_active", true).order("sort_order"),
    db.from("products").select("id, category_id, name, description, base_price_cents, image_url, is_active, sort_order").eq("shop_id", shop.id).eq("is_active", true).order("sort_order"),
    db.from("modifier_groups").select("id, name, selection_type, min_select, max_select, is_required, sort_order").eq("shop_id", shop.id).order("sort_order"),
    db.from("modifier_options").select("id, group_id, name, price_delta_cents, is_active, sort_order").eq("is_active", true).order("sort_order"),
    db.from("product_modifier_groups").select("product_id, modifier_group_id, sort_order"),
  ]);

  const categories = (categoriesRes.data ?? []) as Category[];
  const rawProducts = productsRes.data ?? [];
  const groupsRaw = (groupsRes.data ?? []) as Omit<ModifierGroup, "options">[];
  const optionsRaw = optionsRes.data ?? [];
  const pmg = pmgRes.data ?? [];

  const optionsByGroup = new Map<string, ModifierOption[]>();
  for (const o of optionsRaw) {
    const arr = optionsByGroup.get(o.group_id) ?? [];
    arr.push({
      id: o.id,
      name: o.name,
      price_delta_cents: o.price_delta_cents,
      is_active: o.is_active,
      sort_order: o.sort_order,
    });
    optionsByGroup.set(o.group_id, arr);
  }
  const groupsById = new Map<string, ModifierGroup>(
    groupsRaw.map((g) => [g.id, { ...g, options: optionsByGroup.get(g.id) ?? [] }])
  );

  const groupsByProduct = new Map<string, ModifierGroup[]>();
  for (const row of pmg) {
    const g = groupsById.get(row.modifier_group_id);
    if (!g) continue;
    const arr = groupsByProduct.get(row.product_id) ?? [];
    arr.push(g);
    groupsByProduct.set(row.product_id, arr);
  }

  const products: Product[] = rawProducts.map((p) => ({
    ...p,
    modifier_groups: (groupsByProduct.get(p.id) ?? []).sort((a, b) => a.sort_order - b.sort_order),
  }));

  const shopForClient: Shop = {
    id: shop.id,
    slug: shop.slug,
    name: shop.name,
    currency: shop.currency,
    tax_rate_bps: shop.tax_rate_bps,
  };

  return <MenuClient shop={shopForClient} categories={categories} products={products} />;
}
