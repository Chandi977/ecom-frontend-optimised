import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

import { getService, postService } from "../../services/service";
import { addToCart } from "../../utils/cart";
import AddToCartContent from "../common/AddToCartContent";
import useAddToCart from "../../hooks/useAddToCart";
import { addToFav } from "../../utils/favourites";
import {
  formatCurrency,
  getAvailableStock,
  getProductImageSrc,
  getPrimaryPriceTier,
  getProductSubCategory,
} from "../../utils/productCatalog";
import ProductImage from "./ProductImage";

const BUNDLE_LIMIT = 3;
type CatalogProduct = Record<string, unknown> & {
  _id?: string;
  id?: string;
  slug?: string;
  name?: string;
  model?: string;
  brand?: { _id?: string; id?: string; name?: string } | string;
  category?: unknown;
  buyItWith?: unknown[];
  relatedProducts?: unknown[];
};

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return value?._id || value?.id || "";
  }
  return String(value);
};

const getProductIds = (items) =>
  (Array.isArray(items) ? items : [])
    .map(normalizeId)
    .filter((id) => Boolean(id) && id !== "undefined");

const normalizeCategoryId = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return value?._id || value?.id || "";
  }
  return String(value);
};

const normalizeCategoryName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getSubCategoryField = (product, field) => {
  const subCategory = getProductSubCategory(product);
  if (subCategory && typeof subCategory === "object") {
    return subCategory[field] || "";
  }
  return "";
};

const inferProductCategoryKey = (product) => {
  const text = normalizeCategoryName(
    [
      product?.category?.name,
      product?.category?.slug,
      getSubCategoryField(product, "name"),
      getSubCategoryField(product, "slug"),
      product?.name,
      product?.model,
    ]
      .filter(Boolean)
      .join(" "),
  );

  if (/corrugated|box/.test(text)) return "corrugated box";
  if (/poly\s*bag|polybag/.test(text)) return "poly bag";
  if (/paper\s*bag/.test(text)) return "paper bag";
  if (/bopp|tape/.test(text)) return "tape";
  if (/label|rollabel|chromo|thermal/.test(text)) return "label";
  if (/food\s*wrapping|wrapping\s*paper|foil/.test(text)) {
    return "food wrapping paper";
  }
  if (/carry\s*bag/.test(text)) return "carry bag";

  return "";
};

const getCategoryKey = (product, categoryNameById) => {
  const category = product?.category;
  if (category && typeof category === "object") {
    const namedKey = normalizeCategoryName(category?.name || category?.slug);
    if (namedKey) return namedKey;
  }

  const categoryId = normalizeCategoryId(category);
  const mappedKey = categoryNameById?.[categoryId];
  if (mappedKey) return mappedKey;

  return inferProductCategoryKey(product) || categoryId;
};

const getPrimaryPrice = (product) => getPrimaryPriceTier(product).sellingPrice;

const getPrimaryMrp = (product) => getPrimaryPriceTier(product).mrp;

const getPrimaryPackSize = (product) => getPrimaryPriceTier(product).number || 1;

const getPrimaryPackWeight = (product) =>
  Number(getPrimaryPriceTier(product).packWeight) || 0;

const getPrimaryStock = (product) => {
  const stock = getAvailableStock(product);
  return stock > 0 ? stock : 0;
};

const hasStock = (product) => {
  const stock = getPrimaryStock(product);
  return stock === undefined || Number.isNaN(stock) || stock > 0;
};

const buildProductLabel = (product) =>
  [product?.brand?.name, product?.name].filter(Boolean).join(" ");

const shuffleProducts = (items) => {
  const shuffled = [...(Array.isArray(items) ? items : [])];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
};

