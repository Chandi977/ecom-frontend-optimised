import Head from "next/head";

/**
 * Shared SEO head for the storefront.
 *
 * - ALWAYS emits a canonical against the single www host, falling back to the
 *   provided slug if a product-sourced canonical wasn't supplied — no catalog
 *   page ever ships without one (dedupes www/non-www + query variants).
 * - Emits the standard Open Graph + Twitter site fields on every page that
 *   uses it, so private/undecorated pages stop hiding in SERPs.
 *
 * Usage:
 *   <SeoHead title="..." description="..." slug={product?.slug} image={...} />
 *   <SeoHead ... noindex />            // auth, cart, payment, wishlist, profile
 */
const SITE_HOST = "https://www.store.prempackaging.com";

type SeoHeadProps = {
  title: string;
  description?: string;
  slug?: string | number;
  image?: string;
  noindex?: boolean;
  canonical?: string;
  children?: React.ReactNode;
};

export const SeoHead = ({
  title,
  description,
  slug,
  image,
  noindex,
  canonical,
  children,
}: SeoHeadProps) => {
  const canonicalHref = canonical || (slug ? `${SITE_HOST}/${slug}` : SITE_HOST);

  return (
    <Head>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      <link rel="canonical" href={canonicalHref} />
      <meta property="og:site_name" content="Prem Packaging" />
      <meta property="og:url" content={canonicalHref} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:site"
        content="https://twitter.com/Prem_Packaging"
      />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {children}
    </Head>
  );
};

/**
 * Lightweight noindex head for routes that must never be indexed
 * (cart, wishlist, checkout, payment, auth, profile). Optionally hides
 * the page from crawl while keeping it fully functional for users.
 */
export const NoIndex = () => (
  <Head>
    <meta name="robots" content="noindex, nofollow" />
    <meta name="googlebot" content="noindex, nofollow" />
  </Head>
);

export default SeoHead;
