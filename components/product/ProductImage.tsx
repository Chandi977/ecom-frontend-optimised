import React, { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cdn } from "../../lib/cdn";
import { refreshProductImageUrl } from "../../utils/productImageUrl";

type ProductImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: ImageProps["src"] | null;
  alt?: string;
  fallbackSrc?: string;
};

const DEFAULT_FALLBACK_IMAGE = cdn("/pp_logo_1.png");

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
  const [hasRetried, setHasRetried] = useState(false);

  useEffect(() => {
    setDisplaySrc(src || fallbackSrc);
    setHasRetried(false);
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
        const refreshRequest =
          !hasRetried && typeof displaySrc === "string"
            ? refreshProductImageUrl(displaySrc)
            : undefined;

        if (refreshRequest) {
          setHasRetried(true);
          void refreshRequest
            .then((refreshedSrc) => setDisplaySrc(refreshedSrc))
            .catch(() => setDisplaySrc(fallbackSrc));
          onError?.(event);
          return;
        }

        if (displaySrc !== fallbackSrc) {
          setDisplaySrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}

export default ProductImage;
