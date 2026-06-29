export const PACKPRO_TAPE_CATEGORY_ID = "6557df64301ec4f2f4266141";
export const CARRY_BAG_CATEGORY_IDS = new Set([
  "6557df71301ec4f2f4266145",
  "689d73214687bb4e437542e0",
]);
export const FOOD_WRAPPING_CATEGORY_IDS = new Set([
  "69dcb22e733b8ba056529a9f",
  "679ca70f2833ca433fa0aa9c",
]);
export const LABEL_CATEGORY_ID = "6557deb6301ec4f2f4266135";
export const POLY_BAG_CATEGORY_ID = "6557df4f301ec4f2f426613d";
export const PAPER_BAG_CATEGORY_ID = "6557df46301ec4f2f4266139";
export const CORRUGATED_BOX_CATEGORY_ID = "6557deab301ec4f2f4266131";
export const POLY_BAG_DEFAULT_COLOR = "Outer White & Inner Black";
export const POLY_BAG_DEFAULT_MATERIAL = "virgin plastic with 20% recycled content";
export const POLY_BAG_DEFAULT_ADHESIVE = "Hot Melt Adhesive";

const formatBoolean = (value: unknown): string => {
  if (value === true || value === "true" || value === "Yes") return "Yes";
  return "No";
};

const TAX_AND_SUSTAINABILITY_CONFIG = [
  { label: "HSN Code", keys: ["hsn_code"] },
  { label: "SAC Code", keys: ["sac_code"] },
  { label: "Tax Category", keys: ["tax_category"] },
  { label: "GST", getValue: (product) => resolveGstRate(product), format: (value: unknown) => formatGst(value) },
  { label: "Recyclable", keys: ["recyclable"], format: formatBoolean },
  { label: "Biodegradable", keys: ["biodegradable"], format: formatBoolean },
  { label: "FSC Certified", keys: ["fsc_certified"], format: formatBoolean },
  { label: "Certifications", keys: ["certifications"] },
];

function mergeUniqueFields(baseFields: OverviewField[], extraFields: OverviewField[]): OverviewField[] {
  const seenLabels = new Set(baseFields.map(f => f.label.toLowerCase().trim()));
  const merged = [...baseFields];
  for (const field of extraFields) {
    const labelLower = field.label.toLowerCase().trim();
    if (!seenLabels.has(labelLower)) {
      merged.push(field);
      seenLabels.add(labelLower);
    }
  }
  return merged;
}

const COMMON_FIELDS = [
  { label: "Brand", getValue: (product) => getProductBrandName(product) || "Not Available" },
  { label: "Model", keys: ["model"] },
  { label: "Material", keys: ["material"] },
  { label: "Colour", keys: ["color"] },
  { label: "HSN Code", keys: ["hsn_code"] },
  { label: "SAC Code", keys: ["sac_code"] },
  { label: "Tax Category", keys: ["tax_category"] },
  { label: "GST", getValue: (product) => resolveGstRate(product), format: (value: unknown) => formatGst(value) },
  { label: "Type", keys: ["name"] },
  { label: "Labels per Roll", keys: ["label_in_roll"] },
  { label: "Form", keys: ["form"] },
  { label: "Recyclable", keys: ["recyclable"], format: formatBoolean },
  { label: "Biodegradable", keys: ["biodegradable"], format: formatBoolean },
  { label: "FSC Certified", keys: ["fsc_certified"], format: formatBoolean },
  { label: "Certifications", keys: ["certifications"] },
];

const GENERIC_DIMENSION_FIELDS = [
  { label: "Length (mm)", keys: ["length_mm"] },
  { label: "Width (mm)", keys: ["breadth_mm", "width"] },
  { label: "Height (mm)", keys: ["height_mm"] },
  { label: "Flap (mm)", keys: ["flap_mm"] },
  { label: "Gusset (mm)", keys: ["gusset"] },
  { label: "Length", keys: ["length"] },
  { label: "Width", keys: ["breadth", "width"] },
  { label: "Height", keys: ["height"] },
];

const normalizeId = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "object" && (value as Record<string, unknown>)._id) return String((value as Record<string, unknown>)._id);
  return String(value);
};

