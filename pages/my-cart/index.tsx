"use client"; // This is a client component 👈🏽
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useEffect } from "react";
import {
  alterQuantity,
  getCart,
  removeFromCart,
  updateCart,
  updateShippingDiscount,
  updateAllDiscount,
  updateProductTypeAllDiscount,
  removeCouponCode,
} from "../../utils/cart";
import { getService, postService } from "../../services/service";
import { AiFillDelete } from "react-icons/ai";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import Head from "next/head";
import axios from "axios";

const BRAND_LABELS = {
  "6926d6bad53f3a772c6e978c": "Flipkart",
  "6557dbcc301ec4f2f426610b": "Myntra",
  "69268af9d53f3a772c6bccc2": "Amazon",
  "6582c8580ab82549a084894f": "Ajio",
  "6557dbf9301ec4f2f426611e": "Rollabel™",
  "6557dc10301ec4f2f4266122": "Pack-Secure",
  "6582c8750ab82549a0848953": "PackPro™",
};

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const formatRounded = (value) => Math.round(safeNumber(value));

const getBrandLabel = (brand) => {
  if (!brand) return "";
  if (typeof brand === "object") {
    return brand?.name || brand?.brand_name || brand?.slug || "";
  }
  return BRAND_LABELS[String(brand)] || String(brand);
};

const getCartItemKey = (item, index) => {
  const product = item?.product;
  const productId =
    product && typeof product === "object"
      ? product?._id || product?.id
      : product;
  return `${productId || item?._id || "cart-item"}-${item?.packSize || index}`;
};

const getLineStock = (item) => {
  const priceList = item?.product?.priceList;
  const selectedPrice = Array.isArray(priceList)
    ? priceList.find((price) => String(price?.number) === String(item?.packSize))
    : null;
  const stock = selectedPrice?.stock_quantity ?? item?.stock;
  const numericStock = Number(stock);
  return Number.isFinite(numericStock) ? numericStock : null;
};

const getLineQuantity = (item) => Math.max(1, safeNumber(item?.quantity, 1));

