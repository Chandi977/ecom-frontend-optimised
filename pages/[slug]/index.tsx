"use client"; // This is a client component 👈🏽
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faChevronRight,
  faHeart,
  faHeartbeat,
} from "@fortawesome/free-solid-svg-icons";
import { Global, css } from "@emotion/react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { getService } from "../../services/service";
import Head from "next/head";
import BuySection from "../../components/product/BuySection";
import RelatedSection from "../../components/product/RelatedSection";
import { addToCart } from "../../utils/cart";
import {
  addToFav,
  getFav,
  removeFromFav,
  WISHLIST_UPDATED_EVENT,
} from "../../utils/favourites";
import { AiOutlineShareAlt } from "react-icons/ai";
import { SP } from "next/dist/shared/lib/utils";
import ShareModal from "../../components/product/ShareModal";
import { toast } from "react-toastify";
import { DEV } from "../../services/constants";
import { getOverviewFields } from "../../utils/overviewFields";
import { isFieldVisible, FIELD_VISIBILITY_KEYS } from "../../utils/fieldVisibility";
import { motion } from "framer-motion";
import ProductGallery from "../../components/product/ProductGallery";
import ProductInventory from "../../components/product/ProductInventory";
import ProductPricing from "../../components/product/ProductPricing";
import ProductSpecifications from "../../components/product/ProductSpecifications";
import {
  getLegacyCompatibleProduct,
  getPriceTiers,
  getProductSeo,
  type NormalizedPriceTier,
} from "../../utils/productCatalog";
import { trackProductView } from "../../lib/analytics";

const CARRY_BAG_CATEGORY_IDS = [
  "6557df71301ec4f2f4266145",
  "689d73214687bb4e437542e0",
];
const FOOD_WRAPPING_CATEGORY_IDS = [
  "69dcb22e733b8ba056529a9f",
  "679ca70f2833ca433fa0aa9c",
];

export async function getServerSideProps(context) {
  context.res?.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  const requestedSlug = Array.isArray(context?.query?.slug)
    ? context.query.slug[0]
    : context?.query?.slug;
  const encodedSlug = requestedSlug
    ? encodeURIComponent(String(requestedSlug))
    : "";
  const res = encodedSlug ? await getService(`product/get/${encodedSlug}`) : null;

  if (!res?.data?.data) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      product: res.data.data,
    },
  };
}

const renderMultilineText = (text?: string) => {
  if (!text) return null;
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    return (
      <ul style={{ listStyleType: "disc", paddingLeft: "20px", margin: "8px 0" }}>
        {lines.map((line, idx) => {
          const cleanedLine = line.replace(/^[-*•]\s*/, "");
          return <li key={idx} style={{ marginBottom: "6px" }}>{cleanedLine}</li>;
        })}
      </ul>
    );
  }
  return <p style={{ whiteSpace: "pre-line", margin: 0 }}>{text}</p>;
};

