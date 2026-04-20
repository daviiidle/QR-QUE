"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartModifier = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDeltaCents: number;
};

export type CartItem = {
  id: string; // local uuid for the cart row
  productId: string;
  productName: string;
  basePriceCents: number;
  quantity: number;
  modifiers: CartModifier[];
  notes?: string;
};

type CartState = {
  shopId: string | null;
  shopSlug: string | null;
  items: CartItem[];
  setShop: (shopId: string, shopSlug: string) => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
};

export const unitPriceCents = (i: CartItem) =>
  i.basePriceCents + i.modifiers.reduce((s, m) => s + m.priceDeltaCents, 0);

export const lineTotalCents = (i: CartItem) => unitPriceCents(i) * i.quantity;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      shopId: null,
      shopSlug: null,
      items: [],
      setShop: (shopId, shopSlug) => {
        if (get().shopId && get().shopId !== shopId) {
          // switching shops wipes the cart
          set({ shopId, shopSlug, items: [] });
        } else {
          set({ shopId, shopSlug });
        }
      },
      addItem: (item) => set((s) => ({ items: [...s.items, item] })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, Math.min(20, quantity)) } : i
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "qr-que-cart",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
