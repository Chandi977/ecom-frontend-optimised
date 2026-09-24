import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import AddToCartContent from "../../common/AddToCartContent";
import useAddToCart from "../../../hooks/useAddToCart";
import { addToCart } from "../../../utils/cart";
import {
  getAvailableStock,
  getPrimaryPriceTier,
  getProductImageSrc,
} from "../../../utils/productCatalog";
import {
  fetchBundleProducts,
  normalizeId,
  type CatalogProduct,
} from "../../../utils/productRelations";
import { formatINR } from "./format";

interface FrequentlyBoughtTogetherProps {
  product: CatalogProduct;
}

/**
 * "Frequently Bought Together": the current product plus companion products
 * from other categories, each priced at its own primary pack tier. Prices shown
 * are the real cart prices — the bundle is a convenience for adding several
 * items at once, not a discount, so nothing here marks the total down.
 */
const capitalizeWords = (str: string): string => {
  return String(str || "")
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
};

const getItemFullName = (item: CatalogProduct) => {
  const rawName = String(item?.name || "Product").trim();
  const skuOrModel =
    item?.model ||
    item?.sku ||
    item?.product_id ||
    item?.modelNumber ||
    "";

  let fullName = rawName;
  if (skuOrModel && !rawName.toLowerCase().includes(String(skuOrModel).trim().toLowerCase())) {
    fullName = `${rawName} (${String(skuOrModel).trim()})`;
  }

  return capitalizeWords(fullName);
};

