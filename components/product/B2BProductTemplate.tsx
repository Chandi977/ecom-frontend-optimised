import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";

import {
  getInventoryStatus,
  getPriceTiers,
  getProductMedia,
  getProductSeo,
  getSubCategorySeoContent,
  type NormalizedPriceTier,
} from "../../utils/productCatalog";
import JsonLd from "../common/JsonLd";
import Reveal from "../common/Reveal";
import { canonicalUrl, productPageSchema } from "../../utils/schema";
import ReviewSection from "./reviews/ReviewSection";
import ProductGallery, { type GalleryImage } from "./b2b/ProductGallery";
import BulkPricingCalculator from "./b2b/BulkPricingCalculator";
import TechnicalTabs from "./b2b/TechnicalTabs";
import FrequentlyBoughtTogether from "./b2b/FrequentlyBoughtTogether";
import RelatedProductsSection from "./b2b/RelatedProductsSection";
import RequestQuoteModal from "./b2b/RequestQuoteModal";
import SubCategoryContent from "./b2b/SubCategoryContent";

interface B2BProductTemplateProps {
  product: Record<string, any>;
}

const slugify = (value: string) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Product details page — dark industrial B2B layout.
 *
 * Sections: breadcrumb, gallery + bulk pricing estimator hero, technical tabs
 * (specs / usage / shipping / pincode freight), ratings & reviews, frequently
 * bought together, related products.
 */
