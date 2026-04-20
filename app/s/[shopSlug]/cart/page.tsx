import { notFound } from "next/navigation";
import { supabaseService } from "@/lib/supabase/service";
import { CartClient } from "./_components/CartClient";

export default async function CartPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = await params;
  const db = supabaseService();
  const { data: shop } = await db
    .from("shops")
    .select("id, slug, name, currency, tax_rate_bps")
    .eq("slug", shopSlug)
    .eq("is_active", true)
    .maybeSingle();
  if (!shop) notFound();
  return <CartClient shop={shop} />;
}
