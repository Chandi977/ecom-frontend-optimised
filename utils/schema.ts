// JSON-LD structured data (schema.org) for the storefront.
//
// Every page emits a `@graph` whose nodes hang off two site-wide nodes that
// `_app.tsx` renders once on every route:
//
//   <SITE_URL>/#organization   the seller
//   <SITE_URL>/#website        the site itself (+ its search action)
//
// Page-level helpers below therefore only reference those by `@id` — they must
// never re-declare them, or the same `@id` ends up defined twice per page.
//
// Node id convention: `<page url>#webpage`, `#breadcrumb`, `#product-list`,
// `#product`.

import {
  getAvailableStock,
  getCategorySpecSchema,
  getInventoryStatus,
  getPriceTiers,
  getProductMedia,
  getProductSeo,
  getProductSpecification,
  getSubCategorySeoContent,
  type NormalizedPriceTier,
} from "./productCatalog";
import { isFieldVisible, specVisibilityKey } from "./fieldVisibility";

type Json = Record<string, any>;

/**
 * Canonical origin. Overridable per environment so staging doesn't publish
 * production URLs; the default is the host this store deploys to.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://store.prempackaging.com"
).replace(/\/+$/, "");

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

// Seller details — kept in step with utils/invoiceGenerator.ts (SELLER) and the
// footer, which are the two other places these are stated.
const ORGANIZATION = {
  legalName: "Prem Industries India Limited",
  name: "Prem Packaging",
  email: "ecommerce@premindustries.in",
  telephone: "+91-844-724-7227",
  logo: "/pp_logo.png",
  streetAddress: "C-209, Bulandshahar Road, Industrial Area",
  addressLocality: "Ghaziabad",
  addressRegion: "Uttar Pradesh",
  postalCode: "201009",
  addressCountry: "IN",
  sameAs: [
    "https://prempackaging.com/",
    "https://www.facebook.com/PremIndustriesIndiaLimited/",
    "https://www.instagram.com/prem_packaging/?hl=en",
    "https://www.youtube.com/@premindustries9251/videos",
    "https://in.linkedin.com/company/prem-packaging",
  ],
};

/** Joins a site-relative path onto the canonical origin. */
export const canonicalUrl = (path = "/"): string => {
  if (!path || path === "/") return `${SITE_URL}/`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

/** Media helpers already resolve CDN paths; only local `/foo.png` needs a host. */
const absoluteImage = (src?: string): string => {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  return `${SITE_URL}${src.startsWith("/") ? src : `/${src}`}`;
};

const clean = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value).trim();

/** Drops empty strings/arrays/objects so the emitted JSON stays lean. */
const compact = <T extends Json>(node: T): T => {
  const out: Json = {};
  Object.entries(node).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    if (Array.isArray(value) && value.length === 0) return;
    out[key] = value;
  });
  return out as T;
};

const price = (value: unknown): string => (Number(value) || 0).toFixed(2);

export const buildGraph = (nodes: Array<Json | null | undefined>): Json => ({
  "@context": "https://schema.org",
  "@graph": nodes.filter(Boolean) as Json[],
});

// ── Site-wide nodes (rendered once, from _app.tsx) ─────────────────────────

export const organizationNode = (): Json => ({
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: ORGANIZATION.name,
  legalName: ORGANIZATION.legalName,
  url: `${SITE_URL}/`,
  email: ORGANIZATION.email,
  telephone: ORGANIZATION.telephone,
  logo: {
    "@type": "ImageObject",
    "@id": `${SITE_URL}/#logo`,
    url: absoluteImage(ORGANIZATION.logo),
    contentUrl: absoluteImage(ORGANIZATION.logo),
caption: ORGANIZATION.legalName,
  },
  image: { "@id": `${SITE_URL}/#logo` },
  address: {
    "@type": "PostalAddress",
    streetAddress: ORGANIZATION.streetAddress,
    addressLocality: ORGANIZATION.addressLocality,
    addressRegion: ORGANIZATION.addressRegion,
    postalCode: ORGANIZATION.postalCode,
    addressCountry: ORGANIZATION.addressCountry,
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    telephone: ORGANIZATION.telephone,
    email: ORGANIZATION.email,
    areaServed: "IN",
    availableLanguage: ["en", "hi"],
  },
  sameAs: ORGANIZATION.sameAs,
});

