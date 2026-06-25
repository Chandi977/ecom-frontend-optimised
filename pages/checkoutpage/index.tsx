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
  const [token, setToken] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState<Record<string, any>>({});
  const [userAddresss, setUserAddresss] = useState([]);
  const [visible, setVisible] = useState(false);
  const [expressShip, setExpressShip] = useState(true);
  const [cart, setCart] = useState(null);
  const [pincode, setPincode] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [originalShippingCost, setOriginalShippingCost] = useState(0);
  const [totalCartValue, setTotalCartValue] = useState(0);
  const [radiobtn, setRadiobtn] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [address, setAddress] = useState(null);
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
    orderValueBeforeTaxBothTypeDiscount();

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
    const User = JSON.parse(localStorage.getItem("PIUser"));
    const user = await getService(`getuser/${User?._id}`);
    if (user?.data?.success) {
      setUserAddresss(user?.data?.data?.contact_address);
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
          document.getElementById("express").click();
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
      const phoneValue = selectedAddr.phone || selectedAddr.mobile || "";
      const mobileValue = selectedAddr.mobile || selectedAddr.phone || "";
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
        gstin: selectedAddr.gstin,
        address: selectedAddr.address,
        pincode: selectedAddr.pincode,
        landmark: selectedAddr.landmark,
        town: selectedAddr.town,
        email: orderEmail,
        state: selectedAddr.state,
        user: JSON.parse(localStorage.getItem("PIUser"))?._id,
        totalOrderValue: orderValue,
        totalCartValue: cart?.total_amount,
        shippingCost: shippingCost,
        taxableAmount: gstTax,
        paymentStatus: "Not Paid",
        utrNumber: "0",
        couponCode: cart?.appliedCouponName,
      };
      console.log(userAddresss[selectedIndex]?.gstin.length);
      console.log(totalcartval);
      if (totalcartval > 1 && userAddresss[selectedIndex]?.gstin.length < 15) {
        toast.error("Please add a GST number for this order.");
        return;
      }
      if (pincode !== userAddresss[selectedIndex]?.pincode) {
        toast.error(
          "Entered pincode does not match your selected address pincode.",
        );
        return;
      }

      setIsSubmitting(true); // Set loading state before API calls

      try {
        if (cart?.couponUse === "single") {
          const userId = JSON.parse(localStorage.getItem("PIUser"))?._id;
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
    const User = JSON.parse(localStorage.getItem("PIUser"));
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
          document.getElementById("express").click();
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
      {!authChecked || !token ? null : (
      <div>
        <div className="row p-0 m-0">
          <div className="container-fluid tw-ml-0 tw-mb-0 tw-mr-0 tw-px-[120px] tw-bg-white max-[900px]:tw-px-[15px] max-[900px]:tw-bg-[#ededed]">
            <div className="row bg-white mb-3 mt-3 tw-flex max-[900px]:tw-px-[15px] max-[900px]:tw-rounded-lg max-[900px]:tw-border max-[900px]:tw-border-solid max-[900px]:tw-border-[rgba(0,0,0,0.1)]"> 
              <div className="col-12 col-md-6">
                <div className="mt-1">
                  <span
                    className="p-0 mx-0"
                    style={{
                      color: "#3A5BA2",
                      fontSize: "30px",
                      fontStyle: "normal",
                      fontWeight: "700",
                      lineHeight: "48px",
                    }}
                  >
                    BILLING DETAILS
                  </span>
                </div>
                {token && (
                  <div
                    className="container p-0 m-0 mb-3"
                    style={{ width: "auto", minHeight: "auto" }}
                  >
                    <p
                      className="p-0"
                      style={{
                        color: "var(--heading, #1D1D1D)",
                        fontSize: "17px",
                        fontStyle: "normal",
                        fontWeight: "600",
                        fontFamily: "Montserrat",
                      }}
                    >
                      Select Address:
                    </p>
                    <div className="mt-3 d-flex flex-wrap flex-row justify-content-between align-items-center">
                      {userAddresss?.map((x, index) => {
                        return (
                          <div
                            className={
                              "px-3 py-3 mt-3 bg-white d-flex flex-column justify-content-start align-items-start " +
                              "tw-w-[48%] tw-min-h-[230px] max-[900px]:tw-w-full tw-rounded-xl tw-transition-all tw-duration-200 hover:tw-shadow-md " +
                              (selectedIndex === index
                                ? "tw-border-2 tw-border-solid tw-border-[#182c5a] tw-shadow-md"
                                : "tw-border tw-border-solid tw-border-slate-200 tw-shadow-sm")
                            }
                            key={index}
                            style={{
                              cursor: "pointer",
                            }}
                            onClick={() => setSelectedIndex(index)}
                          >
                            <p className="p-0 m-0 tw-text-slate-800" style={{ fontSize: "16px" }}>
                              <strong>{x?.name}</strong>
                            </p>
                            <p
                              className="p-0 m-0 w-100 mt-2 tw-text-slate-600"
                              style={{ fontSize: "13px" }}
                            >
                              <strong>Street: </strong>
                              {x?.address}
                            </p>
                            {x?.landmark && (
                              <p
                                className="p-0 m-0 w-100 mt-1 tw-text-slate-600"
                                style={{ fontSize: "13px" }}
                              >
                                <strong>Landmark: </strong> {x?.landmark}
                              </p>
                            )}
                            <p
                              className="p-0 m-0 w-100 mt-1 tw-text-slate-600"
                              style={{ fontSize: "13px" }}
                            >
                              <strong>City: </strong>
                              <span style={{ fontWeight: "600" }}>
                                {x?.town}
                              </span>
                            </p>
                            {x?.state && (
                              <p
                                className="p-0 m-0 w-100 mt-1 tw-text-slate-600"
                                style={{ fontSize: "13px" }}
                              >
                                <strong>State: </strong>
                                {x?.state}
                              </p>
                            )}
                            {x?.pincode && (
                              <p
                                className="p-0 m-0 w-100 mt-1 tw-text-slate-600"
                                style={{ fontSize: "13px" }}
                              >
                                <strong>Zip code: </strong> {x?.pincode}
                              </p>
                            )}
                            {x?.mobile && (
                              <p
                                className="p-0 m-0 w-100 mt-1 tw-text-slate-600"
                                style={{ fontSize: "13px" }}
                              >
                                <strong>Phone number: </strong> {x?.mobile}
                              </p>
                            )}
                            <p
                              className="p-0 m-0 w-100 mt-1 tw-text-slate-600"
                              style={{ fontSize: "13px" }}
                            >
                              <strong>Email: </strong>
                              {x?.email}
                            </p>
                            {x?.gstin && (
                              <p
                                className="p-0 m-0 w-100 mt-1 tw-text-slate-600"
                                style={{ fontSize: "13px" }}
                              >
                                <strong>GSTIN: </strong> {x?.gstin}
                              </p>
                            )}

                            <div className="mt-auto pt-3 d-flex flex-row justify-content-start align-items-center">
                              <p
                                className="p-0 m-0 tw-text-[#182c5a] hover:tw-text-[#e92227] tw-transition-colors"
                                style={{
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                }}
                                onClick={(e) => handleEdit(e, x)}
                              >
                                Edit
                              </p>
                              <div
                                className="p-0"
                                style={{
                                  textAlign: "center",
                                  marginLeft: "12px",
                                  height: "12px",
                                  borderLeft: "1px solid #D9D9D9",
                                }}
                              ></div>
                              <p
                                className="p-0 m-0 mx-2 tw-text-slate-500 hover:tw-text-red-500 tw-transition-colors"
                                style={{
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                }}
                                onClick={(e) => handleRemove(e, index)}
                              >
                                Remove
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div
                        className={
                          "mt-3 bg-white d-flex flex-column justify-content-center align-items-center " +
                          "tw-w-[48%] tw-min-h-[230px] max-[900px]:tw-w-full tw-rounded-xl tw-border-2 tw-border-dashed tw-border-slate-200 hover:tw-border-slate-400 hover:tw-text-[#182c5a] tw-transition-all tw-duration-200"
                        }
                        style={{
                          cursor: "pointer",
                        }}
                        onClick={() => setVisible(true)}
                      >
                        <FontAwesomeIcon
                          icon={faAdd}
                          style={{
                            color: "#94a3b8",
                            width: "32px",
                            height: "32px",
                            marginBottom: "8px"
                          }}
                        />
                        <p className="m-0 tw-text-sm tw-text-slate-500">
                          <strong>Add address</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {!token && (
                  <form
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      padding: "0px",
                      margin: "0px",
                      marginLeft: "0px",
                      marginTop: "30px",
                    }}
                    onSubmit={handleOrder}
                  >
                    <>
                      <label className="p-0 mt-0">Full Name*</label>
                      <input
                        style={{
                          width: "100%",
                          height: "48px",
                          backgroundColor: "white",
                          border: "1px solid #EBEBEB",
                          padding: "10px",
                        }}
                        required
                        value={details.name}
                        onChange={(e) =>
                          setDetails({ ...details, name: e.target.value })
                        }
                      />
                      <label className="p-0 mt-3">Mobile Number</label>
                      <input
                        style={{
                          width: "100%",
                          height: "48px",
                          backgroundColor: "white",
                          border: "1px solid #EBEBEB",
                          padding: "10px",
                        }}
                        value={details.mobile}
                        onChange={(e) =>
                          setDetails({ ...details, mobile: e.target.value })
                        }
                      />
                      <label className="p-0 mt-3">GSTIN</label>
                      <input
                        style={{
                          width: "100%",
                          height: "48px",
                          backgroundColor: "white",
                          border: "1px solid #EBEBEB",
                          padding: "10px",
                        }}
                        value={details.gstin}
                        onChange={(e) =>
                          setDetails({ ...details, gstin: e.target.value })
                        }
                      />
                      <label className="p-0 mt-3">
                        Flat, House no., Building, Apartment*
                      </label>
                      <input
                        placeholder="House number and street name"
                        style={{
                          width: "100%",
                          height: "48px",
                          backgroundColor: "white",
                          border: "1px solid #EBEBEB",
                          padding: "10px",
                        }}
                        required
                        value={details.address}
                        onChange={(e) =>
                          setDetails({ ...details, address: e.target.value })
                        }
                      />
                      <label className="p-0 mt-3">Pin Code</label>
                      <input
                        style={{
                          width: "100%",
                          height: "48px",
                          backgroundColor: "white",
                          border: "1px solid #EBEBEB",
                          padding: "10px",
                        }}
                        value={details.pincode}
                        onChange={(e) =>
                          setDetails({ ...details, pincode: e.target.value })
                        }
                      />
                      <label className="p-0 mt-3">Landmark</label>
                      <input
                        style={{
                          width: "100%",
                          height: "48px",
                          backgroundColor: "white",
                          border: "1px solid #EBEBEB",
                          padding: "10px",
                        }}
                        value={details.landmark}
                        onChange={(e) =>
                          setDetails({ ...details, landmark: e.target.value })
                        }
                      />
                      <label className="p-0 mt-3">Town/City*</label>
                      <input
                        style={{
                          width: "100%",
                          height: "48px",
                          backgroundColor: "white",
                          border: "1px solid #EBEBEB",
                          padding: "10px",
                        }}
                        required
                        value={details.town}
                        onChange={(e) =>
                          setDetails({ ...details, town: e.target.value })
                        }
                      />
                      <label className="p-0 mt-3">Email address*</label>
                      <input
                        style={{
                          width: "100%",
                          height: "48px",
                          backgroundColor: "white",
                          border: "1px solid #EBEBEB",
                          padding: "10px",
                        }}
                        value={details.email}
                        onChange={(e) =>
                          setDetails({ ...details, email: e.target.value })
                        }
                      />
                      <label className="p-0 mt-3">State</label>
                      <Select
                        options={states}
                        placeholder="choose a state"
                        value={selectedState}
                        onChange={setSelectedState}
                        instanceId="checkout-state-select"
                        inputId="checkout-state-select"
                      ></Select>
                    </>
                  </form>
                )}
              </div>
              <div className="col-12 col-md-6 tw-my-4 tw-px-4 max-[900px]:tw-px-0">
                <div className="tw-bg-white tw-rounded-2xl tw-shadow-[0_4px_20px_rgba(0,0,0,0.05)] tw-border tw-border-solid tw-border-slate-100 tw-p-6 md:tw-p-8">
                  <p
                    className="p-0 tw-text-[#182c5a] tw-text-xl tw-font-bold tw-mb-6 tw-tracking-wide tw-font-sans"
                  >
                    YOUR ORDER
                  </p>
                  <div className="tw-divide-y tw-divide-slate-100">
                    {/* Header */}
                    <div className="tw-flex tw-justify-between tw-pb-3 tw-text-xs tw-font-semibold tw-text-slate-400 tw-uppercase tw-tracking-wider">
                      <span>Product</span>
                      <span>Total</span>
                    </div>

                    {/* Products */}
                    {cart?.products?.map((x, index) => (
                      <div className="tw-flex tw-justify-between tw-items-center tw-py-4" key={index}>
                        <div className="tw-flex tw-items-center tw-gap-4 tw-pr-4">
                          <img
                            className="tw-w-14 tw-h-14 tw-object-contain tw-bg-slate-50 tw-rounded-lg tw-border tw-border-solid tw-border-slate-100 tw-p-1"
                            alt={x?.product?.name || "Cart product"}
                            src={x?.product?.images?.[0]?.image || "/pp_logo_1.png"}
                          />
                          <div>
                            <p className="tw-text-sm tw-font-medium tw-text-slate-800 tw-capitalize tw-line-clamp-2 max-w-[280px]">
                              {x?.product?.name} {x?.product?.model}
                            </p>
                            <span className="tw-text-xs tw-text-slate-400 tw-mt-0.5 tw-block">
                              Pack of {x?.packSize} pcs • Qty {x?.quantity}
                            </span>
                          </div>
                        </div>
                        <div className="tw-text-right tw-font-semibold tw-text-slate-800">
                          {cart?.appliedCoupon && cart?.couponType === "product" && x?.discountPrice ? (
                            <div className="tw-flex tw-flex-col">
                              <span className="tw-text-xs tw-text-slate-400 tw-line-through">₹{Math.round(x?.price * x?.quantity)}</span>
                              <span className="tw-text-sm tw-text-red-500">₹{Math.round(x?.discountPrice * x?.quantity)}</span>
                            </div>
                          ) : (
                            <span className="tw-text-sm">₹{Math.round(x?.price * x?.quantity)}</span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Total Cart Value */}
                    <div className="tw-flex tw-justify-between tw-items-center tw-py-4">
                      <span className="tw-text-sm tw-font-medium tw-text-slate-600">Total Cart Value</span>
                      <span className="tw-text-sm tw-font-semibold tw-text-slate-800">
                        {cart?.discount_amount === 0 ? (
                          `₹${Math.round(cart?.total_amount)}`
                        ) : (
                          <div className="tw-flex tw-flex-col tw-items-end">
                            <span className="tw-text-xs tw-text-slate-400 tw-line-through">₹{Math.round(cart?.total_amount)}</span>
                            <span className="tw-text-sm tw-text-red-500">₹{Math.round(cart?.discount_amount)}</span>
                          </div>
                        )}
                      </span>
                    </div>

                    {/* Delivery Method */}
                    <div className="tw-py-4">
                      <p className="tw-text-sm tw-font-semibold tw-text-slate-700 tw-mb-3">Choose Delivery Method</p>
                      <div className="tw-space-y-3">
                        {/* Express Delivery */}
                        <label className="tw-flex tw-items-start tw-gap-3 tw-p-3 tw-rounded-lg tw-border tw-border-solid tw-border-slate-100 hover:tw-bg-slate-50 tw-cursor-pointer tw-transition-colors">
                          <input
                            type="radio"
                            id="express"
                            name="shipping"
                            value="express"
                            className="tw-mt-1"
                            onChange={(e) => handleShippingChange(e.target.value)}
                          />
                          <div className="tw-flex-1">
                            <div className="tw-flex tw-justify-between tw-items-center">
                              <span className="tw-text-sm tw-font-medium tw-text-slate-800">Express Delivery (2-3 Working Days)</span>
                              <span className="tw-text-sm tw-font-semibold tw-text-[#182c5a]">Rs.100</span>
                            </div>
                            <span className="tw-text-xs tw-text-slate-400 tw-italic">Applicable for Delhi NCR</span>
                          </div>
                        </label>

                        {/* Standard Delivery */}
                        <label className="tw-flex tw-items-start tw-gap-3 tw-p-3 tw-rounded-lg tw-border tw-border-solid tw-border-slate-100 hover:tw-bg-slate-50 tw-cursor-pointer tw-transition-colors">
                          <input
                            type="radio"
                            id="standard"
                            name="shipping"
                            value="standard"
                            className="tw-mt-1"
                            onChange={(e) => handleShippingChange(e.target.value)}
                          />
                          <div className="tw-flex-1">
                            <div className="tw-flex tw-justify-between tw-items-center">
                              <span className="tw-text-sm tw-font-medium tw-text-slate-800">Standard Delivery (7-10 Working Days)</span>
                              <span className="tw-text-sm tw-font-semibold tw-text-green-600">Free</span>
                            </div>
                            <span className="tw-text-xs tw-text-slate-400 tw-italic">Applicable Pan India</span>
                          </div>
                        </label>
                      </div>

                      {/* Pincode Input */}
                      {radiobtn && (
                        <div className="tw-mt-4 tw-flex tw-gap-3">
                          <input
                            style={{ paddingLeft: "10px" }}
                            placeholder="Enter Pincode"
                            className="tw-flex-1 tw-h-10 tw-border tw-border-solid tw-border-slate-200 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-border-[#182c5a] tw-transition-colors"
                            value={pincode}
                            maxLength={6}
                            pattern="[0-9]*"
                            onChange={(e) => {
                              const enteredValue = e.target.value.replace(/\D/g, "");
                              setPincode(enteredValue);
                              if (enteredValue.length === 6) {
                                calculateFinalShipCost(enteredValue);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Delivery Cost Row */}
                    <div className="tw-flex tw-justify-between tw-items-center tw-py-4">
                      <span className="tw-text-sm tw-font-medium tw-text-slate-600">Delivery Charges</span>
                      <span className="tw-text-sm tw-font-semibold tw-text-slate-800">
                        {cart?.appliedCoupon && cart?.couponType === "shipping" ? (
                          <div className="tw-flex tw-gap-2">
                            <s className="tw-text-slate-400">₹{Math.round(originalShippingCost)}</s>
                            <span className="tw-text-red-500">₹{Math.round(shippingCost)}</span>
                          </div>
                        ) : (
                          <span>₹{Math.round(shippingCost)}</span>
                        )}
                      </span>
                    </div>

                    {/* Total Cart Value + Delivery */}
                    <div className="tw-flex tw-justify-between tw-items-center tw-py-4">
                      <span className="tw-text-sm tw-font-medium tw-text-slate-600">Total Cart Value + Delivery Charges</span>
                      <span className="tw-text-sm tw-font-semibold tw-text-slate-800">
                        {cart?.discount_amount != 0 ? (
                          <span>₹{Math.round(orderValueBeforeTaxAllTypeDiscount)}</span>
                        ) : cart?.couponType === "both" ? (
                          <div className="tw-flex tw-gap-2">
                            <s className="tw-text-slate-400">₹{Math.round(orderValueBeforeTax)}</s>
                            <span className="tw-text-red-500">₹{Math.round(bothTypeDiscountOrderValueBeforeTax)}</span>
                          </div>
                        ) : (
                          <span>₹{Math.round(orderValueBeforeTax)}</span>
                        )}
                      </span>
                    </div>

                    {/* GST Row */}
                    <div className="tw-flex tw-justify-between tw-items-center tw-py-4">
                      <span className="tw-text-sm tw-font-medium tw-text-slate-600 tw-flex tw-items-center tw-gap-1.5 tw-relative">
                        GST
                        <sup onClick={togglePopup} className="tw-cursor-pointer tw-text-[#182c5a] hover:tw-opacity-80">
                          <img src="/circleinfo.svg" alt="" height={14} width={14} />
                        </sup>
                        {showPopup && (
                          <span className="tw-absolute tw-bg-slate-800 tw-text-white tw-text-[10px] tw-p-2 tw-rounded-lg tw-shadow-lg tw-z-10 tw-mt-8 tw-max-w-[200px]">
                            GST is calculated from server category and subcategory rates.
                          </span>
                        )}
                      </span>
                      <span className="tw-text-sm tw-font-semibold tw-text-slate-800">₹{Math.round(gstTax)}</span>
                    </div>

                    {/* Coupon Row */}
                    {cart?.appliedCoupon && (
                      <div className="tw-flex tw-justify-between tw-items-center tw-py-4">
                        <span className="tw-text-sm tw-font-medium tw-text-slate-600">Coupon Code ({cart?.appliedCouponName})</span>
                        <span className="tw-text-sm tw-font-semibold tw-text-green-600">Applied</span>
                      </div>
                    )}

                    {/* Total Payable Amount */}
                    <div className="tw-flex tw-justify-between tw-items-center tw-py-5 tw-border-t tw-border-solid tw-border-slate-100">
                      <span className="tw-text-base tw-font-bold tw-text-[#182c5a]">Total Payable Amount</span>
                      <span className="tw-text-xl tw-font-extrabold tw-text-[#182c5a]">₹{Math.round(totalOrderValue)}</span>
                    </div>
                  </div>

                  {/* Payment Note */}
                  <div className="tw-mt-6 tw-bg-amber-50/60 tw-border tw-border-solid tw-border-amber-100 tw-rounded-xl tw-p-4 tw-flex tw-gap-3">
                    <div className="tw-text-amber-800 tw-text-xs max-[900px]:tw-text-xs tw-leading-relaxed">
                      Only Prepaid Orders accepted. For payment, use this UPI ID: <strong className="tw-text-amber-900 tw-bg-amber-100/50 tw-px-1.5 tw-py-0.5 tw-rounded tw-font-mono tw-text-sm">premindustriesecom@hsbc</strong>. Once we receive your payment, we will update your order status and an Email Confirmation will be sent.
                    </div>
                  </div>

                  {/* Button */}
                  <div className="tw-mt-6 tw-flex tw-justify-center">
                    {stockCheckResult ? (
                      <p className="tw-text-sm tw-text-red-500 tw-font-semibold">
                        Some Items are out of stock. Cannot Place Order!
                      </p>
                    ) : (
                      <button
                        className="tw-w-full tw-bg-[#182c5a] hover:tw-bg-[#e92227] tw-text-white tw-font-bold tw-text-sm tw-py-3.5 tw-px-8 tw-rounded-xl tw-transition-colors tw-shadow-sm"
                        style={{
                          opacity: isSubmitting ? 0.7 : 1,
                          cursor: isSubmitting ? "not-allowed" : "pointer",
                        }}
                        disabled={isSubmitting}
                        onClick={() => handleOrder(cart?.total_amount)}
                      >
                        {isSubmitting ? "PROCESSING..." : "PLACE ORDER"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
        .deliverycostdiv {
          height: 222px;
          border: 1px solid #ebebeb;
          border-top: none;
          border-left: none;
          display: flex;
          align-items: center;
        }
        @media (max-width: 915px) { .deliverycostdiv { height: 310px; } }
        @media (max-width: 780px) { .deliverycostdiv { height: 355px; } }
        @media (max-width: 450px) { .deliverycostdiv { height: 332px; } }
        @media (max-width: 415px) { .deliverycostdiv { height: 353px; } }
        @media (max-width: 391px) { .deliverycostdiv { height: 353px; } }
        @media (max-width: 361px) { .deliverycostdiv { height: 378px; } }
      `}</style>
    </>
  );
};

export default Checkoutpage;


