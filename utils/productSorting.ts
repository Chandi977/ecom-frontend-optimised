import {
  getAvailableStock,
  getDiscountPercent,
  getPrimaryPriceTier,
} from "./productCatalog";

export type ProductSortValue =
  | ""
  | "high to low"
  | "low to high"
  | "newest"
  | "oldest"
  | "name asc"
  | "name desc"
  | "discount high to low"
  | "discount low to high"
  | "stock high to low"
  | "pack low to high"
  | "pack high to low";

const getDateValue = (item: any): number => {
  const value = item?.createdAt || item?.updatedAt;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getNameValue = (item: any): string =>
  [item?.brand?.name, item?.name, item?.model]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const getDiscountValue = (item: any): number => {
  const tier = getPrimaryPriceTier(item);
  return tier.discount ?? getDiscountPercent(tier.sellingPrice, tier.mrp);
};

const compareWithStableFallback =
  (compare: (a: any, b: any) => number) =>
  (
    a: { item: any; index: number },
    b: { item: any; index: number },
  ): number => {
    const result = compare(a.item, b.item);
    return result || a.index - b.index;
  };

export const sortProducts = <T>(items: T[], sortBy: ProductSortValue | string): T[] => {
  if (!sortBy) {
    return items;
  }

  const comparators: Record<string, (a: any, b: any) => number> = {
    "low to high": (a, b) =>
      getPrimaryPriceTier(a).sellingPrice - getPrimaryPriceTier(b).sellingPrice,
    "high to low": (a, b) =>
      getPrimaryPriceTier(b).sellingPrice - getPrimaryPriceTier(a).sellingPrice,
    newest: (a, b) => getDateValue(b) - getDateValue(a),
    oldest: (a, b) => getDateValue(a) - getDateValue(b),
    "name asc": (a, b) => getNameValue(a).localeCompare(getNameValue(b)),
    "name desc": (a, b) => getNameValue(b).localeCompare(getNameValue(a)),
    "discount high to low": (a, b) => getDiscountValue(b) - getDiscountValue(a),
    "discount low to high": (a, b) => getDiscountValue(a) - getDiscountValue(b),
    "stock high to low": (a, b) => getAvailableStock(b) - getAvailableStock(a),
    "pack low to high": (a, b) =>
      getPrimaryPriceTier(a).number - getPrimaryPriceTier(b).number,
    "pack high to low": (a, b) =>
      getPrimaryPriceTier(b).number - getPrimaryPriceTier(a).number,
  };

  const comparator = comparators[sortBy];
  if (!comparator) {
    return items;
  }

  return items
    .map((item, index) => ({ item, index }))
    .sort(compareWithStableFallback(comparator))
    .map(({ item }) => item);
};
