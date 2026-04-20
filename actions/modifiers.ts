"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireShopMember } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

const GroupSchema = z.object({
  name: z.string().trim().min(1).max(60),
  selection_type: z.enum(["single", "multi"]),
  min_select: z.coerce.number().int().min(0).max(20),
  max_select: z.coerce.number().int().min(1).max(20),
  is_required: z.coerce.boolean().optional().default(false),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export async function createModifierGroup(formData: FormData) {
  const { shopId } = await requireShopMember();
  const parsed = GroupSchema.parse(Object.fromEntries(formData));
  if (parsed.max_select < parsed.min_select) {
    throw new Error("max_select must be >= min_select");
  }
  const sb = await supabaseServer();
  const { error } = await sb
    .from("modifier_groups")
    .insert({ shop_id: shopId, ...parsed });
  if (error) throw error;
  revalidatePath("/dashboard/modifiers");
}

const OptionSchema = z.object({
  group_id: z.string().uuid(),
  name: z.string().trim().min(1).max(60),
  price_delta_cents: z.coerce.number().int().min(-100_000).max(100_000),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export async function createModifierOption(formData: FormData) {
  await requireShopMember();
  const parsed = OptionSchema.parse(Object.fromEntries(formData));
  const sb = await supabaseServer();
  const { error } = await sb.from("modifier_options").insert(parsed);
  if (error) throw error;
  revalidatePath("/dashboard/modifiers");
}

export async function toggleModifierOption(id: string, is_active: boolean) {
  await requireShopMember();
  const sb = await supabaseServer();
  await sb.from("modifier_options").update({ is_active }).eq("id", id);
  revalidatePath("/dashboard/modifiers");
}
