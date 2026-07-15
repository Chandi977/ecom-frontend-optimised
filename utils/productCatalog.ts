import type {
  IMediaImage,
  IProduct,
  IProductSpecification,
  ISpecSchemaField,
} from "../types/product";

type UnknownRecord = Record<string, unknown>;

export interface NormalizedPriceTier {
  number: number;
  sellingPrice: number;
  mrp: number;
  stockQuantity?: number;
  discount?: number;
  packWeight?: number;
}

export interface NormalizedProductMedia {
  thumbnail: string;
  images: IMediaImage[];
  videos: UnknownRecord[];
  documents: UnknownRecord[];
}

export interface NormalizedProductSeo {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
  schema?: UnknownRecord;
  ogImage?: string;
}

const SPEC_FIELD_KEYS = [
  "length",
  "width",
  "height",
  "length_inch",
  "length_mm",
  "breadth_inch",
  "breadth_mm",
  "height_inch",
  "height_mm",
  "size_inch",
  "size_mm",
  "flap_mm",
  "thickness",
  "thickness_micron",
  "gusset",
  "print",
  "label_in_roll",
  "core_size",
  "pouch_weight",
  "adhesive",
  "material",
  "color",
  "colour",
  "weight",
  "size",
] as const;

const hasValue = (value: unknown): boolean =>
  value !== undefined && value !== null && String(value).trim() !== "";

const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const numberOrUndefined = (value: unknown): number | undefined => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const stringOrEmpty = (value: unknown): string =>
  hasValue(value) ? String(value) : "";

const nonEmptyArray = (value: unknown): unknown[] | null =>
  Array.isArray(value) && value.length > 0 ? value : null;

export const getObjectId = (value: unknown): string => {
  if (!value) return "";
  if (isRecord(value)) return stringOrEmpty(value._id || value.id);
  return String(value);
};

export const getProductSubCategory = (product?: Partial<IProduct> | UnknownRecord) =>
  (product as UnknownRecord | undefined)?.subCategory ||
  (product as UnknownRecord | undefined)?.sub_category;

// Returns the spec-field definitions declared on the product's (populated)
// category, used to label/order storefront spec rows. Empty when the category
// is unpopulated or hasn't defined a schema.
export const getCategorySpecSchema = (
  product?: Partial<IProduct> | UnknownRecord,
): ISpecSchemaField[] => {
  const category = (product as UnknownRecord | undefined)?.category;
  if (isRecord(category) && Array.isArray(category.spec_schema)) {
    return (category.spec_schema as ISpecSchemaField[]).filter(
      (field) => field && typeof field.key === "string",
    );
  }
  return [];
};

export const getProductSpecification = (
  product?: Partial<IProduct> | UnknownRecord,
): IProductSpecification => {
  const source = (product || {}) as UnknownRecord;
  const normalized = isRecord(source.specification)
    ? (source.specification as UnknownRecord)
    : {};
  const attributes = isRecord(normalized.attributes)
    ? (normalized.attributes as UnknownRecord)
    : {};
  const specification: UnknownRecord = { ...attributes, ...normalized };

  delete specification._id;
  delete specification.product;
  delete specification.createdAt;
  delete specification.updatedAt;
  delete specification.attributes;

  SPEC_FIELD_KEYS.forEach((key) => {
    if (!hasValue(specification[key]) && hasValue(source[key])) {
      specification[key] = source[key];
    }
  });

  return specification as IProductSpecification;
};

export const getPriceTiers = (
  product?: Partial<IProduct> | UnknownRecord,
): NormalizedPriceTier[] => {
  const source = (product || {}) as UnknownRecord;
  const pricing = isRecord(source.pricing) ? source.pricing : {};
  const rawTiers =
    nonEmptyArray(pricing.priceList) ?? nonEmptyArray(source.priceList) ?? [];

  return rawTiers
    .map((tier) => {
      const row = isRecord(tier) ? tier : {};
      const sellingPrice =
        numberOrUndefined(row.SP) ??
        numberOrUndefined(row.price) ??
        numberOrUndefined(pricing.basePrice) ??
        numberOrUndefined(source.price) ??
        0;
      const mrp =
        numberOrUndefined(row.MRP) ??
        numberOrUndefined(row.original_price) ??
        sellingPrice;

      return {
        number: numberOrUndefined(row.number) ?? 1,
        sellingPrice,
        mrp,
        stockQuantity: numberOrUndefined(row.stock_quantity),
        discount: numberOrUndefined(row.discount),
        packWeight: numberOrUndefined(row.pack_weight),
      };
    })
    .filter((tier) => tier.sellingPrice > 0 || tier.mrp > 0);
};

export const getPrimaryPriceTier = (
  product?: Partial<IProduct> | UnknownRecord,
): NormalizedPriceTier => {
  const tiers = getPriceTiers(product);
  if (tiers[0]) return tiers[0];

  const source = (product || {}) as UnknownRecord;
  const pricing = isRecord(source.pricing) ? source.pricing : {};
  const basePrice =
    numberOrUndefined(pricing.basePrice) ?? numberOrUndefined(source.price) ?? 0;
  const stockQuantity = getAvailableStock(product);

  return {
    number: 1,
    sellingPrice: basePrice,
    mrp: basePrice,
    stockQuantity: stockQuantity > 0 ? stockQuantity : undefined,
    packWeight: numberOrUndefined(pricing.packWeight),
  };
};

