import { toast } from "react-toastify";
import { getService, postService } from "../services/service";
import { getLegacyCompatibleProduct, getPriceTiers } from "./productCatalog";

const GUEST_CART_COOKIE = "PIGuestCart";
const LEGACY_GUEST_CART_KEY = "PICart";

const notifyCartUpdated = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cartUpdated"));
  }
};

const safeJsonParse = (value, fallback = null) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
};

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null;
};

const setCookie = (name, value) => {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${secure}`;
};

const deleteCookie = (name) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
};

const clearLegacyGuestCart = () => {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(LEGACY_GUEST_CART_KEY);
  }
};

const getGuestCart = () => {
  clearLegacyGuestCart();
  return safeJsonParse(getCookie(GUEST_CART_COOKIE), null);
};

const setGuestCart = (cart) => {
  clearLegacyGuestCart();
  setCookie(GUEST_CART_COOKIE, JSON.stringify(cart));
};

const clearGuestCart = () => {
  deleteCookie(GUEST_CART_COOKIE);
  clearLegacyGuestCart();
};

const getProductId = (product) => {
  if (product && typeof product === "object") {
    return product?._id || product?.id || product?.toString?.();
  }
  return product;
};

const getSelectedStock = (product, packSize, fallbackStock) => {
  const selected = getPriceTiers(product).find(
    (item) => String(item?.number) === String(packSize),
  );
  return selected?.stockQuantity ?? fallbackStock;
};

const getSelectedPackWeight = (product, packSize, fallbackPackWeight = 0) => {
  const selected = getPriceTiers(product).find(
    (item) => String(item?.number) === String(packSize),
  );
  return Number(selected?.packWeight) || Number(fallbackPackWeight) || 0;
};

const compactProductForGuestCart = (product, packSize) => {
  if (!product || typeof product !== "object") return product;
  const normalizedProduct = getLegacyCompatibleProduct(product);
  const selectedPriceList = getPriceTiers(product)
    .filter((item) => String(item?.number) === String(packSize))
    .map((item) => ({
      number: item?.number,
      pack_weight: item?.packWeight,
      stock_quantity: item?.stockQuantity,
    }));

  return {
    _id: product?._id || product?.id,
    name: product?.name,
    model: product?.model,
    brand: product?.brand,
    category: product?.category,
    sub_category: product?.sub_category || product?.subCategory,
    gst: product?.gst,
    images: normalizedProduct.images || [],
    priceList: selectedPriceList,
  };
};

const buildGuestCartLine = (
  product,
  quantity,
  price,
  selectedPackWeight,
  selectedNumber,
  brand,
  category,
  stock,
) => {
  const numericQuantity = Number(quantity) || 1;
  const packSize = Number(selectedNumber);
  const numericPackWeight = getSelectedPackWeight(
    product,
    packSize,
    selectedPackWeight,
  );

  return {
    product: compactProductForGuestCart(product, packSize),
    quantity: numericQuantity,
    price: Number(price) || 0,
    selectedPackWeight: numericPackWeight,
    totalPackWeight: numericQuantity * numericPackWeight,
    packSize,
    brand,
    category,
    stock: getSelectedStock(product, packSize, stock),
  };
};

const recalculateCart = (products) => {
  const safeProducts = Array.isArray(products) ? products : [];
  return {
    products: safeProducts,
    total_amount: safeProducts.reduce(
      (total, item) => total + (Number(item?.price) || 0) * (Number(item?.quantity) || 0),
      0,
    ),
    discount_amount: 0,
    totalPackWeight: safeProducts.reduce(
      (total, item) => total + (Number(item?.totalPackWeight) || 0),
      0,
    ),
  };
};

const hydrateGuestCartProducts = async (cart) => {
  if (!cart?.products?.length) return cart;

  const products = await Promise.all(
    cart.products.map(async (item) => {
      const productId = getProductId(item?.product);
      const hasImage = Boolean(item?.product?.images?.[0]?.image);
      if (!productId) {
        return item;
      }

      let hydratedProduct = item?.product;
      if (!hasImage) {
        const res = await getService(`product/image/single/${productId}`, {}, { silent: true });
        hydratedProduct =
          res?.data?.message === "Product found" ? res?.data?.data : item?.product;
      }

      if (!hydratedProduct) {
        return item;
      }

      const selectedPackWeight = getSelectedPackWeight(
        hydratedProduct,
        item?.packSize,
        item?.selectedPackWeight,
      );

      return {
        ...item,
        product: {
          ...hydratedProduct,
          priceList: hydratedProduct?.priceList || item?.product?.priceList,
        },
        selectedPackWeight,
        totalPackWeight:
          selectedPackWeight > 0
            ? (Number(item?.quantity) || 0) * selectedPackWeight
            : Number(item?.totalPackWeight) || 0,
        brand: item?.brand || hydratedProduct?.brand?._id || hydratedProduct?.brand,
        category: item?.category || hydratedProduct?.category,
      };
    }),
  );

  const recalculated = recalculateCart(products);
  return {
    ...cart,
    products,
    total_amount: recalculated.total_amount,
    totalPackWeight: recalculated.totalPackWeight,
  };
};

export const addToCart = async (
  product,
  quantity,
  price,
  selectedPackWeight?,
  packSize?,
  selectedNumber?,
  brand?,
  category?,
  stock?,
) => {
  //console.log("Selected Pack Size Inside addToCart:", packSize);
  const token = localStorage.getItem("PIToken");
  const totalPackWeight = quantity * selectedPackWeight; // Calculate totalPackWeight

  if (!token) {
    const cart = getGuestCart();

    if (cart) {
      const products = Array.isArray(cart.products) ? cart.products : [];

      const filteredProducts = products?.filter(
        (x) => getProductId(x?.product) === getProductId(product)
      );

      if (filteredProducts?.length !== 0) {
        toast.info("Item is already in the cart.");
        return true;
      } else {
        products?.push(
          buildGuestCartLine(
            product,
            quantity,
            price,
            selectedPackWeight,
            selectedNumber,
            brand,
            category,
            stock,
          ),
        );

        setGuestCart(recalculateCart(products));
        toast.success("Item added to the cart.");
        notifyCartUpdated();
        return true;
      }
    } else {
      const cartss = recalculateCart([
        buildGuestCartLine(
          product,
          quantity,
          price,
          selectedPackWeight,
          selectedNumber,
          brand,
          category,
          stock,
        ),
      ]);

      setGuestCart(cartss);
      toast.success("Item added to the cart.");
      notifyCartUpdated();
      return true;
    }
  } else {
    const user = JSON.parse(localStorage.getItem("PIUser"));
    clearGuestCart();

    const cartss = {
      product: {
        product: product?._id,
        quantity: Number(quantity),
        price: Number(price),
        totalPackWeight: Number(totalPackWeight),
        packSize: Number(selectedNumber), // Include packSize
        brand: brand,
        category: category,
        stock,
      },
      user: user?._id,
    };

    //console.log("93",cartss)

    // Include headers in the request
    const res = await postService("AddtoCart", cartss);

    if (res?.data?.success) {
      toast.success("Item added to the cart.");
      notifyCartUpdated();
    }
    return true;
  }
};

export const getCart = async () => {
  const token = localStorage.getItem("PIToken");
  if (token) {
    const user = JSON.parse(localStorage.getItem("PIUser"));
    const res = await getService(`cart/${user?._id}`, {}, {
      silent: true,
      suppressAuthRedirect: true,
      suppressErrorStatuses: [401],
    });
    return res?.data?.data;
  } else {
    const cart = getGuestCart();
    if (cart) {
      return hydrateGuestCartProducts(cart);
    } else {
      return null;
    }
  }
};

export const getCartCount = async () => {
  const token = localStorage.getItem("PIToken");
  if (token) {
    const user = JSON.parse(localStorage.getItem("PIUser"));
    const res = await getService(`cart/count/${user?._id}`, {}, {
      silent: true,
      suppressAuthRedirect: true,
      suppressErrorStatuses: [401],
    });
    return res?.data?.data;
  } else {
    const cart = getGuestCart();
    if (cart) {
      const count = Array.isArray(cart.products) ? cart.products.length : 0;
      return { count };
    }
    return { count: 0 };
  }
};

export const alterQuantity = async (product, quantity, packSize) => {
  const token = localStorage.getItem("PIToken");
  const nextQuantity = Math.max(1, Number(quantity) || 1);
  if (!token) {
    const cart = getGuestCart();
    const products = cart?.products || [];
    const index = products?.findIndex(
      (x) =>
        String(getProductId(x?.product)) === String(product) &&
        (packSize === undefined || String(x?.packSize) === String(packSize)),
    );
    if (index === -1) return false;
    //console.log(products[index]);
    const selectedPackWeight =
      getSelectedPackWeight(
        products[index]?.product,
        products[index]?.packSize,
        products[index]?.selectedPackWeight,
      ) ||
      (Number(products[index]?.totalPackWeight) || 0) /
        (Number(products[index]?.quantity) || 1);
    products[index]["quantity"] = nextQuantity;
    products[index]["selectedPackWeight"] = selectedPackWeight;
    products[index]["totalPackWeight"] =
      selectedPackWeight * nextQuantity;
    const newCart = recalculateCart(products);
    setGuestCart(newCart);
    notifyCartUpdated();
    return true;
  } else if (token) {
    const user = JSON.parse(localStorage.getItem("PIUser"));
    const data = {
      user: user?._id,
      product,
      quantity: nextQuantity,
      packSize,
    };
    const res = await postService("alterQunatity", data);
    if (res?.data?.success) {
      notifyCartUpdated();
      return true;
    }
  }
  return false;
};

export const removeFromCart = async (product) => {
  //console.log("158", product);
  if (!product) {
    toast.error("Missing product id. Please refresh and try again.");
    return false;
  }
  const productId = String(product);
  const token = localStorage.getItem("PIToken");
  if (!token) {
    //console.log("161", product);
    const cart = getGuestCart();
    if (!cart) return false;
    const products = cart?.products || [];
    const finalProducts = products.filter((x) => {
      const pid = x?.product;
      const pidStr =
        pid && typeof pid === "object"
          ? pid?._id || pid?.id || pid?.toString?.()
          : pid;
      return String(pidStr) !== productId;
    });
    const newCart = recalculateCart(finalProducts);
    if (finalProducts.length) {
      setGuestCart(newCart);
    } else {
      clearGuestCart();
    }
    notifyCartUpdated();
    return true;
  } else if (token) {
    const user = JSON.parse(localStorage.getItem("PIUser"));
    //console.log("177", product);
    const data = {
      user: user?._id,
      product: productId,
    };
    const res = await postService("removefromcart", data);
    if (res?.data?.success || res?.status === 200 || res?.status === 201) {
      notifyCartUpdated();
      return true;
    }
  }
  return false;
};

export const emptyCart = async () => {
  const token = localStorage.getItem("PIToken");
  if (!token) {
    clearGuestCart();
    notifyCartUpdated();
  } else {
    const user = JSON.parse(localStorage.getItem("PIUser"));
    const data = {
      id: user?._id,
    };
    await postService("emptyCart", data);
    notifyCartUpdated();
  }
};

export const updateCart = async (updates, couponCode, couponType, couponUse) => {
  const token = localStorage.getItem("PIToken");
  const user = JSON.parse(localStorage.getItem("PIUser"))?._id;

  const data = {
    user: user,
    appliedCoupon: true,
    appliedCouponName: couponCode,
    couponType: couponType,
    couponUse: couponUse,
    products: updates.map((update) => ({
      product: update.product,
      discountPrice: update.discountPrice,
    })),
  };

  try {
    //console.log("231", data)
    const res = await postService("updateCart", data);
    return res?.data?.success;
  } catch (error) {
    console.error("Error updating cart:", error);
    return false;
  }
};

export const updateShippingDiscount = async (
  shippingDiscountPrice,
  shippingDiscountPercentage,
  couponCode,
  couponType,
  maxCapDiscount,
  couponUse
) => {
  const token = localStorage.getItem("PIToken");
  const user = JSON.parse(localStorage.getItem("PIUser"))?._id;

  //console.log("248" , couponType);

  // console.log("Input Values - shippingDiscountPrice:", shippingDiscountPrice, "shippingDiscountPercentage:", shippingDiscountPercentage);

  const hasDiscountPrice =
    typeof shippingDiscountPrice === "number" && shippingDiscountPrice > 0;
  const hasDiscountPercentage =
    typeof shippingDiscountPercentage === "number" &&
    shippingDiscountPercentage > 0 &&
    shippingDiscountPercentage <= 100;

  // console.log("hasDiscountPrice:", hasDiscountPrice, "hasDiscountPercentage:", hasDiscountPercentage);

  if (hasDiscountPrice && hasDiscountPercentage) {
    // console.error("Cannot provide both shippingDiscountPrice and shippingDiscountPercentage. Please provide only one.");
    return false;
  }

  if (!hasDiscountPrice && !hasDiscountPercentage) {
    // console.error("Please provide either shippingDiscountPrice or shippingDiscountPercentage.");
    return false;
  }

  const discountData: Record<string, any> = {};
  if (hasDiscountPrice) {
    discountData.shippingDiscountPrice = shippingDiscountPrice;
  } else if (hasDiscountPercentage) {
    discountData.shippingDiscountPercentage = shippingDiscountPercentage;
  }

  const data = {
    user: user,
    appliedCouponName: couponCode,
    appliedCoupon: true,
    couponType: couponType,
    maxCapDiscount: maxCapDiscount,
    couponUse: couponUse,
    ...discountData,
  };

  // console.log("Request Data:", data);

  try {
    const res = await postService("updateShippingCoupon", data, token);
    return res?.data?.success;
  } catch (error) {
    console.error("Error updating shipping discount:", error);
    return false;
  }
};

export const updateAllDiscount = async (
  totalDiscountPrice,
  totalDiscountPercentage,
  couponCode,
  couponType,
  maxCapDiscount,
  couponUse
) => {
  const token = localStorage.getItem("PIToken");
  const user = JSON.parse(localStorage.getItem("PIUser"))?._id;

  // console.log("Input Values - shippingDiscountPrice:", shippingDiscountPrice, "shippingDiscountPercentage:", shippingDiscountPercentage);

  const hasDiscountPrice =
    typeof totalDiscountPrice === "number" && totalDiscountPrice > 0;
  const hasDiscountPercentage =
    typeof totalDiscountPercentage === "number" &&
    totalDiscountPercentage > 0 &&
    totalDiscountPercentage <= 100;

  // console.log("hasDiscountPrice:", hasDiscountPrice, "hasDiscountPercentage:", hasDiscountPercentage);

  if (hasDiscountPrice && hasDiscountPercentage) {
    // console.error("Cannot provide both shippingDiscountPrice and shippingDiscountPercentage. Please provide only one.");
    return false;
  }

  if (!hasDiscountPrice && !hasDiscountPercentage) {
    // console.error("Please provide either shippingDiscountPrice or shippingDiscountPercentage.");
    return false;
  }

  const discountData: Record<string, any> = {};
  if (hasDiscountPrice) {
    discountData.totalDiscountPrice = totalDiscountPrice;
  } else if (hasDiscountPercentage) {
    discountData.totalDiscountPercentage = totalDiscountPercentage;
  }

  const data = {
    user: user,
    appliedCouponName: couponCode,
    appliedCoupon: true,
    couponType: couponType,
    maxCapDiscount: maxCapDiscount,
    couponUse: couponUse,
    ...discountData,
  };

  // console.log("Request Data:", data);

  try {
    const res = await postService("updateAllDiscount", data, token);
    return res?.data?.success;
  } catch (error) {
    console.error("Error updating shipping discount:", error);
    return false;
  }
};

export const updateProductTypeAllDiscount = async (
  totalDiscountPrice,
  couponCode,
  couponType,
  couponUse,
) => {
  const token = localStorage.getItem("PIToken");
  const user = JSON.parse(localStorage.getItem("PIUser"))?._id;

  // console.log("Input Values - shippingDiscountPrice:", shippingDiscountPrice, "shippingDiscountPercentage:", shippingDiscountPercentage);

  const data = {
    user: user,
    appliedCouponName: couponCode,
    appliedCoupon: true,
    couponType: couponType,
    discount_amount: totalDiscountPrice,
    couponUse: couponUse,
  };

  // console.log("Request Data:", data);

  try {
    const res = await postService("/update/coupon/all", data, token);
    return res?.data?.success;
  } catch (error) {
    console.error("Error updating shipping discount:", error);
    return false;
  }
};

export const removeCouponCode = async () => {
  const token = localStorage.getItem("PIToken");
  if (!token) {
    const cart = getGuestCart();
    if (cart) {
      setGuestCart(recalculateCart(cart.products));
    }
  } else {
    const user = JSON.parse(localStorage.getItem("PIUser"));
    const data = {
user: user?._id,
    };
    await postService("/remove/coupon", data);
  }
};

export const migrateGuestCartToServer = async () => {
  const token = localStorage.getItem("PIToken");
  const user = safeJsonParse(localStorage.getItem("PIUser"), null);
  const guestCart = getGuestCart();

  if (!token || !user?._id || !guestCart?.products?.length) {
    return false;
  }

  let migrated = false;
  for (const item of guestCart.products) {
    const productId = getProductId(item?.product);
    if (!productId) continue;

    const payload = {
      product: {
        product: productId,
        quantity: Number(item?.quantity) || 1,
        price: Number(item?.price) || 0,
        totalPackWeight:
          Number(item?.totalPackWeight) ||
          (Number(item?.selectedPackWeight) || 0) * (Number(item?.quantity) || 1),
        packSize: Number(item?.packSize),
        brand: item?.brand,
        category: item?.category,
        stock: item?.stock,
      },
      user: user?._id,
    };

    const res = await postService("AddtoCart", payload, { silent: true });
    if (res?.data?.success) {
      migrated = true;
    }
  }

  if (migrated) {
    clearGuestCart();
    notifyCartUpdated();
  }

  return migrated;
};
