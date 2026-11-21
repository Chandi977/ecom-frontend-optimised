"use client";
import React from "react";
import { getService } from "../../services/service";
import B2BProductTemplate from "../../components/product/B2BProductTemplate";
import { getLegacyCompatibleProduct } from "../../utils/productCatalog";
import { trackProductView } from "../../lib/analytics";

export async function getServerSideProps(context: any) {
  context.res?.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  const requestedSlug = Array.isArray(context?.query?.slug)
    ? context.query.slug[0]
    : context?.query?.slug;
  const encodedSlug = requestedSlug
    ? encodeURIComponent(String(requestedSlug))
    : "";
  const res = encodedSlug ? await getService(`product/get/${encodedSlug}`) : null;

  if (!res?.data?.data) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      product: res.data.data,
    },
  };
}

export default function ProductPage({ product: rawProduct }: { product: any }) {
  const lastViewedProduct = React.useRef<string | null>(null);
  const product = React.useMemo(() => {
    if (!rawProduct) return rawProduct;
    return getLegacyCompatibleProduct(rawProduct);
  }, [rawProduct]);

  React.useEffect(() => {
    const id = String(product?._id || product?.id || "");
    if (!id || lastViewedProduct.current === id) return;
    lastViewedProduct.current = id;
    const category = product?.category;
    trackProductView({
      id,
      name: product?.name,
      category: typeof category === "object" ? category?.name : category,
    });
  }, [product]);

  return <B2BProductTemplate product={product} />;
}
