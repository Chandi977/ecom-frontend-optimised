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

const labelFromKey = (key: string): string =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatValue = (value: SpecificationValue): string => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};

export function ProductSpecifications({ product }: { product?: IProduct }) {
  const specification = getProductSpecification(product);

  // Prefer the category's spec_schema for labels (with unit) and row ordering;
  // fall back to a humanized key for fields the schema doesn't define.
  const specSchema = getCategorySpecSchema(product);
  const schemaByKey = new Map(specSchema.map((field) => [field.key, field]));
  const schemaOrder = new Map(specSchema.map((field, index) => [field.key, index]));

  const labelFor = (key: string): string => {
    const def = schemaByKey.get(key);
    if (!def) return labelFromKey(key);
    const label = def.label || labelFromKey(key);
    return def.unit ? `${label} (${def.unit})` : label;
  };
  const orderFor = (key: string, encounterIndex: number): number =>
    schemaOrder.has(key) ? (schemaOrder.get(key) as number) : specSchema.length + encounterIndex;

  const fields = Object.entries(specification)
    .filter(([key, value]) => !HIDDEN_KEYS.has(key) && hasDisplayValue(value))
    // Admin can hide individual specification rows from the storefront.
    .filter(([key]) => isFieldVisible(product as Record<string, unknown>, specVisibilityKey(key)))
    .map(([key, value], encounterIndex) => ({
      key,
      label: labelFor(key),
      value: formatValue(value as SpecificationValue),
      order: orderFor(key, encounterIndex),
    }))
    .sort((a, b) => a.order - b.order);

  if (!fields.length) {
    return <p className="product-spec-empty">Not Available</p>;
  }

  return (
    <div className="product-spec-grid">
      {fields.map((field) => (
        <div className="product-spec-row" key={field.key}>
          <dt>{field.label}</dt>
          <dd>{field.value}</dd>
        </div>
      ))}
      <style jsx>{`
        .product-spec-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0 24px;
        }
        .product-spec-row {
          display: grid;
          grid-template-columns: minmax(110px, 42%) 1fr;
          gap: 16px;
          padding: 10px 0;
          border-bottom: 1px solid #f2f2f2;
        }
        dt {
          margin: 0;
          color: #182c5a;
          font-weight: 700;
          word-break: break-word;
        }
        dd {
          margin: 0;
          color: #555;
          text-transform: capitalize;
          word-break: break-word;
        }
        .product-spec-empty {
          color: #555;
          margin: 0;
        }
        @media (max-width: 767px) {
          .product-spec-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default ProductSpecifications;
