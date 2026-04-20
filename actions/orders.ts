"use server";

import { revalidatePath } from "next/cache";
import { requireShopMember } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types/domain";

const ALLOWED: OrderStatus[] = ["received", "making", "ready", "completed", "cancelled"];

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  const member = await requireShopMember();
  if (!ALLOWED.includes(status)) throw new Error("bad status");

  const sb = await supabaseServer();
  const { error } = await sb
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("shop_id", member.shopId);
  if (error) throw error;

  revalidatePath("/dashboard");
}
