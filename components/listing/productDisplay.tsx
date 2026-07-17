import {
  getDiscountPercent,
  getPrimaryPriceTier,
  getProductSpecification,
} from "../../utils/productCatalog";

// Cosmetic display overrides for trademark styling, keyed by normalized brand
// name/slug (NOT by ObjectId). Purely presentational — brand identity/name
// comes dynamically from /brand/all.
const BRAND_DISPLAY_OVERRIDES: Record<string, string> = {
  rollabel: "Rollabel™",
  packpro: "PackPro™",
};

const applyBrandDisplay = (name: string): string => {
  const key = name.trim().toLowerCase().replace(/\s+/g, "-");
  return BRAND_DISPLAY_OVERRIDES[key] || name;
};

export const stripObjectId = (value) => {
  if (!value || typeof value !== "string") {
    return value || "";
  }

  return value
    .replace(/\b[a-f0-9]{24}\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
};

// `brandNameById` is a dynamic id->name map (from useBrands()). It is only
// needed when `brand` is a bare ObjectId (list/search payloads are not
// populated); a populated brand object already carries `name`.
export const getBrandLabel = (
  brand,
  brandNameById: Record<string, string> = {},
) => {
  if (!brand) {
    return "";
  }

  const name =
    typeof brand === "object"
      ? brand?.name || brandNameById[brand?._id] || ""
      : brandNameById[brand] || "";

  const cleaned = stripObjectId(name);
  return cleaned ? applyBrandDisplay(cleaned) : "";
};

export const getProductDisplayName = (
  item,
  {
    includeBrand = true,
    includePack = false,
    brandNameById = {},
  }: {
    includeBrand?: boolean;
    includePack?: boolean;
    brandNameById?: Record<string, string>;
  } = {},
) => {
  if (!item) {
    return "";
  }

  const title = [
    includeBrand ? getBrandLabel(item?.brand, brandNameById) : "",
    stripObjectId(item?.name),
    stripObjectId(item?.model),
  ]
    .filter(Boolean)
    .join(" ");

  const packCount = getPrimaryPriceTier(item)?.number;
  if (includePack && packCount) {
    return `${title} (Pack of ${packCount})`;
  }

  return title;
};

const hasCardValue = (value: unknown): boolean =>
  value !== undefined && value !== null && String(value).trim() !== "";

const getFirstCardValue = (
  source: Record<string, unknown>,
  keys: string[],
): unknown => {
  for (const key of keys) {
    const value = source[key];
    if (hasCardValue(value)) return value;
  }
  return undefined;
};

const normalizeDimensionText = (value: unknown): string =>
  String(value || "")
    .trim()
    .replace(/\s*[xX]\s*/g, " x ");

export const formatProductCardPrice = (value: unknown): string => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "₹0";
  return `₹${Math.round(numberValue).toLocaleString("en-IN")}`;
};

export const getProductCardDiscountLabel = (tier): string => {
  if (!tier) return "";
  const computedDiscount = getDiscountPercent(tier.sellingPrice, tier.mrp);
  const discountPercent =
    Number(tier.discount) > 0 ? Number(tier.discount) : computedDiscount;

  return discountPercent > 0 ? `${Math.round(discountPercent)}% off` : "";
};

export const getProductCardBadge = (item): "SALE" | "POPULAR" | "" => {
  if (!item) return "";
  const tier = getPrimaryPriceTier(item);
  const discountPercent =
    tier.discount ?? getDiscountPercent(tier.sellingPrice, tier.mrp);

  if (item?.deal_product || discountPercent > 0) {
    return "SALE";
  }

  if (item?.featured || item?.top_product) {
    return "POPULAR";
  }

  return "";
};

export const getProductCardSummary = (item): string => {
  if (!item) return "";

  const specification = getProductSpecification(item) as Record<string, unknown>;
  const source = { ...item, ...specification };
  const sizeInch = getFirstCardValue(source, ["size_inch"]);
  if (hasCardValue(sizeInch)) {
    return `Size: ${normalizeDimensionText(sizeInch)} inches`;
  }

  const sizeMm = getFirstCardValue(source, ["size_mm"]);
  if (hasCardValue(sizeMm)) {
    return `Internal: ${normalizeDimensionText(sizeMm)} mm`;
  }

  const mmParts = [
    source.length_mm,
    source.breadth_mm ?? source.width_mm ?? source.width,
    source.height_mm,
  ].filter(hasCardValue);
  if (mmParts.length >= 2) {
    return `Internal: ${mmParts.join(" x ")} mm`;
  }

  const inchParts = [
    source.length_inch,
    source.breadth_inch ?? source.width_inch,
    source.height_inch,
  ].filter(hasCardValue);
  if (inchParts.length >= 2) {
    return `Size: ${inchParts.join(" x ")} inches`;
  }

  const gsm = getFirstCardValue(source, ["gsm"]);
  const material = getFirstCardValue(source, ["material"]);
  if (hasCardValue(gsm) && hasCardValue(material)) {
    return `${gsm} GSM ${material}`;
  }

  const color = getFirstCardValue(source, ["color", "colour"]);
  if (hasCardValue(material) && hasCardValue(color)) {
    return `${material} / ${color}`;
  }

  if (hasCardValue(material)) {
    return `Material: ${material}`;
  }

  const category =
    typeof item?.category === "object" ? item?.category?.name : undefined;
  const subCategory =
    typeof item?.subCategory === "object"
      ? item?.subCategory?.name
      : typeof item?.sub_category === "object"
        ? item?.sub_category?.name
        : undefined;

  return [category, subCategory].filter(Boolean).join(" / ");
};
