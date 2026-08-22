import { getService, postService } from "../services/service";

export type Brand = {
  _id: string;
  name: string;
  slug?: string;
  brand_id?: string;
  image?: string;
  [key: string]: unknown;
};

// Case/space-insensitive key used for all name & slug matching so we are robust
// to how brands were entered in the DB (e.g. "Pack Secure" / "pack-secure").
const norm = (value?: string): string => (value || "").trim().toLowerCase();

// Route slug for a brand's landing page (folders under /pages are lowercase,
// hyphenated), derived from the DB slug or name — never from a hardcoded id.
export const toBrandRouteSlug = (brand?: Brand | null): string => {
  if (!brand) return "";
  const base = (brand.slug || brand.name || "").trim().toLowerCase();
  return base.replace(/\s+/g, "-");
};

export const findBrandIdByName = (
  brands: Brand[],
  name: string,
): string | undefined => brands.find((b) => norm(b?.name) === norm(name))?._id;

export const findBrandIdBySlug = (
  brands: Brand[],
  slug: string,
): string | undefined => {
  const target = norm(slug);
  return brands.find(
    (b) => norm(b?.slug) === target || toBrandRouteSlug(b) === target,
  )?._id;
};

export const buildBrandNameById = (
  brands: Brand[],
): Record<string, string> =>
  brands.reduce<Record<string, string>>((acc, b) => {
    if (b?._id && b?.name) acc[String(b._id)] = b.name;
    return acc;
  }, {});

// Marketplace brands offered as listing filters, in display order. The brand
// _id is resolved from /brand/all rather than hardcoded.
export const MARKETPLACE_BRAND_OPTIONS = [
  { slug: "amazon", label: "Amazon" },
  { slug: "flipkart", label: "Flipkart" },
  { slug: "myntra", label: "Myntra" },
  { slug: "ajio", label: "Ajio" },
];

/**
 * Which listing a brand count is scoped to. `filter` is merged into the filter
 * payload (`{ category: [...] }`, `{ subcategory: id }`, …) and `endpoint`
 * names the filter route when it is not the default product one — label pages
 * count through `label/filter` so the semantics match what they render.
 */
export type BrandCountScope = {
  filter: Record<string, unknown>;
  endpoint?: string;
};

const hasProductsForBrand = async (
  scope: BrandCountScope,
  brandId: string,
): Promise<boolean> => {
  const res = await postService(
    scope.endpoint || "product/filter",
    { ...scope.filter, brand: brandId, skip: 0, limit: 1, includeMeta: true },
    { silent: true },
  );

  const total = Number(res?.data?.meta?.total);
  if (Number.isFinite(total)) return total > 0;
  return Array.isArray(res?.data?.data) && res.data.data.length > 0;
};

const hasScope = (scope?: BrandCountScope) =>
  Boolean(scope?.filter && Object.values(scope.filter).some(Boolean));

/**
 * Brand ids that actually have at least one product in a listing — used to
 * keep empty brands out of the filters.
 *
 * Counted per brand rather than read off the first page of products, which
 * only holds 20 items and would hide brands that merely sort later. Meant for
 * `getServerSideProps`, so the filter is already correct on first paint.
 *
 * Returns null when the counts cannot be determined; callers should then show
 * every brand rather than render an empty filter.
 */
export const fetchBrandIdsWithProducts = async (
  scope: BrandCountScope,
  brandIds: (string | null | undefined)[],
): Promise<string[] | null> => {
  const candidates = Array.from(new Set(brandIds.filter(Boolean) as string[]));
  if (!hasScope(scope) || !candidates.length) return null;

  try {
    const counted = await Promise.all(
      candidates.map(async (brandId) =>
        (await hasProductsForBrand(scope, brandId)) ? brandId : null,
      ),
    );
    return counted.filter(Boolean) as string[];
  } catch (error) {
    return null;
  }
};

/**
 * Slug-keyed variant of {@link fetchBrandIdsWithProducts} for the pages that
 * offer the fixed marketplace brand list instead of every brand.
 */
export const fetchBrandSlugsWithProducts = async (
  scope: BrandCountScope,
  options: { slug: string }[] = MARKETPLACE_BRAND_OPTIONS,
): Promise<string[] | null> => {
  if (!hasScope(scope)) return null;

  try {
    const brandsRes = await getService("brand/all", {}, { silent: true });
    const brands = (brandsRes?.data?.data as Brand[]) || [];
    if (!brands.length) return null;

    const counted = await Promise.all(
      options.map(async (option) => {
        const brandId =
          findBrandIdByName(brands, option.slug) ||
          findBrandIdBySlug(brands, option.slug);
        if (!brandId) return null;
        return (await hasProductsForBrand(scope, brandId)) ? option.slug : null;
      }),
    );

    return counted.filter(Boolean) as string[];
  } catch (error) {
    return null;
  }
};

// --- cached fetch of /brand/all (shared across the app, brands rarely change) ---
let brandCache: Brand[] | null = null;
let inflight: Promise<Brand[]> | null = null;

export const fetchBrands = async (): Promise<Brand[]> => {
  if (brandCache) return brandCache;
  if (!inflight) {
    inflight = getService("brand/all")
      .then((res) => {
        const list = (res?.data?.data as Brand[]) || [];
        // Only cache a non-empty result so a transient failure can be retried.
        if (list.length) brandCache = list;
        return list;
      })
      .catch(() => [] as Brand[])
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
};
