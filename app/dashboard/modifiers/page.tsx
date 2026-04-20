import { requireShopMember } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { createModifierGroup, createModifierOption, toggleModifierOption } from "@/actions/modifiers";

export const dynamic = "force-dynamic";

export default async function ModifiersPage() {
  const { shopId } = await requireShopMember();
  const sb = await supabaseServer();

  const { data: groups } = await sb
    .from("modifier_groups")
    .select(`id, name, selection_type, min_select, max_select, is_required, sort_order,
             modifier_options (id, name, price_delta_cents, is_active, sort_order)`)
    .eq("shop_id", shopId)
    .order("sort_order");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">New modifier group</h2>
        <form action={createModifierGroup} className="space-y-2">
          <input name="name" className="input" required placeholder="e.g. Size / Sugar / Toppings" maxLength={60} />
          <select name="selection_type" className="input">
            <option value="single">Single select (pick one)</option>
            <option value="multi">Multi select (pick many)</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input name="min_select" type="number" min={0} defaultValue={0} className="input" placeholder="Min" />
            <input name="max_select" type="number" min={1} defaultValue={1} className="input" placeholder="Max" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input name="is_required" type="checkbox" />
            Required
          </label>
          <input name="sort_order" type="number" defaultValue={(groups?.length ?? 0)} className="input" />
          <button type="submit" className="btn-primary w-full">Add group</button>
        </form>
      </section>

      <section className="space-y-4">
        {(groups ?? []).map((g) => (
          <div key={g.id} className="card">
            <div className="mb-2 flex items-baseline justify-between">
              <div>
                <h3 className="font-semibold">{g.name}</h3>
                <div className="text-xs text-neutral-500">
                  {g.selection_type} · min {g.min_select}, max {g.max_select}
                  {g.is_required && " · required"}
                </div>
              </div>
            </div>
            <ul className="mb-3 space-y-1 text-sm">
              {(g.modifier_options ?? []).map((o) => (
                <li key={o.id} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-1.5">
                  <span>
                    {o.name}
                    {o.price_delta_cents !== 0 && (
                      <span className="ml-2 text-neutral-500">
                        {o.price_delta_cents > 0 ? "+" : ""}
                        {formatMoney(o.price_delta_cents)}
                      </span>
                    )}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await toggleModifierOption(o.id, !o.is_active);
                    }}
                  >
                    <button className="text-xs text-neutral-500 underline" type="submit">
                      {o.is_active ? "Hide" : "Show"}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
            <form action={createModifierOption} className="flex flex-wrap gap-2">
              <input type="hidden" name="group_id" value={g.id} />
              <input name="name" className="input flex-1 min-w-[10rem]" placeholder="Option name" required maxLength={60} />
              <input name="price_delta_cents" type="number" className="input w-32" defaultValue={0} placeholder="Δ cents" />
              <input name="sort_order" type="number" className="input w-20" defaultValue={(g.modifier_options?.length ?? 0)} />
              <button type="submit" className="btn-primary">Add</button>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}