export const FrequentlyBoughtTogether: React.FC<FrequentlyBoughtTogetherProps> = ({
  product,
}) => {
  const [items, setItems] = useState<CatalogProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchBundleProducts(product, 3)
      .then((bundle) => {
        if (!isMounted) return;
        setItems(bundle);
        setSelectedIds(bundle.map((item) => normalizeId(item)).filter(Boolean));
      })
      .catch(() => {
        if (isMounted) setItems([]);
      });
    return () => {
      isMounted = false;
    };
  }, [product]);

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(normalizeId(item))),
    [items, selectedIds],
  );

  const bundleTotal = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) => sum + getPrimaryPriceTier(item).sellingPrice,
        0,
      ),
    [selectedItems],
  );

  const { state: cartState, buttonProps } = useAddToCart({
    onAdd: async () => {
      if (selectedItems.length === 0) {
        toast.warning("Select at least one item to add.");
        return false;
      }
      if (selectedItems.some((item) => getAvailableStock(item) <= 0)) {
        toast.error("One or more selected items are out of stock.");
        return false;
      }

      for (const item of selectedItems) {
        const tier = getPrimaryPriceTier(item);
        await addToCart(
          item,
          1,
          tier.sellingPrice,
          tier.packWeight || 0,
          tier.number,
          tier.number,
          item?.brand?._id || item?.brand,
          item?.category,
          tier.stockQuantity ?? getAvailableStock(item),
        );
      }
      toast.success("Selected products added to your order.");
      return true;
    },
  });

  // Nothing to pair with — a lone card would just repeat the hero.
  if (items.length < 2) return null;

  return (
    <section className="tw-mt-16">
      <h2 className="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-slate-900 tw-mb-4 tw-tracking-tight">
        Frequently Bought Together
      </h2>

      <div className="tw-bg-white tw-text-slate-900 tw-p-6 sm:tw-p-8 tw-rounded-2xl">
        <div className="tw-flex tw-flex-col lg:tw-flex-row tw-items-start lg:tw-items-center tw-gap-8">
          {/* Item cards */}
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 sm:tw-gap-4">
            {items.map((item, index) => {
              const id = normalizeId(item);
              const tier = getPrimaryPriceTier(item);
              const isSelected = selectedIds.includes(id);
              const fullName = getItemFullName(item);
              return (
                <React.Fragment key={id || index}>
                  <button
                    type="button"
                    onClick={() => toggleItem(id)}
                    aria-pressed={isSelected}
                    className={`tw-relative tw-p-3.5 tw-rounded-xl tw-border-0 tw-transition-all tw-cursor-pointer tw-flex tw-flex-col tw-items-center tw-group tw-w-28 sm:tw-w-36 tw-text-center ${
                      isSelected
                        ? "tw-bg-slate-100 tw-ring-2 tw-ring-slate-900"
                        : "tw-bg-slate-50/80 tw-opacity-50 tw-grayscale"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`tw-absolute tw-top-2.5 tw-left-2.5 tw-w-4 tw-h-4 tw-rounded tw-border-0 tw-flex tw-items-center tw-justify-center tw-text-[10px] tw-font-bold ${
                        isSelected
                          ? "tw-bg-slate-900 tw-text-white"
                          : "tw-bg-slate-200 tw-text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span className="tw-w-16 tw-h-16 tw-flex tw-items-center tw-justify-center tw-p-1 tw-mb-2 tw-overflow-hidden tw-bg-white tw-rounded-lg tw-shadow-xs">
                      <img
                        src={getProductImageSrc(item)}
                        alt={fullName}
                        loading="lazy"
                        className="tw-w-full tw-h-full tw-object-contain group-hover:tw-scale-105 tw-transition-transform"
                      />
                    </span>
                    <span className="tw-text-[11px] tw-font-bold tw-text-slate-900 tw-leading-tight tw-break-words">
                      {fullName}
                    </span>
                    <span className="tw-text-[11px] tw-font-semibold tw-text-slate-500 tw-mt-1">
                      {formatINR(tier.sellingPrice)}
                    </span>
                  </button>

                  {index < items.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined tw-text-slate-400 tw-font-bold tw-text-xl tw-select-none"
                    >
                      add
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Summary */}
          <div className="tw-grow lg:tw-pl-8 tw-pt-6 lg:tw-pt-0 tw-w-full lg:tw-w-auto">
            <div className="tw-space-y-2 tw-mb-4 tw-text-xs sm:tw-text-sm">
              {items.map((item, index) => {
                const id = normalizeId(item);
                const isSelected = selectedIds.includes(id);
                const tier = getPrimaryPriceTier(item);
                const fullName = getItemFullName(item);
                return (
                  <div
                    key={id || index}
                    className={`tw-flex tw-justify-between tw-items-center tw-gap-4 ${
                      isSelected
                        ? "tw-text-slate-900"
                        : "tw-text-slate-400 tw-line-through"
                    }`}
                  >
                    <span className="tw-break-words">• {fullName}</span>
                    <span className="tw-whitespace-nowrap tw-font-semibold tw-text-slate-900">
                      {formatINR(tier.sellingPrice)}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="tw-text-xs sm:tw-text-sm tw-text-slate-500 tw-mb-1 tw-font-medium">
              Total Bundle Price ({selectedItems.length}{" "}
              {selectedItems.length === 1 ? "item" : "items"}):
            </p>
            <div className="tw-flex tw-items-baseline tw-gap-3 tw-mb-5">
              <span className="tw-text-2xl sm:tw-text-3xl tw-font-extrabold tw-text-slate-900">
                {formatINR(bundleTotal)}
              </span>
            </div>

            <button
              {...buttonProps}
              type="button"
              disabled={selectedItems.length === 0}
              className={`tw-w-full sm:tw-w-auto tw-px-8 tw-py-3.5 tw-rounded-xl tw-text-xs sm:tw-text-sm tw-font-extrabold tw-uppercase tw-tracking-wider tw-transition-all tw-flex tw-items-center tw-justify-center tw-gap-2.5 tw-border-0 ${
                selectedItems.length > 0
                  ? "tw-bg-slate-900 tw-text-white hover:tw-bg-slate-800 tw-cursor-pointer tw-shadow-md"
                  : "tw-bg-slate-100 tw-text-slate-400 tw-cursor-not-allowed"
              }`}
            >
              <AddToCartContent
                state={cartState}
                icon={false}
                idleLabel={
                  <>
                    <span className="material-symbols-outlined tw-text-lg">
                      shopping_cart
                    </span>
                    Add {selectedItems.length} Bundle Items to Order
                  </>
                }
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FrequentlyBoughtTogether;
