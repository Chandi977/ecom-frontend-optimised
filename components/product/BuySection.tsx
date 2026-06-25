import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

import { getService, postService } from "../../services/service";
import { addToCart } from "../../utils/cart";
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
  [product?.brand?.name, product?.name, product?.model].filter(Boolean).join(" ");

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
  const [total, setTotal] = useState(0);
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
      setTotal(
        bundleProducts.reduce((sum, item) => sum + getPrimaryPrice(item), 0),
      );
    });

    return () => {
      isMounted = false;
    };
  }, [product]);

  const getButtonText = () => {
    if (products.length >= BUNDLE_LIMIT) {
      return "Add all three to Cart";
    }
    if (products.length === 2) {
      return "Add both to Cart";
    }
    return "Add to Cart";
  };

  const handleCart = async (e) => {
    e.stopPropagation();

    if (products.some((item) => !hasStock(item))) {
      toast.error("Sorry, one or more products are out of stock.");
      return;
    }

    for (const item of products) {
      const packSize = getPrimaryPackSize(item);
      await addToCart(
        item,
        1,
        getPrimaryPrice(item),
        getPrimaryPackWeight(item),
        packSize,
        packSize,
        item?.brand?._id,
        item?.category,
        getPrimaryStock(item),
      );
    }
  };

  if (products.length <= 1) {
    return null;
  }

  return (
    <>
      <div className={"row mt-5 m-0 "}>
        <div className="col">
        <p
          style={{
            color: "#3A5BA2",
            fontSize: "24px",
            fontStyle: "normal",
            fontWeight: "700",
            lineHeight: "30px",
            textTransform: "uppercase",
          }}
        >
          BUY IT WITH
        </p>
        <div
          style={{
            backgroundColor: "#3A5BA2",
            height: "3px",
            width: "265px",
          }}
        ></div>
        <div className="buy-section-layout mt-3 mb-2 d-flex flex-column align-items-center">
          <div className="buy-section-products">
            {products.map((item, index) => (
              <React.Fragment key={item?._id || index}>
                <div
                  className="buy-card d-flex flex-column justify-content-center align-items-center shadow-sm"
                  onClick={() => router.push(`/${item?.slug}`)}
                >
                  <div
                    className="buy-card-img-wrapper d-flex justify-content-center align-items-center bg-light"
                  >
                    <Image
                      src={getProductImageSrc(item)}
                      alt={item?.name || "Product image"}
                      fill
                      loading="lazy"
                      style={{ objectFit: "contain", padding: "8px" }}
                    />
                  </div>
                  <div
                    className="buy-card-info d-flex flex-column justify-content-evenly align-items-between"
                  >
                    <div className="buy-card-title-row row p-0 m-0">
                      <p
                        className="buy-card-title d-flex flex-row justify-content-center align-items-center"
                      >
                        {buildProductLabel(item)}
                      </p>
                    </div>
                    <div className="row mx-3"></div>
                    <div
                      className="buy-card-price-row px-3 mt-4 d-flex flex-row align-items-center justify-content-start"
                    >
                      <p className="tw-prod-pricesecondtext">
                        <span className="buy-card-mrp">
                          {formatCurrency(getPrimaryMrp(item))}
                        </span>{" "}
                        <span className="buy-card-price">
                          &nbsp;&nbsp;{formatCurrency(getPrimaryPrice(item))}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                {index !== products.length - 1 && (
                  <p className="plus-sign my-0 mx-2 p-0 tw-prod-plussign">+</p>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="total-container d-flex flex-column align-items-center justify-content-center">
            <div className="d-flex mb-2 justify-content-center align-items-center">
              <p
                style={{
                  color: "var(--h-eading, #222)",
                  fontSize: "22px",
                  fontStyle: "normal",
                  fontWeight: "400",
                  lineHeight: "21px",
                  margin: 0,
                }}
              >
                Total price:&nbsp;
              </p>
              <p
                style={{
                  color: "var(--h-eading, #222)",
                  fontSize: "24px",
                  fontStyle: "normal",
                  fontWeight: "600",
                  lineHeight: "25px",
                  margin: 0,
                }}
                className="text-success"
              >
                {formatCurrency(total)}
              </p>
            </div>
            <button
              className="tw-prod-addtocart"
              onClick={handleCart}
            >
              {getButtonText()}
            </button>
          </div>
        </div>
      </div>
      </div>
      <style jsx>{`
        .tw-prod-pricesecondtext { color: #249b3e; font-family: Montserrat; font-size: 16px; font-style: normal; font-weight: 400; line-height: 18px; }
        .plus-sign {
          height: fit-content;
          color: var(--h-eading, #222);
          text-align: right;
          font-size: 33.6px;
          font-style: normal;
          font-weight: 500;
          line-height: 37.8px;
        }
        .buy-section-layout {
          width: 100%;
        }
        .buy-section-products {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          width: 100%;
        }
        .buy-card {
          width: 287px;
          height: 300px;
          border: 1px solid #EDEDED;
          margin-bottom: 10px;
          cursor: pointer;
        }
        .buy-card-img-wrapper {
          position: relative;
          height: 170px;
          width: 287px;
        }
        .buy-card-info {
          height: 170px;
          width: 227px;
        }
        .buy-card-title-row {
          height: 50px;
        }
        .buy-card-title {
          font-size: 16px;
          font-weight: 400;
          line-height: 21px;
          text-transform: capitalize;
          margin: 0;
          text-align: center;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .buy-card-price-row {
          height: 50px;
        }
        .buy-card-mrp {
          font-size: 16px;
          text-decoration: line-through;
        }
        .buy-card-price {
          font-size: 20px;
          font-weight: 500;
        }
        .total-container {
          width: 100%;
          max-width: 350px;
          margin-top: 24px;
        }
        @media (max-width: 1130px) { .tw-prod-plussign { display: none; } }
        @media (max-width: 767px) {
          .buy-section-products {
            flex-wrap: nowrap !important;
            overflow-x: auto;
            justify-content: flex-start !important;
            width: 100%;
            padding: 10px;
            -webkit-overflow-scrolling: touch;
          }
          .buy-card {
            width: 80px !important;
            height: 135px !important;
            flex-shrink: 0;
            margin-bottom: 0;
          }
          .buy-card-img-wrapper {
            height: 60px !important;
            width: 80px !important;
          }
          .buy-card-info {
            height: 65px !important;
            width: 70px !important;
          }
          .buy-card-title-row {
            height: 25px !important;
          }
          .buy-card-title {
            font-size: 7.5px !important;
            line-height: 9px !important;
          }
          .buy-card-price-row {
            height: 15px !important;
            margin-top: 2px !important;
            padding: 0 !important;
            justify-content: center !important;
          }
          .buy-card-mrp {
            font-size: 7.5px !important;
          }
          .buy-card-price {
            font-size: 9px !important;
          }
          .plus-sign {
            font-size: 14px !important;
            line-height: 14px !important;
            margin: 0 2px !important;
            display: block !important;
          }
          .total-container {
            width: 150px !important;
            margin-left: 10px !important;
            margin-right: 10px !important;
            flex-shrink: 0;
          }
          .tw-prod-addtocart {
            width: 100% !important;
            height: auto !important;
            min-height: 44px !important;
            padding: 8px 12px !important;
            font-size: 12px !important;
            line-height: 16px !important;
          }
        }
        .tw-prod-addtocart { border: 0; color: #fff; text-align: center; font-size: 16px; font-style: normal; font-weight: 500; line-height: 24px; display: flex; width: 213px; height: 44px; padding: 14px 36px; align-items: center; justify-content: center; gap: 10px; flex-shrink: 0; background-color: #182c5a; }
        .tw-prod-addtocart:hover { background-color: #e92227; }
      `}</style>
    </>
  );
}

export default BuySection;