export const websiteNode = (): Json => ({
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: `${SITE_URL}/`,
  name: ORGANIZATION.name,
  description:
    "Industrial and e-commerce packaging supplies from Prem Industries India Limited — corrugated boxes, poly bags, paper bags, tapes and labels.",
  publisher: { "@id": ORGANIZATION_ID },
  inLanguage: "en-IN",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/listingpage?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
});

/** The two nodes every page's graph refers to. Rendered once in `_app.tsx`. */
export const siteSchema = (): Json => buildGraph([organizationNode(), websiteNode()]);

// ── Shared page nodes ──────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export const breadcrumbNode = (
  path: string,
  trail: BreadcrumbItem[],
): Json => ({
  "@type": "BreadcrumbList",
  "@id": `${canonicalUrl(path)}#breadcrumb`,
  itemListElement: [{ name: "Home", path: "/" }, ...trail].map((crumb, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: crumb.name,
    item: canonicalUrl(crumb.path),
  })),
});

interface PageNodeOptions {
  path: string;
  name: string;
  description?: string;
  /** WebPage subtype — CollectionPage, ItemPage, ContactPage, AboutPage… */
  type?: string;
  /** `@id` of the node this page is primarily about (product list, product…). */
  mainEntityId?: string;
  hasBreadcrumb?: boolean;
}

export const pageNode = ({
  path,
  name,
  description,
  type = "WebPage",
  mainEntityId,
  hasBreadcrumb = true,
}: PageNodeOptions): Json => {
  const url = canonicalUrl(path);
  return compact({
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    description: clean(description),
    inLanguage: "en-IN",
    isPartOf: { "@id": WEBSITE_ID },
    ...(hasBreadcrumb ? { breadcrumb: { "@id": `${url}#breadcrumb` } } : {}),
    ...(mainEntityId ? { mainEntity: { "@id": mainEntityId } } : {}),
  });
};

// ── Products ───────────────────────────────────────────────────────────────

const productUrl = (product: Json): string =>
  canonicalUrl(`/${clean(product?.slug) || clean(product?._id)}`);

const availabilityUrl = (product: Json): string =>
  getInventoryStatus(product) === "out-of-stock"
    ? "https://schema.org/OutOfStock"
    : "https://schema.org/InStock";

const brandName = (product: Json): string => {
  const brand = product?.brand;
  if (brand && typeof brand === "object") return clean(brand.name);
  return clean(brand);
};

const categoryName = (product: Json): string => {
  const category = product?.category;
  if (category && typeof category === "object") return clean(category.name);
  return clean(category);
};

/**
 * A tier is a pack: `number` units for `sellingPrice`. Each becomes an Offer
 * priced per pack, carrying a UnitPriceSpecification for the per-unit rate.
 */
const tierOffer = (
  tier: NormalizedPriceTier,
  product: Json,
  availability: string,
): Json => {
  const packSize = tier.number || 1;
  return compact({
    "@type": "Offer",
    name: `Pack of ${packSize}`,
    price: price(tier.sellingPrice),
    priceCurrency: "INR",
    availability,
    itemCondition: "https://schema.org/NewCondition",
    url: productUrl(product),
    seller: { "@id": ORGANIZATION_ID },
    eligibleQuantity: {
      "@type": "QuantitativeValue",
      value: packSize,
      unitCode: "EA",
    },
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: price(tier.sellingPrice / packSize),
      priceCurrency: "INR",
      referenceQuantity: {
        "@type": "QuantitativeValue",
        value: 1,
        unitCode: "EA",
      },
    },
  });
};

/**
 * AggregateOffer whose low/high are the **per-unit** rates (matching the price
 * shown on the product page and keeping the figure in search results
 * comparable), with each pack tier nested as its own Offer.
 */