const hasValue = (value: unknown): boolean =>
  value !== undefined && value !== null && String(value).trim() !== "";

const getFirstValue = (product: Record<string, unknown> | undefined, keys: string[]): unknown => {
  if (!product) return undefined;
  for (const key of keys) {
    const value = product[key];
    if (hasValue(value)) return value;
  }
  return undefined;
};

const getProductBrandName = (product: Record<string, unknown> | undefined): string => {
  const brand = product?.brand;
  if (brand && typeof brand === "object") {
    const name = (brand as Record<string, unknown>).name;
    if (hasValue(name)) return String(name);
  }
  return "";
};

export function formatGst(value: unknown, fallback = "Not Available"): string {
  if (!hasValue(value)) return fallback;
  if (typeof value === "number") {
    const percent = value <= 1 ? value * 100 : value;
    return `${Number.isInteger(percent) ? percent : percent.toFixed(2)}%`;
  }
  const text = String(value).trim();
  if (text.includes("%")) return text;
  const numericValue = Number(text);
  if (Number.isFinite(numericValue)) {
    const percent = numericValue <= 1 ? numericValue * 100 : numericValue;
    return `${Number.isInteger(percent) ? percent : percent.toFixed(2)}%`;
  }
  return text;
}

export const slugifyOverviewFieldKey = (value: unknown): string =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const parseGstValue = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate < 0) return undefined;
  return rate;
};

// Mirrors the backend order-time resolver (utils/gst-calculator.ts): the
// product's own GST wins, falling back to sub_category → category → 18% so the
// displayed rate always matches what the customer is charged.
export function resolveGstRate(product: Record<string, unknown> | undefined): number {
  if (!product) return 18;
  const sub = product.sub_category as Record<string, unknown> | undefined;
  const cat = product.category as Record<string, unknown> | undefined;
  return (
    parseGstValue(product.gst) ??
    (sub && typeof sub === "object" ? parseGstValue(sub.gst) : undefined) ??
    (cat && typeof cat === "object" ? parseGstValue(cat.gst) : undefined) ??
    18
  );
}

const formatWithUnit = (value: unknown, unit: string): string => {
  if (!hasValue(value)) return "Not Available";
  const text = String(value).trim();
  const unitPattern = unit.endsWith("s") ? `${unit.slice(0, -1)}s?` : unit;
  return new RegExp(`\\b${unitPattern}\\b`, "i").test(text) ? text : `${text} ${unit}`;
};

const parseSizeParts = (value: unknown): number[] => {
  if (!hasValue(value)) return [];
  return String(value)
    .match(/\d+(?:\.\d+)?/g)
    ?.map((part) => Number(part))
    .filter((part) => Number.isFinite(part)) || [];
};

const getSizeInchPart = (product: Record<string, unknown>, index: number): number | undefined =>
  parseSizeParts(product?.size_inch)[index];

const getPouchHeightMm = (product: Record<string, unknown>): unknown => {
  const explicitValue = getFirstValue(product, ["height_mm", "length_mm"]);
  if (hasValue(explicitValue)) return explicitValue;
  return parseSizeParts(product?.size_mm)[0];
};

const getPouchWidthMm = (product: Record<string, unknown>): unknown => {
  const explicitValue = getFirstValue(product, ["breadth_mm", "width"]);
  if (hasValue(explicitValue)) return explicitValue;
  return parseSizeParts(product?.size_mm)[1];
};

const getDimensionInches = (product: Record<string, unknown>): string => {
  if (hasValue(product?.size_inch)) {
    return String(product.size_inch).replace(/x/g, " x ").replace(/X/g, " X ");
  }
  const parts = [
    product?.length_inch,
    product?.breadth_inch,
    product?.height_inch
  ].filter(hasValue);
  if (parts.length > 0) {
    return parts.join(" X ");
  }
  return "Not Available";
};

const getDimensionMm = (product: Record<string, unknown>): string => {
  if (hasValue(product?.size_mm)) {
    return String(product.size_mm).replace(/x/g, " x ").replace(/X/g, " X ");
  }
  const parts = [
    product?.length_mm,
    product?.breadth_mm ?? product?.width,
    product?.height_mm
  ].filter(hasValue);
  if (parts.length > 0) {
    return parts.join(" X ");
  }
  return "Not Available";
};

