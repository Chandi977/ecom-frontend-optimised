import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

import { getService, postService } from "../../services/service";
import { addToCart } from "../../utils/cart";
import { addToFav } from "../../utils/favourites";
import {
  formatCurrency,
  getAvailableStock,
  getProductImageSrc,
  getPrimaryPriceTier,
  getProductSubCategory,
} from "../../utils/productCatalog";

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

  const handleCart = async (e) => {
    e.stopPropagation();
    const toAdd = products.filter((p) => checkedIds.includes(p._id || ""));

    if (toAdd.length === 0) {
      toast.warning("Please select at least one item to add.");
      return;
    }

    if (toAdd.some((item) => !hasStock(item))) {
      toast.error("Sorry, one or more selected items are out of stock.");
      return;
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
  };

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
    <>
      <div className="row mt-5 m-0">
        <div className="col">
          <h2 className="tw-text-[#182c5a] tw-text-[24px] tw-font-bold tw-uppercase tw-m-0 tw-mb-1">
            Buy It With
          </h2>
          <p className="tw-text-gray-500 tw-text-[15px] tw-m-0 tw-mb-4">
            Frequently bought together
          </p>

          <div className="buy-section-container tw-flex tw-flex-row tw-justify-center tw-items-stretch tw-gap-8 tw-w-full tw-my-6 tw-py-4 max-[991px]:tw-flex-col max-[991px]:tw-items-center">
            {/* Products Row */}
            <div className="buy-section-products-list tw-flex tw-flex-row tw-items-center tw-justify-center tw-gap-4 max-[767px]:tw-overflow-x-auto max-[767px]:tw-pb-4">
              {products.map((item, index) => {
                const itemId = item._id || "";
                const isChecked = checkedIds.includes(itemId);
                const itemSavings = Math.max(0, getPrimaryMrp(item) - getPrimaryPrice(item));
                return (
                  <React.Fragment key={itemId || index}>
                    <div
                      className={`buy-card d-flex flex-column justify-content-center align-items-center ${isChecked ? "buy-card-selected" : "buy-card-deselected"}`}
                      onClick={() => router.push(`/${item?.slug}`)}
                    >
                      {/* Checkbox Overlay */}
                      <div
                        className="tw-absolute tw-top-3 tw-left-3 tw-z-10 tw-cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckboxToggle(itemId);
                        }}
                      >
                        <div
                          className={`tw-w-5 tw-h-5 tw-rounded tw-border tw-border-solid tw-flex tw-items-center tw-justify-center ${isChecked ? "tw-bg-[#182c5a] tw-border-[#182c5a]" : "tw-bg-white tw-border-gray-300"}`}
                        >
                          {isChecked && (
                            <svg className="tw-w-3 tw-h-3 tw-text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Savings Badge */}
                      {isChecked && itemSavings > 0 && (
                        <div className="tw-absolute tw-top-3 tw-right-3 tw-z-10 tw-bg-[#e92227] tw-text-white tw-text-[10px] tw-font-bold tw-px-2 tw-py-0.5 tw-rounded-full tw-shadow-sm">
                          Save {formatCurrency(itemSavings)}
                        </div>
                      )}

                      <div className="buy-card-img-wrapper d-flex justify-content-center align-items-center bg-light">
                        <Image
                          src={getProductImageSrc(item)}
                          alt={item?.name || "Product image"}
                          fill
                          loading="lazy"
                          style={{ objectFit: "contain", padding: "2px" }}
                        />
                      </div>
                      <div className="buy-card-info d-flex flex-column justify-content-evenly align-items-between">
                        <div className="buy-card-title-row row p-0 m-0">
                          <p className="buy-card-title d-flex flex-row justify-content-center align-items-center">
                            {buildProductLabel(item)}
                          </p>
                        </div>
                        {item.model && (
                          <div className="tw-flex tw-justify-center tw-w-full">
                            <span className="tw-text-[10px] tw-text-gray-500 tw-bg-gray-100 tw-px-2 tw-py-0.5 tw-rounded tw-border tw-border-solid tw-border-gray-200 tw-truncate tw-max-w-[90%]">
                              {item.model}
                            </span>
                          </div>
                        )}
                        <div className="buy-card-price-row px-3 d-flex flex-row align-items-center justify-content-center gap-2">
                          <span className="buy-card-mrp">
                            {formatCurrency(getPrimaryMrp(item))}
                          </span>
                          <span className="buy-card-price">
                            {formatCurrency(getPrimaryPrice(item))}
                          </span>
                        </div>
                      </div>
                    </div>
                    {index !== products.length - 1 && (
                      <p className="plus-sign my-0 mx-2 p-0 tw-prod-plussign">+</p>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Summary Card */}
            <div
              className="buy-summary-card tw-border tw-border-solid tw-border-gray-200 tw-rounded-xl tw-p-5 tw-bg-white tw-flex tw-flex-col tw-w-[280px] tw-shrink-0 max-[991px]:tw-w-full"
              style={{ border: "1px solid #ebebeb" }}
            >
              <div className="tw-flex tw-flex-row tw-justify-between tw-items-center tw-mb-2">
                <span className="tw-text-gray-700 tw-text-[15px] tw-font-semibold">Total Price:</span>
                <span className="tw-text-[#e92227] tw-text-[20px] tw-font-bold">
                  {formatCurrency(totalSellingPrice)}
                </span>
              </div>
              {totalSavings > 0 && (
                <div className="tw-flex tw-flex-row tw-justify-between tw-items-center tw-mb-4">
                  <span className="tw-text-gray-500 tw-text-[13px]">You Save:</span>
                  <span className="tw-text-[#249b3e] tw-text-[13px] tw-font-medium">
                    {formatCurrency(totalSavings)} ({savingsPercent}%)
                  </span>
                </div>
              )}

              <div className="tw-flex tw-flex-col tw-gap-2.5 tw-mt-2">
                <button
                  className="tw-w-full tw-border-0 tw-text-white tw-text-center tw-text-[14px] tw-font-semibold tw-flex tw-h-[42px] tw-items-center tw-justify-center tw-gap-[8px] tw-bg-[#182c5a] tw-rounded-lg hover:tw-bg-[#e92227] tw-transition-colors tw-cursor-pointer"
                  onClick={handleCart}
                >
                  <svg className="tw-w-4 tw-h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  ADD ALL TO CART
                </button>
                <button
                  className="tw-w-full tw-border tw-border-solid tw-border-gray-300 tw-bg-white tw-text-gray-700 tw-text-center tw-text-[14px] tw-font-semibold tw-flex tw-h-[42px] tw-items-center tw-justify-center tw-gap-[8px] tw-rounded-lg hover:tw-bg-gray-50 tw-transition-colors tw-cursor-pointer"
                  onClick={handleWishlist}
                  style={{ border: "1px solid #d1d5db" }}
                >
                  <svg className="tw-w-4 tw-h-4 tw-text-gray-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  ADD TO WISHLIST
                </button>
              </div>
            </div>
          </div>

          {/* Trust Badges Row */}
          <div className="tw-w-full tw-grid tw-grid-cols-4 tw-gap-4 tw-mt-8 tw-mb-4 tw-border tw-border-solid tw-border-gray-200 tw-rounded-xl tw-p-4 tw-bg-white max-[900px]:tw-grid-cols-2 max-[900px]:tw-gap-3" style={{ border: "1px solid #ebebeb" }}>
            <div className="tw-flex tw-flex-row tw-items-center tw-gap-3">
              <svg className="tw-w-8 tw-h-8 tw-text-[#182c5a] tw-flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              <div className="tw-flex tw-flex-col">
                <span className="tw-text-gray-900 tw-text-[13px] tw-font-bold tw-leading-tight">Premium Quality</span>
                <span className="tw-text-gray-500 tw-text-[11px] tw-mt-0.5">Best in class products</span>
              </div>
            </div>
            <div className="tw-flex tw-flex-row tw-items-center tw-gap-3">
              <svg className="tw-w-8 tw-h-8 tw-text-[#182c5a] tw-flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.75a1.125 1.125 0 0 1-1.125-1.125V4.625c0-.621.504-1.125 1.125-1.125H16.5a1.125 1.125 0 0 1 1.125 1.125v13a1.125 1.125 0 0 1-1.125 1.125m-3.75 0h4.875c.621 0 1.125-.504 1.125-1.125v-5.25c0-.411-.223-.79-.586-.975l-3.375-1.713a1.125 1.125 0 0 0-.97-.02L12 9.75M8.25 21h6.75" />
              </svg>
              <div className="tw-flex tw-flex-col">
                <span className="tw-text-gray-900 tw-text-[13px] tw-font-bold tw-leading-tight">Fast Delivery</span>
                <span className="tw-text-gray-500 tw-text-[11px] tw-mt-0.5">Pan India Shipping</span>
              </div>
            </div>
            <div className="tw-flex tw-flex-row tw-items-center tw-gap-3">
              <svg className="tw-w-8 tw-h-8 tw-text-[#182c5a] tw-flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <div className="tw-flex tw-flex-col">
                <span className="tw-text-gray-900 tw-text-[13px] tw-font-bold tw-leading-tight">Best Price</span>
                <span className="tw-text-gray-500 tw-text-[11px] tw-mt-0.5">Guaranteed Savings</span>
              </div>
            </div>
            <div className="tw-flex tw-flex-row tw-items-center tw-gap-3">
              <svg className="tw-w-8 tw-h-8 tw-text-[#182c5a] tw-flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 11.25a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              </svg>
              <div className="tw-flex tw-flex-col">
                <span className="tw-text-gray-900 tw-text-[13px] tw-font-bold tw-leading-tight">Customer Support</span>
                <span className="tw-text-gray-500 tw-text-[11px] tw-mt-0.5">Quick help & support</span>
              </div>
            </div>
          </div>

        </div>
      </div>
      <style jsx>{`
        .plus-sign {
          height: fit-content;
          color: var(--h-eading, #222);
          text-align: right;
          font-size: 33.6px;
          font-style: normal;
          font-weight: 500;
          line-height: 37.8px;
        }
        .buy-section-products-list {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .buy-card {
          position: relative;
          width: 250px;
          height: 330px;
          border-radius: 12px;
          margin-bottom: 0px;
          cursor: pointer;
          background-color: #fff;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .buy-card-selected {
          border: 2px solid #182c5a;
          box-shadow: 0 10px 20px -5px rgba(24, 44, 90, 0.08), 0 8px 10px -6px rgba(24, 44, 90, 0.08);
        }
        .buy-card-selected:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(24, 44, 90, 0.15), 0 10px 10px -5px rgba(24, 44, 90, 0.15);
        }
        .buy-card-deselected {
          border: 1.5px dashed #cbd5e1;
          opacity: 0.55;
        }
        .buy-card-deselected:hover {
          opacity: 0.8;
          border-color: #94a3b8;
        }
        .buy-card-img-wrapper {
          position: relative;
          height: 185px;
          width: 250px;
          background-color: #f9fafb !important;
        }
        .buy-card-info {
          height: 145px;
          width: 100%;
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background-color: #fff;
        }
        .buy-card-title-row {
          height: 40px;
        }
        .buy-card-title {
          font-size: 14px;
          font-weight: 500;
          line-height: 18px;
          text-transform: capitalize;
          margin: 0;
          text-align: center;
          color: #1f2937;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .buy-card-price-row {
          height: 30px;
        }
        .buy-card-mrp {
          font-size: 13px;
          color: #9ca3af;
          text-decoration: line-through;
        }
        .buy-card-price {
          font-size: 16px;
          font-weight: 700;
          color: #e92227;
        }
        @media (max-width: 1130px) { .tw-prod-plussign { display: none; } }
        @media (max-width: 767px) {
          .buy-section-products-list {
            flex-wrap: nowrap !important;
            overflow-x: auto;
            justify-content: flex-start !important;
            width: 100%;
            padding: 10px;
            gap: 6px;
            -webkit-overflow-scrolling: touch;
          }
          .buy-card {
            width: 140px !important;
            height: 235px !important;
            flex-shrink: 0;
            border-radius: 8px;
          }
          .buy-card-img-wrapper {
            height: 130px !important;
            width: 140px !important;
          }
          .buy-card-info {
            height: 105px !important;
            width: 100% !important;
            padding: 4px !important;
          }
          .buy-card-title-row {
            height: 30px !important;
          }
          .buy-card-title {
            font-size: 9px !important;
            line-height: 12px !important;
          }
          .buy-card-price-row {
            height: 20px !important;
            margin-top: 2px !important;
            padding: 0 !important;
            justify-content: center !important;
            gap: 4px !important;
          }
          .buy-card-mrp {
            font-size: 9px !important;
          }
          .buy-card-price {
            font-size: 11px !important;
          }
          .plus-sign {
            font-size: 16px !important;
            line-height: 16px !important;
            margin: 0 4px !important;
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}

export default BuySection;