const offersNode = (product: Json): Json | null => {
  const tiers = getPriceTiers(product);
  const availability = availabilityUrl(product);

  if (tiers.length === 0) {
    const basePrice = Number(product?.pricing?.basePrice ?? product?.price) || 0;
    if (basePrice <= 0) return null;
    return compact({
      "@type": "Offer",
      price: price(basePrice),
      priceCurrency: "INR",
      availability,
      itemCondition: "https://schema.org/NewCondition",
      url: productUrl(product),
      seller: { "@id": ORGANIZATION_ID },
    });
  }

  const unitPrices = tiers
    .map((tier) => tier.sellingPrice / (tier.number || 1))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (unitPrices.length === 0) return null;

  return compact({
    "@type": "AggregateOffer",
    priceCurrency: "INR",
    lowPrice: price(Math.min(...unitPrices)),
    highPrice: price(Math.max(...unitPrices)),
    offerCount: tiers.length,
    availability,
    url: productUrl(product),
    seller: { "@id": ORGANIZATION_ID },
    offers: tiers.map((tier) => tierOffer(tier, product, availability)),
  });
};

/** Visible specification rows become PropertyValues. */
const additionalProperties = (product: Json): Json[] => {
  const specification = getProductSpecification(product) as Record<string, unknown>;
  const schema = getCategorySpecSchema(product);
  const schemaByKey = new Map(schema.map((field) => [field.key, field]));
  const hidden = new Set(["_id", "product", "createdAt", "updatedAt", "__v"]);

  return Object.entries(specification)
    .filter(([key, value]) => {
      if (hidden.has(key)) return false;
      if (value === null || value === undefined || typeof value === "object") {
        return false;
      }
      return clean(value) !== "";
    })
    .filter(([key]) => isFieldVisible(product, specVisibilityKey(key)))
    .map(([key, value]) => {
      const def = schemaByKey.get(key);
      return compact({
        "@type": "PropertyValue",
        name:
          def?.label ||
          key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
        value: clean(value),
        unitText: clean(def?.unit),
      });
    });
};

