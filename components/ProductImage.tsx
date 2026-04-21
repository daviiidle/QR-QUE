"use client";

import { useEffect, useMemo, useState } from "react";
import { getDefaultProductImage, getProductImageSrc } from "@/lib/menu-images";

export function ProductImage({
  name,
  imageUrl,
  className = "",
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
}) {
  const fallbackSrc = useMemo(() => getDefaultProductImage(name), [name]);
  const initialSrc = useMemo(() => getProductImageSrc(name, imageUrl), [name, imageUrl]);
  const [src, setSrc] = useState<string | null>(initialSrc);

  useEffect(() => {
    setSrc(initialSrc);
  }, [initialSrc]);

  if (!src) {
    return <div className={`h-full w-full bg-gradient-to-br from-brand-50 to-neutral-100 ${className}`} />;
  }

  return (
    <img
      src={src}
      alt={name}
      className={`h-full w-full object-cover ${className}`}
      onError={() => setSrc(src === fallbackSrc ? null : fallbackSrc)}
    />
  );
}