interface FieldConfig {
  label: string | ((product: Record<string, unknown>) => string);
  keys?: string[];
  getValue?: (product: Record<string, unknown>, weight?: unknown) => unknown;
  format?: (value: unknown, product?: Record<string, unknown>) => unknown;
}

const buildFieldsFromConfig = (
  product: Record<string, unknown>,
  config: FieldConfig[] = [],
  weight?: unknown,
): { label: string; value: string }[] =>
  config
    .map((field) => {
      const rawValue = field.getValue
        ? field.getValue(product, weight)
        : getFirstValue(product, field.keys || []);
      if (!hasValue(rawValue)) return null;
      const formattedValue = field.format ? field.format(rawValue, product) : rawValue;
      if (!hasValue(formattedValue)) return null;
      return {
        label: typeof field.label === "function" ? field.label(product) : field.label,
        value: String(formattedValue),
      };
    })
    .filter((f): f is { label: string; value: string } => f !== null);

export interface OverviewField {
  label: string;
  value: string;
}

export function getProductKind(input: Record<string, unknown>): string {
  const product = getLegacyCompatibleProduct(input);
  const categoryId = normalizeId(product?.category);
  const categoryName = typeof product?.category === "object" ? (product?.category as Record<string, unknown>)?.name || "" : "";
  const categorySlug = typeof product?.category === "object" ? (product?.category as Record<string, unknown>)?.slug || "" : "";
  const searchText = [product?.name, product?.slug, product?.model, categoryName, categorySlug]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (categoryId === PACKPRO_TAPE_CATEGORY_ID || /tape/i.test(searchText)) return "tape";
  if (CARRY_BAG_CATEGORY_IDS.has(categoryId) || /carry.*bag/i.test(searchText)) return "carry-bag";
  if (FOOD_WRAPPING_CATEGORY_IDS.has(categoryId) || /food.*wrapping|foil/.test(searchText)) return "foil-paper";
  if (categoryId === LABEL_CATEGORY_ID || /label/i.test(searchText)) return "label";
  if (categoryId === POLY_BAG_CATEGORY_ID || /poly.*bag/i.test(searchText)) return "polybag";
  if (categoryId === PAPER_BAG_CATEGORY_ID || /paper.*bag/i.test(searchText)) return "paperbag";
  if (categoryId === CORRUGATED_BOX_CATEGORY_ID || categoryId === "6926d7c0d53f3a772c6f08af" || /corrugated/i.test(searchText)) return "corrugated";
  return "generic";
}

const getCategoryMetricFields = (product: Record<string, unknown>): FieldConfig[] => {
  const productKind = getProductKind(product);
  switch (productKind) {
    case "tape":
      return [
        { label: "Width (mm)", keys: ["breadth_mm", "width"] },
        { label: "Length (mtr)", keys: ["length"] },
        {
          label: (currentProduct) =>
            /paper/i.test([currentProduct?.name, currentProduct?.slug].filter(Boolean).join(" "))
              ? "Thickness (gsm)"
              : "Thickness (micron)",
          keys: ["thickness_micron", "thickness"],
        },
      ];
    case "carry-bag":
      return [
        { label: "Breadth (inch)", keys: ["breadth_inch", "width"] },
        { label: "Height (inch)", keys: ["height_inch"] },
        { label: "Gusset (inch)", keys: ["gusset"] },
        { label: "Thickness (gsm)", keys: ["thickness"] },
      ];
    case "foil-paper":
      return [
        { label: "Length (inch)", keys: ["length_inch"] },
        { label: "Height (inch)", keys: ["height_inch"] },
        { label: "Thickness (gsm)", keys: ["thickness"] },
      ];
    case "label":
      return [
        { label: "Length (inch)", keys: ["length_inch"] },
        { label: "Length (mm)", keys: ["length_mm"] },
        { label: "Height (inch)", keys: ["height_inch", "breadth_inch"] },
        { label: "Height (mm)", keys: ["height_mm", "breadth_mm"] },
        { label: "Core Size (inch)", keys: ["core_size"] },
      ];
    case "polybag":
      return [
        { label: "Length (inch)", keys: ["length_inch"] },
        { label: "Length (mm)", keys: ["length_mm"] },
        { label: "Breadth (inch)", keys: ["breadth_inch"] },
        { label: "Breadth (mm)", keys: ["breadth_mm", "width"] },
        { label: "Flap (mm)", keys: ["flap_mm"] },
      ];
    case "paperbag":
      return [
        { label: "Length (inch)", keys: ["length_inch"] },
        { label: "Length (mm)", keys: ["length_mm"] },
        { label: "Breadth (inch)", keys: ["breadth_inch"] },
        { label: "Breadth (mm)", keys: ["breadth_mm", "width"] },
        { label: "Flap (mm)", keys: ["flap_mm"] },
        { label: "Gusset (mm)", keys: ["gusset"] },
      ];
    case "corrugated":
      return [
        { label: "Length (inch)", keys: ["length_inch"] },
        { label: "Length (mm)", keys: ["length_mm"] },
        { label: "Breadth (inch)", keys: ["breadth_inch"] },
        { label: "Breadth (mm)", keys: ["breadth_mm"] },
        { label: "Height (inch)", keys: ["height_inch"] },
        { label: "Height (mm)", keys: ["height_mm"] },
      ];
    default:
      return GENERIC_DIMENSION_FIELDS;
  }
};

