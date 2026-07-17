// Label products are stored as one DB product PER labels-per-roll quantity,
// encoded in the model by convention: "CL_65x70_250" = base model "CL_65x70"
// with 250 labels per roll. These helpers derive that variant relationship at
// display time only — no schema/data change — so the catalog can show ONE
// listing per base model with the quantity as a selectable variant.

export interface ParsedLabelModel {
  baseModel: string;
  labelQty: number;
}

export interface LabelVariantOption {
  labelQty: number;
  slug?: string;
  id?: string;
  product?: Record<string, any>;
}

// "CL_65x70_250" -> { baseModel: "CL_65x70", labelQty: 250 }. Returns null when
// the model doesn't end in "_<digits>" (e.g. "CL_65x70" itself).
export const parseLabelModel = (model: unknown): ParsedLabelModel | null => {
  const text = String(model ?? "").trim();
  const match = text.match(/^(.+)_(\d+)$/);
  if (!match) return null;
  const labelQty = Number(match[2]);
  if (!Number.isFinite(labelQty) || labelQty <= 0) return null;
  return { baseModel: match[1], labelQty };
};

const normalizeRefId = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "object" && (value as Record<string, unknown>)._id) {
    return String((value as Record<string, unknown>)._id);
  }
  return String(value);
};

const variantGroupKey = (item: Record<string, any>): string | null => {
  const parsed = parseLabelModel(item?.model);
  if (!parsed) return null;
  return `${normalizeRefId(item?.sub_category)}::${parsed.baseModel.toLowerCase()}`;
};

const toVariantOption = (item: Record<string, any>): LabelVariantOption => ({
  labelQty: parseLabelModel(item?.model)!.labelQty,
  slug: item?.slug,
  id: item?._id ? String(item._id) : undefined,
  product: item,
});

// Collapses a listing so products sharing a base model render as ONE card.
// The representative is the lowest-quantity variant (cheapest, mirrors the old
// first listing) carrying:
//   label_base_model — base model for display ("CL_65x70")
//   label_variants   — all quantities, ascending, with slugs for navigation
// Groups with a single member (and non-label-model products) pass through
// untouched, so nothing changes outside the variant families.
export const collapseLabelVariants = <T extends Record<string, any>>(products: T[]): T[] => {
  if (!Array.isArray(products) || products.length === 0) return products;

  const groups = new Map<string, T[]>();
  const order: Array<{ key: string | null; item: T }> = [];

  products.forEach((item) => {
    const key = item ? variantGroupKey(item) : null;
    if (!key) {
      order.push({ key: null, item });
      return;
    }
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push({ key, item });
    }
    groups.get(key)!.push(item);
  });

  return order.map(({ key, item }) => {
    if (!key) return item;
    const members = groups.get(key)!;
    if (members.length < 2) return item;
    const sorted = [...members].sort(
      (a, b) => parseLabelModel(a?.model)!.labelQty - parseLabelModel(b?.model)!.labelQty,
    );
    const representative = sorted[0];
    return {
      ...representative,
      label_base_model: parseLabelModel(representative?.model)!.baseModel,
      label_variants: sorted.map(toVariantOption),
    };
  });
};

// Sibling variants of one product within a fetched catalog page (details-page
// selector). Includes the product itself; returns [] unless 2+ quantities exist.
export const findLabelVariants = (
  product: Record<string, any> | undefined,
  catalog: Array<Record<string, any>>,
): LabelVariantOption[] => {
  if (!product) return [];
  const key = variantGroupKey(product);
  if (!key) return [];
  const seen = new Set<number>();
  const variants = (Array.isArray(catalog) ? catalog : [])
    .filter((item) => item?.slug && variantGroupKey(item) === key)
    .map(toVariantOption)
    .filter((variant) => {
      if (seen.has(variant.labelQty)) return false;
      seen.add(variant.labelQty);
      return true;
    })
    .sort((a, b) => a.labelQty - b.labelQty);
  return variants.length > 1 ? variants : [];
};
