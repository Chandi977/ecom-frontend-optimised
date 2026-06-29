export const BRAND_LABELS = {
  "6926d6bad53f3a772c6e978c": "flipkart",
  "6557dbcc301ec4f2f426610b": "myntra",
  "69268af9d53f3a772c6bccc2": "amazon",
  "6582c8580ab82549a084894f": "ajio",
  "6557dbf9301ec4f2f426611e": "rollabel",
  "6557dc10301ec4f2f4266122": "pack-secure",
  "6582c8750ab82549a0848953": "PackPro",
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

export const getBrandLabel = (brand) => {
  if (!brand) {
    return "";
  }

  if (typeof brand === "object") {
    return stripObjectId(
      BRAND_LABELS[brand?._id] || brand?.name || brand?._id || "",
    );
  }

  return stripObjectId(BRAND_LABELS[brand] || brand);
};

export const getProductDisplayName = (
  item,
  { includeBrand = true, includePack = false } = {},
) => {
  if (!item) {
    return "";
  }

  const title = [
    includeBrand ? getBrandLabel(item?.brand) : "",
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
import { getPrimaryPriceTier } from "../../utils/productCatalog";