// Builds the full category-kind auto-generated overview list (every field that
// has a value). The admin show/hide + reorder + custom-row config is applied on
// top of this by getOverviewFields below.
function buildAutoOverviewFields(
  product: Record<string, unknown> | undefined,
  packSize?: unknown,
  weightValue?: unknown,
): OverviewField[] {
  if (!product) return [];

  const currentProduct = getLegacyCompatibleProduct(product);
  const productKind = getProductKind(currentProduct);
  const taxAndSustainability = buildFieldsFromConfig(currentProduct, TAX_AND_SUSTAINABILITY_CONFIG, weightValue);

  let fields: OverviewField[] = [];

  if (productKind === "corrugated") {
    fields = [
      { label: "Dimension (inch)", value: getDimensionInches(currentProduct) },
      { label: "Dimension (mm)", value: getDimensionMm(currentProduct) },
      { label: "Brand", value: getProductBrandName(currentProduct) || "Not Available" },
    ].filter((field) => field.value !== "Not Available");
  } else if (productKind === "label") {
    const brandName = getProductBrandName(currentProduct) || "Rollabel™";
    fields = [
      { label: "Dimension (inch)", value: getDimensionInches(currentProduct) },
      { label: "Dimension (mm)", value: getDimensionMm(currentProduct) },
      { label: "Brand", value: brandName },
    ].filter((field) => field.value !== "Not Available");
  } else if (productKind === "paperbag") {
    const brandName = getProductBrandName(currentProduct) || "Not Available";
    fields = [
      { label: "Dimension (inch)", value: getDimensionInches(currentProduct) },
      { label: "Dimension (mm)", value: getDimensionMm(currentProduct) },
      { label: "Brand", value: brandName },
    ].filter((field) => field.value !== "Not Available");
  } else if (productKind === "foil-paper") {
    const categoryName = typeof currentProduct?.category === "object" ? (currentProduct?.category as Record<string, unknown>)?.name || "" : "";
    const subCategoryName = typeof currentProduct?.sub_category === "object" ? (currentProduct?.sub_category as Record<string, unknown>)?.name || "" : "";
    fields = [
      { label: "Name", value: String(currentProduct?.name || "Not Available") },
      { label: "Brand", value: getProductBrandName(currentProduct) || "Not Available" },
      { label: "Length (inches)", value: formatWithUnit(getFirstValue(currentProduct, ["length_inch"]) || getSizeInchPart(currentProduct, 0), "inches") },
      { label: "Breadth (inches)", value: formatWithUnit(getFirstValue(currentProduct, ["breadth_inch", "height_inch", "width"]) || getSizeInchPart(currentProduct, 1), "inches") },
      { label: "Thickness (gsm)", value: formatWithUnit(currentProduct?.thickness, "gsm") },
      { label: "Type", value: String(currentProduct?.model || subCategoryName || categoryName || "Not Available") },
      { label: "Print", value: String(currentProduct?.print || "Not Available") },
      { label: "HSN Code", value: String(currentProduct?.hsn_code || "Not Available") },
      { label: "Pack of", value: hasValue(packSize) ? `${packSize} pcs` : "Not Available" },
    ];
  } else if (productKind === "tape") {
    const brandName = getProductBrandName(currentProduct) || "PackPro™";
    fields = [
      { label: "Brand", value: brandName },
      { label: "Print", value: hasValue(currentProduct?.print) ? String(currentProduct.print) : "Not Available" },
    ].filter((field) => field.value !== "Not Available");
  } else if (productKind === "polybag") {
    const brandName = getProductBrandName(currentProduct) || "Not Available";
    fields = [
      { label: "Dimension (inch)", value: getDimensionInches(currentProduct) },
      { label: "Dimension (mm)", value: getDimensionMm(currentProduct) },
      { label: "Brand", value: brandName },
    ].filter((field) => field.value !== "Not Available");
  } else {
    const commonFields = buildFieldsFromConfig(currentProduct, COMMON_FIELDS, weightValue);
    const metricFields = buildFieldsFromConfig(currentProduct, getCategoryMetricFields(currentProduct), weightValue);
    const weightFields = hasValue(weightValue)
      ? [{ label: "Pack Weight (kg)", value: String(weightValue) }]
      : [];
    fields = [...commonFields, ...metricFields, ...weightFields];
  }

  return mergeUniqueFields(fields, taxAndSustainability);
}

