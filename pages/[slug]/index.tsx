"use client";
import React from "react";
import { getService } from "../../services/service";
import B2BProductTemplate from "../../components/product/B2BProductTemplate";
import { getLegacyCompatibleProduct } from "../../utils/productCatalog";

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
  const product = React.useMemo(() => {
    if (!rawProduct) return rawProduct;
    return getLegacyCompatibleProduct(rawProduct);
  }, [rawProduct]);

  return <B2BProductTemplate product={product} />;
}
