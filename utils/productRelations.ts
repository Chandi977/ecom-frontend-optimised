// Catalog relationship lookups shared by the product page's "Frequently Bought
// Together" and "Related Products" sections.
//
// Both sections used to carry their own copy of this logic (BuySection /
// RelatedSection). The rules are unchanged:
//   * bundles prefer the curated `buyItWith` / `relatedProducts` ids, then fall
//     back to any product from a *different* category so the bundle never shows
//     three variants of the same thing;
//   * related products prefer `relatedProducts`, then fall back to the same
//     category/brand.

import { getService, postService } from "../services/service";

export type CatalogProduct = Record<string, any> & {
  _id?: string;
  slug?: string;
  name?: string;
};

export const normalizeId = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "object") {
    return (value as Record<string, unknown>)?._id
      ? String((value as Record<string, unknown>)._id)
      : (value as Record<string, unknown>)?.id
        ? String((value as Record<string, unknown>).id)
        : "";
  }
  return String(value);
};

const getProductIds = (items: unknown): string[] =>
  (Array.isArray(items) ? items : [])
    .map(normalizeId)
    .filter((id) => Boolean(id) && id !== "undefined");

const normalizeCategoryName = (value: unknown): string =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getSubCategoryField = (product: CatalogProduct, field: string): string => {
  const subCategory = product?.subCategory || product?.sub_category;
  if (subCategory && typeof subCategory === "object") {
    return String((subCategory as Record<string, unknown>)[field] || "");
  }
  return "";
};

// Last-resort category grouping for products whose category never populated.
const inferProductCategoryKey = (product: CatalogProduct): string => {
  const text = normalizeCategoryName(
    [
      product?.category?.name,
      product?.category?.slug,
      getSubCategoryField(product, "name"),
      getSubCategoryField(product, "slug"),
      product?.name,
      product?.model,
    ]
      .filter(Boolean)
      .join(" "),
  );

  if (/corrugated|box/.test(text)) return "corrugated box";
  if (/poly\s*bag|polybag/.test(text)) return "poly bag";
  if (/paper\s*bag/.test(text)) return "paper bag";
  if (/bopp|tape/.test(text)) return "tape";
  if (/label|rollabel|chromo|thermal/.test(text)) return "label";
  if (/food\s*wrapping|wrapping\s*paper|foil/.test(text)) {
    return "food wrapping paper";
  }
  if (/carry\s*bag/.test(text)) return "carry bag";

  return "";
};

const getCategoryKey = (
  product: CatalogProduct,
  categoryNameById: Record<string, string>,
): string => {
  const category = product?.category;
  if (category && typeof category === "object") {
    const namedKey = normalizeCategoryName(category?.name || category?.slug);
    if (namedKey) return namedKey;
  }

  const categoryId = normalizeId(category);
  const mappedKey = categoryNameById?.[categoryId];
  if (mappedKey) return mappedKey;

  return inferProductCategoryKey(product) || categoryId;
};

const shuffleProducts = <T,>(items: T[]): T[] => {
  const shuffled = [...(Array.isArray(items) ? items : [])];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

const fetchProductsByIds = async (productIds: string[]): Promise<CatalogProduct[]> => {
  const uniqueIds = Array.from(new Set(productIds));
  const responses = await Promise.all(
    uniqueIds.map((productId) =>
      getService(`product/image/single/${productId}`, {}, { silent: true }),
    ),
  );

  return responses
    .map((res) => (res?.data?.message === "Product found" ? res?.data?.data : null))
    .filter(Boolean) as CatalogProduct[];
};

const fetchFilteredProducts = async (
  payload: Record<string, unknown>,
): Promise<CatalogProduct[]> => {
  const res = await postService("/product/filter", payload, {
    silent: true,
    suppressErrorStatuses: [404],
  });
  return Array.isArray(res?.data?.data) ? res.data.data : [];
};

const getCategoryNameById = async (): Promise<Record<string, string>> => {
  const categoriesRes = await getService("category/all", {}, { silent: true });
  return (categoriesRes?.data?.data || []).reduce(
    (acc: Record<string, string>, category: CatalogProduct) => {
      const categoryId = normalizeId(category);
      const categoryName = normalizeCategoryName(category?.name || category?.slug);
      if (categoryId && categoryName) acc[categoryId] = categoryName;
      return acc;
    },
    {},
  );
};

/**
 * Builds the "Frequently Bought Together" set: the current product plus up to
 * `limit - 1` companions, each from a different category.
 */
export const fetchBundleProducts = async (
  product: CatalogProduct,
  limit = 3,
): Promise<CatalogProduct[]> => {
  if (!product?._id) return [];

  const categoryNameById = await getCategoryNameById();
  const currentCategoryKey = getCategoryKey(product, categoryNameById);
  const currentProductId = normalizeId(product);

  let bundle: CatalogProduct[] = [product];

  const addUnique = (candidate: CatalogProduct) => {
    const candidateId = normalizeId(candidate);
    if (!candidateId) return;
    if (bundle.some((item) => normalizeId(item) === candidateId)) return;
    const candidateCategoryKey = getCategoryKey(candidate, categoryNameById);
    if (
      candidateCategoryKey &&
      bundle.some((item) => getCategoryKey(item, categoryNameById) === candidateCategoryKey)
    ) {
      return;
    }
    bundle = [...bundle, candidate];
  };

  const isDifferentCategory = (item: CatalogProduct) => {
    const categoryKey = getCategoryKey(item, categoryNameById);
    return categoryKey && categoryKey !== currentCategoryKey;
  };

  const curatedIds = [
    ...getProductIds(product?.buyItWith),
    ...getProductIds(product?.relatedProducts),
  ].filter((id) => id !== currentProductId);

  shuffleProducts(await fetchProductsByIds(curatedIds)).forEach((item) => {
    if (bundle.length < limit && isDifferentCategory(item)) addUnique(item);
  });

  if (bundle.length < limit) {
    const alternativeCategoryIds = Object.entries(categoryNameById)
      .filter(([, categoryName]) => categoryName !== currentCategoryKey)
      .map(([categoryId]) => categoryId);

    const fallback = await fetchFilteredProducts({
      ...(alternativeCategoryIds.length > 0 && { category: alternativeCategoryIds }),
      skip: 0,
      limit: 200,
    });

    shuffleProducts(fallback).forEach((item) => {
      if (
        bundle.length < limit &&
        item?._id &&
        normalizeId(item) !== currentProductId &&
        isDifferentCategory(item)
      ) {
        addUnique(item);
      }
    });
  }

  return bundle.slice(0, limit);
};

/**
 * Related products for the grid at the bottom of the product page: the curated
 * `relatedProducts` list when present, otherwise same category/brand.
 */
export const fetchRelatedProducts = async (
  product: CatalogProduct,
  limit = 4,
): Promise<CatalogProduct[]> => {
  const currentProductId = normalizeId(product);
  const curatedIds = getProductIds(product?.relatedProducts).filter(
    (id) => id !== currentProductId,
  );

  if (curatedIds.length > 0) {
    const curated = await fetchProductsByIds(curatedIds);
    if (curated.length) return curated.slice(0, limit);
  }

  const categoryId = normalizeId(product?.category);
  const brandId = normalizeId(product?.brand);
  const fallback = await fetchFilteredProducts({
    ...(categoryId && { category: [categoryId] }),
    ...(brandId && { brand: brandId }),
    skip: 0,
    limit: limit + 2,
  });

  return fallback
    .filter((item) => item?._id && normalizeId(item) !== currentProductId)
    .slice(0, limit);
};
