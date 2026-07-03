import { getPrimaryPriceTier } from "../../utils/productCatalog";

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