export const getAvailableStock = (
  product?: Partial<IProduct> | UnknownRecord,
): number => {
  const source = (product || {}) as UnknownRecord;
  const inventory = isRecord(source.inventory) ? source.inventory : {};
  const inventoryStock = numberOrUndefined(inventory.availableStock);
  if (inventoryStock !== undefined) return inventoryStock;

  const pricing = isRecord(source.pricing) ? source.pricing : {};
  const pricingStock = numberOrUndefined(pricing.stockQuantity);
  if (pricingStock !== undefined) return pricingStock;

  const tierStock = getPriceTiers(product).reduce(
    (sum, tier) => sum + (tier.stockQuantity ?? 0),
    0,
  );
  if (tierStock > 0) return tierStock;

  return numberOrUndefined(source.stock_quantity) ?? 0;
};

export const getInventoryStatus = (
  product?: Partial<IProduct> | UnknownRecord,
): "in-stock" | "low-stock" | "out-of-stock" => {
  const availableStock = getAvailableStock(product);
  const inventory = isRecord((product as UnknownRecord | undefined)?.inventory)
    ? ((product as UnknownRecord).inventory as UnknownRecord)
    : {};
  const minimumStock = numberOrUndefined(inventory.minimumStock) ?? 10;
  if (availableStock <= 0) return "out-of-stock";
  if (availableStock <= minimumStock) return "low-stock";
  return "in-stock";
};

const normalizeImage = (image: unknown): IMediaImage | null => {
  const resolveUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("/")
    ) {
      return trimmed;
    }
    return `https://d3dcdu6oc5g6yg.cloudfront.net/${trimmed}`;
  };

  if (typeof image === "string" && image.trim()) {
    return { image: resolveUrl(image) };
  }
  if (isRecord(image)) {
    const src = stringOrEmpty(image.image || image.url || image.src);
    if (src) {
      return {
        image: resolveUrl(src),
        alt: stringOrEmpty(image.alt),
        order: numberOrUndefined(image.order),
      };
    }
  }
  return null;
};

export const getProductMedia = (
  product?: Partial<IProduct> | UnknownRecord,
): NormalizedProductMedia => {
  const source = (product || {}) as UnknownRecord;
  const media = isRecord(source.media) ? source.media : {};
  const rawImages =
    nonEmptyArray(media.images) ??
    nonEmptyArray(media.gallery) ??
    nonEmptyArray(source.images) ??
    [];
  const images = rawImages.map(normalizeImage).filter(Boolean) as IMediaImage[];
  const thumbnail =
    images[0]?.image ||
    normalizeImage(media.thumbnail)?.image ||
    "/pp_logo_1.png";

  return {
    thumbnail,
    images: images.length ? images : [{ image: thumbnail }],
    videos: Array.isArray(media.videos) ? (media.videos as UnknownRecord[]) : [],
    documents: Array.isArray(media.documents)
      ? (media.documents as UnknownRecord[])
      : [],
  };
};

export const getProductImageSrc = (
  product?: Partial<IProduct> | UnknownRecord,
): string => getProductMedia(product).thumbnail;

export const getProductSeo = (
  product?: Partial<IProduct> | UnknownRecord,
): NormalizedProductSeo => {
  const source = (product || {}) as UnknownRecord;
  const seo = isRecord(source.seo) ? source.seo : {};
  const title =
    stringOrEmpty(seo.metaTitle) ||
    stringOrEmpty(seo.meta_title) ||
    stringOrEmpty(source.meta_title) ||
    [isRecord(source.brand) ? source.brand.name : "", source.name, source.model]
      .filter(Boolean)
      .join(" ");
  const description =
    stringOrEmpty(seo.metaDescription) ||
    stringOrEmpty(seo.meta_description) ||
    stringOrEmpty(source.meta_description) ||
    stringOrEmpty(source.description);
  const keywordsValue = seo.keywords ?? source.keywords;
  const keywords = Array.isArray(keywordsValue)
    ? keywordsValue.map(String).filter(Boolean)
    : stringOrEmpty(keywordsValue)
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);

  return {
    title,
    description,
    keywords,
    canonical: stringOrEmpty(seo.canonical) || undefined,
    schema: isRecord(seo.schema)
      ? seo.schema
      : isRecord(seo.schema_markup)
        ? seo.schema_markup
        : undefined,
    ogImage: stringOrEmpty(seo.ogImage) || getProductImageSrc(product),
  };
};

export const getLegacyCompatibleProduct = (
  product?: Partial<IProduct> | UnknownRecord,
): UnknownRecord => {
  if (!product) return {};
  const source = product as UnknownRecord;
  const specification = getProductSpecification(source) as UnknownRecord;
  const pricing = isRecord(source.pricing) ? source.pricing : {};
  const media = getProductMedia(source);
  const seo = getProductSeo(source);
  const tiers = getPriceTiers(source);

  return {
    ...source,
    ...Object.fromEntries(
      SPEC_FIELD_KEYS.map((key) => [key, source[key] ?? specification[key]]),
    ),
    sub_category: source.sub_category ?? source.subCategory,
    price: source.price ?? pricing.basePrice,
    priceList: source.priceList ?? pricing.priceList ?? tiers.map((tier) => ({
      number: tier.number,
      SP: tier.sellingPrice,
      MRP: tier.mrp,
      stock_quantity: tier.stockQuantity,
      pack_weight: tier.packWeight,
      discount: tier.discount,
    })),
    images: source.images ?? media.images,
    meta_title: source.meta_title ?? seo.title,
    meta_description: source.meta_description ?? seo.description,
  };
};

export const getDiscountPercent = (
  sellingPrice: number,
  mrp: number,
): number => {
  if (!mrp || mrp <= sellingPrice) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
};

export const formatCurrency = (value: unknown): string => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "Rs 0";
  return `Rs ${Math.round(numberValue)}`;
};
