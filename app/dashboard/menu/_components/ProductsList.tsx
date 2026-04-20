"use client";

import { useState } from "react";
import { updateProduct, toggleProduct, attachModifierGroup, detachModifierGroup } from "@/actions/menu";

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
  selection_type: "single" | "multiple";
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
  const [editForm, setEditForm] = useState<Partial<Product>>({});

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setEditForm(p);
  };

  const handleSave = async () => {
    if (!editingId) return;
    await updateProduct(editingId, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
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
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      className="input input-bordered w-full"
                      value={editForm.name ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Name"
                    />
                    <textarea
                      className="input input-bordered w-full"
                      value={editForm.description ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Description"
                    />
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={editForm.base_price_cents ?? 0}
                      onChange={(e) => setEditForm({ ...editForm, base_price_cents: parseInt(e.target.value) })}
                      placeholder="Price (cents)"
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="font-medium">{p.name}</h3>
                    <p className="text-sm text-neutral-500">{p.description}</p>
                    <p className="text-sm font-medium">${(p.base_price_cents / 100).toFixed(2)}</p>
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
                {isEditing ? (
                  <>
                    <button onClick={handleSave} className="btn btn-sm btn-primary">Save</button>
                    <button onClick={handleCancel} className="btn btn-sm btn-ghost">Cancel</button>
                  </>
                ) : (
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
