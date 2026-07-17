import React, { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";

type ProductImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: ImageProps["src"] | null;
  alt?: string;
  fallbackSrc?: string;
};

const DEFAULT_FALLBACK_IMAGE = "/pp_logo_1.png";

export function ProductImage({
  src,
  alt = "Product image",
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  onError,
  unoptimized,
  ...props
}: ProductImageProps) {
  const initialSrc = src || fallbackSrc;
  const [displaySrc, setDisplaySrc] = useState<ImageProps["src"]>(initialSrc);

  useEffect(() => {
    setDisplaySrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  const isRemoteImage =
    typeof displaySrc === "string" && /^https?:\/\//i.test(displaySrc);

  return (
    <Image
      {...props}
      src={displaySrc}
      alt={alt}
      unoptimized={unoptimized ?? isRemoteImage}
      onError={(event) => {
        if (displaySrc !== fallbackSrc) {
          setDisplaySrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}

export default ProductImage;