function BuySection({ product }) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const addUniqueProduct = (list, nextProduct, options: Record<string, any> = {}) => {
      const { categoryNameById = {} } = options;
      const nextId = normalizeId(nextProduct);
      const nextCategoryKey = getCategoryKey(nextProduct, categoryNameById);
      if (!nextId || list.some((item) => normalizeId(item) === nextId)) {
        return list;
      }
      if (
        nextCategoryKey &&
        list.some((item) => getCategoryKey(item, categoryNameById) === nextCategoryKey)
      ) {
        return list;
      }
      return [...list, nextProduct];
    };

    const fetchProductsByIds = async (productIds) => {
      const uniqueIds = Array.from(new Set(productIds));
      const responses = await Promise.all(
        uniqueIds.map((productId) =>
          getService(`product/image/single/${productId}`, {}, { silent: true }),
        ),
      );

      return responses
        .map((res) => (res?.data?.message === "Product found" ? res?.data?.data : null))
        .filter(Boolean);
    };

    const fetchFilteredProducts = async (payload) => {
      const res = await postService("/product/filter", payload, {
        silent: true,
        suppressErrorStatuses: [404],
      });
      return Array.isArray(res?.data?.data) ? res.data.data : [];
    };

    const getCategoryNameById = async () => {
      const categoriesRes = await getService("category/all", {}, { silent: true });
      return (categoriesRes?.data?.data || []).reduce((acc, category) => {
        const categoryId = normalizeCategoryId(category);
        const categoryName = normalizeCategoryName(category?.name || category?.slug);
        if (categoryId && categoryName) {
          acc[categoryId] = categoryName;
        }
        return acc;
      }, {});
    };

    const isDifferentCategory = (item, currentCategoryKey, categoryNameById) => {
      const categoryKey = getCategoryKey(item, categoryNameById);
      return categoryKey && categoryKey !== currentCategoryKey;
    };

    const fetchFallbackProducts = async (
      selectedProducts,
      currentCategoryKey,
      categoryNameById,
    ) => {
      const selectedIds = new Set(selectedProducts.map(normalizeId));
      const alternativeCategoryIds = Object.entries(categoryNameById)
        .filter(([, categoryName]) => categoryName !== currentCategoryKey)
        .map(([categoryId]) => categoryId);

      const payload = {
        ...(alternativeCategoryIds.length > 0 && {
          category: alternativeCategoryIds,
        }),
        skip: 0,
        limit: 200,
      };

      const fallbackList = await fetchFilteredProducts(payload);

      return fallbackList.filter(
        (item) =>
          item?._id &&
          !selectedIds.has(normalizeId(item)) &&
          isDifferentCategory(item, currentCategoryKey, categoryNameById),
      );
    };

    const fetchAnyFallbackProducts = async (
      selectedProducts,
      currentCategoryKey,
      categoryNameById,
    ) => {
      const selectedIds = new Set(selectedProducts.map(normalizeId));
      const fallbackList = await fetchFilteredProducts({
        skip: 0,
        limit: 200,
      });

      return fallbackList.filter(
        (item) =>
          item?._id &&
          !selectedIds.has(normalizeId(item)) &&
          isDifferentCategory(item, currentCategoryKey, categoryNameById),
      );
    };

    const getBundleProducts = async () => {
      if (!product?._id) {
        return [];
      }

      let bundleProducts = [product];
      const categoryNameById = await getCategoryNameById();
      const currentCategoryKey = getCategoryKey(product, categoryNameById);
      const currentProductId = normalizeId(product);
      const curatedIds = [
        ...getProductIds(product?.buyItWith),
        ...getProductIds(product?.relatedProducts),
      ].filter((id) => id !== currentProductId);

      const curatedProducts = shuffleProducts(await fetchProductsByIds(curatedIds));
      curatedProducts.forEach((item) => {
        if (
          bundleProducts.length < BUNDLE_LIMIT &&
          isDifferentCategory(item, currentCategoryKey, categoryNameById)
        ) {
          bundleProducts = addUniqueProduct(bundleProducts, item, {
            categoryNameById,
          });
        }
      });

      if (bundleProducts.length < BUNDLE_LIMIT) {
        const fallbackProducts = shuffleProducts(
          await fetchFallbackProducts(
            bundleProducts,
            currentCategoryKey,
            categoryNameById,
          ),
        );
        fallbackProducts.forEach((item) => {
          if (bundleProducts.length < BUNDLE_LIMIT) {
            bundleProducts = addUniqueProduct(bundleProducts, item, {
              categoryNameById,
            });
          }
        });
      }

      if (bundleProducts.length < BUNDLE_LIMIT) {
        const anyFallbackProducts = shuffleProducts(
          await fetchAnyFallbackProducts(
            bundleProducts,
            currentCategoryKey,
            categoryNameById,
          ),
        );
        anyFallbackProducts.forEach((item) => {
          if (bundleProducts.length < BUNDLE_LIMIT) {
            bundleProducts = addUniqueProduct(bundleProducts, item, {
              categoryNameById,
            });
          }
        });
      }

      return bundleProducts.slice(0, BUNDLE_LIMIT);
    };

    getBundleProducts().then((bundleProducts) => {
      if (!isMounted) return;
      setProducts(bundleProducts);
      setCheckedIds(bundleProducts.map((p) => p._id || ""));
    });

    return () => {
      isMounted = false;
    };
  }, [product]);

  const handleCheckboxToggle = (id: string) => {
    if (checkedIds.includes(id)) {
      setCheckedIds(checkedIds.filter((item) => item !== id));
    } else {
      setCheckedIds([...checkedIds, id]);
    }
  };

  const handleCart = async () => {
    const toAdd = products.filter((p) => checkedIds.includes(p._id || ""));

    if (toAdd.length === 0) {
      toast.warning("Please select at least one item to add.");
      return false;
    }

    if (toAdd.some((item) => !hasStock(item))) {
      toast.error("Sorry, one or more selected items are out of stock.");
      return false;
    }

    for (const item of toAdd) {
      const packSize = getPrimaryPackSize(item);
      await addToCart(
        item,
        1,
        getPrimaryPrice(item),
        getPrimaryPackWeight(item),
        packSize,
        packSize,
        (item?.brand as any)?._id,
        item?.category,
        getPrimaryStock(item),
      );
    }
    toast.success("Selected products added to cart!");
    return true;
  };

  // The bundle adds several products at once, so the flight starts from the
  // first selected card rather than one product-specific ref.
  const { state: cartState, buttonProps: cartButtonProps } = useAddToCart({
    onAdd: handleCart,
    flySource: (button) =>
      button
        .closest(".buy-section-container")
        ?.querySelector<HTMLElement>(".buy-card-selected .buy-card-img-wrapper"),
  });

  const handleWishlist = async (e) => {
    e.stopPropagation();
    const toAdd = products.filter((p) => checkedIds.includes(p._id || ""));

    if (toAdd.length === 0) {
      toast.warning("Please select at least one item to add.");
      return;
    }

    for (const item of toAdd) {
      await addToFav(item);
    }
    toast.success("Selected products added to wishlist!");
  };

  if (products.length <= 1) {
    return null;
  }

  // Calculate pricing dynamics
  const checkedProducts = products.filter((p) => checkedIds.includes(p._id || ""));
  const totalSellingPrice = checkedProducts.reduce((sum, item) => sum + getPrimaryPrice(item), 0);
  const totalMrp = checkedProducts.reduce((sum, item) => sum + getPrimaryMrp(item), 0);
  const totalSavings = Math.max(0, totalMrp - totalSellingPrice);
  const savingsPercent = totalMrp > 0 ? Math.round((totalSavings / totalMrp) * 100) : 0;

  return (
    <div className="row mt-5 m-0">
      <div className="col">
        <h2 className="tw-text-[#0F172A] tw-text-[22px] tw-font-bold tw-m-0 tw-mb-3">
          Frequently Bought Together
        </h2>

        {/* Frequently Bought Together Card Container */}
        <div className="tw-bg-white tw-border tw-border-solid tw-border-[#E2E8F0] tw-rounded-lg tw-p-5 tw-flex tw-flex-row tw-items-center tw-justify-between tw-gap-6 max-[991px]:tw-flex-col">
          {/* Product Thumbnails with + signs */}
          <div className="tw-flex tw-flex-row tw-items-center tw-gap-4 max-[767px]:tw-gap-2">
            {products.map((item, index) => {
              const itemId = item._id || "";
              const isChecked = checkedIds.includes(itemId);
              return (
                <React.Fragment key={itemId || index}>
                  <div
                    className={`tw-w-[90px] tw-h-[90px] tw-bg-white tw-border tw-border-solid tw-rounded-md tw-p-2 tw-relative tw-flex tw-items-center tw-justify-center ${
                      isChecked ? "tw-border-[#31107F] tw-shadow-sm" : "tw-border-gray-200 tw-opacity-60"
                    }`}
                    onClick={() => handleCheckboxToggle(itemId)}
                    style={{ cursor: "pointer" }}
                  >
                    <ProductImage
                      src={getProductImageSrc(item)}
                      alt={item?.name || "Product image"}
                      fill
                      sizes="90px"
                      loading="lazy"
                      style={{ objectFit: "contain", padding: "4px" }}
                    />
                  </div>
                  {index !== products.length - 1 && (
                    <span className="tw-text-gray-500 tw-font-medium tw-text-xl">+</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Total Price & Add All Button */}
          <div className="tw-flex tw-flex-row tw-items-center tw-gap-6 tw-border-l tw-border-solid tw-border-[#F1F5F9] tw-pl-6 max-[991px]:tw-border-l-0 max-[991px]:tw-pl-0 max-[991px]:tw-w-full max-[991px]:tw-justify-between">
            <div className="tw-flex tw-flex-col">
              <span className="tw-text-gray-500 tw-text-xs tw-font-medium">Total Bundle Price:</span>
              <div className="tw-flex tw-items-baseline tw-gap-2">
                <span className="tw-text-[#B91C1C] tw-text-[22px] tw-font-extrabold">
                  {formatCurrency(totalSellingPrice)}
                </span>
                {totalSavings > 0 && (
                  <s className="tw-text-gray-400 tw-text-sm">
                    {formatCurrency(totalMrp)}
                  </s>
                )}
              </div>
            </div>

            <button
              className="tw-bg-[#31107F] hover:tw-bg-[#240A62] tw-text-white tw-font-bold tw-text-sm tw-px-6 tw-py-3 tw-rounded-md tw-border-0 tw-cursor-pointer tw-transition-colors tw-whitespace-nowrap"
              {...cartButtonProps}
            >
              <AddToCartContent
                state={cartState}
                idleLabel={`Add All ${checkedIds.length} Items to Order`}
                addingLabel="Adding..."
                addedLabel="Added to Order"
                iconSize={16}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuySection;
