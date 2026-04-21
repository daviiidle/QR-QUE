"use client";

import { useState } from "react";
import { updateProduct, toggleProduct, attachModifierGroup, detachModifierGroup } from "@/actions/menu";
import { formatMoney } from "@/lib/money";
import { ProductImage } from "@/components/ProductImage";

type Product = {
  id: string;
  name: string;
  description: string | null;
  base_price_cents: number;
  category_id: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

type Category = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

type ModifierGroup = {
  id: string;
  name: string;
  selection_type: "single" | "multi";
  min_select: number;
  max_select: number;
  is_required: boolean;
};

type Props = {
  products: Product[];
  categories: Category[];
  groups: ModifierGroup[];
  pmg: { product_id: string; modifier_group_id: string }[];
};

export function ProductsList({ products, categories, groups, pmg }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleProduct(id, !isActive);
  };

  const attachedGroups = (productId: string) =>
    pmg.filter((entry) => entry.product_id === productId).map((entry) => entry.modifier_group_id);

  const handleAttachGroup = async (productId: string, groupId: string) => {
    await attachModifierGroup(productId, groupId);
  };

  const handleDetachGroup = async (productId: string, groupId: string) => {
    await detachModifierGroup(productId, groupId);
  };

  return (
    <div className="space-y-4">
      {products.map((p) => {
        const isEditing = editingId === p.id;
        const groupsForProduct = attachedGroups(p.id);
        return (
          <div key={p.id} className="rounded-lg border border-neutral-100 p-4">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                <ProductImage name={p.name} imageUrl={p.image_url} />
              </div>

              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <form
                    action={async (formData) => {
                      await updateProduct(p.id, formData);
                      setEditingId(null);
                    }}
                    className="space-y-2"
                  >
                    <input
                      name="name"
                      className="input input-bordered w-full"
                      defaultValue={p.name}
                      placeholder="Name"
                      required
                      maxLength={100}
                    />
                    <textarea
                      name="description"
                      className="input input-bordered w-full"
                      defaultValue={p.description ?? ""}
                      placeholder="Description"
                      maxLength={500}
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        name="base_price_cents"
                        type="number"
                        min={0}
                        className="input input-bordered w-full"
                        defaultValue={p.base_price_cents}
                        placeholder="Price (cents)"
                        required
                      />
                      <select name="category_id" className="input input-bordered w-full" defaultValue={p.category_id ?? ""}>
                        <option value="">No category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      name="image_file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                      className="input input-bordered w-full"
                    />
                    <input
                      name="image_url"
                      className="input input-bordered w-full"
                      defaultValue={p.image_url ?? ""}
                      placeholder="Image URL, or leave empty to remove"
                    />
                    <input
                      name="sort_order"
                      type="number"
                      min={0}
                      className="input input-bordered w-full"
                      defaultValue={p.sort_order}
                      placeholder="Sort order"
                    />
                    <div className="flex items-center gap-2">
                      <button type="submit" className="btn btn-sm btn-primary">Save</button>
                      <button type="button" onClick={handleCancel} className="btn btn-sm btn-ghost">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h3 className="font-medium">{p.name}</h3>
                    <p className="text-sm text-neutral-500">{p.description}</p>
                    <p className="text-sm font-medium">{formatMoney(p.base_price_cents)}</p>
                    {p.image_url && (
                      <p className="mt-1 truncate text-xs text-neutral-400">{p.image_url}</p>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={p.is_active}
                    onChange={() => handleToggle(p.id, p.is_active)}
                    className="toggle toggle-sm"
                  />
                  <span className="text-sm">Active</span>
                </label>
                {!isEditing && (
                  <button onClick={() => handleEdit(p)} className="btn btn-sm btn-ghost">Edit</button>
                )}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {groupsForProduct.length > 0 && groupsForProduct.map((gid) => {
                const g = groups.find((gr) => gr.id === gid);
                return g ? (
                  <span key={gid} className="badge badge-outline text-xs">
                    {g.name}
                    <button onClick={() => handleDetachGroup(p.id, gid)} className="ml-1 hover:text-error">×</button>
                  </span>
                ) : null;
              })}
            </div>
            <div className="mt-2">
              <select
                className="select select-bordered select-sm w-full max-w-xs"
                onChange={(e) => {
                  if (e.target.value) handleAttachGroup(p.id, e.target.value);
                }}
                value=""
              >
                <option value="">+ Add modifier group</option>
                {groups
                  .filter((g) => !groupsForProduct.includes(g.id))
                  .map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}
