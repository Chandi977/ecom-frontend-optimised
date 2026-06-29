"use client"; // This is a client component 👈🏽
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { indianStates } from "../../assets/data";
import Select from "react-select";
import { emptyCart, getCart } from "../../utils/cart";
import { getService, postService, putService } from "../../services/service";
import AddressModal from "../../modals/AddressModal";
import Head from "next/head";
import { PRODUCTION } from "../../services/constants";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Checkoutpage = () => {
  const [token, setToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState<Record<string, any>>({});
  const [userAddresss, setUserAddresss] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);
  const [expressShip, setExpressShip] = useState(true);
  const [cart, setCart] = useState<any>(null);
  const [pincode, setPincode] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [originalShippingCost, setOriginalShippingCost] = useState(0);
  const [totalCartValue, setTotalCartValue] = useState(0);
  const [radiobtn, setRadiobtn] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [address, setAddress] = useState<any>(null);
  const [height, setHeight] = useState("auto");
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submission
  const [details, setDetails] = useState({
    name: "",
    mobile: "",
    gstin: "",
    address: "",
    pincode: "",
    landmark: "",
    town: "",
    email: "",
    state: "",
  });

  const [showPopup, setShowPopup] = useState(false);

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  useEffect(() => {
    const temp = indianStates?.map((x) => {
      return { value: x, label: x };
    });
    setStates(temp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const router = useRouter();

  const handleCart = async () => {
    const result = await getCart();
    setCart(result);
    // console.log(result);
  };
  const orderValueBeforeTax = shippingCost + cart?.total_amount;
  const orderValueBeforeTaxAllTypeDiscount =
    shippingCost + cart?.discount_amount;

  const orderValueBeforeTaxBothTypeDiscount = () => {
    if (cart?.totalDiscountPercentage) {
      const discountPercentage = cart?.totalDiscountPercentage;
      // console.log("total discount: " + cart?.totalDiscountPercentage);
      const maxCapDiscount = cart?.maxCapDiscount;

      const discount = (discountPercentage / 100) * orderValueBeforeTax;

      if (discount < maxCapDiscount) {
        const originalValue =
          orderValueBeforeTax -
          (discountPercentage / 100) * orderValueBeforeTax;

        //console.log("134", discountShippingCost);
        return originalValue;
      } else {
        const originalValue = orderValueBeforeTax - maxCapDiscount;
        return originalValue;
      }
    } else if (cart?.shippingDiscountPrice) {
      const discountPrice = cart?.shippingDiscountPrice;
      const originalValue = orderValueBeforeTax - discountPrice;
      return originalValue;
    }
  };

  const bothTypeDiscountOrderValueBeforeTax =
    orderValueBeforeTaxBothTypeDiscount() ?? orderValueBeforeTax;

  // console.log("105", bothTypeDiscountOrderValueBeforeTax);

  const DEFAULT_GST_RATE = 18;

  const normalizeGstRate = (value, fallback = DEFAULT_GST_RATE) => {
    if (value === undefined || value === null || value === "") return fallback;
    const rate = Number(value);
    if (!Number.isFinite(rate) || rate < 0) return fallback;
    return rate > 0 && rate <= 1 ? rate * 100 : rate;
  };

  const getObjectGstRate = (value) => {
    if (!value || typeof value !== "object") return undefined;
    return normalizeGstRate(value?.gst, undefined);
  };

  const getProductGstRate = (item) => {
    const product = item?.product || {};
    return (
      getObjectGstRate(product?.sub_category) ??
      getObjectGstRate(product?.category) ??
      getObjectGstRate(item?.sub_category) ??
      getObjectGstRate(item?.category) ??
      normalizeGstRate(product?.gst ?? item?.gst, DEFAULT_GST_RATE)
    );
  };

  const getTaxableAmount = () => {
    if (!cart?.products?.length) return 0;

    const productSubtotal = cart.products.reduce(
      (sum, item) =>
        sum + (Number(item?.price) || 0) * (Number(item?.quantity) || 0),
      0,
    );

    let productScale = 1;
    let shippingScale = 1;

    if (Number(cart?.discount_amount) !== 0) {
      productScale =
        productSubtotal > 0 ? Number(cart?.discount_amount) / productSubtotal : 1;
    } else if (cart?.couponType === "both") {
      const discountedOrderValue = Number(bothTypeDiscountOrderValueBeforeTax);
      const baseOrderValue = Number(orderValueBeforeTax);
      const orderScale =
        baseOrderValue > 0 && Number.isFinite(discountedOrderValue)
          ? discountedOrderValue / baseOrderValue
          : 1;
      productScale = orderScale;
      shippingScale = orderScale;
    }

    const productGst = cart.products.reduce((sum, item) => {
      const lineTotal =
        (Number(item?.price) || 0) * (Number(item?.quantity) || 0);
      const gstRate = getProductGstRate(item);
      return sum + (lineTotal * productScale * gstRate) / 100;
    }, 0);

    const shippingGst =
      ((Number(shippingCost) || 0) * shippingScale * DEFAULT_GST_RATE) / 100;

    return productGst + shippingGst;
  };

  // Returns true if any cart line exceeds available stock for its pack size.
  // Uses Array.some so the iteration actually short-circuits on the first
  // out-of-stock match (a plain forEach + return does not break the loop).
  const checkstocks = () => {
    return Boolean(
      cart?.products?.some((item) => {
        const matchingPack = item.product?.priceList?.find(
          (inneritem) => inneritem.number == item.packSize,
        );
        return matchingPack
          ? matchingPack.stock_quantity < item.quantity
          : false;
      }),
    );
  };

  const stockCheckResult = checkstocks();
  // console.log("FINAL RESULT: " + stockCheckResult); // will be true if "ACCEPTED" condition is met
  const gstTax = getTaxableAmount();
  // console.log("Final GST: " + gstTax);
  // console.log("IS OUT OF STOCK? : " + isOutOfStock);

  const getTotalOrderValue = () => {
    if (!cart) return 0;

    if (cart?.discount_amount != 0) {
      const totalOrderValue =
        orderValueBeforeTaxAllTypeDiscount + getTaxableAmount();
      return totalOrderValue;
    } else if (cart?.couponType === "both") {
      const totalOrderValue =
        bothTypeDiscountOrderValueBeforeTax + getTaxableAmount();
      return totalOrderValue;
    } else {
      const totalOrderValue = orderValueBeforeTax + getTaxableAmount();
      return totalOrderValue;
    }
  };
  const totalOrderValue = getTotalOrderValue();
  const orderValue = totalOrderValue;

  useEffect(() => {
    handleCart();
    if (typeof window !== "undefined") {
      const windowHeight = window.innerHeight;
      setHeight(windowHeight > 450 ? "325px" : "214px");
    }
  }, []);

  const getUser = async () => {
    const User = JSON.parse(localStorage.getItem("PIUser") || "{}");
    const user = await getService(`getuser/${User?._id}`);
    if (user?.data?.success) {
      const contactAddress = user?.data?.data?.contact_address;
      setUserAddresss(Array.isArray(contactAddress) ? contactAddress : []);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("PIToken");
    if (!token) {
      setToken(null);
      setAuthChecked(true);
      router.replace("/login?redirect=/checkoutpage");
      return;
    }

    setToken(token);
    setAuthChecked(true);
    getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateShippingCost = async () => {
    try {
      const res = await postService("freight/get/one", {
        pincode: pincode,
        packweight: cart?.totalPackWeight,
      });

      const data = res?.data?.data || res?.data;
      // console.log("Cart data: ", cart);
      // console.log("data: ", data);
      // console.log("Facility City: ", data.facilityCity); // useful
      if (expressShip) {
        // express method selected
        if (
          data.facilityCity === "Noida" ||
          data.facilityCity === "Ghaziabad" ||
          data.facilityCity === "Delhi" ||
          data.facilityCity === "Gurgaon"
        ) {
          setShippingCost(100);
          setOriginalShippingCost(100);
          document.getElementById("express")?.click();
        } else {
          toast.error("Pincode not availabe for Express Delivery");
          setPincode("");
        }
      } else {
        // Standard method selected
        setShippingCost(0);
        setOriginalShippingCost(0);
      }
      // if (cart?.shippingDiscountPercentage) {
      //   const discountPercentage = cart?.shippingDiscountPercentage; // 100%
      //   const maxCapDiscount = cart?.maxCapDiscount; // NULL
      //   const shippingCost = data.shippingCost; // 390 (for pin code 201301)
      //   const percentage = discountPercentage / 100;
      //   const discount = percentage * shippingCost;
      //   let discountShippingCost;
      //   console.log("discount: ", discount);

      //   if (discount < maxCapDiscount) {
      //     const discountShippingCost =
      //       shippingCost - (discountPercentage / 100) * shippingCost;

      //     // console.log("134", discountShippingCost);
      //     setShippingCost(discountShippingCost);
      //     setOriginalShippingCost(data.shippingCost);
      //   } else if (maxCapDiscount == null) {
      //     discountShippingCost = shippingCost - discount;
      //     setShippingCost(shippingCost - discount);
      //     setOriginalShippingCost(data.shippingCost);
      //   } else {
      //     discountShippingCost = shippingCost - maxCapDiscount;

      //     console.log("134", discountShippingCost);
      //     setShippingCost(discountShippingCost);
      //     setOriginalShippingCost(data.shippingCost);
      //   }
      // } else if (cart?.shippingDiscountPrice) {
      //   const discountPrice = cart?.shippingDiscountPrice;
      //   const shippingCost = data.shippingCost;
      //   const discountShippingCost = shippingCost - discountPrice;
      //   //console.log("134", discountShippingCost);
      //   setShippingCost(discountShippingCost);
      //   setOriginalShippingCost(data.shippingCost);
      // } else {
      //   setShippingCost(data.shippingCost);
      // }

      // setShippingCost(data.shippingCost);
      toast.success("Shipping Cost updated successfully ");
      //console.log("Shipping Cost: ", data.shippingCost);
    } catch (error) {
      // console.error("Error:", error);
    }
  };

  const loadScript = (src) => {
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

  const displayRaxor = async (
    amount,
    name,
    number,
    email,
    address,
    orderId,
    guestToken,
  ) => {
    const res = await loadScript(
      "https://checkout.razorpay.com/v1/checkout.js",
    );
    // Keep paise accuracy; avoid parseInt flooring
    const amountInt = Math.round(Number(amount));
    if (!res) {
      toast.error("You appear offline. Unable to load Razorpay.");
      setIsSubmitting(false); // Reset loading state
      return;
    }
    //console.log("Amount", amountInt);
    //console.log("Amount", amountInt);
    // Defensive: Ensure orderId is a valid MongoDB ObjectId string
    if (!orderId || typeof orderId !== "string" || orderId.length < 12) {
      toast.error("Order ID missing or invalid. Payment cannot proceed.");
      setIsSubmitting(false);
      return;
    }
    console.log(
      "[Payment] Using order _id for payment status update:",
      orderId,
    );
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      amount: amountInt,
      currency: "INR",
      name: "Prem Packaging",
      description: "Order Payment",
      image:
        process.env.NEXT_PUBLIC_RAZORPAY_LOGO_URL ||
        "https://prempackaging.in/pp_logo_1.png",
      handler: async function (response) {
        // Debug: Log the orderId being sent for payment status update
        console.log(
          "[DEBUG] Sending order _id to payment status update:",
          orderId,
        );
        const result = await putService("order/update/payment/status", {
          _id: orderId,
          paymentStatus: "Payment Verified",
          paymentProvider: "razorpay",
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
          ...(guestToken ? { guestToken } : {}),
        });
        const resultData = result?.data || null;
        setIsSubmitting(false); // Reset loading state after payment completion
        if (result?.status === 200 && resultData?.success) {
          toast.success("Payment verified successfully");
          router.push("/my-orders");
          // if (window.location.pathname !== `/orderPlaced/${orderId}`) {
          //   dispatch(openLoader());
          // }
          await emptyCart();
        } else {
          toast.error("something wrong with payment");
        }
      },
      modal: {
        ondismiss: async function () {
          // User closed payment modal without completing payment
          setIsSubmitting(false); // Reset loading state when modal dismissed
          toast.warning("Payment cancelled. You can retry from My Orders.");
          // Notify backend about failed payment
          await putService("order/mark-payment-failed", {
            _id: orderId,
            ...(guestToken ? { guestToken } : {}),
          }).catch(() => {});
          router.push("/my-orders");
        },
        escape: false,
        confirm_close: true,
      },
      prefill: {
        name: `${name}`,
        email: email,
        contact: number,
      },
      notes: {
        address: address,
      },
      theme: {
        color: "#0C4E9C",
      },
    };
    const paymentObject = new window.Razorpay(options);

    // Handle payment failure
    paymentObject.on("payment.failed", async function (response) {
      setIsSubmitting(false); // Reset loading state on payment failure
      toast.error(
        "Payment failed: " + (response.error?.description || "Unknown error"),
      );
      // Notify backend about failed payment
      await putService("order/mark-payment-failed", {
        _id: orderId,
        error: response.error,
        ...(guestToken ? { guestToken } : {}),
      }).catch(() => {});
    });

    paymentObject.open();
  };

  const handleOrder = async (totalcartval) => {
    // Prevent double submission
    if (isSubmitting) {
      toast.warning("Order is being processed, please wait...");
      return;
    }

    // if(totalcartval >= 15000){

    // }
    // console.log("DETAILS HEREEEEE: ", details);
    if (!token) {
      if (!details.name) {
        toast.error("Please enter name");
        return;
      } else if (!details.address) {
        toast.error("Please enter Flat or house Number");
        return;
      } else if (!details.town) {
        toast.error("Please enter town or city");
        return;
      } else if (!details.email) {
        toast.error("Please enter email");
        return;
      }
      const items = cart?.products?.map((x) => {
        return {
          product: x?.product?._id,
          quantity: x?.quantity,
          price: x?.price,
          packSize: x?.packSize,
        };
      });

      if (pincode !== details.pincode) {
        console.log(pincode);
        toast.error(
          "Entered pincode does not match your selected address pincode.",
        );
        return;
      }
      // console.log("place order button fired");
      if (shippingCost === 0) {
        //console.log(shippingCost);
        toast.error("Shipping cost cannot be zero. Please enter pincode.");
        return;
      }

      setIsSubmitting(true); // Set loading state

      try {
        const data = {
          name: details.name,
          mobile: details.mobile,
          gstin: details.gstin,
          address: details.address,
          pincode: details.pincode,
          landmark: details.landmark,
          town: details.town,
          email: details.email,
          state: selectedState?.value,
          items: items,
          totalOrderValue: orderValue,
          totalCartValue: cart?.total_amount,
          shippingCost: shippingCost,
          taxableAmount: gstTax,
          paymentStatus: "Not Paid",
          utrNumber: "0",
        };
        const res = await postService("order/create", data);
        if (res?.data?.success) {
          // Debug: Log the order _id received after creation
          console.log("[DEBUG] Created order _id:", res?.data?.data?._id);
          await displayRaxor(
            data?.totalOrderValue * 100,
            data?.name,
            data?.mobile,
            data?.email,
            data?.address,
            res?.data?.data?._id,
            res?.data?.data?.guestToken,
          );
          // Note: setIsSubmitting(false) will be called in Razorpay handlers
        } else {
          setIsSubmitting(false);
        }
      } catch (error) {
        toast.error("Failed to place order. Please try again.");
        console.error("Order creation error:", error);
      } finally {
        setIsSubmitting(false); // Reset loading state
      }
    } else {
      if (userAddresss?.length === 0) {
        toast.error(
          "No address selected. Please select an address or add a new one.",
        );
        return;
      }
      const items = cart?.products?.map((x) => {
        return {
          product: x?.product?._id,
          quantity: x?.quantity,
          price: x?.price,
          packSize: x?.packSize,
        };
      });
      // Ensure both 'mobile' and 'phone' fields are present and non-empty in the payload
      const selectedAddr = userAddresss[selectedIndex] || {};
      const phoneValue = String(selectedAddr.phone || selectedAddr.mobile || "");
      const mobileValue = String(selectedAddr.mobile || selectedAddr.phone || "");
      const selectedGstin = String(selectedAddr.gstin || "").trim();
      const selectedAddressPincode = String(selectedAddr.pincode || "").trim();
      const orderEmail = String(selectedAddr.email || "").trim();
      if (!orderEmail) {
        toast.error("Selected address is missing an email address.");
        return;
      }
      // DO NOT send orderId in the payload, let backend generate it
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
        totalOrderValue: orderValue,
        totalCartValue: cart?.total_amount,
        shippingCost: shippingCost,
        taxableAmount: gstTax,
        paymentStatus: "Not Paid",
        utrNumber: "0",
        couponCode: cart?.appliedCouponName,
      };
      if (selectedGstin.length < 15) {
        toast.error("Please add a GST number for this order.");
        return;
      }
      if (String(pincode || "").trim() !== selectedAddressPincode) {
        toast.error(
          "Entered pincode does not match your selected address pincode.",
        );
        return;
      }

      setIsSubmitting(true); // Set loading state before API calls

      try {
        if (cart?.couponUse === "single") {
          const userId = JSON.parse(localStorage.getItem("PIUser") || "{}")?._id;
          const couponCode = cart?.appliedCouponName;

          const couponData = {
            userId,
            couponCode,
          };
          await postService("add/coupon", couponData);
          // console.log("428", res);
        }
        const res = await postService("order/create", data);
        if (res?.data?.success) {
          // Debug: Log the order _id received after creation
          console.log("[DEBUG] Created order _id:", res?.data?.data?._id);
          await displayRaxor(
            data?.totalOrderValue * 100,
            data?.name,
            data?.mobile,
            data?.email,
            data?.address,
            res?.data?.data?._id,
            res?.data?.data?.guestToken,
          );
          // Note: setIsSubmitting(false) will be called in Razorpay handlers
        } else {
          setIsSubmitting(false);
        }
      } catch (error) {
        toast.error("Failed to place order. Please try again.");
        console.error("Order creation error:", error);
        setIsSubmitting(false);
      }
    }
  };

  const handleVisible = () => {
    setVisible(false);
    setAddress(null);
    getUser();
  };

  const handleEdit = (e, x) => {
    e.stopPropagation();
    setVisible(true);
    setAddress(x);
  };

  const handleRemove = async (e, index) => {
    e.stopPropagation();
    const temp = userAddresss;
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

  useEffect(() => {
    // console.log("Radio Btn: ", radiobtn);
  }, [radiobtn]);

  const handleShippingChange = (value) => {
    setRadiobtn(true);
    if (value === "express") {
      setExpressShip(true);
    } else {
      setExpressShip(false);
    }
    setPincode("");
    // calculateShippingCost();
  };

  const calculateFinalShipCost = async (pincodeValue) => {
    // Code to calculate all the value that we need!
    try {
      const res = await postService("freight/get/one", {
        pincode: pincodeValue,
        packweight: cart?.totalPackWeight,
      });

      const data = res?.data?.data || res?.data;
      // console.log("Cart data: ", cart);
      // console.log("data GETTING: ", data);
      // console.log("Facility City: ", data.facilityCity); // useful
      // console.log("PINCODE VALUE GETTING: ", pincodeValue);
      if (expressShip) {
        // express method selected
        if (
          pincodeValue === "122022" ||
          pincodeValue === "201015" ||
          pincodeValue === "121000" ||
          pincodeValue === "110066" ||
          pincodeValue === "122234" ||
          pincodeValue === "110101" ||
          pincodeValue === "201306" ||
          pincodeValue === "124505" ||
          pincodeValue === "122002" ||
          pincodeValue === "110007" ||
          pincodeValue === "122010" ||
          pincodeValue === "110080" ||
          pincodeValue === "122016" ||
          pincodeValue === "110022" ||
          pincodeValue === "110079" ||
          pincodeValue === "121001" ||
          pincodeValue === "201313" ||
          pincodeValue === "110084" ||
          pincodeValue === "122001" ||
          pincodeValue === "110102" ||
          pincodeValue === "201014" ||
          pincodeValue === "110069" ||
          pincodeValue === "110039" ||
          pincodeValue === "110119" ||
          pincodeValue === "110605" ||
          pincodeValue === "110043" ||
          pincodeValue === "123507" ||
          pincodeValue === "110049" ||
          pincodeValue === "110030" ||
          pincodeValue === "201318" ||
          pincodeValue === "122100" ||
          pincodeValue === "110065" ||
          pincodeValue === "121010" ||
          pincodeValue === "110011" ||
          pincodeValue === "110025" ||
          pincodeValue === "122207" ||
          pincodeValue === "122007" ||
          pincodeValue === "121004" ||
          pincodeValue === "110067" ||
          pincodeValue === "122003" ||
          pincodeValue === "201301" ||
          pincodeValue === "201106" ||
          pincodeValue === "122055" ||
          pincodeValue === "201007" ||
          pincodeValue === "122004" ||
          pincodeValue === "110073" ||
          pincodeValue === "110086" ||
          pincodeValue === "201018" ||
          pincodeValue === "110003" ||
          pincodeValue === "201021" ||
          pincodeValue === "110078" ||
          pincodeValue === "122220" ||
          pincodeValue === "110047" ||
          pincodeValue === "201206" ||
          pincodeValue === "110051" ||
          pincodeValue === "201316" ||
          pincodeValue === "110503" ||
          pincodeValue === "110013" ||
          pincodeValue === "121005" ||
          pincodeValue === "121102" ||
          pincodeValue === "245304" ||
          pincodeValue === "201002" ||
          pincodeValue === "110031" ||
          pincodeValue === "201019" ||
          pincodeValue === "122231" ||
          pincodeValue === "122226" ||
          pincodeValue === "110016" ||
          pincodeValue === "124508" ||
          pincodeValue === "110090" ||
          pincodeValue === "110089" ||
          pincodeValue === "203208" ||
          pincodeValue === "110036" ||
          pincodeValue === "110014" ||
          pincodeValue === "110608" ||
          pincodeValue === "201102" ||
          pincodeValue === "110085" ||
          pincodeValue === "110505" ||
          pincodeValue === "110104" ||
          pincodeValue === "110103" ||
          pincodeValue === "110059" ||
          pincodeValue === "122230" ||
          pincodeValue === "110054" ||
          pincodeValue === "122012" ||
          pincodeValue === "122102" ||
          pincodeValue === "110100" ||
          pincodeValue === "110042" ||
          pincodeValue === "123003" ||
          pincodeValue === "201101" ||
          pincodeValue === "110052" ||
          pincodeValue === "110020" ||
          pincodeValue === "110091" ||
          pincodeValue === "110604" ||
          pincodeValue === "110504" ||
          pincodeValue === "110401" ||
          pincodeValue === "110098" ||
          pincodeValue === "110012" ||
          pincodeValue === "110048" ||
          pincodeValue === "201012" ||
          pincodeValue === "122011" ||
          pincodeValue === "110301" ||
          pincodeValue === "122006" ||
          pincodeValue === "110403" ||
          pincodeValue === "110015" ||
          pincodeValue === "201020" ||
          pincodeValue === "110607" ||
          pincodeValue === "122101" ||
          pincodeValue === "201309" ||
          pincodeValue === "122206" ||
          pincodeValue === "110063" ||
          pincodeValue === "121003" ||
          pincodeValue === "110096" ||
          pincodeValue === "201304" ||
          pincodeValue === "110046" ||
          pincodeValue === "122203" ||
          pincodeValue === "111112" ||
          pincodeValue === "110019" ||
          pincodeValue === "122227" ||
          pincodeValue === "110110" ||
          pincodeValue === "110117" ||
          pincodeValue === "201312" ||
          pincodeValue === "122009" ||
          pincodeValue === "111120" ||
          pincodeValue === "121011" ||
          pincodeValue === "110507" ||
          pincodeValue === "121014" ||
          pincodeValue === "201005" ||
          pincodeValue === "201016" ||
          pincodeValue === "201017" ||
          pincodeValue === "201315" ||
          pincodeValue === "110609" ||
          pincodeValue === "110071" ||
          pincodeValue === "110058" ||
          pincodeValue === "201006" ||
          pincodeValue === "122232" ||
          pincodeValue === "201307" ||
          pincodeValue === "110108" ||
          pincodeValue === "110113" ||
          pincodeValue === "122005" ||
          pincodeValue === "110088" ||
          pincodeValue === "110094" ||
          pincodeValue === "122215" ||
          pincodeValue === "122223" ||
          pincodeValue === "201300" ||
          pincodeValue === "121013" ||
          pincodeValue === "122208" ||
          pincodeValue === "110502" ||
          pincodeValue === "110033" ||
          pincodeValue === "122211" ||
          pincodeValue === "110005" ||
          pincodeValue === "110057" ||
          pincodeValue === "110006" ||
          pincodeValue === "110083" ||
          pincodeValue === "110040" ||
          pincodeValue === "122013" ||
          pincodeValue === "110115" ||
          pincodeValue === "201009" ||
          pincodeValue === "110125" ||
          pincodeValue === "201000" ||
          pincodeValue === "110072" ||
          pincodeValue === "124501" ||
          pincodeValue === "110018" ||
          pincodeValue === "110402" ||
          pincodeValue === "121101" ||
          pincodeValue === "122210" ||
          pincodeValue === "122218" ||
          pincodeValue === "110076" ||
          pincodeValue === "110093" ||
          pincodeValue === "201303" ||
          pincodeValue === "122017" ||
          pincodeValue === "210005" ||
          pincodeValue === "110092" ||
          pincodeValue === "201305" ||
          pincodeValue === "201317" ||
          pincodeValue === "110017" ||
          pincodeValue === "110037" ||
          pincodeValue === "110029" ||
          pincodeValue === "110053" ||
          pincodeValue === "110510" ||
          pincodeValue === "122204" ||
          pincodeValue === "122019" ||
          pincodeValue === "201003" ||
          pincodeValue === "110026" ||
          pincodeValue === "121012" ||
          pincodeValue === "110024" ||
          pincodeValue === "110027" ||
          pincodeValue === "110118" ||
          pincodeValue === "110050" ||
          pincodeValue === "122209" ||
          pincodeValue === "121015" ||
          pincodeValue === "110302" ||
          pincodeValue === "110009" ||
          pincodeValue === "110508" ||
          pincodeValue === "110095" ||
          pincodeValue === "110116" ||
          pincodeValue === "110501" ||
          pincodeValue === "110060" ||
          pincodeValue === "122213" ||
          pincodeValue === "122214" ||
          pincodeValue === "110114" ||
          pincodeValue === "210003" ||
          pincodeValue === "201013" ||
          pincodeValue === "110028" ||
          pincodeValue === "201103" ||
          pincodeValue === "110112" ||
          pincodeValue === "110044" ||
          pincodeValue === "110512" ||
          pincodeValue === "110099" ||
          pincodeValue === "110511" ||
          pincodeValue === "110105" ||
          pincodeValue === "121009" ||
          pincodeValue === "110106" ||
          pincodeValue === "110001" ||
          pincodeValue === "110034" ||
          pincodeValue === "110082" ||
          pincodeValue === "110056" ||
          pincodeValue === "124507" ||
          pincodeValue === "201008" ||
          pincodeValue === "203207" ||
          pincodeValue === "110097" ||
          pincodeValue === "122015" ||
          pincodeValue === "110062" ||
          pincodeValue === "110121" ||
          pincodeValue === "201314" ||
          pincodeValue === "110603" ||
          pincodeValue === "122217" ||
          pincodeValue === "110068" ||
          pincodeValue === "110509" ||
          pincodeValue === "110008" ||
          pincodeValue === "110077" ||
          pincodeValue === "110606" ||
          pincodeValue === "122228" ||
          pincodeValue === "110120" ||
          pincodeValue === "121006" ||
          pincodeValue === "122224" ||
          pincodeValue === "201310" ||
          pincodeValue === "201311" ||
          pincodeValue === "122098" ||
          pincodeValue === "110124" ||
          pincodeValue === "122021" ||
          pincodeValue === "110075" ||
          pincodeValue === "110506" ||
          pincodeValue === "122225" ||
          pincodeValue === "110081" ||
          pincodeValue === "110045" ||
          pincodeValue === "122020" ||
          pincodeValue === "121002" ||
          pincodeValue === "110122" ||
          pincodeValue === "122216" ||
          pincodeValue === "110064" ||
          pincodeValue === "110010" ||
          pincodeValue === "110070" ||
          pincodeValue === "110087" ||
          pincodeValue === "110002" ||
          pincodeValue === "122233" ||
          pincodeValue === "122109" ||
          pincodeValue === "110021" ||
          pincodeValue === "110074" ||
          pincodeValue === "122229" ||
          pincodeValue === "122000" ||
          pincodeValue === "121008" ||
          pincodeValue === "110109" ||
          pincodeValue === "124506" ||
          pincodeValue === "110004" ||
          pincodeValue === "122018" ||
          pincodeValue === "201302" ||
          pincodeValue === "110107" ||
          pincodeValue === "110023" ||
          pincodeValue === "110061" ||
          pincodeValue === "110038" ||
          pincodeValue === "110601" ||
          pincodeValue === "110055" ||
          pincodeValue === "110032" ||
          pincodeValue === "110602" ||
          pincodeValue === "201004" ||
          pincodeValue === "201010" ||
          pincodeValue === "122219" ||
          pincodeValue === "201001" ||
          pincodeValue === "110035" ||
          pincodeValue === "201308" ||
          pincodeValue === "110041" ||
          pincodeValue === "201011" ||
          pincodeValue === "121007" ||
          pincodeValue === "122008" ||
          pincodeValue === "122014"
        ) {
          setShippingCost(100);
          setOriginalShippingCost(100);
          document.getElementById("express")?.click();
          toast.success("Express Delivery Applied!");
        } else {
          toast.error("Pincode not availabe for Express Delivery");
          setPincode("");
        }
      } else {
        // Standard method selected
        if (pincodeValue === "232108") {
          toast.error("Pincode not availabe for Delivery");
          setPincode("");
        } else {
          toast.success("Standard Delivery Applied!");
          setShippingCost(0);
          setOriginalShippingCost(0);
        }
      }
      // if (cart?.shippingDiscountPercentage) {
      //   const discountPercentage = cart?.shippingDiscountPercentage; // 100%
      //   const maxCapDiscount = cart?.maxCapDiscount; // NULL
      //   const shippingCost = data.shippingCost; // 390 (for pin code 201301)
      //   const percentage = discountPercentage / 100;
      //   const discount = percentage * shippingCost;
      //   let discountShippingCost;
      //   console.log("discount: ", discount);

      //   if (discount < maxCapDiscount) {
      //     const discountShippingCost =
      //       shippingCost - (discountPercentage / 100) * shippingCost;

      //     // console.log("134", discountShippingCost);
      //     setShippingCost(discountShippingCost);
      //     setOriginalShippingCost(data.shippingCost);
      //   } else if (maxCapDiscount == null) {
      //     discountShippingCost = shippingCost - discount;
      //     setShippingCost(shippingCost - discount);
      //     setOriginalShippingCost(data.shippingCost);
      //   } else {
      //     discountShippingCost = shippingCost - maxCapDiscount;

      //     console.log("134", discountShippingCost);
      //     setShippingCost(discountShippingCost);
      //     setOriginalShippingCost(data.shippingCost);
      //   }
      // } else if (cart?.shippingDiscountPrice) {
      //   const discountPrice = cart?.shippingDiscountPrice;
      //   const shippingCost = data.shippingCost;
      //   const discountShippingCost = shippingCost - discountPrice;
      //   //console.log("134", discountShippingCost);
      //   setShippingCost(discountShippingCost);
      //   setOriginalShippingCost(data.shippingCost);
      // } else {
      //   setShippingCost(data.shippingCost);
      // }

      // setShippingCost(data.shippingCost);
      // toast.success("Shipping Cost updated successfully ");
      //console.log("Shipping Cost: ", data.shippingCost);
    } catch (error) {
      // console.error("Error:", error);
    }
  };

  return (
    <>
      <Head>
        <title>Checkout | store.prempackaging</title>
        <meta name="title" content="Checkout" />
        <meta
          name="description"
          content="Complete your order securely with our simple checkout. Multiple payment options and fast confirmation ensure a smooth shopping experience."
        />
      </Head>

      {!authChecked || !token ? (
        <div className="co-boot">
          <div className="co-boot-mark">
            <img src="/pp_logo_1.png" alt="Prem Packaging" />
          </div>
          <span className="co-boot-label">Securing your checkout…</span>
          <span className="co-boot-bar">
            <i />
          </span>
        </div>
      ) : (
        <div className="co-root">
          {/* ───────── Checkout header ───────── */}
          <header className="co-head">
            <div className="co-head-in">
              <a
                href="https://prempackaging.com"
                className="co-brand"
                aria-label="Prem Packaging home"
              >
                <img src="/pp_logo_1.png" alt="Prem Packaging" />
              </a>

              <ol className="co-steps" aria-label="Checkout progress">
                <li className="co-step is-done">
                  <span className="co-step-no">01</span>
                  <span className="co-step-tx">Cart</span>
                </li>
                <li className="co-step is-now" aria-current="step">
                  <span className="co-step-no">02</span>
                  <span className="co-step-tx">Shipping</span>
                </li>
                <li className="co-step">
                  <span className="co-step-no">03</span>
                  <span className="co-step-tx">Payment</span>
                </li>
              </ol>

              <div className="co-head-right">
                <span className="co-secure">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                  Secure
                </span>
                <button
                  type="button"
                  className="co-back"
                  onClick={() => router.push("/my-cart")}
                >
                  ← Cart
                </button>
              </div>
            </div>
          </header>

          <main className="co-main">
            <div className="co-grid">
              {/* ───────── LEFT: destination & delivery ───────── */}
              <section className="co-left">
                <div className="co-sec-head">
                  <h1 className="co-h1">Ship to</h1>
                  <p className="co-sub">
                    Choose where this consignment is delivered and how fast it
                    moves.
                  </p>
                </div>

                {token && (
                  <div className="co-addr-wrap">
                    <span className="co-field-label">Saved addresses</span>
                    <div className="co-addr-grid">
                      {userAddresss?.map((x, index) => (
                        <div
                          key={index}
                          className={
                            "co-addr" +
                            (selectedIndex === index ? " is-sel" : "")
                          }
                          role="radio"
                          aria-checked={selectedIndex === index}
                          tabIndex={0}
                          onClick={() => setSelectedIndex(index)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedIndex(index);
                            }
                          }}
                        >
                          <span className="co-addr-top">
                            <span className="co-addr-tick" aria-hidden="true" />
                            <span className="co-addr-name">{x?.name}</span>
                          </span>

                          <span className="co-addr-lines">
                            <span>{x?.address}</span>
                            {x?.landmark && (
                              <span className="co-addr-dim">
                                Near {x?.landmark}
                              </span>
                            )}
                            <span>
                              {x?.town}
                              {x?.state ? `, ${x?.state}` : ""}
                            </span>
                          </span>

                          <span className="co-addr-meta">
                            {x?.pincode && (
                              <span className="co-chip">
                                <i>PIN</i>
                                <b>{x?.pincode}</b>
                              </span>
                            )}
                            {(x?.mobile || x?.phone) && (
                              <span className="co-chip">
                                <i>TEL</i>
                                <b>{x?.mobile || x?.phone}</b>
                              </span>
                            )}
                            {x?.gstin && (
                              <span className="co-chip co-chip--wide">
                                <i>GSTIN</i>
                                <b>{x?.gstin}</b>
                              </span>
                            )}
                          </span>

                          {x?.email && (
                            <span className="co-addr-email">{x?.email}</span>
                          )}

                          <span className="co-addr-actions">
                            <button
                              type="button"
                              className="co-link"
                              onClick={(e) => handleEdit(e, x)}
                            >
                              Edit
                            </button>
                            <span className="co-sep" aria-hidden="true" />
                            <button
                              type="button"
                              className="co-link co-link--mut"
                              onClick={(e) => handleRemove(e, index)}
                            >
                              Remove
                            </button>
                          </span>
                        </div>
                      ))}

                      <button
                        type="button"
                        className="co-addr-add"
                        onClick={() => {
                          setAddress(null);
                          setVisible(true);
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faAdd}
                          style={{ width: "18px", height: "18px" }}
                        />
                        <span>Add a new address</span>
                      </button>
                    </div>
                  </div>
                )}

                {!token && (
                  <form className="co-form" onSubmit={handleOrder}>
                    <div className="co-form-grid">
                      <label className="co-fld co-fld--full">
                        <span className="co-fld-l">
                          Full name <i>*</i>
                        </span>
                        <input
                          className="co-in"
                          required
                          value={details.name}
                          onChange={(e) =>
                            setDetails({ ...details, name: e.target.value })
                          }
                        />
                      </label>

                      <label className="co-fld">
                        <span className="co-fld-l">Mobile number</span>
                        <input
                          className="co-in"
                          value={details.mobile}
                          onChange={(e) =>
                            setDetails({ ...details, mobile: e.target.value })
                          }
                        />
                      </label>

                      <label className="co-fld">
                        <span className="co-fld-l">GSTIN</span>
                        <input
                          className="co-in co-in--mono"
                          value={details.gstin}
                          onChange={(e) =>
                            setDetails({ ...details, gstin: e.target.value })
                          }
                        />
                      </label>

                      <label className="co-fld co-fld--full">
                        <span className="co-fld-l">
                          Flat, house no., building <i>*</i>
                        </span>
                        <input
                          className="co-in"
                          placeholder="House number and street name"
                          required
                          value={details.address}
                          onChange={(e) =>
                            setDetails({ ...details, address: e.target.value })
                          }
                        />
                      </label>

                      <label className="co-fld">
                        <span className="co-fld-l">Pin code</span>
                        <input
                          className="co-in co-in--mono"
                          value={details.pincode}
                          onChange={(e) =>
                            setDetails({ ...details, pincode: e.target.value })
                          }
                        />
                      </label>

                      <label className="co-fld">
                        <span className="co-fld-l">Landmark</span>
                        <input
                          className="co-in"
                          value={details.landmark}
                          onChange={(e) =>
                            setDetails({ ...details, landmark: e.target.value })
                          }
                        />
                      </label>

                      <label className="co-fld">
                        <span className="co-fld-l">
                          Town / city <i>*</i>
                        </span>
                        <input
                          className="co-in"
                          required
                          value={details.town}
                          onChange={(e) =>
                            setDetails({ ...details, town: e.target.value })
                          }
                        />
                      </label>

                      <label className="co-fld">
                        <span className="co-fld-l">
                          Email address <i>*</i>
                        </span>
                        <input
                          className="co-in"
                          value={details.email}
                          onChange={(e) =>
                            setDetails({ ...details, email: e.target.value })
                          }
                        />
                      </label>

                      <label className="co-fld co-fld--full co-fld--select">
                        <span className="co-fld-l">State</span>
                        <Select
                          options={states}
                          placeholder="Choose a state"
                          value={selectedState}
                          onChange={setSelectedState}
                          instanceId="checkout-state-select"
                          inputId="checkout-state-select"
                        ></Select>
                      </label>
                    </div>
                  </form>
                )}

                {/* Delivery method */}
                <div className="co-sec-head co-sec-head--gap">
                  <span className="co-eyebrow">Dispatch</span>
                  <h2 className="co-h2">Delivery method</h2>
                </div>

                <div className="co-ship">
                  <label className="co-ship-opt">
                    <input
                      type="radio"
                      id="express"
                      name="shipping"
                      value="express"
                      onChange={(e) => handleShippingChange(e.target.value)}
                    />
                    <span className="co-ship-card">
                      <span className="co-ship-radio" aria-hidden="true" />
                      <span className="co-ship-main">
                        <span className="co-ship-name">Express delivery</span>
                        <span className="co-ship-sub">
                          2–3 working days · Delhi NCR only
                        </span>
                      </span>
                      <span className="co-ship-price">₹100</span>
                    </span>
                  </label>

                  <label className="co-ship-opt">
                    <input
                      type="radio"
                      id="standard"
                      name="shipping"
                      value="standard"
                      onChange={(e) => handleShippingChange(e.target.value)}
                    />
                    <span className="co-ship-card">
                      <span className="co-ship-radio" aria-hidden="true" />
                      <span className="co-ship-main">
                        <span className="co-ship-name">Standard delivery</span>
                        <span className="co-ship-sub">
                          7–10 working days · Pan-India
                        </span>
                      </span>
                      <span className="co-ship-price co-ship-price--free">
                        Free
                      </span>
                    </span>
                  </label>

                  {radiobtn && (
                    <div className="co-pin">
                      <span className="co-pin-l">Confirm delivery pincode</span>
                      <input
                        className="co-pin-in"
                        placeholder="6-digit pincode"
                        value={pincode}
                        maxLength={6}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        onChange={(e) => {
                          const enteredValue = e.target.value.replace(
                            /\D/g,
                            "",
                          );
                          setPincode(enteredValue);
                          if (enteredValue.length === 6) {
                            calculateFinalShipCost(enteredValue);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* ───────── RIGHT: dispatch manifest ───────── */}
              <aside className="co-right">
                <div className="co-manifest">
                  <div className="co-manifest-tape">
                    <span className="co-manifest-title">
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <path d="M21 8 12 3 3 8l9 5 9-5Z" />
                        <path d="M3 8v8l9 5 9-5V8" />
                        <path d="M12 13v8" />
                      </svg>
                      Dispatch manifest
                    </span>
                    <span className="co-manifest-ref">
                      {cart?.products?.length || 0}{" "}
                      {cart?.products?.length === 1 ? "line" : "lines"}
                    </span>
                  </div>

                  <div className="co-manifest-body">
                    <ul className="co-items">
                      {cart?.products?.map((x, index) => (
                        <li className="co-item" key={index}>
                          <span className="co-item-thumb">
                            <img
                              alt={x?.product?.name || "Cart product"}
                              src={
                                x?.product?.images?.[0]?.image ||
                                "/pp_logo_1.png"
                              }
                            />
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
                            {cart?.appliedCoupon &&
                            cart?.couponType === "product" &&
                            x?.discountPrice ? (
                              <>
                                <s>₹{Math.round(x?.price * x?.quantity)}</s>
                                <b className="is-cut">
                                  ₹{Math.round(x?.discountPrice * x?.quantity)}
                                </b>
                              </>
                            ) : (
                              <b>₹{Math.round(x?.price * x?.quantity)}</b>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="co-perf" aria-hidden="true" />

                    <dl className="co-costs">
                      <div className="co-cost">
                        <dt>Cart value</dt>
                        <dd>
                          {cart?.discount_amount === 0 ? (
                            <span>₹{Math.round(cart?.total_amount)}</span>
                          ) : (
                            <span className="co-cut">
                              <s>₹{Math.round(cart?.total_amount)}</s>
                              <b className="is-cut">
                                ₹{Math.round(cart?.discount_amount)}
                              </b>
                            </span>
                          )}
                        </dd>
                      </div>

                      <div className="co-cost">
                        <dt>Delivery</dt>
                        <dd>
                          {cart?.appliedCoupon &&
                          cart?.couponType === "shipping" ? (
                            <span className="co-cut">
                              <s>₹{Math.round(originalShippingCost)}</s>
                              <b className="is-cut">
                                ₹{Math.round(shippingCost)}
                              </b>
                            </span>
                          ) : (
                            <span>₹{Math.round(shippingCost)}</span>
                          )}
                        </dd>
                      </div>

                      <div className="co-cost">
                        <dt>Cart + delivery</dt>
                        <dd>
                          {cart?.discount_amount != 0 ? (
                            <span>
                              ₹{Math.round(orderValueBeforeTaxAllTypeDiscount)}
                            </span>
                          ) : cart?.couponType === "both" ? (
                            <span className="co-cut">
                              <s>₹{Math.round(orderValueBeforeTax)}</s>
                              <b className="is-cut">
                                ₹
                                {Math.round(
                                  bothTypeDiscountOrderValueBeforeTax,
                                )}
                              </b>
                            </span>
                          ) : (
                            <span>₹{Math.round(orderValueBeforeTax)}</span>
                          )}
                        </dd>
                      </div>

                      <div className="co-cost">
                        <dt className="co-gst">
                          GST
                          <button
                            type="button"
                            className="co-gst-i"
                            onClick={togglePopup}
                            aria-label="How GST is calculated"
                          >
                            <img
                              src="/circleinfo.svg"
                              alt=""
                              height={14}
                              width={14}
                            />
                          </button>
                          {showPopup && (
                            <span className="co-gst-pop" role="tooltip">
                              GST is applied at the applicable rate for each
                              product in your cart.
                            </span>
                          )}
                        </dt>
                        <dd>₹{Math.round(gstTax)}</dd>
                      </div>

                      {cart?.appliedCoupon && (
                        <div className="co-cost">
                          <dt>Coupon · {cart?.appliedCouponName}</dt>
                          <dd className="co-applied">Applied</dd>
                        </div>
                      )}
                    </dl>

                    <div className="co-total">
                      <span className="co-total-label">Total payable</span>
                      <span className="co-total-amt">
                        ₹{Math.round(totalOrderValue)}
                      </span>
                    </div>

                    <div className="co-note">
                      <span className="co-note-h">Prepaid orders only</span>
                      <p>
                        Pay securely online, or to UPI ID{" "}
                        <strong className="co-upi">
                          premindustriesecom@hsbc
                        </strong>
                        . Once payment is received we update your order status
                        and email a confirmation.
                      </p>
                    </div>

                    {stockCheckResult ? (
                      <div className="co-oos" role="alert">
                        Some items are out of stock — this order can’t be
                        placed.
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="co-cta"
                        disabled={isSubmitting}
                        onClick={() => handleOrder(cart?.total_amount)}
                      >
                        <span>
                          {isSubmitting ? "Processing…" : "Place order"}
                        </span>
                        {!isSubmitting && (
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14" />
                            <path d="m13 6 6 6-6 6" />
                          </svg>
                        )}
                      </button>
                    )}

                    <div className="co-trust">
                      <span className="co-trust-i">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="4" y="10" width="16" height="11" rx="2" />
                          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                        </svg>
                        256-bit secured
                      </span>
                      <span className="co-trust-dot" aria-hidden="true" />
                      <span className="co-trust-i">Razorpay · UPI · Cards</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </main>

          {/* ───────── Mobile sticky pay bar ───────── */}
          <div className="co-paybar">
            <div className="co-paybar-tot">
              <span>Total payable</span>
              <strong>₹{Math.round(totalOrderValue)}</strong>
            </div>
            {stockCheckResult ? (
              <span className="co-paybar-oos">Out of stock</span>
            ) : (
              <button
                type="button"
                className="co-paybar-btn"
                disabled={isSubmitting}
                onClick={() => handleOrder(cart?.total_amount)}
              >
                {isSubmitting ? "Processing…" : "Place order"}
              </button>
            )}
          </div>

          <AddressModal
            visible={visible}
            handleVisible={handleVisible}
            prev={userAddresss}
            address={address}
          ></AddressModal>
        </div>
      )}

      <style jsx>{`
        /* ============ Dispatch-manifest checkout ============ */
        .co-root,
        .co-boot {
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
        }

        /* ---- boot / auth-check screen ---- */
        .co-boot {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 18px;
          background: var(--canvas);
          font-family: var(--ui);
        }
        .co-boot-mark img {
          height: 42px;
          width: auto;
          opacity: 0.92;
        }
        .co-boot-label {
          font-size: 13px;
          letter-spacing: 0.04em;
          color: var(--mut);
        }
        .co-boot-bar {
          width: 160px;
          height: 3px;
          border-radius: 99px;
          background: #dfe3ea;
          overflow: hidden;
        }
        .co-boot-bar i {
          display: block;
          height: 100%;
          width: 40%;
          border-radius: 99px;
          background: var(--navy);
          animation: co-load 1.1s ease-in-out infinite;
        }
        @keyframes co-load {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(320%);
          }
        }

        /* ---- root canvas ---- */
        .co-root {
          min-height: 100vh;
          font-family: var(--ui);
          color: var(--ink);
          background-color: var(--canvas);
          background-image: radial-gradient(
            circle,
            rgba(20, 33, 61, 0.045) 1px,
            transparent 1px
          );
          background-size: 22px 22px;
          padding-bottom: 28px;
          -webkit-font-smoothing: antialiased;
        }

        /* ---- header ---- */
        .co-head {
          position: sticky;
          top: 0;
          z-index: 30;
          background: rgba(255, 255, 255, 0.86);
          backdrop-filter: saturate(1.4) blur(10px);
          border-bottom: 1px solid var(--line);
        }
        .co-head-in {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 28px;
          height: 66px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        .co-brand {
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
        }
        .co-brand img {
          height: 34px;
          width: auto;
        }

        .co-steps {
          display: flex;
          align-items: center;
          gap: 26px;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .co-step {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          position: relative;
          color: var(--mut-2);
        }
        .co-step + .co-step::before {
          content: "";
          position: absolute;
          left: -18px;
          top: 50%;
          width: 10px;
          height: 1px;
          background: var(--line);
        }
        .co-step-no {
          font-family: var(--mono);
          font-size: 11px;
          font-weight: 600;
          width: 25px;
          height: 25px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1.5px solid var(--line);
          background: #fff;
          color: var(--mut-2);
        }
        .co-step-tx {
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }
        .co-step.is-done .co-step-no {
          border-color: var(--navy);
          color: #fff;
          background: var(--navy);
        }
        .co-step.is-done .co-step-tx {
          color: var(--ink);
        }
        .co-step.is-now .co-step-no {
          border-color: var(--navy);
          color: var(--navy);
          background: #fff;
          box-shadow: 0 0 0 4px rgba(24, 44, 90, 0.1);
        }
        .co-step.is-now .co-step-tx {
          color: var(--ink);
        }

        .co-head-right {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
        }
        .co-secure {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: var(--ok);
        }
        .co-back {
          font-family: var(--ui);
          font-size: 12.5px;
          font-weight: 600;
          color: var(--ink);
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 7px 13px;
          cursor: pointer;
          transition:
            border-color 0.15s ease,
            color 0.15s ease;
        }
        .co-back:hover {
          border-color: var(--navy);
          color: var(--navy);
        }

        /* ---- layout ---- */
        .co-main {
          max-width: 1180px;
          margin: 0 auto;
          padding: 34px 28px 0;
        }
        .co-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 396px;
          gap: 30px;
          align-items: start;
        }

        /* ---- section heads ---- */
        .co-sec-head {
          animation: co-rise 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both;
        }
        .co-sec-head--gap {
          margin-top: 34px;
        }
        .co-eyebrow {
          display: inline-block;
          font-family: var(--mono);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--navy-2);
          margin-bottom: 7px;
        }
        .co-h1,
        .co-h2 {
          font-family: var(--disp);
          color: var(--ink);
          margin: 0;
          letter-spacing: -0.01em;
        }
        .co-h1 {
          font-size: 30px;
          font-weight: 800;
          line-height: 1.05;
        }
        .co-h2 {
          font-size: 20px;
          font-weight: 700;
        }
        .co-sub {
          margin: 8px 0 0;
          font-size: 13.5px;
          color: var(--mut);
          max-width: 46ch;
        }

        /* ---- address cards ---- */
        .co-addr-wrap {
          margin-top: 22px;
          animation: co-rise 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) 0.05s both;
        }
        .co-field-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: var(--mut);
          margin-bottom: 12px;
        }
        .co-addr-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .co-addr {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 17px 17px 15px;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 14px;
          cursor: pointer;
          text-align: left;
          transition:
            border-color 0.16s ease,
            box-shadow 0.16s ease,
            transform 0.16s ease;
        }
        .co-addr:hover {
          border-color: #cdd3de;
          box-shadow: 0 6px 20px rgba(20, 33, 61, 0.06);
        }
        .co-addr:focus-visible {
          outline: none;
          border-color: var(--navy);
          box-shadow: 0 0 0 3px rgba(24, 44, 90, 0.16);
        }
        .co-addr.is-sel {
          border-color: var(--navy);
          box-shadow: 0 8px 24px rgba(24, 44, 90, 0.12);
        }
        .co-addr-top {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .co-addr-tick {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid var(--line);
          flex-shrink: 0;
          position: relative;
          transition:
            border-color 0.16s ease,
            background 0.16s ease;
        }
        .co-addr.is-sel .co-addr-tick {
          border-color: var(--navy);
          background: var(--navy);
        }
        .co-addr.is-sel .co-addr-tick::after {
          content: "";
          position: absolute;
          inset: 4px;
          border-radius: 50%;
          background: #fff;
        }
        .co-addr-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--ink);
        }
        .co-addr-lines {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 13px;
          line-height: 1.45;
          color: #475067;
        }
        .co-addr-dim {
          color: var(--mut-2);
        }
        .co-addr-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 1px;
        }
        .co-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px 3px 6px;
          background: #f4f6f9;
          border: 1px solid var(--line-2);
          border-radius: 7px;
          max-width: 100%;
        }
        .co-chip i {
          font-family: var(--mono);
          font-style: normal;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--mut-2);
        }
        .co-chip b {
          font-family: var(--mono);
          font-size: 11.5px;
          font-weight: 600;
          color: var(--ink);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .co-chip--wide {
          width: 100%;
        }
        .co-addr-email {
          font-size: 12px;
          color: var(--mut);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .co-addr-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: auto;
          padding-top: 4px;
        }
        .co-link {
          font-family: var(--ui);
          font-size: 12px;
          font-weight: 700;
          color: var(--navy);
          background: none;
          border: 0;
          padding: 0;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .co-link:hover {
          color: var(--signal);
        }
        .co-link--mut {
          color: var(--mut);
        }
        .co-link--mut:hover {
          color: var(--signal);
        }
        .co-sep {
          width: 1px;
          height: 11px;
          background: var(--line);
        }
        .co-addr-add {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 150px;
          background: transparent;
          border: 1.5px dashed #cbd2de;
          border-radius: 14px;
          color: var(--mut);
          font-family: var(--ui);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition:
            border-color 0.16s ease,
            color 0.16s ease,
            background 0.16s ease;
        }
        .co-addr-add:hover {
          border-color: var(--navy);
          color: var(--navy);
          background: rgba(24, 44, 90, 0.03);
        }

        /* ---- guest form ---- */
        .co-form {
          margin-top: 22px;
        }
        .co-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .co-fld {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .co-fld--full {
          grid-column: 1 / -1;
        }
        .co-fld-l {
          font-size: 12px;
          font-weight: 600;
          color: var(--ink);
          letter-spacing: 0.01em;
        }
        .co-fld-l i {
          color: var(--signal);
          font-style: normal;
        }
        .co-in {
          height: 46px;
          padding: 0 14px;
          font-family: var(--ui);
          font-size: 14px;
          color: var(--ink);
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 10px;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }
        .co-in--mono {
          font-family: var(--mono);
          letter-spacing: 0.02em;
        }
        .co-in:focus {
          outline: none;
          border-color: var(--navy);
          box-shadow: 0 0 0 3px rgba(24, 44, 90, 0.13);
        }
        .co-fld--select :global(.css-13cymwt-control),
        .co-fld--select :global(.css-t3ipsp-control) {
          min-height: 46px;
          border-radius: 10px;
          border-color: var(--line);
        }

        /* ---- delivery options ---- */
        .co-ship {
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .co-ship-opt {
          display: block;
          cursor: pointer;
        }
        .co-ship-opt input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }
        .co-ship-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 15px 17px;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 13px;
          transition:
            border-color 0.16s ease,
            box-shadow 0.16s ease;
        }
        .co-ship-opt:hover .co-ship-card {
          border-color: #cdd3de;
        }
        .co-ship-opt input:focus-visible + .co-ship-card {
          border-color: var(--navy);
          box-shadow: 0 0 0 3px rgba(24, 44, 90, 0.16);
        }
        .co-ship-opt input:checked + .co-ship-card {
          border-color: var(--navy);
          box-shadow: 0 8px 22px rgba(24, 44, 90, 0.1);
        }
        .co-ship-radio {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid var(--line);
          flex-shrink: 0;
          position: relative;
          transition:
            border-color 0.16s ease,
            background 0.16s ease;
        }
        .co-ship-opt input:checked + .co-ship-card .co-ship-radio {
          border-color: var(--navy);
          background: var(--navy);
        }
        .co-ship-opt input:checked + .co-ship-card .co-ship-radio::after {
          content: "";
          position: absolute;
          inset: 4px;
          border-radius: 50%;
          background: #fff;
        }
        .co-ship-main {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }
        .co-ship-name {
          font-size: 14.5px;
          font-weight: 700;
          color: var(--ink);
        }
        .co-ship-sub {
          font-size: 12px;
          color: var(--mut);
        }
        .co-ship-price {
          font-family: var(--mono);
          font-size: 14px;
          font-weight: 700;
          color: var(--navy);
        }
        .co-ship-price--free {
          color: var(--ok);
        }
        .co-pin {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-top: 2px;
          animation: co-rise 0.3s ease both;
        }
        .co-pin-l {
          font-size: 12px;
          font-weight: 600;
          color: var(--ink);
        }
        .co-pin-in {
          height: 46px;
          padding: 0 14px;
          font-family: var(--mono);
          font-size: 14px;
          letter-spacing: 0.18em;
          color: var(--ink);
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 10px;
          max-width: 220px;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }
        .co-pin-in:focus {
          outline: none;
          border-color: var(--navy);
          box-shadow: 0 0 0 3px rgba(24, 44, 90, 0.13);
        }

        /* ---- dispatch manifest ---- */
        .co-right {
          position: sticky;
          top: 90px;
          animation: co-rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) 0.1s both;
        }
        .co-manifest {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 18px 50px rgba(20, 33, 61, 0.08);
        }
        .co-manifest-tape {
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
        .co-manifest-title {
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
        .co-manifest-ref {
          font-family: var(--mono);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #8a7a55;
        }
        .co-manifest-body {
          padding: 20px;
        }

        /* items */
        .co-items {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-height: 290px;
          overflow-y: auto;
        }
        .co-items::-webkit-scrollbar {
          width: 5px;
        }
        .co-items::-webkit-scrollbar-thumb {
          background: #d7dbe3;
          border-radius: 99px;
        }
        .co-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .co-item-thumb {
          width: 50px;
          height: 50px;
          flex-shrink: 0;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: #f7f8fa;
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
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .co-item-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--ink);
          text-transform: capitalize;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .co-item-spec {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--mut);
          letter-spacing: 0.01em;
        }
        .co-item-amt {
          flex-shrink: 0;
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          font-family: var(--mono);
        }
        .co-item-amt b {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--ink);
        }
        .co-item-amt s {
          font-size: 11px;
          color: var(--mut-2);
        }
        .co-item-amt .is-cut {
          color: var(--signal);
        }

        /* perforation */
        .co-perf {
          position: relative;
          height: 0;
          margin: 18px -20px;
          border-top: 2px dashed var(--line);
        }
        .co-perf::before,
        .co-perf::after {
          content: "";
          position: absolute;
          top: -9px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--canvas);
          border: 1px solid var(--line);
        }
        .co-perf::before {
          left: -8px;
        }
        .co-perf::after {
          right: -8px;
        }

        /* cost rows */
        .co-costs {
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .co-cost {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .co-cost dt {
          font-size: 13px;
          color: var(--mut);
          font-weight: 500;
        }
        .co-cost dd {
          margin: 0;
          font-family: var(--mono);
          font-size: 13.5px;
          font-weight: 700;
          color: var(--ink);
        }
        .co-cut {
          display: inline-flex;
          align-items: baseline;
          gap: 7px;
        }
        .co-cut s {
          font-size: 11.5px;
          font-weight: 500;
          color: var(--mut-2);
        }
        .co-cut .is-cut {
          color: var(--signal);
        }
        .co-applied {
          color: var(--ok) !important;
          font-family: var(--ui) !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .co-gst {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          position: relative;
        }
        .co-gst-i {
          display: inline-flex;
          background: none;
          border: 0;
          padding: 0;
          cursor: pointer;
          line-height: 0;
          opacity: 0.7;
          transition: opacity 0.15s ease;
        }
        .co-gst-i:hover {
          opacity: 1;
        }
        .co-gst-pop {
          position: absolute;
          left: 0;
          top: calc(100% + 8px);
          width: 210px;
          padding: 9px 11px;
          font-size: 11px;
          line-height: 1.5;
          color: #fff;
          background: var(--ink);
          border-radius: 9px;
          box-shadow: 0 10px 24px rgba(20, 33, 61, 0.2);
          z-index: 5;
        }
        .co-gst-pop::before {
          content: "";
          position: absolute;
          top: -5px;
          left: 14px;
          width: 10px;
          height: 10px;
          background: var(--ink);
          transform: rotate(45deg);
        }

        /* total stamp */
        .co-total {
          margin-top: 18px;
          padding-top: 17px;
          border-top: 1px solid var(--line);
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }
        .co-total-label {
          font-family: var(--disp);
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--ink);
        }
        .co-total-amt {
          position: relative;
          font-family: var(--disp);
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: var(--navy);
          line-height: 1;
          padding-bottom: 5px;
        }
        .co-total-amt::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 3px;
          border-radius: 2px;
          background: var(--signal);
        }

        /* note */
        .co-note {
          margin-top: 18px;
          padding: 14px 15px;
          background: #faf6ec;
          border: 1px solid #efe3c6;
          border-radius: 12px;
        }
        .co-note-h {
          display: block;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: #8a6d1e;
          margin-bottom: 4px;
        }
        .co-note p {
          margin: 0;
          font-size: 12px;
          line-height: 1.55;
          color: #6f5a1e;
        }
        .co-upi {
          font-family: var(--mono);
          font-size: 12px;
          font-weight: 700;
          color: #5c4912;
          background: #f1e6c6;
          padding: 1px 6px;
          border-radius: 5px;
          white-space: nowrap;
        }

        /* CTA */
        .co-cta {
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
        .co-cta svg {
          transition: transform 0.18s ease;
        }
        .co-cta:hover:not(:disabled) {
          background: var(--signal);
          box-shadow: 0 14px 30px rgba(233, 34, 39, 0.28);
        }
        .co-cta:hover:not(:disabled) svg {
          transform: translateX(4px);
        }
        .co-cta:active:not(:disabled) {
          transform: scale(0.985);
        }
        .co-cta:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .co-oos {
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

        /* trust */
        .co-trust {
          margin-top: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .co-trust-i {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--mut);
        }
        .co-trust-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--mut-2);
        }

        /* ---- mobile pay bar ---- */
        .co-paybar {
          display: none;
        }

        @keyframes co-rise {
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
          .co-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .co-right {
            position: static;
            top: auto;
          }
          .co-main {
            padding: 26px 18px 0;
          }
          .co-head-in {
            padding: 0 18px;
          }
          .co-step-tx {
            display: none;
          }
          .co-step + .co-step::before {
            left: -16px;
            width: 8px;
          }
          .co-steps {
            gap: 22px;
          }
          .co-paybar {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 40;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            padding: 12px 18px calc(12px + env(safe-area-inset-bottom));
            background: rgba(255, 255, 255, 0.94);
            backdrop-filter: saturate(1.4) blur(10px);
            border-top: 1px solid var(--line);
            box-shadow: 0 -8px 24px rgba(20, 33, 61, 0.08);
          }
          .co-paybar-tot {
            display: flex;
            flex-direction: column;
            line-height: 1.15;
          }
          .co-paybar-tot span {
            font-size: 11px;
            color: var(--mut);
          }
          .co-paybar-tot strong {
            font-family: var(--disp);
            font-size: 20px;
            font-weight: 800;
            color: var(--navy);
          }
          .co-paybar-btn {
            flex: 1;
            max-width: 220px;
            height: 48px;
            font-family: var(--disp);
            font-size: 14px;
            font-weight: 700;
            color: #fff;
            background: var(--navy);
            border: 0;
            border-radius: 12px;
            cursor: pointer;
            transition: background 0.18s ease;
          }
          .co-paybar-btn:active:not(:disabled) {
            background: var(--signal);
          }
          .co-paybar-btn:disabled {
            opacity: 0.65;
          }
          .co-paybar-oos {
            flex: 1;
            text-align: center;
            font-size: 12.5px;
            font-weight: 700;
            color: var(--signal);
          }
          .co-root {
            padding-bottom: 96px;
          }
        }

        @media (max-width: 620px) {
          .co-addr-grid {
            grid-template-columns: 1fr;
          }
          .co-form-grid {
            grid-template-columns: 1fr;
          }
          .co-h1 {
            font-size: 26px;
          }
          .co-secure {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .co-root *,
          .co-boot * {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>
    </>
  );
};

export default Checkoutpage;
