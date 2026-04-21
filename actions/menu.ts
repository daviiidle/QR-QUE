"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireShopMember } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

const MENU_IMAGE_BUCKET = "menu-images";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_MIME_TO_EXTENSION: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function getImageFile(formData: FormData) {
  const image = formData.get("image_file");
  if (!(image instanceof File) || image.size === 0) return null;
  if (!IMAGE_MIME_TO_EXTENSION[image.type]) {
    throw new Error("Unsupported image type. Upload a JPG, PNG, WebP, AVIF, or GIF.");
  }
  if (image.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }
  return image;
}

async function uploadProductImage(shopId: string, productId: string, image: File) {
  const ext = IMAGE_MIME_TO_EXTENSION[image.type];
  const path = `${shopId}/${productId}/${crypto.randomUUID()}.${ext}`;
  const sb = supabaseService();
  const { error } = await sb.storage.from(MENU_IMAGE_BUCKET).upload(path, image, {
    contentType: image.type,
    upsert: false,
  });
  if (error) throw error;

  const { data } = sb.storage.from(MENU_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

const CategorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export async function createCategory(formData: FormData) {
  const { shopId } = await requireShopMember();
  const parsed = CategorySchema.parse(Object.fromEntries(formData));
  const sb = await supabaseServer();
  const { error } = await sb
    .from("categories")
    .insert({ shop_id: shopId, name: parsed.name, sort_order: parsed.sort_order });
  if (error) throw error;
  revalidatePath("/dashboard/menu");
}

export async function toggleCategory(id: string, is_active: boolean) {
  await requireShopMember();
  const sb = await supabaseServer();
  await sb.from("categories").update({ is_active }).eq("id", id);
  revalidatePath("/dashboard/menu");
}

const ProductSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  base_price_cents: z.coerce.number().int().min(0).max(1_000_000),
  category_id: z.string().uuid().optional().or(z.literal("")),
  image_url: z.string().url().optional().or(z.literal("")),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export async function createProduct(formData: FormData) {
  const { shopId, shopSlug } = await requireShopMember();
  const raw = Object.fromEntries(formData);
  const p = ProductSchema.parse(raw);
  const sb = await supabaseServer();
  const image = getImageFile(formData);
  const { data: product, error } = await sb.from("products").insert({
    shop_id: shopId,
    name: p.name,
    description: p.description || null,
    base_price_cents: p.base_price_cents,
    category_id: p.category_id || null,
    image_url: p.image_url || null,
    sort_order: p.sort_order,
  }).select("id").single();
  if (error) throw error;

  if (image) {
    const imageUrl = await uploadProductImage(shopId, product.id, image);
    const { error: imageError } = await sb
      .from("products")
      .update({ image_url: imageUrl })
      .eq("id", product.id)
      .eq("shop_id", shopId);
    if (imageError) throw imageError;
  }

  revalidatePath("/dashboard/menu");
  revalidatePath(`/s/${shopSlug}`);
}

export async function toggleProduct(id: string, is_active: boolean) {
  await requireShopMember();
  const sb = await supabaseServer();
  await sb.from("products").update({ is_active }).eq("id", id);
  revalidatePath("/dashboard/menu");
}

export async function updateProduct(id: string, formData: FormData) {
  const { shopId, shopSlug } = await requireShopMember();
  const raw = Object.fromEntries(formData);
  const p = ProductSchema.parse(raw);
  const sb = await supabaseServer();
  const image = getImageFile(formData);
  const imageUrl = image ? await uploadProductImage(shopId, id, image) : p.image_url || null;
  const { error } = await sb.from("products").update({
    name: p.name,
    description: p.description || null,
    base_price_cents: p.base_price_cents,
    category_id: p.category_id || null,
    image_url: imageUrl,
    sort_order: p.sort_order,
  }).eq("id", id).eq("shop_id", shopId);
  if (error) throw error;
  revalidatePath("/dashboard/menu");
  revalidatePath(`/s/${shopSlug}`);
}

export async function attachModifierGroup(productId: string, modifierGroupId: string) {
  await requireShopMember();
  const sb = await supabaseServer();
  await sb
    .from("product_modifier_groups")
    .upsert({ product_id: productId, modifier_group_id: modifierGroupId });
  revalidatePath("/dashboard/menu");
}

export async function detachModifierGroup(productId: string, modifierGroupId: string) {
  await requireShopMember();
  const sb = await supabaseServer();
  await sb
    .from("product_modifier_groups")
    .delete()
    .eq("product_id", productId)
    .eq("modifier_group_id", modifierGroupId);
  revalidatePath("/dashboard/menu");
}