export default function B2BProductTemplate({ product }: B2BProductTemplateProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedTierNumber, setSelectedTierNumber] = useState<number | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  const rawProductName = product?.name || "Industrial Packaging Product";

  const brandName =
    (typeof product?.brand === "object" ? product?.brand?.name : product?.brand) ||
    "Prem Industries";

  const categoryName =
    (typeof product?.category === "object"
      ? product?.category?.name
      : product?.category) || "Industrial Packaging";

  const categoryHref = `/${
    (typeof product?.category === "object" && product?.category?.slug) ||
    slugify(String(categoryName))
  }`;

  const sku =
    product?.model ||
    product?.sku ||
    product?.product_id ||
    (product?._id ? `IND-${String(product._id).slice(-6).toUpperCase()}` : "");

  const productName = useMemo(() => {
    if (!rawProductName) return sku ? `SKU: ${sku}` : "";
    const capitalized = rawProductName
      .split(/\s+/)
      .map((w: string) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
      .join(" ");

    if (!sku || capitalized.toLowerCase().includes(String(sku).toLowerCase())) {
      return capitalized;
    }
    return `${capitalized} ${sku}`;
  }, [rawProductName, sku]);

  const seo = useMemo(() => getProductSeo(product), [product]);

  const images: GalleryImage[] = useMemo(() => {
    const media = getProductMedia(product);
    return media.images.map((img, index) => ({
      src: img.image,
      alt: img.alt || `${productName} — view ${index + 1}`,
      caption: img.alt || `${productName} view ${index + 1}`,
    }));
  }, [product, productName]);

  const tiers: NormalizedPriceTier[] = useMemo(
    () => [...getPriceTiers(product)].sort((a, b) => a.number - b.number),
    [product],
  );

  const selectedTier: NormalizedPriceTier = useMemo(() => {
    const matched = tiers.find((tier) => tier.number === selectedTierNumber);
    return (
      matched ||
      tiers[0] || {
        number: 1,
        sellingPrice: Number(product?.price) || 0,
        mrp: Number(product?.price) || 0,
      }
    );
  }, [tiers, selectedTierNumber, product]);

  // A slug change swaps the product underneath us — reset the estimator.
  useEffect(() => {
    setSelectedTierNumber(null);
    setQuantity(1);
  }, [product?._id]);

  const inStock = getInventoryStatus(product) !== "out-of-stock";

  const productSchema = useMemo(() => productPageSchema(product), [product]);

  // SEO copy + FAQ authored once on the sub-category, shared by its products.
  const subCategoryContent = useMemo(() => getSubCategorySeoContent(product), [product]);

  return (
    <>
      <Head>
        <title>{`${seo.title || productName} | Prem Industries`}</title>
        <meta
          name="description"
          content={
            seo.description ||
            `Buy ${productName} in bulk from Prem Industries. High-performance industrial packaging supplies.`
          }
        />
        <link rel="canonical" href={canonicalUrl(`/${product?.slug || product?._id || ""}`)} />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Product + ItemPage + BreadcrumbList */}
      <JsonLd data={productSchema} id="product" />

      <style jsx global>{`
        .material-symbols-outlined {
          font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
          vertical-align: middle;
        }
        .b2b-icon-fill {
          font-variation-settings: "FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24;
        }
        /* Number inputs in the estimator read as plain figures — the native
           spinners fight the dark chrome. */
        .b2b-product-page input[type="number"]::-webkit-outer-spin-button,
        .b2b-product-page input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .b2b-product-page input[type="number"] {
          -moz-appearance: textfield;
        }
        .b2b-product-page a {
          text-decoration: none;
        }
      `}</style>

      <div className="b2b-product-page tw-bg-white tw-text-[#0f172a] tw-min-h-screen tw-pb-16">
        <main className="tw-w-full tw-max-w-[1280px] tw-mx-auto tw-px-4 sm:tw-px-6 tw-py-8">
          {/* Breadcrumbs */}
          <nav className="tw-flex tw-items-center tw-gap-2 tw-mb-6 tw-text-[#64748b] tw-text-[11px] tw-font-medium tw-overflow-x-auto tw-whitespace-nowrap">
            <Link href="/" className="hover:tw-underline hover:tw-text-[#0f172a] tw-transition-colors tw-text-[#64748b]">
              Home
            </Link>
            <span className="material-symbols-outlined tw-text-sm tw-text-[#94a3b8]">
              chevron_right
            </span>
            <Link
              href={categoryHref}
              className="hover:tw-underline hover:tw-text-[#0f172a] tw-transition-colors tw-text-[#64748b]"
            >
              {categoryName}
            </Link>
            <span className="material-symbols-outlined tw-text-sm tw-text-[#94a3b8]">
              chevron_right
            </span>
            <span className="tw-text-[#0f172a] tw-font-bold">{productName}</span>
          </nav>

          {/* Hero: gallery + bulk pricing estimator */}
          <section className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-12 tw-gap-8 tw-items-start">
            <div className="lg:tw-col-span-7">
              <ProductGallery images={images} inStock={inStock} />
            </div>

            <div className="lg:tw-col-span-5">
              <BulkPricingCalculator
                product={product}
                productName={productName}
                brandName={String(brandName)}
                sku={String(sku)}
                tiers={tiers}
                selectedTier={selectedTier}
                onTierChange={(tier) => setSelectedTierNumber(tier.number)}
                quantity={quantity}
                onQuantityChange={setQuantity}
                onRequestQuote={() => setIsQuoteModalOpen(true)}
              />
            </div>
          </section>

          {/* Everything below the hero fades up as it is reached. The hero
              itself is left alone — it is the first thing on screen and must
              be readable the instant the page paints. */}

          {/* Technical specs, care, shipping & freight */}
          <Reveal amount={0.1}>
            <TechnicalTabs
              product={product}
              productName={productName}
              selectedTier={selectedTier}
            />
          </Reveal>

          {/* Ratings & reviews */}
          <Reveal as="section" className="tw-mt-16" id="reviews" amount={0.1}>
            <ReviewSection product={product} />
          </Reveal>

          {/* Frequently bought together */}
          <Reveal amount={0.1}>
            <FrequentlyBoughtTogether product={product} />
          </Reveal>

          {/* Sub-category buying guide + FAQ (SEO copy) */}
          {subCategoryContent && (
            <Reveal amount={0.1}>
              <SubCategoryContent content={subCategoryContent} />
            </Reveal>
          )}

          {/* Related products */}
          <Reveal amount={0.1}>
            <RelatedProductsSection product={product} />
          </Reveal>
        </main>
      </div>

      <RequestQuoteModal
        open={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        productName={productName}
        sku={String(sku)}
        defaultQuantity={(selectedTier.number || 1) * quantity}
      />
    </>
  );
}
