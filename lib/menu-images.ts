const DEFAULT_PRODUCT_IMAGES: Record<string, string> = {
  "brown sugar milk": "/menu-images/brown-sugar-milk.svg",
  "classic milk tea": "/menu-images/classic-milk-tea.svg",
  "mango green tea": "/menu-images/mango-green-tea.svg",
  "matcha latte": "/menu-images/matcha-latte.svg",
  "passionfruit green tea": "/menu-images/passionfruit-green-tea.svg",
  "taro milk tea": "/menu-images/taro-milk-tea.svg",
};

function normalizeProductName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getDefaultProductImage(productName: string) {
  return DEFAULT_PRODUCT_IMAGES[normalizeProductName(productName)] ?? null;
}

export function isUsableImageUrl(value: string | null | undefined) {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/")) return true;

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getProductImageSrc(productName: string, imageUrl: string | null | undefined) {
  const defaultImage = getDefaultProductImage(productName);
  const trimmed = imageUrl?.trim();
  if (
    defaultImage &&
    (trimmed?.startsWith("https://www.canva.com/api/short/") ||
      trimmed?.startsWith("https://design.canva.ai/"))
  ) {
    return defaultImage;
  }
  if (isUsableImageUrl(trimmed)) return trimmed!;
  return defaultImage;
}