export const productNode = (product: Json): Json => {
  const url = productUrl(product);
  const seo = getProductSeo(product);
  const media = getProductMedia(product);
  const images = media.images
    .map((image) => absoluteImage(image.image))
    .filter(Boolean);

  const ratingCount = Number(product?.ratingCount) || 0;
  const ratingAverage = Number(product?.ratingAverage) || 0;

  return compact({
    "@type": "Product",
    "@id": `${url}#product`,
    name: clean(product?.name),
    description: clean(seo.description || product?.description),
    url,
    image: images,
    sku: clean(product?.model || product?.product_id || product?._id),
    mpn: clean(product?.model),
    category: categoryName(product),
    ...(brandName(product)
      ? { brand: { "@type": "Brand", name: brandName(product) } }
      : {}),
    manufacturer: { "@id": ORGANIZATION_ID },
    additionalProperty: additionalProperties(product),
    ...(offersNode(product) ? { offers: offersNode(product) } : {}),
    // Only ever published from real moderated reviews — never from the
    // storefront's sample-review fallback.
    ...(ratingCount > 0 && ratingAverage > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ratingAverage.toFixed(1),
            reviewCount: ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    isPartOf: { "@id": WEBSITE_ID },
  });
};

/** Full graph for a product detail page. */
/**
 * FAQPage node for the sub-category FAQ rendered on a page. Returns null when
 * the sub-category has no FAQ authored, so the graph stays clean.
 */
export const faqNode = (path: string, faqs: Json[] = []): Json | null => {
  const entries = (Array.isArray(faqs) ? faqs : [])
    .map((faq) => ({ question: clean(faq?.question), answer: clean(faq?.answer) }))
    .filter((faq) => faq.question && faq.answer);
  if (!entries.length) return null;

  return {
    "@type": "FAQPage",
    "@id": `${canonicalUrl(path)}#faq`,
    mainEntity: entries.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
};

export const productPageSchema = (product: Json): Json => {
  const slug = clean(product?.slug) || clean(product?._id);
  const path = `/${slug}`;
  const url = canonicalUrl(path);
  const category = categoryName(product);
  const categorySlug =
    (product?.category && typeof product.category === "object"
      ? clean(product.category.slug)
      : "") ||
    category
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const trail: BreadcrumbItem[] = [];
  if (category && categorySlug) trail.push({ name: category, path: `/${categorySlug}` });
  trail.push({ name: clean(product?.name), path });

  return buildGraph([
    pageNode({
      path,
      name: clean(product?.name),
      description: getProductSeo(product).description,
      type: "ItemPage",
      mainEntityId: `${url}#product`,
    }),
    productNode(product),
    breadcrumbNode(path, trail),
    // Sub-category FAQ, authored once per sub-category and shared by its products.
    faqNode(path, getSubCategorySeoContent(product)?.faqs),
  ]);
};

// ── Listing / collection pages ─────────────────────────────────────────────

export interface CollectionPageOptions {
  path: string;
  name: string;
  description?: string;
  /** Products the page rendered server-side; each becomes an ItemList entry. */
  products?: Json[];
  /** Breadcrumb trail after Home. Defaults to a single crumb for this page. */
  breadcrumb?: BreadcrumbItem[];
  /** Cap on ItemList entries so the payload stays reasonable. */
  limit?: number;
  /** `SearchResultsPage` for query-driven listings, `CollectionPage` otherwise. */
  type?: string;
}

export const collectionPageSchema = ({
  path,
  name,
  description,
  products = [],
  breadcrumb,
  limit = 30,
  type = "CollectionPage",
}: CollectionPageOptions): Json => {
  const url = canonicalUrl(path);
  const listId = `${url}#product-list`;

  const items = (Array.isArray(products) ? products : [])
    .filter((item) => item && (item.slug || item._id))
    .slice(0, limit)
    .map((item, index) =>
      compact({
        "@type": "ListItem",
        position: index + 1,
        name: clean(item?.name),
        url: productUrl(item),
      }),
    );

  return buildGraph([
    pageNode({ path, name, description, type, mainEntityId: listId }),
    compact({
      "@type": "ItemList",
      "@id": listId,
      name,
      description: clean(description),
      url,
      itemListOrder: "https://schema.org/ItemListUnordered",
      numberOfItems: items.length,
      itemListElement: items,
    }),
    breadcrumbNode(path, breadcrumb || [{ name, path }]),
  ]);
};

// ── Content pages (policies, contact, custom packaging, …) ─────────────────

export interface ContentPageOptions {
  path: string;
  name: string;
  description?: string;
  type?: string;
  breadcrumb?: BreadcrumbItem[];
}

export const contentPageSchema = ({
  path,
  name,
  description,
  type = "WebPage",
  breadcrumb,
}: ContentPageOptions): Json =>
  buildGraph([
    pageNode({ path, name, description, type }),
    breadcrumbNode(path, breadcrumb || [{ name, path }]),
  ]);

// ── Home ───────────────────────────────────────────────────────────────────

export const homePageSchema = (options: {
  name: string;
  description?: string;
  /** Top-level catalog sections, rendered as an ItemList of category links. */
  categories?: BreadcrumbItem[];
}): Json => {
  const url = `${SITE_URL}/`;
  const listId = `${url}#category-list`;
  const categories = options.categories || [];

  return buildGraph([
    compact({
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: options.name,
      description: clean(options.description),
      inLanguage: "en-IN",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORGANIZATION_ID },
      ...(categories.length ? { mainEntity: { "@id": listId } } : {}),
    }),
    categories.length
      ? compact({
          "@type": "ItemList",
          "@id": listId,
          name: "Packaging categories",
          numberOfItems: categories.length,
          itemListElement: categories.map((category, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: category.name,
            url: canonicalUrl(category.path),
          })),
        })
      : null,
  ]);
};
