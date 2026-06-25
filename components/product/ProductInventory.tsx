import React from "react";
import type { IProduct } from "../../types/product";
import {
  getAvailableStock,
  getInventoryStatus,
} from "../../utils/productCatalog";

const STATUS_LABELS = {
  "in-stock": "In Stock",
  "low-stock": "Low Stock",
  "out-of-stock": "Out Of Stock",
};

export function ProductInventory({ product }: { product?: IProduct }) {
  const status = getInventoryStatus(product);
  const availableStock = getAvailableStock(product);

  return (
    <section className={`inventory inventory-${status}`} aria-live="polite">
      <strong>{STATUS_LABELS[status]}</strong>
      {availableStock > 0 && <span>{availableStock} available</span>}
      <style jsx>{`
        .inventory {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          font-size: 16px;
        }
        strong {
          font-size: 22px;
        }
        span {
          color: #4b5563;
        }
        .inventory-in-stock strong {
          color: #17803d;
        }
        .inventory-low-stock strong {
          color: #b45309;
        }
        .inventory-out-of-stock strong {
          color: #dc2626;
        }
      `}</style>
    </section>
  );
}

export default ProductInventory;
