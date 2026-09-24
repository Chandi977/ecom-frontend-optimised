import React from "react";
import type { IProduct } from "../../types/product";
import { getProductSpecification, getCategorySpecSchema } from "../../utils/productCatalog";
import { isFieldVisible, specVisibilityKey } from "../../utils/fieldVisibility";

type SpecificationValue = string | number | boolean;

const HIDDEN_KEYS = new Set([
  "_id",
  "product",
  "createdAt",
  "updatedAt",
  "__v",
]);

const hasDisplayValue = (value: unknown): value is SpecificationValue => {
  if (value === undefined || value === null) return false;
  if (typeof value === "object") return false;
  return String(value).trim() !== "";
};

const KEY_LABEL_MAP: Record<string, string> = {
  inner_dimensions: "Inner Dimensions (LxWxH)",
  outer_dimensions: "Outer Dimensions (LxWxH)",
  size_mm: "Dimensions (mm)",
  size_inch: "Dimensions (Inch)",
  length_inch: "Length (Inch)",
  breadth_inch: "Breadth (Inch)",
  height_inch: "Height (Inch)",
  length_mm: "Length (mm)",
  breadth_mm: "Breadth (mm)",
  height_mm: "Height (mm)",
  weight_capacity: "Weight Capacity",
  compression_strength: "Compression Strength",
  hsn_code: "HSN Code",
  material: "Material",
  color: "Color",
  colour: "Color",
};

const labelFromKey = (key: string): string => {
  const lower = key.toLowerCase();
  if (KEY_LABEL_MAP[lower]) return KEY_LABEL_MAP[lower];
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const roundNumericValue = (val: number): string => {
  const rounded = Math.round((val + Number.EPSILON) * 100) / 100;
  return String(rounded);
};

const formatValue = (value: SpecificationValue, key?: string): string => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === undefined || value === null) return "";

  if (typeof value === "number") {
    return roundNumericValue(value);
  }

  const str = String(value).trim();
  if (!str) return "";

  // Pure numeric float string e.g. "5.51181399999999"
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    const num = parseFloat(str);
    if (!isNaN(num)) {
      return roundNumericValue(num);
    }
  }

  // Dimension format like "140x114x89" or "5.5x4.5x3.5"
  if (/^\d+(\.\d+)?\s*[xX]\s*\d+(\.\d+)?\s*[xX]\s*\d+(\.\d+)?$/.test(str)) {
    const parts = str.split(/[xX]/).map((p) => {
      const num = parseFloat(p.trim());
      return isNaN(num) ? p.trim() : roundNumericValue(num);
    });
    const formattedDim = parts.join(" x ");
    if (key && (key.includes("mm") || key === "inner_dimensions") && !str.toLowerCase().includes("mm")) {
      return `${formattedDim} mm`;
    }
    return formattedDim;
  }

  // Title-case short lowercase string values
  if (str.length < 40 && /^[a-z0-9\s,/_-]+$/.test(str)) {
    return str
      .split(/(\s+|\/|-)/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  }

  return str;
};

