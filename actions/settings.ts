"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

const ShopSchema = z.object({
  name: z.string().trim().min(1).max(100),
  tax_rate_bps: z.coerce.number().int().min(0).max(5000),
  currency: z.string().trim().min(3).max(3).default("AUD"),
  timezone: z.string().trim().min(1).max(60).default("Australia/Sydney"),
});

export async function updateShop(formData: FormData) {
  const { shopId } = await requireOwner();
  const parsed = ShopSchema.parse(Object.fromEntries(formData));
  const sb = await supabaseServer();
  const { error } = await sb.from("shops").update(parsed).eq("id", shopId);
  if (error) throw error;
  revalidatePath("/dashboard/settings");
}