const Cartpage = () => {  const [pincode, setPincode] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const [cart, setCart] = useState<any>(null);
  const [cartProducts, setCartProducts] = useState<any[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponUsed, setCouponUsed] = useState<any[]>([]);
  const currentDate = new Date().toISOString();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingQuantityKey, setUpdatingQuantityKey] = useState<string | null>(null);

  const getUser = async () => {
    const userStr = localStorage.getItem("PIUser");
    if (!userStr) return;
    const User = JSON.parse(userStr);
    // setCouponUsed(User?.couponUsed);
    const user = await getService(`getuser/${User?._id}`);
    // console.log("58", user)
    setCouponUsed(user?.data?.data?.couponUsed);
    // if (user?.data?.success) {
    //   setUserAddresss(user?.data?.data?.contact_address);
    // }
  };

  useEffect(() => {
    const token = localStorage.getItem("PIToken");
    if (token) {
      getUser();
    }
    setToken(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCart = async () => {
    const c = await getCart();
    if (c !== null) {
      setCart(c);
      setCartProducts(c?.products);
      console.log("CART COMING", c);
      // OUT OF STOCK STATE MANAGEMENT HERE
      // {
      //   cart?.products?.map((product) => product);
      // }

      // const packSizeQuantityMap = {};
      // cart?.products?.forEach((item) => {
      //   packSizeQuantityMap[item.packSize] = item.quantity;
      // });
      // console.log("MAP CREATED: ", packSizeQuantityMap);
    }
  };

  useEffect(() => {
    handleCart();
  }, []);

  // Safely derive product id from cart line item
  const getProductId = (item) => {
    const pid = item?.product;
    if (pid && typeof pid === "object") {
      return pid?._id || pid?.id || pid?.toString?.();
    }
    return pid || item?._id || null;
  };

  const handleAlter = async (item, value, index) => {
    const productId = getProductId(item);
    if (!productId) {
      toast.error("Unable to update quantity. Missing product id.");
      return;
    }

    const currentQuantity = getLineQuantity(item);
    const stock = getLineStock(item);
    let nextQuantity = Math.floor(Number(value));

    if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
      nextQuantity = 1;
    }

    if (stock !== null && stock < 1) {
      toast.error("This item is out of stock.");
      return;
    }

    if (stock !== null && nextQuantity > stock) {
      nextQuantity = stock;
      toast.info(`Only ${stock} item(s) available for this pack size.`);
    }

    if (nextQuantity === currentQuantity) {
      return;
    }

    const key = getCartItemKey(item, index);
    setUpdatingQuantityKey(key);
    try {
      const result = await alterQuantity(productId, nextQuantity, item?.packSize);
      if (result) {
        await handleCart();
      }
    } finally {
      setUpdatingQuantityKey(null);
    }
  };

  const renderQuantityControl = (item, index, mobile = false) => {
    const quantity = getLineQuantity(item);
    const stock = getLineStock(item);
    const key = getCartItemKey(item, index);
    const isUpdating = updatingQuantityKey === key;
    const maxReached = stock !== null && quantity >= stock;

    return (
      <div
        className={`tw-inline-flex tw-items-center tw-h-10 tw-border tw-border-solid tw-border-[#c7c7c7] tw-rounded tw-overflow-hidden tw-bg-white ${
          mobile ? "tw-h-[30px]" : ""
        }`}
      >
        <button
          type="button"
          className="tw-w-8 tw-h-full tw-border-0 tw-bg-[#182c5a] tw-text-white tw-text-lg tw-font-bold tw-leading-none tw-cursor-pointer disabled:tw-bg-[#d9d9d9] disabled:tw-text-[#777] disabled:tw-cursor-not-allowed"
          aria-label="Decrease quantity"
          disabled={isUpdating || quantity <= 1}
          onClick={() => handleAlter(item, quantity - 1, index)}
        >
          -
        </button>
        <input
          className="qty-input tw-w-12 tw-h-full tw-border-0 tw-border-l-[1px] tw-border-r-[1px] tw-border-solid tw-border-[#c7c7c7] tw-text-center tw-text-base tw-font-semibold tw-bg-white tw-text-black disabled:tw-bg-[#f5f5f5]"
          type="number"
          min="1"
          max={stock ?? undefined}
          value={quantity}
          aria-label="Cart quantity"
          disabled={isUpdating}
          onChange={(event) => handleAlter(item, event.target.value, index)}
        />
        <button
          type="button"
          className="tw-w-8 tw-h-full tw-border-0 tw-bg-[#182c5a] tw-text-white tw-text-lg tw-font-bold tw-leading-none tw-cursor-pointer disabled:tw-bg-[#d9d9d9] disabled:tw-text-[#777] disabled:tw-cursor-not-allowed"
          aria-label="Increase quantity"
          disabled={isUpdating || maxReached}
          onClick={() => handleAlter(item, quantity + 1, index)}
        >
          +
        </button>
      </div>
    );
  };

  const handleRemoveFromCart = async (item) => {
    if (!cart?.products?.length) {
      toast.info("Your cart is already empty.");
      return;
    }
    const productId = getProductId(item);
    if (!productId) {
      toast.error("Unable to remove item. Missing product id.");
      return;
    }
    if (removingId) return; // guard against double clicks
    setRemovingId(String(productId));
    try {
      const result = await removeFromCart(String(productId));
      if (result) {
        toast.success("Item removed. Note: all pack sizes of this product were removed.");
        await handleCart();
      } else {
        toast.error("Could not remove item. Please retry.");
      }
    } catch (error) {
      toast.error("Remove failed. Check your connection and try again.");
    } finally {
      setRemovingId(null);
    }
  };

  const handleApplyCoupon = async () => {
    if (!token) {
      toast.info("Please login to apply coupon codes.");
      router.push("/login?redirect=/my-cart");
      return;
    }
    //console.log("Sending coupon code:", couponCode);
    console.log("Cart Products", cartProducts);
    // console.log("122", couponUsed);

    try {
      const response = await getService(`coupon/get/code/${couponCode}`);
      const couponData = response?.data?.data;
      if (response && response.status === 200) {
        if (couponUsed) {
          for (let i = 0; i < couponUsed.length; i++) {
            if (couponUsed[i] === couponData?.couponCode) {
              toast.error("Coupon already used.");
              return;
            }
          }
        }
        if (couponData?.startDate >= currentDate) {
          toast.error("Coupon not active yet.");
          return;
        }

        if (currentDate >= couponData?.endDate) {
          toast.error("Coupon expired.");
          return;
        }

        if (cart?.total_amount < couponData?.minimumOrderValue) {
          toast.error(
            `Minimum Cart Value should be ${couponData?.minimumOrderValue}`,
          );
          return;
        }
        if (
          couponData?.startDate <= currentDate &&
          currentDate <= couponData?.endDate &&
          cart?.total_amount > couponData?.minimumOrderValue
        ) {
          //console.log("checking1")
          if (couponData?.type === "product") {
            if (couponData?.productType === "brand" || couponData?.productType === "category") {
              const productUpdates: any[] = [];

              for (const item of cartProducts ?? []) {
                if (
                  (couponData?.productType === "brand" &&
                    item?.brand === couponData?.brand) ||
                  (couponData?.productType === "category" &&
                    item?.category === couponData?.category)
                ) {
                  const discountedPrice = calculateDiscountedPrice(
                    item,
                    couponData,
                  );
                  productUpdates.push({
                    product: item.product._id,
                    discountPrice: discountedPrice,
                  });
                }
              }

              if (productUpdates.length > 0) {
                await updateCart(
                  productUpdates,
                  couponData?.couponCode,
                  "product",
                  couponData?.noOfUse,
                );
                toast.success("Coupon Applied!");
                await handleCart();
              } else {
                toast.error("No eligible products found for this coupon.");
              }
            } else if (couponData?.productType === "all") {
              const totalOrderValue = cart?.total_amount;

              if (couponData?.discountPercentage) {
                const discountValue =
                  (totalOrderValue * couponData.discountPercentage) / 100;

                let discountedOrderValue;

                if (discountValue > couponData?.maxDiscountCap) {
                  discountedOrderValue =
                    totalOrderValue - couponData?.maxDiscountCap;
                } else {
                  discountedOrderValue = totalOrderValue - discountValue;
                }

                await updateProductTypeAllDiscount(
                  discountedOrderValue,
                  couponData?.couponCode,
                  "all",
                  couponData?.noOfUse,
                  couponData?.discountPercentage,
                  null,
                );
                toast.success("Coupon Applied!");
                await handleCart();
              } else if (couponData?.discountPrice) {
                const discountedOrderValue =
                  totalOrderValue - couponData?.discountPrice;
                await updateProductTypeAllDiscount(
                  discountedOrderValue,
                  couponData?.couponCode,
                  "all",
                  couponData?.noOfUse,
                  null,
                  couponData?.discountPrice,
                );
                toast.success("Coupon Applied!");
                await handleCart();
              }
            } else {
              toast.error("Coupon not applicable for the products in the cart.");
              return;
            }
          }

          if (couponData?.type === "shipping") {
            //console.log("check1")
            if (couponData?.discountPrice) {
              //console.log("check2")
              const shippingDiscountPrice = couponData?.discountPrice;
              await updateShippingDiscount(
                shippingDiscountPrice,
                0,
                couponData?.couponCode,
                "shipping",
                couponData?.noOfUse,
                undefined,
              );
              toast.success("Coupon Applied!");
              await handleCart();
            } else {
              //console.log("check3")
              const shippingDiscountPercentage = couponData?.discountPercentage;
              await updateShippingDiscount(
                0,
                shippingDiscountPercentage,
                couponData?.couponCode,
                "shipping",
                couponData?.maxDiscountCap,
                couponData?.noOfUse,
              );
              toast.success("Coupon Applied!");
              await handleCart();
            }
          }

          if (couponData?.type === "both") {
            //console.log("check1")
            if (couponData?.discountPrice) {
              //console.log("check2")
              const totalDiscountPrice = couponData?.discountPrice;
              await updateAllDiscount(
                totalDiscountPrice,
                0,
                couponData?.couponCode,
                "both",
                couponData?.maxDiscountCap,
                couponData?.noOfUse,
              );
              toast.success("Coupon Applied!");
              await handleCart();
            } else {
              //console.log("check3")
              const totalDiscountPercentage = couponData?.discountPercentage;
              await updateAllDiscount(
                0,
                totalDiscountPercentage,
                couponData?.couponCode,
                "both",
                couponData?.maxDiscountCap,
                couponData?.noOfUse,
              );
              toast.success("Coupon Applied!");
              await handleCart();
            }
          }

          // toast.success("Coupon Applied!");
        } else {
          toast.error("Minimum order value not matched.");
          console.error();
        }
      } else {
        toast.error("Invalid Coupon");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Invalid Coupon");
    }
  };

  const removeCoupon = async () => {
    if (!token) {
      toast.info("Please login to manage coupon codes.");
      router.push("/login?redirect=/my-cart");
      return;
    }
    await removeCouponCode();
    toast.success("Coupon Removed");
    await handleCart();
  };

  const calculateDiscountedPrice = (product, couponData) => {
    //console.log(product);
    let discountedPrice = product.price;

    if (couponData?.discountPercentage) {
      const discountPercentage = couponData?.discountPercentage;
      discountedPrice -= (discountPercentage / 100) * product.price;
    }

    if (couponData?.discountPrice) {
      discountedPrice -= couponData?.discountPrice;
    }

    if (discountedPrice < 0) {
      discountedPrice = 0;
    }

    return discountedPrice;
  };

  let isOutOfStock = false;

  const hasStockIssue = (item) => {
    const priceList = item?.product?.priceList;
    if (!Array.isArray(priceList)) return false;
    return priceList.some(
      (inneritem) =>
        inneritem?.number == item?.packSize &&
        inneritem?.stock_quantity < item?.quantity,
    );
  };

  const checkstocks = () => {
    return (cart?.products || []).some((item) => {
      const out = hasStockIssue(item);
      if (out) isOutOfStock = true;
      return out;
    });
  };

  const stockCheckResult = checkstocks();

  const cartItems = cart?.products || [];
  const cartLoaded = cart !== null && cart !== undefined;
  const isCartEmpty = cartLoaded && cartItems.length === 0;
  const effectiveCartTotal =
    safeNumber(cart?.discount_amount) !== 0
      ? cart?.discount_amount
      : cart?.total_amount;

  return (
    <>
      <Head>
        <title>My Cart | store.prempackaging</title>
        <meta name="title" content="My Cart" />
        <meta
          name="description"
          content="Review and manage your selected packaging items in your cart. Edit quantities, apply discounts, and proceed easily to secure checkout."
        />
      </Head>

      <div className="ct-root">
        <div className="ct-wrap">
          {/* header */}
          <header className="ct-head">
            <div className="ct-head-l">
              <h1 className="ct-title">Your cart</h1>
            </div>
            {cartItems.length > 0 && (
              <div className="ct-head-meta">
                <span className="ct-meta-chip">
                  <i>Items</i>
                  <b>{cartItems.length}</b>
                </span>
                <span className="ct-meta-chip">
                  <i>Weight</i>
                  <b>{Math.ceil(safeNumber(cart?.totalPackWeight))}kg</b>
                </span>
              </div>
            )}
          </header>

          {!cartLoaded ? (
            <div className="ct-boot">
              <span className="ct-boot-bar">
                <i />
              </span>
              <span className="ct-boot-tx">Loading your cart…</span>
            </div>
          ) : isCartEmpty ? (
            <div className="ct-empty">
              <span className="ct-empty-ic" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 8 12 3 3 8l9 5 9-5Z" />
                  <path d="M3 8v8l9 5 9-5V8" />
                  <path d="M12 13v8" />
                </svg>
              </span>
              <h2 className="ct-empty-h">Your cart is empty</h2>
              <p className="ct-empty-p">
                Add packaging supplies to start building your consignment.
              </p>
              <button
                type="button"
                className="ct-cta ct-cta--inline"
                onClick={() => router.push("/")}
              >
                <span>Browse products</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="ct-grid">
              {/* ───────── LEFT: packing list ───────── */}
              <section className="ct-left">
                <div className="ct-list">
                  <div className="ct-list-tape">
                    <span className="ct-list-title">
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <path d="M21 8 12 3 3 8l9 5 9-5Z" />
                        <path d="M3 8v8l9 5 9-5V8" />
                        <path d="M12 13v8" />
                      </svg>
                      Packing list
                    </span>
                    <span className="ct-list-ref">
                      {cartItems.length}{" "}
                      {cartItems.length === 1 ? "line" : "lines"}
                    </span>
                  </div>

                  <div className="ct-list-cols">
                    <span>Item</span>
                    <span>Unit price</span>
                    <span>Quantity</span>
                    <span>Line total</span>
                  </div>

                  <ul className="ct-rows">
                    {cart?.products?.map((item, index) => (
                      <li className="ct-row" key={getCartItemKey(item, index)}>
                        <div className="ct-cell ct-cell-item">
                          <span className="ct-thumb">
                            <img
                              src={
                                item?.product?.images?.[0]?.image ||
                                "/pp_logo_1.png"
                              }
                              alt={item?.product?.name || "Cart product"}
                            />
                          </span>
                          <div className="ct-item-meta">
                            <span className="ct-item-name">
                              {getBrandLabel(item?.product?.brand)}{" "}
                              {item?.product?.name} {item?.product?.model}
                            </span>
                            <span className="ct-item-chips">
                              <span className="ct-chip">
                                <i>Pack</i>
                                <b>{item?.packSize}</b>
                              </span>
                              <span className="ct-chip">
                                <i>Wt</i>
                                <b>
                                  {Math.ceil(safeNumber(item?.totalPackWeight))}
                                  kg
                                </b>
                              </span>
                            </span>
                            {hasStockIssue(item) && (
                              <span className="ct-oos">Out of stock</span>
                            )}
                          </div>
                        </div>

                        <div className="ct-cell ct-cell-price">
                          <span className="ct-cell-l">Unit price</span>
                          <b>₹{formatRounded(item?.price)}</b>
                        </div>

                        <div className="ct-cell ct-cell-qty">
                          <span className="ct-cell-l">Quantity</span>
                          {renderQuantityControl(item, index)}
                        </div>

                        <div className="ct-cell ct-cell-total">
                          <span className="ct-cell-l">Line total</span>
                          <span className="ct-line-amt">
                            {cart?.appliedCoupon &&
                            cart?.couponType === "product" &&
                            item?.discountPrice !== 0 ? (
                              <>
                                <s>
                                  ₹
                                  {formatRounded(item?.price * item?.quantity)}
                                </s>
                                <b className="is-cut">
                                  ₹
                                  {formatRounded(
                                    item?.discountPrice * item?.quantity,
                                  )}
                                </b>
                              </>
                            ) : (
                              <b>
                                ₹{formatRounded(item?.price * item?.quantity)}
                              </b>
                            )}
                          </span>
                          <button
                            type="button"
                            className="ct-del"
                            title="Removing a product removes all its pack sizes and clears applied coupons."
                            style={{
                              opacity:
                                removingId ===
                                String(item?.product?._id || item?.product)
                                  ? 0.4
                                  : 1,
                              pointerEvents:
                                removingId ===
                                String(item?.product?._id || item?.product)
                                  ? "none"
                                  : "auto",
                            }}
                            onClick={() => handleRemoveFromCart(item)}
                            aria-label="Remove item"
                          >
                            <AiFillDelete />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  className="ct-continue"
                  onClick={() => router.push("/")}
                >
                  ← Continue shopping
                </button>
              </section>

              {/* ───────── RIGHT: summary ───────── */}
              <aside className="ct-right">
                <div className="ct-sum">
                  <div className="ct-sum-head">
                    <span className="ct-sum-title">Order summary</span>
                  </div>

                  <div className="ct-sum-body">
                    <dl className="ct-costs">
                      <div className="ct-cost">
                        <dt>Cart value</dt>
                        <dd>
                          {safeNumber(cart?.discount_amount) !== 0 ? (
                            <span className="ct-cut">
                              <s>₹{formatRounded(cart?.total_amount)}</s>
                              <b className="is-cut">
                                ₹{formatRounded(cart?.discount_amount)}
                              </b>
                            </span>
                          ) : (
                            <span>₹{formatRounded(cart?.total_amount)}</span>
                          )}
                        </dd>
                      </div>
                      <div className="ct-cost">
                        <dt>Total weight</dt>
                        <dd>
                          {Math.ceil(safeNumber(cart?.totalPackWeight))} kg
                        </dd>
                      </div>
                    </dl>

                    {/* coupon */}
                    {cart?.appliedCoupon ? (
                      <div className="ct-coupon-on">
                        <span className="ct-coupon-tag">
                          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          {cart?.appliedCouponName}
                        </span>
                        <button
                          type="button"
                          className="ct-coupon-remove"
                          onClick={removeCoupon}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="ct-coupon">
                        <input
                          className="ct-coupon-in"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <button
                          type="button"
                          className="ct-coupon-btn"
                          onClick={handleApplyCoupon}
                        >
                          Apply
                        </button>
                      </div>
                    )}

                    <div className="ct-perf" aria-hidden="true" />

                    <div className="ct-total">
                      <span className="ct-total-label">Cart total</span>
                      <span className="ct-total-amt">
                        ₹{formatRounded(effectiveCartTotal)}
                      </span>
                    </div>
                    <p className="ct-total-note">
                      Shipping &amp; GST are calculated at checkout.
                    </p>

                    {stockCheckResult ? (
                      <div className="ct-sum-oos" role="alert">
                        Some items are out of stock — remove them to continue.
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="ct-cta"
                        onClick={() => {
                          if (cart?.products?.length) {
                            router.push(
                              token
                                ? "/checkoutpage"
                                : "/login?redirect=/checkoutpage",
                            );
                          } else {
                            toast.error("Cart is empty.");
                          }
                        }}
                      >
                        <span>Proceed to checkout</span>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" />
                          <path d="m13 6 6 6-6 6" />
                        </svg>
                      </button>
                    )}

                    <div className="ct-trust">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="4" y="10" width="16" height="11" rx="2" />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>
                      Secure checkout · Razorpay · UPI
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* quantity stepper (renderQuantityControl) */
        .qty-input::-webkit-outer-spin-button,
        .qty-input::-webkit-inner-spin-button {
          margin: 0;
          -webkit-appearance: none;
        }
        .qty-input[type="number"] {
          -moz-appearance: textfield;
        }

        /* ============ packing-list cart ============ */
        .ct-root {
          --ink: #14213d;
          --navy: #182c5a;
          --navy-2: #26407e;
          --signal: #e92227;
          --paper: #ffffff;
          --canvas: #eceef2;
          --line: #e4e7ec;
          --line-2: #eef1f4;
          --mut: #667085;
          --mut-2: #98a2b3;
          --kraft: #efe6d2;
          --kraft-line: #d8c5a0;
          --ok: #1f8a55;
          --disp: "Montserrat", sans-serif;
          --ui: "Montserrat", sans-serif;
          --mono: ui-monospace, "SFMono-Regular", "Cascadia Mono", Menlo,
            "Roboto Mono", monospace;

          font-family: var(--ui);
          color: var(--ink);
          background-color: var(--canvas);
          background-image: radial-gradient(
            circle,
            rgba(20, 33, 61, 0.045) 1px,
            transparent 1px
          );
          background-size: 22px 22px;
          padding: 30px 0 56px;
          -webkit-font-smoothing: antialiased;
        }
        .ct-wrap {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 28px;
        }

        .ct-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 26px;
          animation: ct-rise 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both;
        }
        .ct-title {
          font-family: var(--disp);
          font-size: 34px;
          font-weight: 800;
          letter-spacing: -0.01em;
          line-height: 1;
          margin: 0;
          color: var(--ink);
        }
        .ct-head-meta {
          display: flex;
          gap: 10px;
        }
        .ct-meta-chip {
          display: inline-flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          padding: 8px 13px;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 11px;
        }
        .ct-meta-chip i {
          font-style: normal;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--mut-2);
        }
        .ct-meta-chip b {
          font-family: var(--mono);
          font-size: 16px;
          font-weight: 700;
          color: var(--navy);
        }

        /* loading / empty */
        .ct-boot {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 90px 0;
        }
        .ct-boot-bar {
          width: 160px;
          height: 3px;
          border-radius: 99px;
          background: #dfe3ea;
          overflow: hidden;
        }
        .ct-boot-bar i {
          display: block;
          height: 100%;
          width: 40%;
          border-radius: 99px;
          background: var(--navy);
          animation: ct-load 1.1s ease-in-out infinite;
        }
        .ct-boot-tx {
          font-size: 13px;
          color: var(--mut);
        }
        @keyframes ct-load {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(320%);
          }
        }
        .ct-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
          padding: 70px 24px 80px;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 18px;
          box-shadow: 0 18px 50px rgba(20, 33, 61, 0.06);
        }
        .ct-empty-ic {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: var(--kraft);
          color: var(--navy);
          margin-bottom: 10px;
        }
        .ct-empty-h {
          font-family: var(--disp);
          font-size: 22px;
          font-weight: 800;
          margin: 0;
          color: var(--ink);
        }
        .ct-empty-p {
          font-size: 14px;
          color: var(--mut);
          margin: 0 0 10px;
        }

        /* ---- layout ---- */
        .ct-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 372px;
          gap: 28px;
          align-items: start;
        }

        /* ---- packing list ---- */
        .ct-list {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 14px 40px rgba(20, 33, 61, 0.06);
          animation: ct-rise 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) 0.05s both;
        }
        .ct-list-tape {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 20px;
          background: var(--kraft);
          border-bottom: 1px dashed var(--kraft-line);
          background-image: repeating-linear-gradient(
            -45deg,
            rgba(216, 197, 160, 0.18) 0,
            rgba(216, 197, 160, 0.18) 1px,
            transparent 1px,
            transparent 9px
          );
        }
        .ct-list-title {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--disp);
          font-size: 13.5px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--ink);
        }
        .ct-list-ref {
          font-family: var(--mono);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #8a7a55;
        }
        .ct-list-cols {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 110px 132px 132px;
          gap: 16px;
          align-items: center;
          padding: 14px 22px;
          border-bottom: 1px solid var(--line);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--mut-2);
        }
        .ct-list-cols span:nth-child(2),
        .ct-list-cols span:nth-child(3) {
          text-align: center;
        }
        .ct-list-cols span:nth-child(4) {
          text-align: right;
        }
        .ct-rows {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .ct-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 110px 132px 132px;
          gap: 16px;
          align-items: center;
          padding: 16px 22px;
          border-bottom: 1px solid var(--line-2);
        }
        .ct-row:last-child {
          border-bottom: 0;
        }
        .ct-cell {
          min-width: 0;
        }
        .ct-cell-l {
          display: none;
        }
        .ct-cell-item {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .ct-thumb {
          width: 60px;
          height: 60px;
          flex-shrink: 0;
          border: 1px solid var(--line);
          border-radius: 11px;
          background: #f7f8fa;
          padding: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ct-thumb img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .ct-item-meta {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ct-item-name {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.35;
          color: var(--ink);
          text-transform: capitalize;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ct-item-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .ct-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px 3px 6px;
          background: #f4f6f9;
          border: 1px solid var(--line-2);
          border-radius: 7px;
        }
        .ct-chip i {
          font-family: var(--mono);
          font-style: normal;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--mut-2);
        }
        .ct-chip b {
          font-family: var(--mono);
          font-size: 11.5px;
          font-weight: 600;
          color: var(--ink);
        }
        .ct-oos {
          align-self: flex-start;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--signal);
          background: #fdf0f0;
          border: 1px solid #f7d4d5;
          border-radius: 6px;
          padding: 2px 7px;
        }
        .ct-cell-price {
          text-align: center;
          font-family: var(--mono);
          font-size: 13.5px;
          font-weight: 700;
          color: var(--ink);
        }
        .ct-cell-qty {
          display: flex;
          justify-content: center;
        }
        .ct-cell-total {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
        }
        .ct-line-amt {
          display: inline-flex;
          flex-direction: column;
          align-items: flex-end;
          font-family: var(--mono);
          text-align: right;
        }
        .ct-line-amt b {
          font-size: 14px;
          font-weight: 700;
          color: var(--ink);
        }
        .ct-line-amt s {
          font-size: 11px;
          color: var(--mut-2);
        }
        .ct-line-amt .is-cut {
          color: var(--signal);
        }
        .ct-del {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          border: 1px solid var(--line);
          border-radius: 9px;
          background: #fff;
          color: var(--mut-2);
          font-size: 16px;
          cursor: pointer;
          transition:
            color 0.15s ease,
            border-color 0.15s ease,
            background 0.15s ease;
        }
        .ct-del:hover {
          color: var(--signal);
          border-color: #f3c9ca;
          background: #fdf2f2;
        }

        .ct-continue {
          margin-top: 18px;
          font-family: var(--ui);
          font-size: 13.5px;
          font-weight: 600;
          color: var(--ink);
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 11px 18px;
          cursor: pointer;
          transition:
            border-color 0.15s ease,
            color 0.15s ease;
        }
        .ct-continue:hover {
          border-color: var(--navy);
          color: var(--navy);
        }

        /* ---- summary ---- */
        .ct-right {
          position: sticky;
          top: 24px;
          animation: ct-rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) 0.1s both;
        }
        .ct-sum {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 18px 50px rgba(20, 33, 61, 0.08);
        }
        .ct-sum-head {
          padding: 16px 20px;
          border-bottom: 1px solid var(--line);
        }
        .ct-sum-title {
          font-family: var(--disp);
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: var(--ink);
        }
        .ct-sum-body {
          padding: 20px;
        }
        .ct-costs {
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ct-cost {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .ct-cost dt {
          font-size: 13px;
          color: var(--mut);
          font-weight: 500;
        }
        .ct-cost dd {
          margin: 0;
          font-family: var(--mono);
          font-size: 13.5px;
          font-weight: 700;
          color: var(--ink);
        }
        .ct-cut {
          display: inline-flex;
          align-items: baseline;
          gap: 7px;
        }
        .ct-cut s {
          font-size: 11.5px;
          font-weight: 500;
          color: var(--mut-2);
        }
        .ct-cut .is-cut {
          color: var(--signal);
        }

        /* coupon */
        .ct-coupon {
          display: flex;
          gap: 9px;
          margin-top: 16px;
        }
        .ct-coupon-in {
          flex: 1;
          min-width: 0;
          height: 46px;
          padding: 0 14px;
          font-family: var(--mono);
          font-size: 13px;
          letter-spacing: 0.04em;
          color: var(--ink);
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 10px;
          text-transform: uppercase;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }
        .ct-coupon-in::placeholder {
          text-transform: none;
          letter-spacing: 0;
          color: var(--mut-2);
        }
        .ct-coupon-in:focus {
          outline: none;
          border-color: var(--navy);
          box-shadow: 0 0 0 3px rgba(24, 44, 90, 0.13);
        }
        .ct-coupon-btn {
          flex-shrink: 0;
          height: 46px;
          padding: 0 18px;
          font-family: var(--ui);
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          background: var(--navy);
          border: 0;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.18s ease;
        }
        .ct-coupon-btn:hover {
          background: var(--signal);
        }
        .ct-coupon-on {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 16px;
          padding: 11px 14px;
          background: #edf7f1;
          border: 1px solid #c8e6d5;
          border-radius: 11px;
        }
        .ct-coupon-tag {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-family: var(--mono);
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--ok);
        }
        .ct-coupon-remove {
          font-family: var(--ui);
          font-size: 12px;
          font-weight: 700;
          color: var(--mut);
          background: none;
          border: 0;
          padding: 0;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .ct-coupon-remove:hover {
          color: var(--signal);
        }

        /* perforation */
        .ct-perf {
          position: relative;
          height: 0;
          margin: 20px -20px;
          border-top: 2px dashed var(--line);
        }
        .ct-perf::before,
        .ct-perf::after {
          content: "";
          position: absolute;
          top: -9px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--canvas);
          border: 1px solid var(--line);
        }
        .ct-perf::before {
          left: -8px;
        }
        .ct-perf::after {
          right: -8px;
        }

        /* total stamp */
        .ct-total {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
        }
        .ct-total-label {
          font-family: var(--disp);
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--ink);
        }
        .ct-total-amt {
          position: relative;
          font-family: var(--disp);
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: var(--navy);
          line-height: 1;
          padding-bottom: 5px;
        }
        .ct-total-amt::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 3px;
          border-radius: 2px;
          background: var(--signal);
        }
        .ct-total-note {
          margin: 9px 0 0;
          font-size: 11.5px;
          color: var(--mut);
        }

        /* CTA */
        .ct-cta {
          margin-top: 18px;
          width: 100%;
          height: 54px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-family: var(--disp);
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: #fff;
          background: var(--navy);
          border: 0;
          border-radius: 13px;
          cursor: pointer;
          box-shadow: 0 12px 26px rgba(24, 44, 90, 0.26);
          transition:
            background 0.18s ease,
            transform 0.12s ease,
            box-shadow 0.18s ease;
        }
        .ct-cta :global(svg) {
          transition: transform 0.18s ease;
        }
        .ct-cta:hover {
          background: var(--signal);
          box-shadow: 0 14px 30px rgba(233, 34, 39, 0.28);
        }
        .ct-cta:hover :global(svg) {
          transform: translateX(4px);
        }
        .ct-cta:active {
          transform: scale(0.985);
        }
        .ct-cta--inline {
          width: auto;
          padding: 0 26px;
          margin-top: 6px;
        }
        .ct-sum-oos {
          margin-top: 18px;
          padding: 14px;
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          color: var(--signal);
          background: #fdf0f0;
          border: 1px solid #f7d4d5;
          border-radius: 12px;
        }
        .ct-trust {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--mut);
        }

        @keyframes ct-rise {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ============ responsive ============ */
        @media (max-width: 980px) {
          .ct-grid {
            grid-template-columns: 1fr;
            gap: 22px;
          }
          .ct-right {
            position: static;
            top: auto;
          }
        }

        @media (max-width: 760px) {
          .ct-wrap {
            padding: 0 16px;
          }
          .ct-title {
            font-size: 28px;
          }
          .ct-list-cols {
            display: none;
          }
          .ct-row {
            grid-template-columns: 1fr;
            gap: 14px;
            padding: 16px;
            border: 1px solid var(--line);
            border-radius: 13px;
            margin: 14px;
          }
          .ct-cell-l {
            display: inline;
            font-size: 12px;
            font-weight: 600;
            color: var(--mut);
          }
          .ct-cell-price,
          .ct-cell-qty,
          .ct-cell-total {
            display: flex;
            align-items: center;
            justify-content: space-between;
            text-align: left;
          }
          .ct-cell-price {
            border-top: 1px solid var(--line-2);
            padding-top: 12px;
          }
          .ct-cell-total {
            gap: 14px;
          }
          .ct-line-amt {
            margin-left: auto;
          }
        }

        @media (max-width: 480px) {
          .ct-head {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ct-root * {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>
    </>
  );
};

export default Cartpage;