export function ProductSpecifications({ product }: { product?: IProduct }) {
  const [activeTab, setActiveTab] = React.useState<"specs" | "usage" | "shipping">("specs");
  const rawSpec = getProductSpecification(product) as Record<string, unknown>;
  const specification: Record<string, unknown> = { ...rawSpec };

  const l_mm = specification.length_mm ?? specification.length;
  const b_mm = specification.breadth_mm ?? specification.width_mm ?? specification.breadth;
  const h_mm = specification.height_mm ?? specification.height;

  const l_in = specification.length_inch;
  const b_in = specification.breadth_inch;
  const h_in = specification.height_inch;

  if (!specification.inner_dimensions && !specification.size_mm && l_mm && b_mm && h_mm) {
    specification.inner_dimensions = `${formatValue(l_mm as SpecificationValue)} x ${formatValue(b_mm as SpecificationValue)} x ${formatValue(h_mm as SpecificationValue)} mm`;
  }

  if (!specification.size_inch && l_in && b_in && h_in) {
    specification.size_inch = `${formatValue(l_in as SpecificationValue)} x ${formatValue(b_in as SpecificationValue)} x ${formatValue(h_in as SpecificationValue)}`;
  }

  const specSchema = getCategorySpecSchema(product);
  const schemaByKey = new Map(specSchema.map((field) => [field.key, field]));
  const schemaOrder = new Map(specSchema.map((field, index) => [field.key, index]));

  const labelFor = (key: string): string => {
    const def = schemaByKey.get(key);
    if (def?.label) return def.label;
    const label = labelFromKey(key);
    return def?.unit && !label.toLowerCase().includes(def.unit.toLowerCase())
      ? `${label} (${def.unit})`
      : label;
  };
  const orderFor = (key: string, encounterIndex: number): number =>
    schemaOrder.has(key) ? (schemaOrder.get(key) as number) : specSchema.length + encounterIndex;

  const fields = Object.entries(specification)
    .filter(([key, value]) => !HIDDEN_KEYS.has(key) && hasDisplayValue(value))
    .filter(([key]) => isFieldVisible(product as Record<string, unknown>, specVisibilityKey(key)))
    .map(([key, value], encounterIndex) => ({
      key,
      label: labelFor(key),
      value: formatValue(value as SpecificationValue, key),
      order: orderFor(key, encounterIndex),
    }))
    .sort((a, b) => a.order - b.order);

  const TABS: Array<{ key: "specs" | "usage" | "shipping"; label: string; icon?: string }> = [
    { key: "specs", label: "TECHNICAL SPECIFICATIONS" },
    { key: "usage", label: "USAGE & CARE" },
    { key: "shipping", label: "SHIPPING & RETURNS" },
  ];

  return (
    <div className="tw-my-6">
      {/* Tabs Header */}
      <div className="tw-flex tw-flex-wrap tw-gap-4 sm:tw-gap-8 tw-mb-6">
        {[
          { key: "specs", label: "Technical Specifications" },
          { key: "usage", label: "Usage & Care" },
          { key: "shipping", label: "Shipping & Returns" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`tw-relative tw-pb-3 tw-px-0 tw-bg-transparent tw-border-0 tw-text-xs sm:tw-text-sm md:tw-text-base tw-font-bold tw-uppercase tw-tracking-widest tw-transition-colors tw-cursor-pointer ${
              activeTab === tab.key
                ? "tw-text-slate-900 tw-border-b-2 tw-border-solid tw-border-slate-900"
                : "tw-text-slate-500 hover:tw-text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tw-min-h-[220px]">
        {activeTab === "specs" && (
          <div className="tw-bg-white tw-p-5 sm:tw-p-6 tw-border tw-border-solid tw-border-slate-200 tw-rounded-xl tw-shadow-sm">
            {fields.length > 0 ? (
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-x-12 tw-gap-y-1">
                {fields.map((field) => (
                  <div
                    key={field.key}
                    className="tw-flex tw-justify-between tw-items-center tw-gap-4 tw-py-2.5"
                  >
                    <span className="tw-font-medium tw-text-slate-600 tw-text-sm sm:tw-text-base">
                      {field.label}
                    </span>
                    <span className="tw-text-sm sm:tw-text-base tw-font-bold tw-text-slate-900 tw-text-right">
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="tw-text-sm sm:tw-text-base tw-text-slate-500 tw-m-0">
                Detailed specifications for this product are available on request.
              </p>
            )}
          </div>
        )}

        {activeTab === "usage" && (
          <div className="tw-bg-white tw-p-6 sm:tw-p-7 tw-border tw-border-solid tw-border-slate-200 tw-rounded-xl tw-shadow-sm tw-text-sm sm:tw-text-base tw-text-slate-900 tw-space-y-5">
            <h3 className="tw-text-lg sm:tw-text-xl tw-font-bold tw-text-slate-900 tw-m-0">
              Recommended Industrial Usage
            </h3>
            <p className="tw-leading-relaxed tw-text-slate-700 tw-text-sm sm:tw-text-base tw-m-0">
              {product?.usage ||
                product?.aboutItem ||
                product?.description ||
                `Engineered for high-volume e-commerce and industrial logistics, providing consistent protection and structural integrity in transit.`}
            </p>
            <div
              className="tw-bg-slate-50 tw-p-5 sm:tw-p-6 tw-rounded-r-lg"
              style={{ border: "none", borderLeft: "4px solid #0F172A" }}
            >
              <h4 className="tw-font-bold tw-mb-3 tw-uppercase tw-text-xs sm:tw-text-sm tw-tracking-wider tw-text-slate-900">
                HANDLING GUIDELINES:
              </h4>
              <ul className="tw-list-disc tw-pl-5 tw-space-y-2.5 tw-text-slate-700 tw-text-sm sm:tw-text-base tw-leading-relaxed tw-mb-0">
                <li>Store flat in a dry, well-ventilated warehouse zone away from direct ground moisture.</li>
                <li>Avoid stacking more than 10 units high when fully loaded to preserve edge crush rating.</li>
                <li>Use standard 2-inch or 3-inch industrial packaging tape for optimal seal integrity.</li>
                <li>Compatible with automatic case sealer equipment and shrink wrap machinery.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "shipping" && (
          <div className="tw-bg-white tw-p-5 sm:tw-p-6 tw-border tw-border-solid tw-border-slate-200 tw-rounded-xl tw-shadow-sm tw-text-sm sm:tw-text-base tw-space-y-5">
            <div
              className="tw-flex tw-items-start tw-gap-4 tw-p-5 tw-bg-slate-50 tw-rounded-r-lg"
              style={{ border: "none", borderLeft: "4px solid #0F172A" }}
            >
              <span className="material-symbols-outlined tw-text-slate-900 tw-text-3xl">
                local_shipping
              </span>
              <div>
                <h4 className="tw-font-bold tw-text-base sm:tw-text-lg tw-text-slate-900 tw-mb-1">
                  Pan-India B2B Industrial Logistics Network
                </h4>
                <p className="tw-text-slate-700 tw-leading-relaxed tw-text-sm sm:tw-text-base tw-m-0">
                  Large orders qualify for palletised dispatch with direct truckload delivery across Pan-India enterprise locations.
                </p>
              </div>
            </div>

            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
              {[
                {
                  title: "Palletised delivery",
                  body: "Bulk orders ship wooden-palletised with corner protectors.",
                },
                {
                  title: "Return & quality claim",
                  body: "Replacement guarantee against manufacturing defects or burst rating failure.",
                },
                {
                  title: "Custom dispatch",
                  body: "Buyer-arranged transport pickup from Prem Industries plant hubs.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="tw-p-4 tw-border tw-border-solid tw-border-slate-200 tw-bg-slate-50 tw-rounded-lg"
                >
                  <div className="tw-font-bold tw-text-slate-900 tw-text-sm sm:tw-text-base tw-mb-1">{card.title}</div>
                  <div className="tw-text-slate-600 tw-text-xs sm:tw-text-sm">{card.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductSpecifications;