interface OverviewConfigRow {
  key?: string;
  label?: string;
  value?: string;
  visible?: boolean;
}

const keyForAutoField = (field: OverviewField): string => slugifyOverviewFieldKey(field.label);

const keyForConfigRow = (row: OverviewConfigRow): string =>
  (row.key && String(row.key).trim()) || slugifyOverviewFieldKey(row.label);

// Applies an admin-saved visibility/order/custom-row config on top of the live
// auto-generated fields. Auto fields keep their dynamic (live) values; custom
// rows use their stored value. Auto fields not referenced by the config are
// appended (visible) so fields added after the config was saved still appear.
function applyOverviewConfig(
  autoFields: OverviewField[],
  config: OverviewConfigRow[],
): OverviewField[] {
  const autoByKey = new Map(autoFields.map((field) => [keyForAutoField(field), field]));
  const usedKeys = new Set<string>();
  const result: OverviewField[] = [];

  for (const row of config) {
    const visible = row.visible !== false;
    const rowKey = keyForConfigRow(row);
    const autoField = autoByKey.get(rowKey);

    if (autoField) {
      usedKeys.add(rowKey);
      if (visible) result.push({ label: autoField.label, value: autoField.value });
    } else if (visible && row.label && hasValue(row.value)) {
      // Custom row (no matching auto field) — render its stored value.
      result.push({ label: String(row.label), value: String(row.value) });
    }
  }

  // Append auto fields the config never referenced (e.g. added after it was
  // saved) so the page never silently drops a newly-available spec.
  for (const field of autoFields) {
    if (!usedKeys.has(keyForAutoField(field))) result.push(field);
  }

  return result;
}

export function getOverviewFields(
  product: Record<string, unknown> | undefined,
  packSize?: unknown,
  weightValue?: unknown,
): OverviewField[] {
  if (!product) return [];

  const currentProduct = getLegacyCompatibleProduct(product);
  const autoFields = buildAutoOverviewFields(currentProduct, packSize, weightValue);

  const config = Array.isArray(currentProduct.overview_fields)
    ? (currentProduct.overview_fields as OverviewConfigRow[])
    : [];

  if (config.length === 0) return autoFields;

  // New-style configs carry a `key` on at least one row. Legacy products store a
  // fully manual {label,value} list with no keys — preserve the old behavior of
  // showing that list exclusively (no auto fields mixed in).
  const isNewStyleConfig = config.some(
    (row) => row && row.key != null && String(row.key).trim() !== "",
  );

  if (!isNewStyleConfig) {
    return config
      .filter((row) => row && row.label && hasValue(row.value))
      .map((row) => ({ label: String(row.label), value: String(row.value) }));
  }

  return applyOverviewConfig(autoFields, config);
}
import { getLegacyCompatibleProduct } from "./productCatalog";
