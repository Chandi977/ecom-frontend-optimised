import { getService } from "../services/service";

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
