"use client"; // This is a client component 👈🏽
import React, { useState, useEffect, useRef } from "react";
import {
  alterQuantity,
  getCart,
  removeFromCart,
  updateCart,
  updateShippingDiscount,
  updateAllDiscount,
  updateProductTypeAllDiscount,
  removeCouponCode,
  emptyCart,
} from "../../utils/cart";
import { getService, postService, putService } from "../../services/service";
import { useBrands } from "../../context/BrandContext";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import AddressModal from "../../modals/AddressModal";
import { addDays } from "date-fns";

import {
  FiShield,
  FiTruck,
  FiHeadphones,
  FiInfo,
  FiCheckCircle,
  FiLock,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiPhone,
  FiPlus,
  FiChevronDown,
  FiChevronUp,
  FiFileText,
} from "react-icons/fi";
import { getProductSpecification, getProductImageSrc } from "../../utils/productCatalog";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const safeNumber = (value: any, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const formatRounded = (value: any) => Math.round(safeNumber(value));

const getBrandLabel = (brand: any, brandNameById: Record<string, string> = {}) => {
  if (!brand) return "";
  if (typeof brand === "object") {
    return (
      brand?.name ||
      brand?.brand_name ||
      brand?.slug ||
      brandNameById[brand?._id] ||
      ""
    );
  }
  return brandNameById[String(brand)] || "";
};

const getCartItemKey = (item: any, index: number) => {
  const product = item?.product;
  const productId =
    product && typeof product === "object"
      ? product?._id || product?.id
      : product;
  return `${productId || item?._id || "cart-item"}-${item?.packSize || index}`;
};

const getLineStock = (item: any) => {
  const priceList = item?.product?.priceList;
  const selectedPrice = Array.isArray(priceList)
    ? priceList.find((price) => String(price?.number) === String(item?.packSize))
    : null;
  const stock = selectedPrice?.stock_quantity ?? item?.stock;
  const numericStock = Number(stock);
  return Number.isFinite(numericStock) ? numericStock : null;
};

const getLineQuantity = (item: any) => Math.max(1, safeNumber(item?.quantity, 1));

const Cartpage = () => {
  const { brandNameById } = useBrands();
  const router = useRouter();
  
  // Step State
  // 1: Cart View
  // 2: Checkout View
  const [step, setStep] = useState(1);

  // Common Cart States
  const [token, setToken] = useState<string | null>(null);
  const [cart, setCart] = useState<any>(null);
  const [cartProducts, setCartProducts] = useState<any[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponUsed, setCouponUsed] = useState<any[]>([]);
  const currentDate = new Date().toISOString();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingQuantityKey, setUpdatingQuantityKey] = useState<string | null>(null);

  // Consolidated Checkout States
  const [userAddresss, setUserAddresss] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);
  const [expressShip, setExpressShip] = useState(false);
  const [pincode, setPincode] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [originalShippingCost, setOriginalShippingCost] = useState(0);
  const [radiobtn, setRadiobtn] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [address, setAddress] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isGstAccordionOpen, setIsGstAccordionOpen] = useState(false);

  // Pincode already saved on the currently selected delivery address. When this
  // exists we never ask the customer to re-enter it.
  const currentAddressPincode = String(
    userAddresss?.[selectedIndex]?.pincode || "",
  );
  const hasSavedPincode = currentAddressPincode.length === 6;

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  const getUser = async () => {
    const userStr = localStorage.getItem("PIUser");
    if (!userStr) return;
    const User = JSON.parse(userStr);
    const user = await getService(`getuser/${User?._id}`);
    if (user?.data?.success) {
      setCouponUsed(user?.data?.data?.couponUsed);
      const contactAddress = user?.data?.data?.contact_address;
      setUserAddresss(Array.isArray(contactAddress) ? contactAddress : []);
    }
  };

  const handleCart = async () => {
    const c = await getCart();
    if (c !== null) {
      setCart(c);
      setCartProducts(c?.products);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("PIToken");
    setToken(token);
    handleCart();
    if (token) {
      getUser();
    }
  }, []);

  useEffect(() => {
    if (router.query.step === "shipping" && token) {
      setStep(2);
    }
  }, [router.query.step, token]);

  // Auto-fill the delivery pincode from the selected address so the customer
  // never has to re-type a pincode they've already saved. Re-syncs when they
  // switch address; shipping is recalculated silently to avoid a toast on load.
  useEffect(() => {
    if (hasSavedPincode) {
      setPincode(currentAddressPincode);
      calculateFinalShipCost(currentAddressPincode, expressShip, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, userAddresss]);

  const getProductId = (item: any) => {
    const pid = item?.product;
    if (pid && typeof pid === "object") {
      return pid?._id || pid?.id || pid?.toString?.();
    }
    return pid || item?._id || null;
  };

  const handleAlter = async (item: any, value: any, index: number) => {
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

  const handleRemoveFromCart = async (item: any) => {
    if (!cart?.products?.length) {
      toast.info("Your cart is already empty.");
      return;
    }
    const productId = getProductId(item);
    if (!productId) {
      toast.error("Unable to remove item. Missing product id.");
      return;
    }
    if (removingId) return;
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
            if (couponData?.discountPrice) {
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
            if (couponData?.discountPrice) {
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
        } else {
          toast.error("Minimum order value not matched.");
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

  const calculateDiscountedPrice = (product: any, couponData: any) => {
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

  const hasStockIssue = (item: any) => {
    const priceList = item?.product?.priceList;
    if (!Array.isArray(priceList)) return false;
    return priceList.some(
      (inneritem) =>
        inneritem?.number == item?.packSize &&
        inneritem?.stock_quantity < item?.quantity,
    );
  };

  const checkstocks = () => {
    return (cart?.products || []).some((item: any) => hasStockIssue(item));
  };

  const getProductGstRate = (item: any) => {
    const product = item?.product || {};

    // Convert a raw GST value to a percentage number (0.18 -> 18, 18 -> 18),
    // or undefined when it isn't a usable rate so resolution can fall through.
    const toPercent = (val: any) => {
      if (val === undefined || val === null || val === "") return undefined;
      const rate = Number(val);
      if (!Number.isFinite(rate) || rate < 0) return undefined;
      return rate > 0 && rate <= 1 ? rate * 100 : rate;
    };

    const fromObject = (value: any) =>
      value && typeof value === "object" ? toPercent(value?.gst) : undefined;

    // Product's own GST wins, then sub_category, then category, then 18%.
    // Mirrors resolveGstRate() in utils/overviewFields.ts and the backend
    // gst-calculator, so each product is charged/shown at its own rate.
    return (
      toPercent(product?.gst) ??
      toPercent(item?.gst) ??
      fromObject(product?.sub_category) ??
      fromObject(product?.category) ??
      fromObject(item?.sub_category) ??
      fromObject(item?.category) ??
      18
    );
  };

  const calculateCartGst = () => {
    if (!cartProducts?.length) return 0;
    const productSubtotal = cartProducts.reduce(
      (sum, item) => sum + (Number(item?.price) || 0) * (Number(item?.quantity) || 0),
      0
    );
    let productScale = 1;
    if (Number(cart?.discount_amount) !== 0 && productSubtotal > 0) {
      productScale = Number(cart?.discount_amount) / productSubtotal;
    }
    
    return cartProducts.reduce((sum, item) => {
      const lineTotal = (Number(item?.price) || 0) * (Number(item?.quantity) || 0);
      const gstRate = getProductGstRate(item);
      return sum + (lineTotal * productScale * gstRate) / 100;
    }, 0);
  };

  const getGstBreakdown = () => {
    if (!cartProducts?.length) return [];
    const productSubtotal = cartProducts.reduce(
      (sum, item) => sum + (Number(item?.price) || 0) * (Number(item?.quantity) || 0),
      0
    );
    let productScale = 1;
    if (Number(cart?.discount_amount) !== 0 && productSubtotal > 0) {
      productScale = Number(cart?.discount_amount) / productSubtotal;
    }
    return cartProducts.map((item) => {
      const lineTotal = (Number(item?.price) || 0) * (Number(item?.quantity) || 0);
      const gstRate = getProductGstRate(item);
      const scaledSelling = lineTotal * productScale;
      const gstAmount = (scaledSelling * gstRate) / 100;
      const brandName = getBrandLabel(item?.product?.brand, brandNameById);
      const formattedBrand = formatBrandName(brandName);
      const productName = item?.product?.name || "";
      const fullName = [formattedBrand, productName].filter(Boolean).join(" ");
      return {
        name: fullName,
        rate: gstRate,
        amount: gstAmount,
      };
    });
  };

  // Per-line breakdown so every cart row can show: Selling price + GST = Total
  const getLineBreakdown = (item: any) => {
    const isProductCoupon =
      !!cart?.appliedCoupon &&
      cart?.couponType === "product" &&
      Number(item?.discountPrice) !== 0;
    const quantity = Number(item?.quantity) || 0;
    const originalSelling = (Number(item?.price) || 0) * quantity;
    const unitPrice = isProductCoupon
      ? Number(item?.discountPrice)
      : Number(item?.price);
    const selling = (Number.isFinite(unitPrice) ? unitPrice : 0) * quantity;
    const gstRate = getProductGstRate(item);
    const gstAmount = (selling * gstRate) / 100;
    return {
      isProductCoupon,
      originalSelling,
      selling,
      gstRate,
      gstAmount,
      total: selling + gstAmount,
    };
  };

  const getProductDetailsLines = (item: any) => {
    const spec = getProductSpecification(item?.product);
    const lines: string[] = [];

    const size = spec.size || spec.size_inch || spec.size_mm || (spec.width && spec.length ? `${spec.width} X ${spec.length}` : "");
    const core = spec.core_size ? `${spec.core_size}` : "";
    const thickness = spec.thickness_micron ? `${spec.thickness_micron} Microns` : spec.thickness ? `${spec.thickness}` : "";
    const material = spec.material ? `${spec.material}` : "";
    const ply = spec.ply ? `${spec.ply}` : "";
    const labelInRoll = spec.label_in_roll ? `${spec.label_in_roll} Labels` : "";

    const catName = String(item?.product?.category?.name || "").toLowerCase();
    
    if (catName.includes("tape")) {
      const line1 = [spec.width, spec.length, thickness].filter(Boolean).join(" X ");
      if (line1) lines.push(line1);
      if (core) lines.push(core);
    } else if (catName.includes("box")) {
      if (size) lines.push(String(size));
      const line2 = [spec.material, ply].filter(Boolean).join(" - ");
      if (line2) lines.push(line2);
    } else if (catName.includes("label")) {
      const labelDesc = [size, labelInRoll].filter(Boolean).join(" - ");
      if (labelDesc) lines.push(labelDesc);
    } else {
      const parts: any[] = [];
      if (size) parts.push(size);
      if (thickness) parts.push(thickness);
      if (core) parts.push(core);
      if (material) parts.push(material);
      if (ply) parts.push(ply);
      if (labelInRoll) parts.push(labelInRoll);
      
      if (parts.length > 0) {
        lines.push(parts.slice(0, 3).join(" - "));
        if (parts.length > 3) {
          lines.push(parts.slice(3).join(" - "));
        }
      }
    }

    if (item?.packSize) {
      const unit = catName.includes("tape") ? "Rolls" : catName.includes("box") ? "Pcs" : catName.includes("label") ? "Labels" : "pcs";
      lines.push(`Pack of ${item.packSize} ${unit}`);
    }

    return lines;
  };

  const formatBrandName = (brandName: string) => {
    if (!brandName) return "";
    const clean = brandName.replace(/™/g, "");
    if (clean.toLowerCase() === "rollabel") return "Rollabel™";
    if (clean.toLowerCase() === "packpro") return "PackPro™";
    return brandName;
  };

  const calculateTotalSavings = () => {
    let totalMrp = 0;
    let totalSelling = 0;
    
    cartProducts.forEach((item) => {
      const priceList = item?.product?.priceList;
      const selectedPrice = Array.isArray(priceList)
        ? priceList.find((p) => String(p?.number) === String(item?.packSize))
        : null;
      const mrp = Number(selectedPrice?.MRP ?? selectedPrice?.original_price ?? item?.price);
      const selling = Number(item?.price);
      
      totalMrp += mrp * (Number(item?.quantity) || 0);
      totalSelling += selling * (Number(item?.quantity) || 0);
    });

    const couponDisc = cart?.discount_amount ? Math.max(0, cart.total_amount - cart.discount_amount) : 0;
    const mrpSavings = Math.max(0, totalMrp - totalSelling);
    const totalSavings = mrpSavings + couponDisc;
    const baseForSavings = totalMrp > 0 ? totalMrp : totalSelling;
    const savingsPercent = baseForSavings > 0 ? Math.round((totalSavings / baseForSavings) * 100) : 0;

    return { totalSavings, savingsPercent };
  };

  const renderQuantityControl = (item: any, index: number, mobile = false) => {
    const quantity = getLineQuantity(item);
    const stock = getLineStock(item);
    const key = getCartItemKey(item, index);
    const isUpdating = updatingQuantityKey === key;
    const maxReached = stock !== null && quantity >= stock;

    return (
      <div className={`ct-stepper ${mobile ? "ct-stepper--mobile" : ""}`}>
        <button
          type="button"
          className="ct-stepper-btn"
          aria-label="Decrease quantity"
          disabled={isUpdating || quantity <= 1}
          onClick={() => handleAlter(item, quantity - 1, index)}
        >
          -
        </button>
        <input
          className="ct-stepper-input"
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
          className="ct-stepper-btn"
          aria-label="Increase quantity"
          disabled={isUpdating || maxReached}
          onClick={() => handleAlter(item, quantity + 1, index)}
        >
          +
        </button>
      </div>
    );
  };

  const stockCheckResult = checkstocks();
  const cartItems = cart?.products || [];
  const cartLoaded = cart !== null && cart !== undefined;
  const isCartEmpty = cartLoaded && cartItems.length === 0;

  const subtotal = cartProducts.reduce(
    (sum, item) => sum + (Number(item?.price) || 0) * (Number(item?.quantity) || 0),
    0
  );
  const couponDiscount = cart?.discount_amount ? Math.max(0, cart.total_amount - cart.discount_amount) : 0;
  const gstTax = calculateCartGst();
  const { totalSavings, savingsPercent } = calculateTotalSavings();
  const finalTotal = (cart?.discount_amount ? cart?.discount_amount : subtotal) + gstTax + shippingCost;

  // Checkout Operations
  const handleVisible = () => {
    setVisible(false);
    setAddress(null);
    getUser();
  };

  const handleEdit = (e: any, x: any) => {
    e.stopPropagation();
    setVisible(true);
    setAddress(x);
  };

  const handleRemove = async (e: any, index: number) => {
    e.stopPropagation();
    const temp = [...userAddresss];
    temp.splice(index, 1);
    const User = JSON.parse(localStorage.getItem("PIUser") || "{}");
    const data = {
      id: User?._id,
      contact_address: temp,
    };
    const res = await postService("edituser", data);
    if (res?.data?.success) {
      toast.success("Address removed successfully");
      getUser();
    }
  };

  const handleShippingChange = (value: string) => {
    setRadiobtn(true);
    const isExpress = value === "express";
    setExpressShip(isExpress);
    // Keep the pincode the user already typed and just re-check it against the
    // newly selected delivery method, so they never have to re-enter it.
    if (pincode.length === 6) {
      calculateFinalShipCost(pincode, isExpress);
    }
  };

  const calculateFinalShipCost = async (
    pincodeValue: string,
    isExpress: boolean = expressShip,
    silent: boolean = false,
  ) => {
    try {
      const res = await postService("freight/get/one", {
        pincode: pincodeValue,
        packweight: cart?.totalPackWeight,
      });

      const data = res?.data?.data || res?.data;
      
      const expressPincodes = [
        "122022", "201015", "121000", "110066", "122234", "110101", "201306", "124505",
        "122002", "110007", "122010", "110080", "122016", "110022", "110079", "121001",
        "201313", "110084", "122001", "110102", "201014", "110069", "110039", "110119",
        "110605", "110043", "123507", "110049", "110030", "201318", "122100", "110065",
        "121010", "110011", "110025", "122207", "122007", "121004", "110067", "122003",
        "201301", "201106", "122055", "201007", "122004", "110073", "110086", "201018",
        "110003", "201021", "110078", "122220", "110047", "201206", "110051", "201316",
        "110503", "110013", "121005", "121102", "245304", "201002", "110031", "201019",
        "122231", "122226", "110016", "124508", "110090", "110089", "203208", "110036",
        "110014", "110608", "201102", "110085", "110505", "110104", "110103", "110059",
        "122230", "110054", "122012", "122102", "110100", "110042", "123003", "201101",
        "110052", "110020", "110091", "110604", "110504", "110401", "110098", "110012",
        "110048", "201026", "122011", "110301", "122006", "110403", "110015", "201020",
        "110607", "122101", "201309", "122206", "110063", "121003", "110096", "201304",
        "110046", "122203", "111112", "110019", "122227", "110110", "110117", "201312",
        "122009", "111120", "121011", "110507", "121014", "201005", "201016", "201017",
        "201315", "110609", "110071", "110058", "201006", "122232", "201307", "110108",
        "110113", "122005", "110088", "110094", "122215", "122223", "201300", "121013",
        "122208", "110502", "110033", "122211", "110005", "110057", "110006", "110083",
        "110040", "122013", "110115", "201009", "110125", "201000", "110072", "124501",
        "110018", "110402", "121101", "122210", "122218", "110076", "110093", "201303",
        "122017", "210005", "110092", "201305", "201317", "110017", "110037", "110029",
        "110053", "110510", "122204", "122019", "201003", "110026", "121012", "110024",
        "110027", "110118", "110050", "122209", "121015", "110302", "110009", "110508",
        "110095", "110116", "110501", "110060", "122213", "122214", "110114", "210003",
        "201013", "110028", "201103", "110112", "110044", "110512", "110099", "110511",
        "110105", "121009", "110106", "110001", "110034", "110082", "110056", "124507",
        "201008", "203207", "110097", "122015", "110062", "110121", "201314", "110603",
        "122217", "110068", "110509", "110008", "110077", "110606", "122228", "110120",
        "121006", "122224", "201310", "201311", "122098", "110124", "122021", "110075",
        "110506", "122225", "110081", "110045", "122020", "121002", "110122", "122216",
        "110064", "110010", "110070", "110087", "110002", "122233", "122109", "110021",
        "110074", "122229", "122000", "121008", "110109", "124506", "110004", "122018",
        "201302", "110107", "110023", "110061", "110038", "110601", "110055", "110032",
        "110602", "201004", "201010", "122219", "201001", "110035", "201308", "110041",
        "201011", "121007", "122008", "122014"
      ];

      if (isExpress) {
        if (expressPincodes.includes(pincodeValue)) {
          setShippingCost(100);
          setOriginalShippingCost(100);
          if (!silent) toast.success("Express Delivery Applied!");
        } else {
          if (!silent) toast.error("Pincode not available for Express Delivery");
        }
      } else {
        if (pincodeValue === "232108") {
          if (!silent) toast.error("Pincode not available for Delivery");
        } else {
          if (!silent) toast.success("Standard Delivery Applied!");
          setShippingCost(0);
          setOriginalShippingCost(0);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadScript = (src: string) => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }

      const existingScript = window.document.querySelector(
        `script[src="${src}"]`,
      );
      if (existingScript) {
        const isLoaded = existingScript.getAttribute("data-loaded") === "true";
        const isLoading =
          existingScript.getAttribute("data-loading") === "true";
        if (isLoaded || !isLoading) {
          resolve(true);
        } else {
          existingScript.addEventListener("load", () => resolve(true), {
            once: true,
          });
          existingScript.addEventListener("error", () => resolve(false), {
            once: true,
          });
        }
        return;
      }

      const script = window.document.createElement("script");
      script.src = src;
      script.setAttribute("data-loading", "true");
      script.onload = () => {
        script.setAttribute("data-loaded", "true");
        script.removeAttribute("data-loading");
        resolve(true);
      };

      script.onerror = () => {
        script.removeAttribute("data-loading");
        resolve(false);
      };

      window.document.body.appendChild(script);
    });
  };

  const displayRazor = async (
    amount: number,
    name: string,
    number: string,
    email: string,
    address: string,
    orderId: string,
    guestToken: string,
  ) => {
    const res = await loadScript(
      "https://checkout.razorpay.com/v1/checkout.js",
    );
    const amountInt = Math.round(Number(amount));
    if (!res) {
      toast.error("You appear offline. Unable to load Razorpay.");
      setIsSubmitting(false);
      return;
    }
    if (!orderId || typeof orderId !== "string" || orderId.length < 12) {
      toast.error("Order ID missing or invalid. Payment cannot proceed.");
      setIsSubmitting(false);
      return;
    }
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      amount: amountInt,
      currency: "INR",
      name: "Prem Packaging",
      description: "Secure Checkout Payment",
      image: "/pp_logo_1.png",
      order_id: guestToken,
      handler: async function (response: any) {
        const paymentData = {
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          orderId: orderId,
        };
        try {
          const verificationRes = await postService(
            "order/verify-payment",
            paymentData,
          );
          if (verificationRes?.data?.success) {
            toast.success("Payment successful! Your order has been placed.");
            await emptyCart();
            router.push("/my-orders");
          } else {
            toast.error("Payment verification failed. Please contact support.");
          }
        } catch (error) {
          toast.error("Error verifying payment.");
        } finally {
          setIsSubmitting(false);
        }
      },
      prefill: {
        name: name,
        email: email,
        contact: number,
      },
      notes: {
        address: address,
      },
      theme: {
        color: "#182c5a",
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (response: any) {
      toast.error(`Payment failed: ${response.error.description}`);
      setIsSubmitting(false);
    });
    rzp.open();
  };

  const handleOrder = async () => {
    if (isSubmitting) return;

    const selectedAddr = userAddresss[selectedIndex];
    if (!selectedAddr) {
      toast.error("Please add or select a delivery address.");
      return;
    }
    const phoneValue = selectedAddr.mobile || selectedAddr.phone || "";
    const mobileValue = selectedAddr.mobile || selectedAddr.phone || "";
    const orderEmail = selectedAddr.email || "guest@prempackaging.com";
    const selectedAddressPincode = selectedAddr.pincode || "";
    const selectedGstin = selectedAddr.gstin || "";

    const items = cart?.products?.map((item: any) => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.price,
      packSize: item.packSize,
      discountPrice: item?.discountPrice || 0,
    }));

    const data = {
      items: items,
      name: selectedAddr.name,
      phone: phoneValue,
      mobile: mobileValue,
      gstin: selectedGstin,
      address: selectedAddr.address,
      pincode: selectedAddressPincode,
      landmark: selectedAddr.landmark,
      town: selectedAddr.town,
      email: orderEmail,
      state: selectedAddr.state,
      user: JSON.parse(localStorage.getItem("PIUser") || "{}")?._id,
      totalOrderValue: finalTotal,
      totalCartValue: cart?.total_amount,
      shippingCost: shippingCost,
      taxableAmount: gstTax,
      paymentStatus: "Not Paid",
      utrNumber: "0",
      couponCode: cart?.appliedCouponName,
    };

    if (pincode && String(pincode).trim() !== selectedAddressPincode) {
      toast.error(
        "Entered pincode does not match your selected address pincode.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (cart?.couponUse === "single") {
        const userId = JSON.parse(localStorage.getItem("PIUser") || "{}")?._id;
        const couponCode = cart?.appliedCouponName;
        const couponData = { userId, couponCode };
        await postService("add/coupon", couponData);
      }
      const res = await postService("order/create", data);
      if (res?.data?.success) {
        await displayRazor(
          data?.totalOrderValue * 100,
          data?.name,
          data?.mobile,
          data?.email,
          data?.address,
          res?.data?.data?._id,
          res?.data?.data?.guestToken,
        );
      } else {
        setIsSubmitting(false);
      }
    } catch (error) {
      toast.error("Failed to place order. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{step === 1 ? "My Cart" : "Checkout"} | store.prempackaging</title>
        <meta name="title" content={step === 1 ? "My Cart" : "Checkout"} />
        <meta
          name="description"
          content="Review packaging supplies in your cart and complete checkout securely without leaving the page."
        />
      </Head>

      <div className="ct-root">
        <div className="ct-wrap">
          {/* Header */}
          <header className="ct-head">
            <div className="ct-head-l">
              <h1 className="ct-title">
                {step === 1 ? (
                  <>
                    YOUR CART <span className="ct-count-badge">({cartItems.length})</span>
                  </>
                ) : (
                  "CHECKOUT"
                )}
              </h1>
              <p className="ct-subtitle">
                {step === 1
                  ? "Review your items and proceed to checkout"
                  : "Choose delivery location and payment options"}
              </p>
            </div>

            {/* Stepper progress indicator */}
            <ol className="co-steps" aria-label="Checkout progress">
              <li className={`co-step ${step === 1 ? "is-now" : "is-done"}`} onClick={() => step === 2 && setStep(1)} style={{cursor: step === 2 ? "pointer" : "default"}}>
                <span className="co-step-no">01</span>
                <span className="co-step-tx">Cart</span>
              </li>
              <li className={`co-step ${step === 2 ? "is-now" : ""}`}>
                <span className="co-step-no">02</span>
                <span className="co-step-tx">Shipping</span>
              </li>
              <li className="co-step">
                <span className="co-step-no">03</span>
                <span className="co-step-tx">Payment</span>
              </li>
            </ol>

            {/* Trust badge */}
            <div className="ct-head-trust">
              <div className="ct-head-trust-item">
                <FiShield className="ct-trust-icon" />
                <div className="ct-trust-text">
                  <span className="ct-trust-title">Secure Checkout</span>
                  <span className="ct-trust-desc">100% Safe</span>
                </div>
              </div>
            </div>
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
                className="ct-cta-btn ct-cta-btn--inline"
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
              {/* LEFT Column: Panels Container with Sliding Transitions */}
              <section className="ct-left ct-left-panels-container">
                {/* Panel 1: Cart Review List */}
                <div className={`ct-left-panel ${step === 1 ? "is-active" : "is-inactive-left"}`}>
                  <div className="ct-list">
                    <div className="ct-list-cols">
                      <span>PRODUCT</span>
                      <span>PRICE</span>
                      <span>QUANTITY</span>
                      <span>TOTAL</span>
                    </div>

                    <ul className="ct-rows">
                      {cart?.products?.map((item: any, index: number) => {
                        const brandName = getBrandLabel(item?.product?.brand, brandNameById);
                        const formattedBrand = formatBrandName(brandName);
                        const productName = item?.product?.name || "";
                        const model = item?.product?.model;
                        const specLines = getProductDetailsLines(item);
                        const hasStock = !hasStockIssue(item);
                        const itemImg = getProductImageSrc(item?.product) || item?.product?.images?.[0]?.image || "/pp_logo_1.png";
                        const breakdown = getLineBreakdown(item);

                        return (
                          <li className="ct-row" key={getCartItemKey(item, index)}>
                            {/* PRODUCT */}
                            <div className="ct-cell ct-cell-item">
                              <span className="ct-thumb">
                                <img src={itemImg} alt={productName} />
                              </span>
                              <div className="ct-item-meta">
                                <span className="ct-item-name">
                                  {formattedBrand ? `${formattedBrand} ` : ""}{productName}
                                </span>
                                {model && <span className="ct-item-model">{model}</span>}
                                {specLines.map((line, lIdx) => (
                                  <span key={lIdx} className="ct-item-spec">{line}</span>
                                ))}
                                <span className={hasStock ? "ct-in-stock" : "ct-oos"}>
                                  <FiCheckCircle className="inline-icon" /> {hasStock ? "In Stock" : "Out of stock"}
                                </span>
                              </div>
                            </div>

                            {/* PRICE */}
                            <div className="ct-cell ct-cell-price">
                              <span className="ct-cell-l">PRICE</span>
                              <b>₹{formatRounded(item?.price)}</b>
                            </div>

                            {/* QUANTITY */}
                            <div className="ct-cell ct-cell-qty">
                              <span className="ct-cell-l">QUANTITY</span>
                              <div className="ct-qty-container">
                                {renderQuantityControl(item, index)}
                                <button
                                  type="button"
                                  className="ct-remove-link"
                                  disabled={removingId !== null}
                                  onClick={() => handleRemoveFromCart(item)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            {/* TOTAL */}
                            <div className="ct-cell ct-cell-total">
                              <span className="ct-cell-l">TOTAL</span>
                              <div className="ct-line-breakdown">
                                <div className="ct-bd-row">
                                  <span className="ct-bd-label">Selling price</span>
                                  <span className="ct-bd-amt">
                                    {breakdown.isProductCoupon && (
                                      <s className="ct-bd-strike">
                                        ₹{breakdown.originalSelling.toFixed(2)}
                                      </s>
                                    )}
                                    ₹{breakdown.selling.toFixed(2)}
                                  </span>
                                </div>
                                <div className="ct-bd-row">
                                  <span className="ct-bd-label">GST ({breakdown.gstRate}%)</span>
                                  <span className="ct-bd-amt">+₹{breakdown.gstAmount.toFixed(2)}</span>
                                </div>
                                <div className="ct-bd-row ct-bd-sum">
                                  <span className="ct-bd-label">Total</span>
                                  <b className="ct-bd-total">₹{breakdown.total.toFixed(2)}</b>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className="ct-continue-btn"
                    onClick={() => router.push("/")}
                  >
                    <FiChevronLeft className="ct-btn-arrow" /> Continue Shopping
                  </button>
                </div>

                {/* Panel 2: Shipping details & addresses */}
                <div className={`ct-left-panel ${step === 2 ? "is-active" : "is-inactive-right"}`}>
                  {/* Delivery Address Block */}
                  <div className="co-section-block">
                    <h2 className="co-section-title">1. Delivery address</h2>
                    
                    <div className="co-addr-grid">
                      {userAddresss?.map((x, index) => {
                        const isSelected = selectedIndex === index;
                        return (
                          <div
                            key={index}
                            className={`co-addr-card ${isSelected ? "is-sel" : ""}`}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={0}
                            onClick={() => setSelectedIndex(index)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedIndex(index);
                              }
                            }}
                          >
                            <div className="co-addr-card-header">
                              <span className="co-addr-radio-outer">
                                <span className="co-addr-radio-inner" />
                              </span>
                              {index === 0 && <span className="default-badge">Default address</span>}
                            </div>

                            <div className="co-addr-body">
                              <h3 className="co-addr-name">{x?.name}</h3>
                              <p className="co-addr-text">{x?.address}</p>
                              {x?.landmark && <p className="co-addr-text">Near {x?.landmark}</p>}
                              <p className="co-addr-text">
                                {x?.town}{x?.state ? `, ${x?.state}` : ""}{x?.pincode ? ` - ${x?.pincode}` : ""}
                              </p>
                            </div>

                            <div className="co-addr-footer">
                              {(x?.mobile || x?.phone) && (
                                <span className="footer-meta-item">
                                  <FiPhone className="meta-icon" /> {x?.mobile || x?.phone}
                                </span>
                              )}
                              {x?.gstin && (
                                <span className="gstin-badge">
                                  <span className="gstin-label">GSTIN</span>
                                  <span className="gstin-val">{x?.gstin}</span>
                                </span>
                              )}
                            </div>

                            <div className="co-addr-actions">
                              <button
                                type="button"
                                className="action-btn"
                                onClick={(e) => handleEdit(e, x)}
                              >
                                Edit
                              </button>
                              <span className="action-divider" />
                              <button
                                type="button"
                                className="action-btn action-btn-remove"
                                onClick={(e) => handleRemove(e, index)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add new address card */}
                      <button
                        type="button"
                        className="co-addr-add-card"
                        onClick={() => {
                          setAddress(null);
                          setVisible(true);
                        }}
                      >
                        <div className="add-icon-circle">
                          <FiPlus />
                        </div>
                        <span className="add-title">Add new address</span>
                        <span className="add-desc">Save a new address for faster checkout</span>
                      </button>
                    </div>
                  </div>

                  {/* Delivery Method Block */}
                  <div className="co-section-block">
                    <h2 className="co-section-title">2. Delivery method</h2>

                    <div className="co-delivery-methods">
                      {/* Express Delivery */}
                      <label className="co-delivery-option">
                        <input
                          type="radio"
                          id="express"
                          name="shipping"
                          value="express"
                          checked={expressShip}
                          onChange={() => handleShippingChange("express")}
                        />
                        <div className={`co-delivery-card ${expressShip ? "is-sel" : ""}`}>
                          <span className="co-delivery-radio"></span>
                          <FiTruck className="delivery-icon" />
                          <div className="delivery-text">
                            <span className="delivery-name">Express delivery</span>
                            <span className="delivery-desc">2–3 working days · Delhi NCR only</span>
                          </div>
                          <span className="delivery-price">₹100</span>
                        </div>
                      </label>

                      {/* Standard Delivery */}
                      <label className="co-delivery-option">
                        <input
                          type="radio"
                          id="standard"
                          name="shipping"
                          value="standard"
                          checked={!expressShip}
                          onChange={() => handleShippingChange("standard")}
                        />
                        <div className={`co-delivery-card ${!expressShip ? "is-sel" : ""}`}>
                          <span className="co-delivery-radio"></span>
                          <FiTruck className="delivery-icon" />
                          <div className="delivery-text">
                            <span className="delivery-name">Standard delivery</span>
                            <span className="delivery-desc">7–10 working days · Pan-India</span>
                          </div>
                          <span className="delivery-price text-green">Free</span>
                        </div>
                      </label>

                      {/* Pincode confirmation widget — only shown as a fallback
                          when the selected address has no saved pincode. */}
                      {radiobtn && !hasSavedPincode && (
                        <div className="co-pincode-confirm">
                          <span className="pincode-label">Confirm delivery pincode</span>
                          <div className="pincode-input-group">
                            <input
                              className="pincode-input"
                              placeholder="6-digit pincode"
                              value={pincode}
                              maxLength={6}
                              pattern="[0-9]*"
                              inputMode="numeric"
                              onChange={(e) => {
                                const enteredValue = e.target.value.replace(/\D/g, "");
                                setPincode(enteredValue);
                                if (enteredValue.length === 6) {
                                  calculateFinalShipCost(enteredValue);
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* GST Invoice Accordion */}
                  <div className="co-section-block">
                    <div
                      className="co-gst-accordion-header"
                      onClick={() => setIsGstAccordionOpen(!isGstAccordionOpen)}
                    >
                      <FiFileText className="gst-accordion-icon" />
                      <div className="gst-accordion-text">
                        <span className="gst-accordion-title">Need invoice with GST?</span>
                        <span className="gst-accordion-desc">We will generate a GST invoice for your order.</span>
                      </div>
                      {isGstAccordionOpen ? (
                        <FiChevronUp className="gst-accordion-chevron" />
                      ) : (
                        <FiChevronDown className="gst-accordion-chevron" />
                      )}
                    </div>

                    {isGstAccordionOpen && (
                      <div className="co-gst-accordion-body">
                        <p className="gst-body-info">
                          GSTIN details can be updated by editing your saved address above. If you proceed with guest details or need a custom setup, make sure your address metadata is configured correctly.
                        </p>
                        {userAddresss[selectedIndex]?.gstin ? (
                          <div className="current-gstin-display">
                            <span className="display-label">Current GSTIN:</span>
                            <span className="display-val">{userAddresss[selectedIndex]?.gstin}</span>
                          </div>
                        ) : (
                          <div className="current-gstin-display text-muted">
                            No GSTIN registered for the selected address. Edit the address to register a GST number.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="ct-continue-btn"
                    onClick={() => setStep(1)}
                  >
                    <FiChevronLeft className="ct-btn-arrow" /> Back to Cart
                  </button>
                </div>
              </section>

              {/* RIGHT Column: Sidebar order summary */}
              <aside className="ct-right">
                {step === 1 ? (
                  <div className="ct-summary-card">
                    <h2 className="ct-summary-title">ORDER SUMMARY</h2>

                    <div className="ct-summary-rows">
                      <div className="ct-summary-row">
                        <span className="row-label">Subtotal ({cartItems.length} items)</span>
                        <span className="row-val">₹{formatRounded(subtotal)}</span>
                      </div>

                      {couponDiscount > 0 && (
                        <div className="ct-summary-row text-discount">
                          <span className="row-label">Coupon Discount</span>
                          <span className="row-val">-₹{formatRounded(couponDiscount)}</span>
                        </div>
                      )}

                      <div className="ct-summary-row">
                        <span className="row-label">
                          Shipping <FiInfo className="row-info-icon" title="Shipping is calculated at checkout based on location and weight" />
                        </span>
                        <span className={`row-val ${shippingCost > 0 ? "" : "text-green"}`}>
                          {shippingCost > 0 ? `₹${formatRounded(shippingCost)}` : "Free"}
                        </span>
                      </div>

                      <div className="ct-summary-row">
                        <span className="row-label">
                          Tax (GST){" "}
                          <span className="gst-info-trigger-wrapper">
                            <FiInfo className="row-info-icon" />
                            <span className="gst-details-popover" role="tooltip">
                              <span className="gst-popover-header">GST Breakdown</span>
                              <span className="gst-popover-divider" />
                              <span className="gst-popover-list">
                                {getGstBreakdown().map((breakdownItem, idx) => (
                                  <span key={idx} className="gst-popover-item">
                                    <span className="gst-popover-item-name" title={breakdownItem.name}>
                                      {breakdownItem.name}
                                    </span>
                                    <span className="gst-popover-item-rate">({breakdownItem.rate}%)</span>
                                    <span className="gst-popover-item-amount">₹{breakdownItem.amount.toFixed(2)}</span>
                                  </span>
                                ))}
                              </span>
                            </span>
                          </span>
                        </span>
                        <span className="row-val">₹{gstTax.toFixed(2)}</span>
                      </div>

                      <div className="ct-summary-divider"></div>

                      <div className="ct-summary-row row-total">
                        <span className="total-label">ORDER TOTAL</span>
                        <span className="total-val">₹{finalTotal.toFixed(2)}</span>
                      </div>

                      {totalSavings > 0 && (
                        <div className="ct-savings-text text-green">
                          You save ₹{formatRounded(totalSavings)} ({savingsPercent}%) on this order
                        </div>
                      )}

                      {totalSavings > 0 && (
                        <div className="ct-savings-callout">
                          <FiCheckCircle className="callout-icon" />
                          <span>Yay! You're saving ₹{formatRounded(totalSavings)} on this order</span>
                        </div>
                      )}

                      {/* Coupon Input Area */}
                      <div className="ct-coupon-wrapper">
                        {cart?.appliedCoupon ? (
                          <div className="ct-coupon-applied">
                            <span className="applied-badge">
                              <FiCheckCircle /> {cart?.appliedCouponName}
                            </span>
                            <button type="button" className="remove-coupon-btn" onClick={removeCoupon}>
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="ct-coupon-input-group">
                            <input
                              className="ct-coupon-input"
                              placeholder="Enter coupon code"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value)}
                            />
                            <button type="button" className="apply-coupon-btn" onClick={handleApplyCoupon}>
                              Apply
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Proceed to Checkout CTA */}
                      {stockCheckResult ? (
                        <div className="ct-oos-alert" role="alert">
                          Some items are out of stock. Please remove them to proceed.
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="ct-checkout-btn"
                          onClick={() => {
                            if (!token) {
                              router.push("/login?redirect=/my-cart?step=shipping");
                            } else if (cart?.products?.length) {
                              setStep(2);
                            } else {
                              toast.error("Cart is empty.");
                            }
                          }}
                        >
                          <FiLock className="checkout-btn-icon" />
                          PROCEED TO CHECKOUT
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="ct-summary-card">
                    <h2 className="ct-summary-title">Order summary</h2>

                    {/* Items thumbnails list */}
                    <ul className="co-items">
                      {cart?.products?.map((x: any, index: number) => {
                        const itemImg = getProductImageSrc(x?.product) || x?.product?.images?.[0]?.image || "/pp_logo_1.png";
                        return (
                          <li className="co-item" key={index}>
                            <span className="co-item-thumb">
                              <img alt={x?.product?.name || "Cart product"} src={itemImg} />
                            </span>
                            <span className="co-item-info">
                              <span className="co-item-name">
                                {x?.product?.name} {x?.product?.model}
                              </span>
                              <span className="co-item-spec">
                                Pack of {x?.packSize} · Qty {x?.quantity}
                              </span>
                            </span>
                            <span className="co-item-amt">
                              <b>₹{formatRounded(x?.price * x?.quantity)}</b>
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="co-summary-divider" />

                    {/* Pricing breakdowns */}
                    <dl className="co-costs">
                      <div className="co-cost">
                        <dt>Cart value</dt>
                        <dd>₹{formatRounded(subtotal)}</dd>
                      </div>

                      <div className="co-cost">
                        <dt>Delivery</dt>
                        <dd>{shippingCost > 0 ? `₹${formatRounded(shippingCost)}` : "Free"}</dd>
                      </div>

                      <div className="co-cost">
                        <dt>
                          GST{" "}
                          <span className="gst-info-trigger-wrapper">
                            <FiInfo className="gst-info-icon" />
                            <span className="gst-details-popover" role="tooltip">
                              <span className="gst-popover-header">GST Breakdown</span>
                              <span className="gst-popover-divider" />
                              <span className="gst-popover-list">
                                {getGstBreakdown().map((breakdownItem, idx) => (
                                  <span key={idx} className="gst-popover-item">
                                    <span className="gst-popover-item-name" title={breakdownItem.name}>
                                      {breakdownItem.name}
                                    </span>
                                    <span className="gst-popover-item-rate">({breakdownItem.rate}%)</span>
                                    <span className="gst-popover-item-amount">₹{breakdownItem.amount.toFixed(2)}</span>
                                  </span>
                                ))}
                              </span>
                            </span>
                          </span>
                        </dt>
                        <dd>₹{formatRounded(gstTax)}</dd>
                      </div>
                    </dl>

                    <div className="co-summary-divider" />

                    {/* Total */}
                    <div className="co-total">
                      <span className="co-total-label">Total payable</span>
                      <span className="co-total-amt">₹{formatRounded(finalTotal)}</span>
                    </div>

                    {/* Prepaid alert */}
                    <div className="co-prepaid-alert">
                      <FiShield className="prepaid-alert-icon" />
                      <div className="prepaid-alert-text">
                        <span className="alert-title">Prepaid orders only</span>
                        <p className="alert-desc">
                          Pay securely online to confirm your order. You'll receive email updates instantly.
                        </p>
                      </div>
                    </div>

                    {/* Continue payment button */}
                    {stockCheckResult ? (
                      <div className="co-oos-alert" role="alert">
                        Some items are out of stock — this order can't be placed.
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="co-checkout-btn"
                        disabled={isSubmitting}
                        onClick={handleOrder}
                      >
                        <FiLock className="checkout-lock-icon" />
                        <span>{isSubmitting ? "Processing…" : "Continue to payment"}</span>
                      </button>
                    )}

                    {/* Security trust note */}
                    <div className="co-trust-footer">
                      <FiLock className="trust-footer-icon" />
                      <span>256-bit secure · Razorpay · UPI · Cards</span>
                    </div>
                  </div>
                )}

                {/* WHY SHOP WITH US (Stable) */}
                <div className="ct-why-shop-us">
                  <h3 className="why-shop-title">
                    <FiShield className="why-shop-title-icon" /> Why shop with us?
                  </h3>
                  <ul className="why-shop-list">
                    <li>
                      <FiCheckCircle className="why-shop-list-icon" /> 100% Secure Payments
                    </li>
                    <li>
                      <FiCheckCircle className="why-shop-list-icon" /> Genuine Products
                    </li>
                    <li>
                      <FiCheckCircle className="why-shop-list-icon" /> 7 Days Easy Returns
                    </li>
                    <li>
                      <FiCheckCircle className="why-shop-list-icon" /> Dedicated Customer Support
                    </li>
                  </ul>
                </div>
              </aside>
            </div>
          )}

          {/* Bottom Trust Footer Badges */}
          {cartItems.length > 0 && (
            <div className="ct-footer-badges">
              <div className="ct-footer-badge-item">
                <FiShield className="badge-item-icon" />
                <div className="badge-item-text">
                  <span className="badge-item-title">Premium Quality</span>
                  <span className="badge-item-desc">Best in class products</span>
                </div>
              </div>
              <div className="ct-footer-badge-item">
                <FiTruck className="badge-item-icon" />
                <div className="badge-item-text">
                  <span className="badge-item-title">Fast Delivery</span>
                  <span className="badge-item-desc">Pan India Shipping</span>
                </div>
              </div>
              <div className="ct-footer-badge-item">
                <FiRefreshCw className="badge-item-icon" />
                <div className="badge-item-text">
                  <span className="badge-item-title">Easy Returns</span>
                  <span className="badge-item-desc">7 Days Return Policy</span>
                </div>
              </div>
              <div className="ct-footer-badge-item">
                <FiLock className="badge-item-icon" />
                <div className="badge-item-text">
                  <span className="badge-item-title">Secure Payment</span>
                  <span className="badge-item-desc">100% Protected</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddressModal
        visible={visible}
        handleVisible={handleVisible}
        prev={userAddresss}
        address={address}
      />

      <style jsx>{`
        /* ============ PREMIUM DESIGN STYLES ============ */
        .ct-root {
          --font-family: "Inter", "Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          --color-ink: #0f172a;
          --color-navy: #1e293b;
          --color-slate-muted: #64748b;
          --color-green: #10b981;
          --color-green-dark: #059669;
          --color-green-bg: #f0fdf4;
          --color-green-border: #bbf7d0;
          --color-line: #e2e8f0;
          --color-bg-canvas: #f8fafc;
          --color-bg-card: #ffffff;
          --color-primary-btn: #0f172a;
          --color-primary-btn-hover: #1e293b;
          
          font-family: var(--font-family);
          color: var(--color-ink);
          background-color: var(--color-bg-canvas);
          min-height: 100vh;
          padding: 40px 0 80px;
          -webkit-font-smoothing: antialiased;
        }

        .ct-wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Header section */
        .ct-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          gap: 20px;
          border-bottom: 1px solid var(--color-line);
          padding-bottom: 18px;
        }
        .ct-title {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--color-ink);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ct-count-badge {
          font-size: 18px;
          color: var(--color-slate-muted);
          font-weight: 500;
        }
        .ct-subtitle {
          font-size: 13px;
          color: var(--color-slate-muted);
          margin: 6px 0 0;
        }

        /* Stepper progress indicator */
        .co-steps {
          display: flex;
          align-items: center;
          gap: 32px;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .co-step {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          position: relative;
          color: var(--color-slate-muted);
        }
        .co-step + .co-step::before {
          content: "";
          position: absolute;
          left: -20px;
          top: 50%;
          width: 12px;
          height: 1px;
          background: var(--color-line);
        }
        .co-step-no {
          font-size: 11px;
          font-weight: 700;
          width: 24px;
          height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1.5px solid var(--color-line);
          background: #ffffff;
          color: var(--color-slate-muted);
        }
        .co-step-tx {
          font-size: 13px;
          font-weight: 600;
        }
        .co-step.is-done .co-step-no {
          border-color: var(--color-primary-btn);
          color: #ffffff;
          background: var(--color-primary-btn);
        }
        .co-step.is-done .co-step-tx {
          color: var(--color-ink);
        }
        .co-step.is-now .co-step-no {
          border-color: var(--color-primary-btn);
          color: var(--color-primary-btn);
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
        }
        .co-step.is-now .co-step-tx {
          color: var(--color-ink);
          font-weight: 700;
        }

        /* Top Trust Badges */
        .ct-head-trust {
          display: flex;
          gap: 24px;
          align-items: center;
        }
        .ct-head-trust-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ct-trust-icon {
          font-size: 22px;
          color: var(--color-ink);
          flex-shrink: 0;
        }
        .ct-trust-text {
          display: flex;
          flex-direction: column;
        }
        .ct-trust-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-ink);
          line-height: 1.2;
        }
        .ct-trust-desc {
          font-size: 11px;
          color: var(--color-slate-muted);
        }

        /* Grid layout */
        .ct-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 380px;
          gap: 32px;
          align-items: start;
        }

        /* Left Column: Packing list and sliding panels */
        .ct-left {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .ct-left-panels-container {
          position: relative;
          overflow: hidden;
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: 0 !important;
        }
        .ct-left-panel {
          grid-area: 1 / 1 / 2 / 2;
          width: 100%;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .ct-left-panel.is-active {
          transform: translateX(0);
          opacity: 1;
          pointer-events: auto;
          position: relative;
          z-index: 2;
        }
        .ct-left-panel.is-inactive-left {
          transform: translateX(-60px);
          opacity: 0;
          pointer-events: none;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
        }
        .ct-left-panel.is-inactive-right {
          transform: translateX(60px);
          opacity: 0;
          pointer-events: none;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
        }
        .ct-list {
          background: var(--color-bg-card);
          border: 1px solid var(--color-line);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }

        /* Columns Headers */
        .ct-list-cols {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) 90px 130px 150px;
          gap: 16px;
          align-items: center;
          padding: 14px 24px;
          background: #f1f5f9;
          border-bottom: 1px solid var(--color-line);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--color-slate-muted);
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
          grid-template-columns: minmax(0, 1.6fr) 90px 130px 150px;
          gap: 16px;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid var(--color-line);
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

        /* Product meta */
        .ct-cell-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .ct-thumb {
          width: 72px;
          height: 72px;
          flex-shrink: 0;
          border: 1px solid var(--color-line);
          border-radius: 8px;
          background: #ffffff;
          padding: 6px;
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
          gap: 4px;
        }
        .ct-item-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--color-ink);
          line-height: 1.3;
          margin-bottom: 2px;
        }
        .ct-item-model {
          font-size: 12px;
          color: var(--color-slate-muted);
          font-weight: 500;
        }
        .ct-item-spec {
          font-size: 12px;
          color: var(--color-slate-muted);
        }
        .ct-in-stock {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-green-dark);
          margin-top: 4px;
        }
        .inline-icon {
          font-size: 14px;
        }
        .ct-oos {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: #ef4444;
          margin-top: 4px;
        }

        /* Stepper Widget */
        .ct-qty-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        :global(.ct-stepper) {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          height: 38px !important;
          width: 114px !important;
          border: 1px solid var(--color-line) !important;
          border-radius: 6px !important;
          background: #ffffff !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
        }
        :global(.ct-stepper-btn) {
          width: 35px !important;
          min-width: 35px !important;
          max-width: 35px !important;
          flex-shrink: 0 !important;
          flex-grow: 0 !important;
          height: 100% !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: #ffffff !important;
          color: var(--color-ink) !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: background 0.15s ease !important;
          padding: 0 !important;
          margin: 0 !important;
          box-sizing: border-box !important;
        }
        :global(.ct-stepper-btn:hover:not(:disabled)) {
          background: #f1f5f9 !important;
        }
        :global(.ct-stepper-btn:disabled) {
          color: var(--color-slate-muted) !important;
          opacity: 0.4 !important;
          cursor: not-allowed !important;
        }
        :global(.ct-stepper-input) {
          width: 42px !important;
          min-width: 42px !important;
          max-width: 42px !important;
          flex-shrink: 0 !important;
          flex-grow: 0 !important;
          height: 100% !important;
          border: none !important;
          border-left: 1px solid var(--color-line) !important;
          border-right: 1px solid var(--color-line) !important;
          text-align: center !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          color: var(--color-ink) !important;
          background: #ffffff !important;
          outline: none !important;
          box-shadow: none !important;
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          -moz-appearance: textfield !important;
          appearance: none !important;
        }
        :global(.ct-stepper-input:focus) {
          outline: none !important;
          box-shadow: none !important;
          border-color: var(--color-line) !important;
        }
        :global(.ct-stepper-input::-webkit-outer-spin-button) {
          -webkit-appearance: none !important;
          margin: 0 !important;
        }
        :global(.ct-stepper-input::-webkit-inner-spin-button) {
          -webkit-appearance: none !important;
          margin: 0 !important;
        }

        .ct-remove-link {
          background: none;
          border: 0;
          color: var(--color-slate-muted);
          font-size: 12px;
          font-weight: 500;
          text-decoration: underline;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s ease;
        }
        .ct-remove-link:hover {
          color: #ef4444;
        }

        /* Prices styling */
        .ct-cell-price b {
          font-size: 16px;
          font-weight: 700;
          color: var(--color-green-dark);
          display: block;
          text-align: center;
        }

        .ct-cell-total {
          text-align: right;
        }
        .ct-cell-total b {
          font-size: 18px;
          font-weight: 700;
          color: var(--color-green-dark);
        }
        .ct-price-strike {
          display: block;
          font-size: 12px;
          color: var(--color-slate-muted);
          margin-bottom: 2px;
        }
        .ct-price-discounted {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: var(--color-green-dark);
        }

        /* Per-line Selling price + GST = Total breakdown */
        .ct-line-breakdown {
          display: flex;
          flex-direction: column;
          gap: 3px;
          width: 100%;
        }
        .ct-bd-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
          font-size: 11px;
          line-height: 1.3;
          white-space: nowrap;
        }
        .ct-bd-label {
          color: var(--color-slate-muted);
          font-weight: 500;
        }
        .ct-bd-amt {
          color: var(--color-ink);
          font-weight: 600;
        }
        .ct-bd-strike {
          margin-right: 5px;
          color: var(--color-slate-muted);
          font-weight: 400;
        }
        .ct-bd-sum {
          margin-top: 4px;
          padding-top: 5px;
          border-top: 1px solid var(--color-line);
        }
        .ct-bd-sum .ct-bd-label {
          color: var(--color-ink);
          font-weight: 700;
        }
        .ct-bd-sum .ct-bd-total {
          font-size: 16px;
          font-weight: 700;
          color: var(--color-green-dark);
        }

        /* Continue shopping button */
        .ct-continue-btn {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 0;
          font-size: 14px;
          font-weight: 700;
          color: var(--color-slate-muted);
          cursor: pointer;
          padding: 0;
          transition: color 0.15s ease;
        }
        .ct-continue-btn:hover {
          color: var(--color-ink);
        }
        .ct-btn-arrow {
          font-size: 16px;
        }

        /* Sidebar summary card */
        .ct-summary-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-line);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          margin-bottom: 24px;
        }
        .ct-summary-title {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: var(--color-ink);
          margin: 0 0 20px;
        }

        .ct-summary-rows {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .ct-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: var(--color-slate-muted);
        }
        .row-info-icon {
          font-size: 14px;
          color: var(--color-slate-muted);
          margin-left: 2px;
          cursor: help;
        }
        .ct-summary-row.text-discount .row-val {
          color: var(--color-green-dark);
          font-weight: 700;
        }
        .row-val {
          font-weight: 600;
          color: var(--color-ink);
        }

        .ct-summary-divider {
          height: 1px;
          background: var(--color-line);
          margin: 6px 0;
        }

        .ct-summary-row.row-total {
          color: var(--color-ink);
          margin-top: 4px;
        }
        .total-label {
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.02em;
        }
        .total-val {
          font-size: 22px;
          font-weight: 800;
          color: var(--color-ink);
          letter-spacing: -0.01em;
        }

        .ct-savings-text {
          font-size: 13.5px;
          font-weight: 700;
          text-align: center;
        }
        .ct-savings-callout {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--color-green-bg);
          border: 1px solid var(--color-green-border);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 12.5px;
          color: var(--color-green-dark);
          font-weight: 600;
        }
        .callout-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        /* Coupon wrapper styling */
        .ct-coupon-wrapper {
          margin-top: 8px;
        }
        .ct-coupon-input-group {
          display: flex;
          gap: 8px;
          background: #f8fafc;
          border: 1.5px dashed var(--color-line);
          border-radius: 8px;
          padding: 8px;
        }
        .ct-coupon-input {
          flex-grow: 1;
          height: 38px;
          border: 1px solid var(--color-line);
          border-radius: 6px;
          padding: 0 12px;
          font-size: 13px;
          font-weight: 600;
          outline: none;
          text-transform: uppercase;
        }
        .ct-coupon-input:focus {
          border-color: var(--color-primary-btn);
        }
        .apply-coupon-btn {
          height: 38px;
          background: var(--color-primary-btn);
          color: #ffffff;
          border: 0;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 700;
          padding: 0 16px;
          cursor: pointer;
        }
        .apply-coupon-btn:hover {
          background: var(--color-primary-btn-hover);
        }

        .ct-coupon-applied {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--color-green-bg);
          border: 1px solid var(--color-green-border);
          border-radius: 8px;
          padding: 10px 14px;
        }
        .applied-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: var(--color-green-dark);
        }
        .remove-coupon-btn {
          background: none;
          border: 0;
          font-size: 12px;
          font-weight: 700;
          color: #ef4444;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
        }

        /* Checkout CTA button */
        .ct-checkout-btn {
          height: 48px;
          background: var(--color-primary-btn);
          border: 0;
          border-radius: 8px;
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
          transition: background 0.15s ease, transform 0.1s ease;
        }
        .ct-checkout-btn:hover {
          background: var(--color-primary-btn-hover);
        }
        .ct-checkout-btn:active {
          transform: scale(0.99);
        }
        .checkout-btn-icon {
          font-size: 15px;
        }
        .ct-oos-alert {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: 8px;
          padding: 12px;
          font-size: 13px;
          color: #ef4444;
          font-weight: 600;
          text-align: center;
        }

        /* WHY SHOP US */
        .ct-why-shop-us {
          border: 1px solid var(--color-line);
          border-radius: 12px;
          background: #ffffff;
          padding: 20px;
        }
        .why-shop-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-ink);
          margin: 0 0 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .why-shop-title-icon {
          font-size: 16px;
        }
        .why-shop-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .why-shop-list li {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: var(--color-slate-muted);
          font-weight: 500;
        }
        .why-shop-list-icon {
          font-size: 14px;
          color: var(--color-green-dark);
        }

        /* Bottom Footer Badges */
        .ct-footer-badges {
          grid-column: span 2;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-top: 48px;
          border-top: 1.5px solid var(--color-line);
          padding-top: 36px;
        }
        .ct-footer-badge-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .badge-item-icon {
          font-size: 24px;
          color: var(--color-ink);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .badge-item-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .badge-item-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--color-ink);
        }
        .badge-item-desc {
          font-size: 11.5px;
          color: var(--color-slate-muted);
        }

        /* ============ CHECKOUT SPECIFIC CLASSES ============ */
        .co-section-block {
          background: #ffffff;
          border: 1px solid var(--color-line);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .co-section-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--color-ink);
          margin: 0 0 16px;
        }

        /* Address card grid styles */
        .co-addr-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .co-addr-card {
          position: relative;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border: 1px solid var(--color-line);
          border-radius: 10px;
          padding: 16px;
          cursor: pointer;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .co-addr-card:hover {
          border-color: #cbd5e1;
        }
        .co-addr-card.is-sel {
          border-color: var(--color-primary-btn);
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
        }

        .co-addr-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .co-addr-radio-outer {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid var(--color-line);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #ffffff;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .co-addr-card.is-sel .co-addr-radio-outer {
          border-color: var(--color-primary-btn);
          background: var(--color-primary-btn);
        }
        .co-addr-radio-inner {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ffffff;
        }

        .default-badge {
          background: #e2e8f0;
          color: var(--color-navy);
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .co-addr-body {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-bottom: 14px;
        }
        .co-addr-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-ink);
          margin: 0 0 4px;
        }
        .co-addr-text {
          font-size: 13px;
          color: var(--color-slate-muted);
          line-height: 1.4;
          margin: 0;
        }

        .co-addr-footer {
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-top: 1px solid var(--color-line);
          padding-top: 10px;
          margin-bottom: 10px;
        }
        .footer-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--color-slate-muted);
          font-weight: 500;
        }
        .meta-icon {
          font-size: 14px;
        }

        .gstin-badge {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          border: 1px solid var(--color-line);
          border-radius: 6px;
          overflow: hidden;
          font-size: 11px;
        }
        .gstin-label {
          background: #f1f5f9;
          color: var(--color-slate-muted);
          font-weight: 700;
          padding: 2px 6px;
        }
        .gstin-val {
          color: var(--color-ink);
          font-weight: 600;
          padding: 2px 8px;
          background: #ffffff;
        }

        .co-addr-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-top: auto;
        }
        .action-btn {
          background: none;
          border: 0;
          font-size: 12px;
          font-weight: 700;
          color: var(--color-slate-muted);
          cursor: pointer;
          padding: 0;
          transition: color 0.15s ease;
        }
        .action-btn:hover {
          color: var(--color-primary-btn);
        }
        .action-btn-remove:hover {
          color: #ef4444;
        }
        .action-divider {
          width: 1px;
          height: 10px;
          background: var(--color-line);
        }

        /* Dashed card for adding addresses */
        .co-addr-add-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1.5px dashed #cbd5e1;
          border-radius: 10px;
          background: transparent;
          cursor: pointer;
          min-height: 180px;
          padding: 20px;
          text-align: center;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .co-addr-add-card:hover {
          border-color: var(--color-primary-btn);
          background: #f8fafc;
        }
        .add-icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: var(--color-ink);
          margin-bottom: 12px;
          transition: background 0.15s ease;
        }
        .co-addr-add-card:hover .add-icon-circle {
          background: #e2e8f0;
        }
        .add-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-ink);
          margin-bottom: 4px;
        }
        .add-desc {
          font-size: 12px;
          color: var(--color-slate-muted);
          line-height: 1.3;
        }

        /* Delivery method options */
        .co-delivery-methods {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .co-delivery-option {
          cursor: pointer;
          display: block;
        }
        .co-delivery-option input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }
        .co-delivery-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: #ffffff;
          border: 1px solid var(--color-line);
          border-radius: 10px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .co-delivery-option:hover .co-delivery-card {
          border-color: #cbd5e1;
        }
        .co-delivery-card.is-sel {
          border-color: var(--color-primary-btn);
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.05);
        }

        .co-delivery-radio {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid var(--color-line);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #ffffff;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .co-delivery-card.is-sel .co-delivery-radio {
          border-color: var(--color-primary-btn);
          background: var(--color-primary-btn);
        }
        .co-delivery-card.is-sel .co-delivery-radio::after {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ffffff;
        }

        .delivery-icon {
          font-size: 20px;
          color: var(--color-ink);
          flex-shrink: 0;
        }
        .delivery-text {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .delivery-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-ink);
        }
        .delivery-desc {
          font-size: 12px;
          color: var(--color-slate-muted);
        }
        .delivery-price {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-ink);
        }

        .co-pincode-confirm {
          margin-top: 6px;
          background: #f8fafc;
          border: 1px dashed var(--color-line);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pincode-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-slate-muted);
        }
        .pincode-input {
          height: 38px;
          width: 160px;
          padding: 0 12px;
          border: 1px solid var(--color-line);
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.1em;
          outline: none;
        }
        .pincode-input:focus {
          border-color: var(--color-primary-btn);
        }

        /* GST Accordion styles */
        .co-gst-accordion-header {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }
        .gst-accordion-icon {
          font-size: 22px;
          color: var(--color-ink);
          flex-shrink: 0;
        }
        .gst-accordion-text {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .gst-accordion-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-ink);
        }
        .gst-accordion-desc {
          font-size: 12px;
          color: var(--color-slate-muted);
        }
        .gst-accordion-chevron {
          font-size: 18px;
          color: var(--color-slate-muted);
        }
        .co-gst-accordion-body {
          margin-top: 16px;
          border-top: 1px solid var(--color-line);
          padding-top: 16px;
        }
        .gst-body-info {
          font-size: 12px;
          color: var(--color-slate-muted);
          line-height: 1.5;
          margin: 0 0 12px;
        }
        .current-gstin-display {
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 13px;
        }
        .display-label {
          font-weight: 600;
          color: var(--color-slate-muted);
        }
        .display-val {
          font-weight: 700;
          color: var(--color-ink);
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 4px;
        }

        /* Checkout sidebar summary and costs */
        .co-items {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 280px;
          overflow-y: auto;
        }
        .co-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .co-item-thumb {
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          border: 1px solid var(--color-line);
          border-radius: 8px;
          background: #ffffff;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .co-item-thumb img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .co-item-info {
          flex-grow: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .co-item-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-ink);
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .co-item-spec {
          font-size: 11px;
          color: var(--color-slate-muted);
        }
        .co-item-amt {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-ink);
          text-align: right;
          flex-shrink: 0;
        }

        .co-summary-divider {
          height: 1px;
          background: var(--color-line);
          margin: 16px 0;
        }

        .co-costs {
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .co-cost {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13.5px;
          color: var(--color-slate-muted);
        }
        .co-cost dt {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .co-gst-info-btn {
          background: none;
          border: 0;
          padding: 0;
          color: var(--color-slate-muted);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
        }
        .gst-info-icon {
          font-size: 14px;
        }
        .co-gst-popover {
          position: absolute;
          background: var(--color-navy);
          color: #ffffff;
          padding: 8px 12px;
          font-size: 11px;
          border-radius: 6px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
          width: 200px;
          z-index: 10;
          line-height: 1.4;
          margin-top: 40px;
        }
        .co-cost dd {
          margin: 0;
          font-weight: 600;
          color: var(--color-ink);
        }

        .co-total {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 16px;
        }
        .co-total-label {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-ink);
        }
        .co-total-amt {
          font-size: 24px;
          font-weight: 800;
          color: var(--color-ink);
          letter-spacing: -0.01em;
        }

        .co-prepaid-alert {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: var(--color-green-bg);
          border: 1px solid var(--color-green-border);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
        }
        .prepaid-alert-icon {
          font-size: 18px;
          color: var(--color-green-dark);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .prepaid-alert-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .alert-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-green-dark);
        }
        .alert-desc {
          font-size: 11.5px;
          color: var(--color-green-dark);
          line-height: 1.45;
          margin: 0;
        }

        .co-checkout-btn {
          width: 100%;
          height: 48px;
          background: var(--color-primary-btn);
          border: 0;
          border-radius: 8px;
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
          transition: background 0.15s ease, transform 0.1s ease;
        }
        .co-checkout-btn:hover {
          background: var(--color-primary-btn-hover);
        }
        .co-checkout-btn:active {
          transform: scale(0.99);
        }
        .checkout-lock-icon {
          font-size: 15px;
        }
        .co-oos-alert {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: 8px;
          padding: 12px;
          font-size: 13px;
          color: #ef4444;
          font-weight: 600;
          text-align: center;
        }

        .co-trust-footer {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11.5px;
          color: var(--color-slate-muted);
        }
        .trust-footer-icon {
          font-size: 12px;
        }

        /* Loading Boot Screen */
        .ct-boot {
          min-height: 260px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 18px;
          background: var(--color-bg-card);
          border: 1px solid var(--color-line);
          border-radius: 12px;
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
          background: var(--color-primary-btn);
          animation: co-load 1.1s ease-in-out infinite;
        }
        .ct-boot-tx {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-slate-muted);
        }
        @keyframes co-load {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(320%); }
        }

        /* Empty state */
        .ct-empty {
          background: var(--color-bg-card);
          border: 1px solid var(--color-line);
          border-radius: 12px;
          padding: 64px 24px;
          text-align: center;
          max-width: 580px;
          margin: 40px auto;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .ct-empty-ic {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #f1f5f9;
          color: var(--color-slate-muted);
          margin-bottom: 20px;
        }
        .ct-empty-h {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-ink);
          margin: 0 0 8px;
        }
        .ct-empty-p {
          font-size: 14px;
          color: var(--color-slate-muted);
          margin: 0 0 24px;
        }
        .ct-cta-btn--inline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 42px;
          padding: 0 20px;
          background: var(--color-primary-btn);
          border: 0;
          border-radius: 6px;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .ct-cta-btn--inline:hover {
          background: var(--color-primary-btn-hover);
        }

        /* ============ RESPONSIVE LAYOUTS ============ */
        @media (max-width: 1024px) {
          .ct-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .ct-right {
            position: static;
            top: auto;
          }
          .ct-footer-badges {
            grid-column: span 1;
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .ct-head {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .co-steps {
            gap: 16px;
          }
          .co-step-tx {
            display: none;
          }
          .co-step + .co-step::before {
            left: -12px;
            width: 8px;
          }
          .ct-wrap {
            padding: 0 16px;
          }
          .co-addr-grid {
            grid-template-columns: 1fr;
          }
          
          /* Table responsive collapse */
          .ct-list-cols {
            display: none;
          }
          .ct-row {
            display: flex;
            flex-direction: column;
            padding: 18px;
            align-items: stretch;
            gap: 12px;
          }
          .ct-cell {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .ct-cell-item {
            flex-direction: row;
            justify-content: flex-start;
            align-items: flex-start;
            gap: 14px;
          }
          .ct-cell-price b {
            text-align: right;
          }
          .ct-cell-total {
            text-align: right;
            border-top: 1px solid var(--color-line);
            padding-top: 12px;
            margin-top: 4px;
            align-items: flex-start;
          }
          .ct-line-breakdown {
            width: auto;
            flex: 0 1 auto;
            min-width: 160px;
          }
          .ct-cell-l {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            color: var(--color-slate-muted);
            letter-spacing: 0.05em;
          }
          .ct-qty-container {
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
          }
          .ct-footer-badges {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        .gst-info-trigger-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          cursor: pointer;
        }

        .gst-details-popover {
          visibility: hidden;
          opacity: 0;
          position: absolute;
          background: var(--color-navy, #1e293b);
          color: #ffffff;
          padding: 10px 14px;
          font-size: 11px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          width: 250px;
          z-index: 50;
          line-height: 1.4;
          bottom: 125%; /* position above the icon */
          left: 50%;
          transform: translateX(-50%);
          transition: opacity 0.2s ease, visibility 0.2s ease;
          pointer-events: none;
        }

        .gst-details-popover::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: var(--color-navy, #1e293b) transparent transparent transparent;
        }

        .gst-info-trigger-wrapper:hover .gst-details-popover {
          visibility: visible;
          opacity: 1;
        }

        .gst-popover-header {
          font-weight: 700;
          font-size: 12px;
          margin-bottom: 4px;
          color: #ffffff;
          display: block;
        }

        .gst-popover-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.2);
          margin: 6px 0;
          display: block;
        }

        .gst-popover-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .gst-popover-item {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 6px;
          align-items: center;
          text-align: left;
        }

        .gst-popover-item-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        .gst-popover-item-rate {
          color: rgba(255, 255, 255, 0.7);
          font-size: 10px;
        }

        .gst-popover-item-amount {
          font-weight: 600;
          text-align: right;
        }

        @media (prefers-reduced-motion: reduce) {
          .ct-root *,
          .ct-boot * {
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
