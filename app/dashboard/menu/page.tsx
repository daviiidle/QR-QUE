import { requireShopMember } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { createCategory, createProduct, toggleCategory } from "@/actions/menu";
import { ProductsList } from "./_components/ProductsList";

export const dynamic = "force-dynamic";

export default async function MenuAdminPage() {
  const { shopId } = await requireShopMember();
  const sb = await supabaseServer();

  const [catsRes, prodsRes, groupsRes, pmgRes] = await Promise.all([
    sb.from("categories").select("id, name, sort_order, is_active").eq("shop_id", shopId).order("sort_order"),
    sb.from("products").select("id, name, description, base_price_cents, is_active, category_id, image_url, sort_order").eq("shop_id", shopId).order("sort_order"),
    sb.from("modifier_groups").select("id, name, selection_type, min_select, max_select, is_required").eq("shop_id", shopId).order("sort_order"),
    sb.from("product_modifier_groups").select("product_id, modifier_group_id"),
  ]);

  const categories = catsRes.data ?? [];
  const products = prodsRes.data ?? [];
  const groups = groupsRes.data ?? [];
  const pmg = pmgRes.data ?? [];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Categories</h2>
        <ul className="mb-4 space-y-1 text-sm">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2">
              <span>{c.name}</span>
              <form
                action={async () => {
                  "use server";
                  await toggleCategory(c.id, !c.is_active);
                }}
              >
                <button className="text-xs text-neutral-500 underline" type="submit">
                  {c.is_active ? "Hide" : "Show"}
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={createCategory} className="space-y-2">
          <input name="name" placeholder="Category name" className="input" required maxLength={60} />
          <input name="sort_order" type="number" defaultValue={categories.length} className="input" />
          <button type="submit" className="btn-primary w-full">Add category</button>
        </form>
      </section>

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">New product</h2>
        <form action={createProduct} className="space-y-2">
          <input name="name" placeholder="Product name" className="input" required maxLength={100} />
          <textarea name="description" placeholder="Description (optional)" className="input" rows={2} maxLength={500} />
          <div className="grid grid-cols-2 gap-2">
            <input name="base_price_cents" type="number" min={0} placeholder="Price in cents (e.g. 650)" className="input" required />
            <select name="category_id" className="input">
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <input name="image_url" placeholder="Image URL (optional)" className="input" />
          <input name="sort_order" type="number" defaultValue={products.length} className="input" />
          <button type="submit" className="btn-primary w-full">Add product</button>
        </form>
      </section>

      <section className="card lg:col-span-2">
        <h2 className="mb-3 text-lg font-semibold">Products</h2>
        <ProductsList
          products={products}
          categories={categories}
          groups={groups}
          pmg={pmg}
        />
      </section>
    </div>
  );
}