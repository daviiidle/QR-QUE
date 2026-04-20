import { requireShopMember } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { updateShop } from "@/actions/settings";
import { QrPanel } from "./_components/QrPanel";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { shopId, role } = await requireShopMember();
  const sb = await supabaseServer();
  const { data: shop } = await sb
    .from("shops")
    .select("id, slug, name, currency, timezone, tax_rate_bps")
    .eq("id", shopId)
    .single();

  if (!shop) return null;

  const disabled = role !== "owner";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Shop</h2>
        <form action={updateShop} className="space-y-3">
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              defaultValue={shop.name}
              disabled={disabled}
              className="input mt-1"
              required
              maxLength={100}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="currency">Currency</label>
              <input
                id="currency"
                name="currency"
                defaultValue={shop.currency}
                disabled={disabled}
                className="input mt-1"
                maxLength={3}
              />
            </div>
            <div>
              <label className="label" htmlFor="tax_rate_bps">Tax (basis pts)</label>
              <input
                id="tax_rate_bps"
                name="tax_rate_bps"
                type="number"
                min={0}
                max={5000}
                defaultValue={shop.tax_rate_bps}
                disabled={disabled}
                className="input mt-1"
              />
              <p className="mt-1 text-xs text-neutral-500">e.g. 1000 = 10%</p>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="timezone">Timezone</label>
            <input
              id="timezone"
              name="timezone"
              defaultValue={shop.timezone}
              disabled={disabled}
              className="input mt-1"
            />
          </div>
          <button
            type="submit"
            disabled={disabled}
            className="btn-primary w-full"
            title={disabled ? "Only the owner can edit shop settings." : undefined}
          >
            Save
          </button>
        </form>
      </section>

      <QrPanel shopSlug={shop.slug} />
    </div>
  );
}
