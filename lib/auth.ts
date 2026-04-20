import "server-only";
import { supabaseServer } from "./supabase/server";

export type ShopMember = {
  userId: string;
  shopId: string;
  shopSlug: string;
  role: "owner" | "staff";
};

/**
 * Resolve the logged-in user's primary shop. v1: one shop per user.
 * Returns null if not signed in or not a member of any shop.
 */
export async function getCurrentShopMember(): Promise<ShopMember | null> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data } = await sb
    .from("shop_users")
    .select("role, shop_id, shops!inner(slug)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  // @ts-expect-error join shape
  const slug: string = data.shops.slug;
  return { userId: user.id, shopId: data.shop_id, shopSlug: slug, role: data.role };
}

export async function requireShopMember(): Promise<ShopMember> {
  const m = await getCurrentShopMember();
  if (!m) throw new Error("unauthorized");
  return m;
}

export async function requireOwner(): Promise<ShopMember> {
  const m = await requireShopMember();
  if (m.role !== "owner") throw new Error("forbidden");
  return m;
}