const Productpage = ({ product: rawProduct }) => {
  const product = React.useMemo(() => {
    if (!rawProduct) return rawProduct;
    const updated = { ...getLegacyCompatibleProduct(rawProduct) };
    if (rawProduct.slug === "amazon-paper-bag-pm1" || rawProduct._id === "655b45fe0ebe678ef4df6849") {
      if (!updated.adhesive) updated.adhesive = "Self-Adhesive";
      if (!updated.color) updated.color = "Brown";
    }
    if (rawProduct.slug === "amazon-polybag-nmt1-52.5-micron" || rawProduct._id === "655bddfc74aaa9c6f3318d8e") {
      if (!updated.adhesive) updated.adhesive = "Self-Adhesive";
    }
    return updated;
  }, [rawProduct]);
  //console.log(product);
  const [visible, setVisible] = useState(false);
  const [priceList, setPriceList] = useState<NormalizedPriceTier[]>([]);
  const [priceIndex, setPriceIndex] = useState(0);
  const [price, setPrice] = useState(0);
  const [MRP, setMRP] = useState(0);
  const [stock, setStock] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [favourite, setFavourite] = useState<Array<{ product?: { _id?: string } }>>([]);
  const [index, setIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedNumber, setSelectedNumber] = useState(1);
  const [selectedPackWeight, setSelectedPackWeight] = useState(1);
  const [packSize, setSelectedPackSize] = useState(0);
  const [share, setShare] = useState(false);  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userMobileNo, setUserMobileNo] = useState<string | null>(null);  const [showPopup, setShowPopup] = useState(false);
  const [isAboutExpanded, setIsAboutExpanded] = useState(true);
  const [isDescExpanded, setIsDescExpanded] = useState(true);
  const seo = getProductSeo(product);
  const categoryId =
    typeof product?.category === "object"
      ? product?.category?._id
      : product?.category;
  const categoryName =
    typeof product?.category === "object" ? product?.category?.name || "" : "";
  const categorySlug =
    typeof product?.category === "object" ? product?.category?.slug || "" : "";

  // Customer-behavior + demand signal: record one product view per product load.
  useEffect(() => {
    if (product?._id) {
      trackProductView({
        id: product._id,
        name: product?.name,
        category: categoryName,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  const isCarryBagProduct =
    CARRY_BAG_CATEGORY_IDS.includes(String(categoryId)) ||
    /carry.*bag/i.test(categoryName) ||
    /carry.*bag/i.test(categorySlug);

  const isFoodWrappingProduct =
    FOOD_WRAPPING_CATEGORY_IDS.includes(String(categoryId)) ||
    /food.*wrapping|foil/i.test(categoryName) ||
    /food.*wrapping|foil/i.test(categorySlug);

  const isTapeProduct =
    [
      "6557df71301ec4f2f4266145",
      "6557df64301ec4f2f4266141",
      "6642e8f665f20fe41ab417bc",
    ].includes(String(categoryId)) ||
    /tape/i.test(categoryName) ||
    /tape/i.test(categorySlug);

  const isPaperBagProduct =
    categoryId === "6557df46301ec4f2f4266139" ||
    /paper.*bag/i.test(categoryName) ||
    /paper.*bag/i.test(categorySlug);

  const isPolyBagProduct =
    categoryId === "6557df4f301ec4f2f426613d" ||
    /poly.*bag/i.test(categoryName) ||
    /poly.*bag/i.test(categorySlug);

  const isLabelProduct =
    categoryId === "6557deb6301ec4f2f4266135" ||
    /label/i.test(categoryName) ||
    /label/i.test(categorySlug);

  const isCorrugatedProduct =
    categoryId === "6557deab301ec4f2f4266131" ||
    categoryId === "6926d7c0d53f3a772c6f08af" ||
    /corrugated/i.test(categoryName) ||
    /corrugated/i.test(categorySlug);

  const isCarryHandleTapeProduct =
    categoryId === "67cac1fc2a4e1c9ef44a92b5" ||
    /carry.*handle.*tape/i.test(categoryName) ||
    /carry.*handle.*tape/i.test(categorySlug);
  // Admin-controlled storefront visibility for the fixed top-card elements.
  const showQuickOverview = isFieldVisible(product, FIELD_VISIBILITY_KEYS.sectionQuickOverview);
  const showSpecifications = isFieldVisible(product, FIELD_VISIBILITY_KEYS.sectionSpecifications);
  const showProductDetails = isFieldVisible(product, FIELD_VISIBILITY_KEYS.sectionProductDetails);
  const showAboutItem = isFieldVisible(product, FIELD_VISIBILITY_KEYS.aboutItem);
  const showGstNote = isFieldVisible(product, FIELD_VISIBILITY_KEYS.noteGst);
  const showDeliveryNote = isFieldVisible(product, FIELD_VISIBILITY_KEYS.noteDelivery);
  const showBadgeFreeDelivery = isFieldVisible(product, FIELD_VISIBILITY_KEYS.badgeFreeDelivery);
  const showBadgeSecureTransaction = isFieldVisible(product, FIELD_VISIBILITY_KEYS.badgeSecureTransaction);
  const showBadgeNoReturns = isFieldVisible(product, FIELD_VISIBILITY_KEYS.badgeNoReturns);
  const showBadgeRecyclable = isFieldVisible(product, FIELD_VISIBILITY_KEYS.badgeRecyclable);

  const aboutItemText = React.useMemo(() => {
    if (product?.aboutItem && String(product.aboutItem).trim() !== "" && String(product.aboutItem).trim().toLowerCase() !== "text pending") {
      return product.aboutItem;
    }
    if (isPaperBagProduct) {
      return `- Made from high-quality kraft paper for durability.
- Eco-friendly, recyclable, and biodegradable.
- Strong handles for comfortable carrying.
- Available in multiple sizes, colors, and GSM options.
- Suitable for retail, gifting, grocery, and takeaway packaging.
- Can be customized with brand logo and printing.`;
    }
    return "";
  }, [product?.aboutItem, isPaperBagProduct]);

  const usageText = React.useMemo(() => {
    if (product?.usage && String(product.usage).trim() !== "" && String(product.usage).trim().toLowerCase() !== "text pending") {
      return product.usage;
    }
    if (isPaperBagProduct) {
      return `- Keep away from direct water contact or excessive moisture.
- Store in a cool, dry place.
- Do not exceed the recommended load capacity.
- Reusable multiple times under normal handling.`;
    }
    return "";
  }, [product?.usage, isPaperBagProduct]);
  const descriptionText = product?.description
    ? product.description.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()
    : "";
  const hasDescription = Boolean(descriptionText);
  const hasUsage = Boolean(usageText);
  const showDescriptionDetails = showProductDetails && hasDescription;
  const showUsageDetails = showProductDetails && hasUsage;
  const showExpandedProductDetails =
    showDescriptionDetails || showSpecifications || showUsageDetails;

  const safePrice = Number.isFinite(Number(price)) ? Number(price) : 0;
  const safeMRP = Number.isFinite(Number(MRP)) ? Number(MRP) : 0;
  const discountPercent =
    safeMRP > 0 ? Math.round(((safeMRP - safePrice) / safeMRP) * 100) : 0;

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  const getFavourite = async () => {
    const result = await getFav();
    setFavourite(Array.isArray(result) ? result : []);
  };

  useEffect(() => {
    // console.log("61", product);
    if (product) {
      const tiers = getPriceTiers(product);
      if (tiers.length > 0) {
        const tier = tiers[0];
        setPriceList(tiers);
        setPriceIndex(0);
        setPrice(tier.sellingPrice);
        setMRP(tier.mrp);
        setQuantity(1);
        setSelectedNumber(tier.number);
        setSelectedPackWeight(tier.packWeight || 0);
        setStock(tier.stockQuantity || 0);
      } else {
        setPrice(product?.price);
        setQuantity(1);
      }
    }
    getFavourite();
  }, [product]);

  useEffect(() => {
    const handleWishlistUpdate = () => {
      getFavourite();
    };

    window.addEventListener(WISHLIST_UPDATED_EVENT, handleWishlistUpdate);
    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, handleWishlistUpdate);
    };
  }, []);

  const handlePlus = () => {
    setQuantity(quantity + 1);
  };

  const handleMinus = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleCart = async (e) => {
    e.stopPropagation();
    const priceForOne = price / selectedNumber;

    if (quantity > stock) {
      toast.error("Quantity selected is not in stock.");
      return;
    }

    //console.log("Selected Number of Packs:", selectedNumber);
    //console.log("Price for One Pack:", packSize);
    // console.log("Selected Pack Weight:", selectedPackWeight);
    // console.log("quantity", quantity);
    const brand = product.brand._id;
    const category = product.category;
    // console.log("category", category);

    const result = await addToCart(
      product,
      quantity,
      price,
      selectedPackWeight,
      packSize,
      selectedNumber,
      brand,
      category,
      stock,
    );
    // console.log("169",result);
  };

  const checkFav = (id) => {
    const temp = favourite?.map((x) => x?.product?._id).indexOf(id);
    if (temp === -1 || temp === undefined || temp === null) {
      return false;
    } else {
      return true;
    }
  };

  const handleFavourite = async (e, product) => {
    e.stopPropagation();
    const temp = favourite?.map((x) => x?.product?._id).indexOf(product?._id);
    if (temp === -1 || temp === undefined || temp === null) {
      await addToFav(product);
      getFavourite();
    } else {
      await removeFromFav(product?._id);
      getFavourite();
    }
  };

  const handleNumberChange = (event) => {
    const newNumber = parseInt(event.target.value);
    setSelectedNumber(newNumber);

    const selectedPriceData = priceList.find(
      (item) => item.number === newNumber,
    );

    if (!selectedPriceData) {
      return;
    }

    setSelectedPackWeight(selectedPriceData.packWeight || 0);
    setSelectedPackSize(selectedNumber);

    setPrice(selectedPriceData.sellingPrice);
    setMRP(selectedPriceData.mrp);
    setStock(selectedPriceData.stockQuantity || 0);
  };

  const handleTierChange = (tier: NormalizedPriceTier) => {
    setSelectedNumber(tier.number);
    setSelectedPackWeight(tier.packWeight || 0);
    setSelectedPackSize(tier.number);
    setPrice(tier.sellingPrice);
    setMRP(tier.mrp);
    setStock(tier.stockQuantity || 0);
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
  };

  const handleShare = () => {
    setShare(true);
    document.body.style.overflow = "hidden";
  };

  const handleClose = () => {
    setShare(false);
    document.body.style.overflow = "auto";
  };

  useEffect(() => {
    // Get the user's token from local storage
    const token = localStorage.getItem("PIToken");
    setToken(token);

    // Get the user's data from local storage
    const storedUser = localStorage.getItem("PIUser");
    const userData = storedUser ? JSON.parse(storedUser) : null;
    //console.log(userData);

    // Check if userData contains the user's name and store it in state
    if (userData && userData.first_name) {
      const fullName = `${userData.first_name} ${userData.last_name}`;
      setUserName(fullName);
      setUserEmail(userData.email_address);
      setUserMobileNo(userData.mobile_number);
    }
  }, []);

  const handleNotifyMe = async () => {
    // console.log(userName);
    // console.log(userEmail)
    // console.log(userMobileNo)
    // console.log(product?._id)

    const payload = {
      product_id: product?._id,
      name: userName,
      email_address: userEmail,
      mobile_number: userMobileNo,
    };

    try {
      const response = await fetch(DEV + "notify/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // console.log("Notification sent successfully!");
        toast.success("You will be notified once in stock.");
      } else {
        console.error("Failed to send notification.");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  return (
    <>
      <Head>
        <title>
          {seo.title || [
            product?.brand?.name,
            product?.name,
            product?.model,
            "Prem Packaging - Innovation In Action",
          ]
            .filter(Boolean)
            .join(" - ")}
        </title>
        {seo.description && <meta name="description" content={seo.description} />}
        {seo.keywords.length > 0 && (
          <meta name="keywords" content={seo.keywords.join(", ")} />
        )}
        <meta property="og:title" content={seo.title} />
        {seo.description && (
          <meta property="og:description" content={seo.description} />
        )}
        {seo.ogImage && <meta property="og:image" content={seo.ogImage} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.title} />
        {seo.description && (
          <meta name="twitter:description" content={seo.description} />
        )}
        {seo.canonical && <link rel="canonical" href={seo.canonical} />}
        {seo.schema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.schema) }}
          />
        )}
      </Head>
      <div>
        {share && <ShareModal data={product} handleClose={handleClose} />}
      </div>
      <div
        style={{
          fontFamily: "Montserrat",
        }}
      >
        <div className="row mt-3 p-0">
          <div className="container-fluid tw-m-0 tw-mt-[27px] tw-px-[110px] tw-bg-white max-[900px]:tw-mt-0 max-[900px]:tw-px-[10px] max-[900px]:tw-bg-[#f5f5f5]">
            <div className="row tw-m-0 tw-mt-[28px] tw-flex tw-flex-row max-[900px]:tw-flex-col">
              <div className="col-12 col-md-6 detail-card-left tw-flex tw-flex-col tw-justify-start tw-items-start">
                <p className="tw-hidden max-[900px]:tw-flex max-[900px]:tw-items-center max-[900px]:tw-gap-2 max-[900px]:tw-mt-[10px] max-[900px]:tw-px-[14px] max-[900px]:tw-text-black max-[900px]:tw-font-sans max-[900px]:tw-text-[17px] max-[900px]:tw-capitalize max-[900px]:tw-font-semibold max-[900px]:tw-leading-[29px] max-[900px]:tw-tracking-[0.51px] tw-flex-wrap">
                  <span>{product?.brand?.name} {product?.name}</span>
                  {product?.model && (
                    <span className="tw-text-[11px] tw-font-medium tw-text-gray-500 tw-bg-gray-100 tw-px-2 tw-py-0.5 tw-rounded tw-normal-case tw-border tw-border-solid tw-border-gray-200 tw-ml-1">
                      {product.model}
                    </span>
                  )}
                </p>

                <div className="tw-mt-5 max-[900px]:tw-mt-[12px] tw-w-full tw-relative">
                  {/* Out of Stock Badge */}
                  {(stock <= 0 || isNaN(stock)) && (
                    <div className="tw-absolute tw-top-4 tw-left-4 tw-z-10 tw-bg-[#fee2e2] tw-text-[#e92227] tw-px-3 tw-py-1.5 tw-text-xs tw-font-bold tw-rounded-md">
                      Out of Stock
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => handleFavourite(e, product)}
                    className="tw-absolute tw-top-4 tw-right-4 tw-z-10 tw-w-10 tw-h-10 tw-flex tw-items-center tw-justify-center tw-bg-white tw-border tw-border-solid tw-border-gray-200 tw-rounded-full tw-shadow-sm tw-cursor-pointer hover:tw-scale-105 active:tw-scale-95 tw-transition-all"
                    style={{ border: "1px solid #ebebeb" }}
                    aria-label={checkFav(product?._id) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {checkFav(product?._id) ? (
                      <FontAwesomeIcon
                        icon={faHeart}
                        style={{
                          color: "red",
                          fontSize: "18px",
                        }}
                      />
                    ) : (
                      <svg className="tw-w-5 tw-h-5 tw-text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    )}
                  </button>

                  <ProductGallery product={product} />
                </div>

                {/* Footer Badges Row */}
                <div className="tw-w-full tw-mt-6 tw-mb-4">
                  <div className="tw-grid tw-grid-cols-4 tw-gap-2 max-[767px]:tw-gap-1 tw-border tw-border-solid tw-border-gray-200 tw-rounded-xl tw-p-4 max-[767px]:tw-p-2 tw-bg-white" style={{ border: "1px solid #ebebeb" }}>
                    <div className="tw-flex tw-flex-col tw-items-center tw-text-center">
                      <svg className="tw-w-7 tw-h-7 tw-text-[#182c5a] tw-mb-1.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.75a1.125 1.125 0 0 1-1.125-1.125V4.625c0-.621.504-1.125 1.125-1.125H16.5a1.125 1.125 0 0 1 1.125 1.125v13a1.125 1.125 0 0 1-1.125 1.125m-3.75 0h4.875c.621 0 1.125-.504 1.125-1.125v-5.25c0-.411-.223-.79-.586-.975l-3.375-1.713a1.125 1.125 0 0 0-.97-.02L12 9.75M8.25 21h6.75" />
                      </svg>
                      <span className="tw-text-gray-800 tw-font-bold tw-text-[12px] max-[767px]:tw-text-[10px] tw-leading-tight">Free Delivery</span>
                      <span className="tw-text-gray-500 tw-text-[10px] max-[767px]:tw-text-[8px] tw-mt-0.5">Pan India</span>
                    </div>

                    <div className="tw-flex tw-flex-col tw-items-center tw-text-center">
                      <svg className="tw-w-7 tw-h-7 tw-text-[#182c5a] tw-mb-1.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                      </svg>
                      <span className="tw-text-gray-800 tw-font-bold tw-text-[12px] max-[767px]:tw-text-[10px] tw-leading-tight">Secure Packaging</span>
                      <span className="tw-text-gray-500 tw-text-[10px] max-[767px]:tw-text-[8px] tw-mt-0.5">100% Safe</span>
                    </div>

                    <div className="tw-flex tw-flex-col tw-items-center tw-text-center">
                      <svg className="tw-w-7 tw-h-7 tw-text-[#182c5a] tw-mb-1.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                      </svg>
                      <span className="tw-text-gray-800 tw-font-bold tw-text-[12px] max-[767px]:tw-text-[10px] tw-leading-tight">Bulk Order</span>
                      <span className="tw-text-gray-500 tw-text-[10px] max-[767px]:tw-text-[8px] tw-mt-0.5">Best Discounts</span>
                    </div>

                    <div className="tw-flex tw-flex-col tw-items-center tw-text-center">
                      <svg className="tw-w-7 tw-h-7 tw-text-[#182c5a] tw-mb-1.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      <span className="tw-text-gray-800 tw-font-bold tw-text-[12px] max-[767px]:tw-text-[10px] tw-leading-tight">Eco Friendly</span>
                      <span className="tw-text-gray-500 tw-text-[10px] max-[767px]:tw-text-[8px] tw-mt-0.5">100% Recyclable</span>
                    </div>
                  </div>
                </div>

                <div className="tw-w-full tw-hidden max-[900px]:tw-block tw-bg-[#EBEBEB] tw-h-[1px] tw-mt-[20px]"></div>
              </div>
              <div className="col-12 col-md-6 detail-card-right">
                <div className="tw-flex tw-flex-col tw-w-full">
                  <div
                    className="p-0 m-0"
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: "30px",
                      alignItems: "center",
                    }}
                  >
                    <div className="tw-text-black tw-p-0 tw-text-[32px] tw-font-semibold tw-leading-[35px] tw-tracking-[0.72px] tw-capitalize max-[900px]:tw-hidden tw-flex tw-items-center tw-gap-3 tw-flex-wrap">
                      <span>{product?.brand?.name} {product?.name}</span>
                      {product?.model && (
                        <span className="tw-text-[16px] tw-font-medium tw-text-gray-500 tw-bg-gray-100 tw-px-3 tw-py-1 tw-rounded-md tw-normal-case tw-border tw-border-solid tw-border-gray-200">
                          {product.model}
                        </span>
                      )}
                    </div>
                    <div onClick={handleShare} className="tw-cursor-pointer">
                      <AiOutlineShareAlt
                        style={{ width: "24px", height: "24px" }}
                      />
                    </div>
                  </div>

                  <div className="p-0 d-flex flex-row justify-content-between">
                    <div className="tw-flex tw-flex-col tw-justify-start tw-w-full">
                      <p className="tw-m-0 tw-hidden max-[900px]:tw-block max-[900px]:tw-text-[#828282] max-[900px]:tw-font-sans max-[900px]:tw-text-[14.9px] max-[900px]:tw-font-semibold max-[900px]:tw-leading-[22.528px] max-[900px]:tw-tracking-[0.298px]">Price</p>
                      <p className="tw-m-0 tw-hidden max-[900px]:tw-block max-[900px]:tw-text-[#828282] max-[900px]:tw-font-sans max-[900px]:tw-text-[14.9px] max-[900px]:tw-font-semibold max-[900px]:tw-leading-[22.528px] max-[900px]:tw-tracking-[0.298px]"> </p>
                      
                      <div className="mt-2 tw-w-full">
                        <ProductPricing
                          product={product}
                          selectedNumber={selectedNumber}
                          quantity={quantity}
                          showQuantity={false}
                          onTierChange={handleTierChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Specifications Table Layout */}
                  {product && showQuickOverview && (
                    <div className="tw-w-full tw-mt-4 tw-mb-4">
                      {getOverviewFields(
                        product,
                        selectedNumber,
                        selectedPackWeight,
                      ).map((field) => {
                        let icon = (
                          <svg className="tw-w-5 tw-h-5 tw-text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        );
                        const labelLower = field.label.toLowerCase();
                        if (labelLower.includes("dimension")) {
                          icon = (
                            <svg className="tw-w-5 tw-h-5 tw-text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.25v11.5a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 17.75V6.25A2.25 2.25 0 0 1 4.5 4h15a2.25 2.25 0 0 1 2.25 2.25Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v4m3-4v3m3-4v4m3-4v3m3-4v4" />
                            </svg>
                          );
                        } else if (labelLower.includes("brand")) {
                          icon = (
                            <svg className="tw-w-5 tw-h-5 tw-text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                            </svg>
                          );
                        } else if (labelLower.includes("hsn") || labelLower.includes("sac")) {
                          icon = (
                            <svg className="tw-w-5 tw-h-5 tw-text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h2v15H3zM7 4.5h1v15H7zM10 4.5h3v15h-3zM15 4.5h1v15h-1zM18 4.5h3v15h-3z" />
                            </svg>
                          );
                        } else if (labelLower.includes("gst")) {
                          icon = (
                            <svg className="tw-w-5 tw-h-5 tw-text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M10 6a2 2 0 11-4 0 2 2 0 014 0zm8 12a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          );
                        }

                        let displayLabel = field.label;
                        if (displayLabel === "Dimension (inch)") displayLabel = "Dimensions (inches)";
                        if (displayLabel === "Dimension (mm)") displayLabel = "Dimensions (mm)";

                        return (
                          <div key={field.label} className="tw-flex tw-flex-row tw-justify-between tw-items-center tw-py-3.5 max-[767px]:tw-py-2.5" style={{ borderBottom: "1px solid #ebebeb" }}>
                            <div className="tw-flex tw-flex-row tw-items-center tw-gap-3 max-[767px]:tw-gap-2">
                              {icon}
                              <span className="tw-text-gray-600 tw-text-[15px] max-[767px]:tw-text-[13px] tw-font-medium">{displayLabel}</span>
                            </div>
                            <span className="tw-text-gray-800 tw-text-[15px] max-[767px]:tw-text-[13px] tw-font-semibold tw-whitespace-nowrap">{field.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Common Field: About Item */}
                  {product && showAboutItem && (
                    <div className="tw-mt-3">
                      <span className="tw-text-[#182c5a] tw-text-[16px] tw-font-bold tw-block tw-mb-2">
                        About the Item / Highlights
                      </span>
                      <div style={{ fontWeight: "400", fontSize: "16px", color: "#828282" }}>
                        {!aboutItemText ? (
                          isTapeProduct || isPolyBagProduct || isCorrugatedProduct || isPaperBagProduct || isLabelProduct ? (
                            <span style={{ color: "#7f7f7f" }}>text pending</span>
                          ) : (
                            "Not Available"
                          )
                        ) : (
                          renderMultilineText(aboutItemText)
                        )}
                      </div>
                    </div>
                  )}


                  <div className="qty-action-container tw-flex tw-flex-row tw-items-center tw-justify-start tw-gap-6 tw-mt-4 tw-mb-5 max-[767px]:tw-gap-4 max-[767px]:tw-w-full">
                    {/* Quantity Selector on Left */}
                    <div className="tw-flex tw-flex-row tw-items-center tw-gap-4 max-[767px]:tw-gap-3">
                      <span className="tw-text-gray-800 tw-font-bold tw-text-[16px] max-[767px]:tw-hidden">Quantity</span>
                      <div className="tw-flex tw-flex-row tw-items-center tw-border tw-border-solid tw-border-gray-200 tw-rounded-lg tw-overflow-hidden tw-h-[44px]" style={{ border: "1px solid #d1d5db" }}>
                        <button
                          onClick={handleMinus}
                          disabled={stock <= 0 || isNaN(stock)}
                          className="tw-w-[44px] tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-gray-50 tw-border-0 tw-text-gray-600 tw-font-bold tw-text-lg hover:tw-bg-gray-100 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                        >
                          -
                        </button>
                        <div className="tw-w-[50px] tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-white tw-border-x tw-border-solid tw-border-gray-200" style={{ borderInline: "1px solid #d1d5db" }}>
                          <span className="tw-text-gray-800 tw-font-semibold tw-text-base">{quantity}</span>
                        </div>
                        <button
                          onClick={handlePlus}
                          disabled={stock <= 0 || isNaN(stock) || quantity >= stock}
                          className="tw-w-[44px] tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-gray-50 tw-border-0 tw-text-gray-600 tw-font-bold tw-text-lg hover:tw-bg-gray-100 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Action Button on Right */}
                    <div className="tw-flex tw-justify-start tw-flex-1">
                      {stock <= 0 || isNaN(stock) ? (
                        <motion.button
                          className="tw-border-0 tw-text-white tw-text-center tw-text-[16px] tw-font-semibold tw-flex tw-w-[213px] max-[767px]:tw-w-full tw-h-[44px] tw-items-center tw-justify-center tw-gap-[8px] tw-bg-[#182c5a] tw-rounded-lg"
                          whileHover={{ scale: 1.02, backgroundColor: "#e92227" }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.2 }}
                          onClick={handleNotifyMe}
                        >
                          <svg className="tw-w-5 tw-h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a9.04 9.04 0 0 1-5.714 0M3.167 12.75c0-4.107 3.327-7.433 7.433-7.433 4.106 0 7.433 3.326 7.433 7.433a3 3 0 0 0 3 3h-20.866a3 3 0 0 0 3-3ZM14.857 17.082a9.04 9.04 0 0 1-5.714 0" />
                          </svg>
                          Notify Me
                        </motion.button>
                      ) : (
                        <motion.button
                          className="tw-border-0 tw-text-white tw-text-center tw-text-[16px] tw-font-semibold tw-flex tw-w-[213px] max-[767px]:tw-w-full tw-h-[44px] tw-items-center tw-justify-center tw-gap-[8px] tw-bg-[#182c5a] tw-rounded-lg"
                          whileHover={{ scale: 1.02, backgroundColor: "#e92227" }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.2 }}
                          onClick={handleCart}
                        >
                          Add To Cart
                        </motion.button>
                      )}
                    </div>

                    {/* Mobile-only footer notes inside sticky bar */}
                    <div className="tw-hidden max-[767px]:tw-flex tw-flex-row tw-justify-center tw-w-full tw-text-gray-500 tw-text-[12px] tw-mt-2 tw-gap-1.5 tw-font-medium">
                      <span>Price is excluding GST</span>
                      <span>&bull;</span>
                      <span>Delivery within 7-10 working days</span>
                    </div>
                  </div>

                  {/* Bottom Notes Row */}
                  <div className="tw-flex tw-flex-row tw-w-full tw-gap-3 tw-mt-3 max-[767px]:tw-hidden">
                    {showGstNote && (
                      <div className="tw-flex-1">
                        <div
                          className="tw-w-full tw-h-full tw-flex tw-flex-row tw-items-center tw-justify-center tw-border tw-border-solid tw-border-gray-200 tw-rounded-lg tw-py-2 tw-px-1.5 tw-bg-white"
                          style={{ minHeight: "44px", border: "1px solid #ebebeb" }}
                        >
                          <p className="tw-text-gray-800 tw-m-0 tw-text-[13px] max-[767px]:tw-text-[11px] tw-font-semibold tw-text-center">
                            Price is excluding GST
                          </p>
                        </div>
                      </div>
                    )}
                    {showDeliveryNote && (
                      <div className="tw-flex-1">
                        <div
                          className="tw-w-full tw-h-full tw-flex tw-flex-row tw-items-center tw-justify-center tw-border tw-border-solid tw-border-gray-200 tw-rounded-lg tw-py-2 tw-px-1.5 tw-bg-white"
                          style={{ minHeight: "44px", border: "1px solid #ebebeb" }}
                        >
                          <svg className="tw-w-4 tw-h-4 tw-text-gray-800 tw-mr-1.5 tw-flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.75a1.125 1.125 0 0 1-1.125-1.125V4.625c0-.621.504-1.125 1.125-1.125H16.5a1.125 1.125 0 0 1 1.125 1.125v13a1.125 1.125 0 0 1-1.125 1.125m-3.75 0h4.875c.621 0 1.125-.504 1.125-1.125v-5.25c0-.411-.223-.79-.586-.975l-3.375-1.713a1.125 1.125 0 0 0-.97-.02L12 9.75M8.25 21h6.75" />
                          </svg>
                          <p className="tw-text-gray-800 tw-m-0 tw-text-[13px] max-[767px]:tw-text-[11px] tw-font-semibold tw-text-center">
                            Delivery within 7-10 working days
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details Full-Width Container */}
            {showExpandedProductDetails && (
              <div className="tw-w-full tw-border tw-border-solid tw-border-gray-200 tw-rounded-xl tw-p-6 tw-bg-white tw-mt-8 tw-mb-6" style={{ border: "1px solid #ebebeb" }}>
                <div className="tw-grid tw-grid-cols-1 tw-gap-8">
                  {showDescriptionDetails && (
                    <section>
                      <h3 className="tw-text-[#182c5a] tw-text-[20px] tw-font-bold tw-mb-3">
                        Product Description
                      </h3>
                      <div
                        className="tw-text-gray-600 tw-text-[15px] tw-leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                    </section>
                  )}

                  {showSpecifications && (
                    <section>
                      <h3 className="tw-text-[#182c5a] tw-text-[20px] tw-font-bold tw-mb-3">
                        Specifications
                      </h3>
                      <ProductSpecifications product={product} />
                    </section>
                  )}

                  {showUsageDetails && (
                    <section>
                      <h3 className="tw-text-[#182c5a] tw-text-[20px] tw-font-bold tw-mb-3">
                        Usage & Care Instructions
                      </h3>
                      <div className="tw-text-gray-600 tw-text-[15px] tw-leading-relaxed">
                        {renderMultilineText(usageText)}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}

            <BuySection product={product} />
            <RelatedSection product={product} />
          </div>
        </div>
      </div>
      <Global styles={css`
        .detail-card-left, .detail-card-right {
          background-color: #fff;
          padding: 36px 32px !important;
          margin-bottom: 24px;
        }
        @media (min-width: 901px) {
          .detail-card-left {
            width: calc(50% - 60px) !important;
            margin-left: 40px !important;
            margin-right: 20px !important;
          }
          .detail-card-right {
            width: calc(50% - 60px) !important;
            margin-left: 20px !important;
            margin-right: 40px !important;
          }
        }
        @media (max-width: 900px) and (min-width: 768px) {
          .detail-card-left, .detail-card-right {
            padding: 24px 20px !important;
            margin-left: 40px !important;
            margin-right: 40px !important;
            width: calc(100% - 80px) !important;
          }
        }
        @media (max-width: 767px) {
          .detail-card-left, .detail-card-right {
            padding: 16px 12px !important;
            margin-left: 12px !important;
            margin-right: 12px !important;
            width: calc(100% - 24px) !important;
          }
        }
        @media (max-width: 767px) {
          .qty-action-container {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            background-color: #fff !important;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08) !important;
            padding: 12px 16px 16px 16px !important;
            margin: 0 !important;
            z-index: 9999 !important;
            width: 100% !important;
            border-top: 1px solid #ebebeb !important;
            flex-wrap: wrap !important;
          }
          body {
            padding-bottom: 110px !important;
          }
        }
      `} />
    </>
  );
};

export default Productpage;
