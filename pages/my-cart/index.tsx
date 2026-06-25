"use client"; // This is a client component 👈🏽
import React from "react";
import Link from "next/link";
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
  const [token, setToken] = useState(null);
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [cartProducts, setCartProducts] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [dataCoupon, setCouponData] = useState(null);  const [couponUsed, setCouponUsed] = useState([]);
  const currentDate = new Date().toISOString();
  const [removingId, setRemovingId] = useState(null);
  const [updatingQuantityKey, setUpdatingQuantityKey] = useState(null);

  const getUser = async () => {
    const User = JSON.parse(localStorage.getItem("PIUser"));
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
    // console.log(dataCoupon)
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
          className="qty-input tw-w-12 tw-h-full tw-border-0 tw-border-l-[1px] tw-border-r-[1px] tw-border-solid tw-border-[#c7c7c7] tw-text-center tw-text-base tw-font-semibold disabled:tw-bg-[#f5f5f5]"
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
      setCouponData(couponData);

      if (response.status === 200) {
        //console.log("Coupon Data:", dataCoupon);
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
            const productUpdates = [];

            cartProducts?.forEach(async (item) => {
              if (
                // Check if product type is BRAND or CATEGORY
                (couponData?.productType === "brand" &&
                  item?.brand === couponData?.brand) ||
                (couponData?.productType === "category" &&
                  item?.category === couponData?.category)
              ) {
                // console.log("check1");
                const discountedPrice = calculateDiscountedPrice(
                  item,
                  couponData,
                );
                productUpdates.push({
                  product: item.product._id,
                  discountPrice: discountedPrice,
                });

                await updateCart(
                  productUpdates,
                  couponData?.couponCode,
                  "product",
                  couponData?.noOfUse,
                ); // Send all product updates to updateCart function
                toast.success("Coupon Applied!");
                await handleCart();
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
                  );
                  toast.success("Coupon Applied!");
                  await handleCart();
                  // console.log(discountedOrderValue);
                } else if (couponData?.discountPrice) {
                  const discountedOrderValue =
                    totalOrderValue - couponData?.discountPrice;
                  await updateProductTypeAllDiscount(
                    discountedOrderValue,
                    couponData?.couponCode,
                    "all",
                    couponData?.noOfUse,
                  );
                  toast.success("Coupon Applied!");
                  await handleCart();
                  // console.log(discountedOrderValue);
                }

                // Optionally reload the page after applying the discount
                // window.location.reload();
              } else {
                // console.log("check3");
                toast.error(
                  "Coupon not applicable for the products in the cart. ",
                );
                return;
              }
            });
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
      <div>
        <div className="row mt-5">
          <div className="row tw-px-[120px] max-[900px]:tw-px-1 tw-bg-white">
            <div className="mt-2 mx-0 tw-flex tw-flex-col max-[900px]:tw-hidden">
              <p className="tw-text-[#222] tw-font-montserrat tw-text-[15px] tw-font-medium tw-leading-[21px] tw-underline tw-p-0 tw-m-0">
                {" "}
                <Link
                  href="/"
                  style={{ textDecoration: "none", color: "black" }}
                >
                  Homepage{" "}
                </Link>
                / My Cart
              </p>
            </div>
            <p
              className="max-[900px]:tw-hidden"
              style={{
                color: "#182C5A",
                fontSize: "40px",
                fontStyle: "normal",
                fontWeight: "750",
                lineHeight: "54px",
                letterSpacing: "1.08px",
                textTransform: "uppercase",
                textAlign: "center",
                marginBottom: "30px",
              }}
            >
              YOUR SHOPPING CART
            </p>
            {/* 2-COLUMN LAYOUT START */}
            <div className="row mt-4 gy-4 mx-0">
              {/* LEFT COLUMN: PRODUCTS LIST */}
              <div className="col-12 col-lg-8 px-0 pe-lg-3">
                <div className="cart-products-card p-4 bg-white mb-4">
                  {/* Desktop header */}
                  <div
                    className="row mx-0 pb-3 border-bottom max-[900px]:tw-hidden"
                    style={{ fontWeight: "bold" }}
                  >
                    <div className="col-5">Product</div>
                    <div className="col-2 text-center">Price</div>
                    <div className="col-3 text-center">Quantity</div>
                    <div className="col-2 text-end">Subtotal</div>
                  </div>

                  {cart?.products?.map((item, index) => {
                    return (
                      <div
                        className="row py-3 mx-0 border-bottom align-items-center max-[900px]:tw-hidden"
                        key={getCartItemKey(item, index)}
                      >
                        <div className="col-5 d-flex justify-content-start align-items-center">
                          <img
                            src={item?.product?.images?.[0]?.image || "/pp_logo_1.png"}
                            alt={item?.product?.name || "Cart product"}
                            width="74px"
                            height="59px"
                            style={{ objectFit: "contain", marginRight: "12px" }}
                          />
                          <div>
                            <p
                              className="m-0"
                              style={{
                                color: "#000",
                                fontSize: "16px",
                                fontStyle: "normal",
                                fontWeight: "700",
                                lineHeight: "22px",
                                textTransform: "capitalize",
                              }}
                            >
                              {getBrandLabel(item?.product?.brand)} {item?.product?.name} {item?.product?.model}
                            </p>
                            <span className="text-muted fw-normal" style={{ fontSize: "13px" }}>
                              Pack Size: {item?.packSize} | Weight: {Math.ceil(safeNumber(item?.totalPackWeight))}kg
                            </span>
                            {hasStockIssue(item) && (
                              <p className="text-danger m-0 mt-1" style={{ fontSize: "12px" }}>
                                Out of Stock
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="col-2 text-center">
                          <p className="m-0">₹{formatRounded(item?.price)}</p>
                        </div>

                        <div className="col-3 d-flex justify-content-center align-items-center">
                          {renderQuantityControl(item, index)}
                        </div>

                        <div className="col-2 d-flex justify-content-end align-items-center">
                          <p className="m-0" style={{ fontWeight: "700" }}>
                            ₹
                            {cart?.appliedCoupon &&
                            cart?.couponType === "product" &&
                            item?.discountPrice !== 0 ? (
                              <>
                                <s className="text-muted me-1">
                                  {formatRounded(item?.price * item?.quantity)}
                                </s>
                                <span className="text-success fw-bold">
                                  {formatRounded(item?.discountPrice * item?.quantity)}
                                </span>
                              </>
                            ) : (
                              <>{formatRounded(item?.price * item?.quantity)}</>
                            )}
                          </p>
                          <i
                            className="ms-3"
                            style={{
                              color: "red",
                              fontSize: "18px",
                              cursor: "pointer",
                              opacity: removingId === String(item?.product?._id || item?.product) ? 0.4 : 1,
                              pointerEvents:
                                removingId === String(item?.product?._id || item?.product) ? "none" : "auto",
                              marginLeft: "15px",
                            }}
                            title="Removing a product removes all its pack sizes and clears applied coupons."
                            onClick={() => handleRemoveFromCart(item)}
                          >
                            <AiFillDelete />
                          </i>
                        </div>
                      </div>
                    );
                  })}

                  {/* only for mobileview */}
                  <div className="container-fluid bg-white mt-3 py-3 mx-0 tw-hidden max-[900px]:tw-block">
                    <div className="row mt-3 d-flex justify-content-center align-items-center">
                      <p
                        className="p-0 m-0"
                        style={{
                          width: "fit-content",
                          color: "#000",
                          fontFamily: "Montserrat",
                          fontSize: "24px",
                          fontWeight: "700",
                          lineHeight: "30px",
                        }}
                      >
                        Your Shopping Cart
                      </p>
                    </div>
                    <div
                      className="row mt-3"
                      style={{ height: "1px", backgroundColor: "#EBEBEB" }}
                    ></div>
                    <div className="row py-3">
                      {cart?.products?.map((item, index) => {
                        return (
                          <React.Fragment key={getCartItemKey(item, index)}>
                            <div className="col-3 d-flex flex-column justify-content-center align-items-center">
                              <img
                                src={item?.product?.images?.[0]?.image || "/pp_logo_1.png"}
                                alt={item?.product?.name || "Cart product"}
                                width="74px"
                                height="59px"
                                style={{ objectFit: "contain" }}
                              />
                            </div>
                            <div className="col-9 py-2 d-flex flex-column justify-content-start align-items-start">
                              <div className="d-flex flex-row justify-content-between align-items-start w-100">
                                <p
                                  className="m-0"
                                  style={{
                                    textAlign: "start",
                                    width: "168px",
                                    color: "#000",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    lineHeight: "18px",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {getBrandLabel(item?.product?.brand)} {item?.product?.name} {item?.product?.model}
                                </p>
                                <p
                                  className="m-0"
                                  style={{
                                    color: "#000",
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    lineHeight: "18px",
                                  }}
                                >
                                  ₹{formatRounded(item?.price * item?.quantity)}
                                </p>
                              </div>
                              <div className="mt-3 py-1 d-flex flex-row justify-content-start align-items-center w-100">
                                {renderQuantityControl(item, index, true)}

                                <div
                                  className="h-100 mx-3"
                                  style={{ borderLeft: "2px solid #D9D9D9", height: "24px" }}
                                ></div>
                                <p className="m-0" style={{ fontSize: "13px" }}>
                                  {Math.ceil(safeNumber(item?.totalPackWeight))}kg
                                </p>

                                <div
                                  className="h-100 mx-3"
                                  style={{ borderLeft: "2px solid #D9D9D9", height: "24px" }}
                                ></div>
                                <p
                                  className="m-0"
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    color: "#E92227",
                                    cursor:
                                      removingId === String(item?.product?._id || item?.product)
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity:
                                      removingId === String(item?.product?._id || item?.product) ? 0.4 : 1,
                                  }}
                                  onClick={() => handleRemoveFromCart(item)}
                                >
                                  Delete
                                </p>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>

                    <div
                      className="row mt-3"
                      style={{ height: "1px", backgroundColor: "#EBEBEB" }}
                    ></div>
                    <div className="row py-3">
                      <div className="col-8 d-flex justify-content-start align-items-center">
                        <p
                          className="m-0"
                          style={{
                            color: "#000",
                            fontSize: "16px",
                            fontWeight: "600",
                          }}
                        >
                          Subtotal ({cart?.products?.length ? cart?.products?.length : 0} items):
                        </p>
                      </div>
                      <div className="col-4 d-flex justify-content-end align-items-center">
                        <p
                          className="m-0"
                          style={{
                            color: "#000",
                            fontSize: "20px",
                            fontWeight: "600",
                          }}
                        >
                          ₹{formatRounded(cart?.total_amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 d-flex justify-content-start max-[900px]:tw-hidden">
                  <button
                    className="btn btn-outline-secondary px-4 py-2"
                    style={{
                      borderRadius: "4px",
                      border: "1px solid rgba(0, 0, 0, 0.3)",
                      fontSize: "16px",
                      fontWeight: "500",
                    }}
                    onClick={() => router.push("/")}
                  >
                    Back to Shop
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: COUPON & TOTALS */}
              <div className="col-12 col-lg-4 px-0 ps-lg-3">
                {/* Cart Total Card */}
                <div className="cart-card d-flex flex-column mb-4">
                  <h4 className="cart-card-title mb-4 text-center">Cart Total</h4>
                  
                  <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                    <span className="cart-total-label">Total Cart Value :</span>
                    <span className="cart-total-value">
                      {safeNumber(cart?.discount_amount) !== 0 ? (
                        <>
                          <s className="text-muted me-2" style={{ marginRight: "10px" }}>₹{formatRounded(cart?.total_amount)}</s>
                          <span className="text-success fw-bold fs-5">
                            ₹{formatRounded(cart?.discount_amount)}
                          </span>
                        </>
                      ) : (
                        <span className="fw-bold fs-5">
                          ₹{formatRounded(cart?.total_amount)}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center py-3 border-bottom mb-4">
                    <span className="cart-total-label">Total Cart Weight :</span>
                    <span className="cart-total-value fw-bold fs-5">
                      {Math.ceil(safeNumber(cart?.totalPackWeight))} kg
                    </span>
                  </div>

                  <div className="d-flex justify-content-center align-items-center mt-auto">
                    {stockCheckResult ? (
                      <p className="text-danger m-0 text-center">
                        Some Items are out of stock, Cannot Place Order!
                      </p>
                    ) : (
                      <button
                        className="btn btn-checkout w-100 py-3 fw-bold"
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
                        Proceed to checkout
                      </button>
                    )}
                  </div>
                </div>

                {/* Coupon Code Card */}
                <div className="cart-card d-flex flex-column">
                  <h4 className="cart-card-title mb-3">COUPON CODE</h4>
                  <div className="d-flex flex-column align-items-stretch gap-2">
                    <input
                      placeholder={
                        cart?.appliedCoupon
                          ? cart?.appliedCouponName
                          : "Enter Coupon Code"
                      }
                      className="form-control cart-coupon-input"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={Boolean(cart?.appliedCoupon)}
                      style={cart?.appliedCoupon ? { opacity: 0.6 } : {}}
                    />
                    <button
                      className="btn cart-coupon-btn w-100"
                      onClick={cart?.appliedCoupon ? removeCoupon : handleApplyCoupon}
                    >
                      {cart?.appliedCoupon ? "Remove Coupon" : "Apply Coupon Code"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
       <style jsx>{`
        .qty-input::-webkit-outer-spin-button,
        .qty-input::-webkit-inner-spin-button {
          margin: 0;
          -webkit-appearance: none;
        }
        .qty-input[type="number"] {
          -moz-appearance: textfield;
        }
        .cart-card {
          background-color: #fff;
          border-radius: 12px;
          border: 1px solid #ebebeb;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          padding: 32px !important;
        }
        .cart-card-title {
          color: #182C5A;
          font-size: 24px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .cart-coupon-input {
          height: 50px;
          border: 1px solid #c7c7c7;
          border-radius: 6px;
          font-size: 16px;
          padding: 10px 16px;
          width: 100%;
        }
        .cart-coupon-btn {
          height: 50px;
          background-color: #182c5a;
          color: #fff;
          border-radius: 6px;
          border: 0;
          font-weight: 600;
          padding: 0 24px;
          transition: background-color 0.2s ease;
        }
        .cart-coupon-btn:hover {
          background-color: #e92227;
          color: #fff;
        }
        .cart-total-label {
          font-size: 18px;
          font-weight: 500;
          color: #555;
        }
        .cart-total-value {
          font-size: 18px;
        }
        .btn-checkout {
          background-color: #182c5a;
          color: #fff;
          border-radius: 6px;
          border: 0;
          font-size: 16px;
          transition: background-color 0.2s ease;
        }
        .btn-checkout:hover {
          background-color: #e92227;
          color: #fff;
        }
        @media (max-width: 767px) {
          .cart-card {
            padding: 20px !important;
          }
          .cart-card-title {
            font-size: 20px;
            margin-bottom: 16px !important;
          }
        }
      `}</style>
    </>
  );
};

export default Cartpage;


