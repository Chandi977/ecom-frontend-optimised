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
import Info from "../../components/product/Info";
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
import Image from "next/image";
import { motion } from "framer-motion";
import ProductGallery from "../../components/product/ProductGallery";
import ProductInventory from "../../components/product/ProductInventory";
import ProductPricing from "../../components/product/ProductPricing";
import {
  getLegacyCompatibleProduct,
  getPriceTiers,
  getProductSeo,
  type NormalizedPriceTier,
} from "../../utils/productCatalog";

const CARRY_BAG_CATEGORY_IDS = [
  "6557df71301ec4f2f4266145",
  "689d73214687bb4e437542e0",
];
const FOOD_WRAPPING_CATEGORY_IDS = [
  "69dcb22e733b8ba056529a9f",
  "679ca70f2833ca433fa0aa9c",
];

export async function getServerSideProps(context) {
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
  const seo = getProductSeo(product);
  const categoryId =
    typeof product?.category === "object"
      ? product?.category?._id
      : product?.category;
  const categoryName =
    typeof product?.category === "object" ? product?.category?.name || "" : "";
  const categorySlug =
    typeof product?.category === "object" ? product?.category?.slug || "" : "";

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
  const showAboutItem = isFieldVisible(product, FIELD_VISIBILITY_KEYS.aboutItem);
  const showGstNote = isFieldVisible(product, FIELD_VISIBILITY_KEYS.noteGst);
  const showDeliveryNote = isFieldVisible(product, FIELD_VISIBILITY_KEYS.noteDelivery);
  const showBadgeFreeDelivery = isFieldVisible(product, FIELD_VISIBILITY_KEYS.badgeFreeDelivery);
  const showBadgeSecureTransaction = isFieldVisible(product, FIELD_VISIBILITY_KEYS.badgeSecureTransaction);
  const showBadgeNoReturns = isFieldVisible(product, FIELD_VISIBILITY_KEYS.badgeNoReturns);
  const showBadgeRecyclable = isFieldVisible(product, FIELD_VISIBILITY_KEYS.badgeRecyclable);

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

    setSelectedPackWeight(selectedPriceData.packWeight);
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
                <p className="tw-hidden max-[900px]:tw-block max-[900px]:tw-mt-[10px] max-[900px]:tw-px-[14px] max-[900px]:tw-text-black max-[900px]:tw-font-sans max-[900px]:tw-text-[17px] max-[900px]:tw-capitalize max-[900px]:tw-font-semibold max-[900px]:tw-leading-[29px] max-[900px]:tw-tracking-[0.51px]">
                  {product?.brand?.name} {product?.name} {product?.model}
                </p>

                <div className="tw-mt-5 max-[900px]:tw-mt-[12px] tw-w-full">
                  <ProductGallery product={product} />
                </div>
                <div className="tw-w-full tw-hidden max-[900px]:tw-block tw-bg-[#EBEBEB] tw-h-[1px] tw-mt-[20px]"></div>
              </div>
              <div className="col-12 col-md-6 detail-card-right">
                <div className="row p-0 m-0">
                  <div
                    className="p-0 m-0"
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: "30px",
                      alignItems: "center",
                    }}
                  >
                    <div className="tw-text-black tw-p-0 tw-text-[32px] tw-font-semibold tw-leading-[35px] tw-tracking-[0.72px] tw-capitalize max-[900px]:tw-hidden">
                      {product?.brand?.name} {product?.name} {product?.model}
                    </div>
                    <div onClick={handleShare} className="tw-cursor-pointer">
                      <AiOutlineShareAlt
                        style={{ width: "24px", height: "24px" }}
                      />
                    </div>
                  </div>

                  <div className="p-0 d-flex flex-row justify-content-between">
                    <div className="tw-flex tw-flex-col tw-justify-start">
                      <p className="tw-m-0 tw-hidden max-[900px]:tw-block max-[900px]:tw-text-[#828282] max-[900px]:tw-font-sans max-[900px]:tw-text-[14.9px] max-[900px]:tw-font-semibold max-[900px]:tw-leading-[22.528px] max-[900px]:tw-tracking-[0.298px]">Price</p>
                      <p className="tw-m-0 tw-hidden max-[900px]:tw-block max-[900px]:tw-text-[#828282] max-[900px]:tw-font-sans max-[900px]:tw-text-[14.9px] max-[900px]:tw-font-semibold max-[900px]:tw-leading-[22.528px] max-[900px]:tw-tracking-[0.298px]"> </p>
                      <div
                        style={{
                          display: "none",
                          gap: "20px",
                          alignItems: "center",
                        }}
                      >
                        {/* MRP display */}
                        <p className="tw-text-black tw-text-[16px] tw-font-normal tw-leading-[24px] tw-tracking-[0.72px] tw-mt-[18px] max-[900px]:tw-text-[24px] max-[900px]:tw-my-[9px]">
                          MRP : <s>₹{safeMRP}</s>
                        </p>

                        {/* SP display */}
                        <p className="tw-text-black tw-text-[28px] tw-font-medium tw-leading-[24px] tw-tracking-[0.72px] tw-mt-[18px] max-[900px]:tw-text-[37px] max-[900px]:tw-my-[9px]">
                          ₹{Math.round(safePrice)}
                        </p>

                        {/* discount % display */}
                        <p className="tw-text-[#ff0000] tw-text-[20px] tw-font-light tw-leading-[32px] tw-mt-[18px]">
                          {discountPercent}% Off
                        </p>
                      </div>

                      <div className="mt-2">
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

                  {/* Dynamic Overview Fields (matches Info.tsx Quick Overview) */}
                  {product && showQuickOverview && (
                    <div className="p-0 mt-3">
                      {getOverviewFields(
                        product,
                        selectedNumber,
                        selectedPackWeight,
                      ).map((field) => (
                        <div
                          key={field.label}
                          style={{
                            display: "flex",
                            justifyContent: "start",
                            alignItems: "center",
                            marginTop: "0px",
                            gap: "5px",
                          }}
                        >
                          <p style={{ fontWeight: "600", fontSize: "16px" }}>
                            {field.label} -{" "}
                          </p>
                          <p
                            style={{
                              fontWeight: "400",
                              fontSize: "16px",
                              textTransform: "capitalize",
                            }}
                          >
                            {field.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                    {/* Common Field: About Item */}
                    {product && showAboutItem && (
                      <>
                        <p>
                          <span style={{ fontWeight: "600", fontSize: "16px" }}>
                            About the Item -{" "}
                          </span>
                          <span style={{ fontWeight: "400", fontSize: "16px" }}>
                            {!product?.aboutItem || String(product?.aboutItem).trim() === ""
                              ? (isTapeProduct || isPolyBagProduct || isCorrugatedProduct || isPaperBagProduct || isLabelProduct ? "text pending" : "Not Available")
                              : product?.aboutItem}
                          </span>
                        </p>
                      </>
                    )}
                    <ProductInventory product={product} />

                  <div className="row p-0 m-0 mt-2">
                    <div className="col tw-px-0 tw-flex tw-flex-row tw-justify-between max-[900px]:tw-flex-col">
                      {stock <= 0 || isNaN(stock) ? (
                        <div className="tw-p-0 tw-m-0 tw-flex tw-flex-row tw-bg-[#f8f9fa] tw-w-[200px] tw-h-[44px] tw-opacity-50">
                          <div className="tw-h-full tw-flex tw-flex-row tw-justify-center tw-items-center tw-w-[50px] tw-border tw-border-solid tw-border-[rgba(0,0,0,0.5)] tw-cursor-not-allowed">
                            <img
                              src="/icon-minus.png"
                              alt="Decrease quantity"
                              width="24"
                              height="24"
                            />
                          </div>
                          <div className="tw-h-full tw-flex tw-flex-row tw-justify-center tw-items-center tw-w-[100px] tw-border-y tw-border-solid tw-border-[rgba(0,0,0,0.5)]">
                            <p className="tw-text-black tw-p-0 tw-m-0 tw-text-[20px] tw-font-medium tw-leading-[28px]">{quantity}</p>
                          </div>
                          <div className="tw-h-full tw-flex tw-flex-row tw-justify-center tw-items-center tw-w-[50px] tw-border tw-border-solid tw-border-[rgba(0,0,0,0.5)] tw-cursor-not-allowed tw-bg-[#182C5A]">
                            <img
                              src="/icon-plus.png"
                              alt="Increase quantity"
                              width="24"
                              height="24"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="tw-p-0 tw-m-0 tw-flex tw-flex-row tw-bg-[#f8f9fa] tw-w-[200px] tw-h-[44px]">
                          <div
                            className="tw-h-full tw-flex tw-flex-row tw-justify-center tw-items-center tw-w-[50px] tw-border tw-border-solid tw-border-[rgba(0,0,0,0.5)] tw-cursor-pointer"
                            onClick={handleMinus}
                          >
                            <img
                              src="/icon-minus.png"
                              alt="Decrease quantity"
                              width="24"
                              height="24"
                            />
                          </div>
                          <div className="tw-h-full tw-flex tw-flex-row tw-justify-center tw-items-center tw-w-[100px] tw-border-y tw-border-solid tw-border-[rgba(0,0,0,0.5)]">
                            <p className="tw-text-black tw-p-0 tw-m-0 tw-text-[20px] tw-font-medium tw-leading-[28px]">{quantity}</p>
                          </div>
                          <div
                            className="tw-h-full tw-flex tw-flex-row tw-justify-center tw-items-center tw-w-[50px] tw-border tw-border-solid tw-border-[rgba(0,0,0,0.5)] tw-cursor-pointer tw-bg-[#182C5A]"
                            onClick={handlePlus}
                          >
                            <img
                              src="/icon-plus.png"
                              alt="Increase quantity"
                              width="24"
                              height="24"
                            />
                          </div>
                        </div>
                      )}
                      <div className="tw-flex tw-flex-row tw-items-center max-[900px]:tw-pt-[10px]">
                        {stock <= 0 || isNaN(stock) ? (
                          <motion.button
                            className="tw-border-0 tw-text-white tw-text-center tw-text-[16px] tw-font-medium tw-leading-[24px] tw-flex tw-w-[213px] tw-h-[44px] tw-items-center tw-justify-center tw-gap-[10px] tw-flex-shrink-0 tw-bg-[#182c5a] tw-rounded"
                            whileHover={{ scale: 1.05, backgroundColor: "#e92227" }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            onClick={handleNotifyMe}
                          >
                            Notify Me
                          </motion.button>
                        ) : (
                          <motion.button
                            className="tw-border-0 tw-text-white tw-text-center tw-text-[16px] tw-font-medium tw-leading-[24px] tw-flex tw-w-[213px] tw-h-[44px] tw-items-center tw-justify-center tw-gap-[10px] tw-flex-shrink-0 tw-bg-[#182c5a] tw-rounded"
                            whileHover={{ scale: 1.05, backgroundColor: "#e92227" }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            onClick={handleCart}
                          >
                            Add To Cart
                          </motion.button>
                        )}
                        <motion.div
                          className="tw-flex tw-justify-center tw-items-center tw-ml-[14px] tw-w-[40px] tw-h-[40px] tw-border tw-border-solid tw-border-[rgba(0,0,0,0.50)] tw-cursor-pointer"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleFavourite(e, product)}
                        >
                          {checkFav(product?._id) ? (
                            <FontAwesomeIcon
                              icon={faHeart}
                              style={{
                                color: "red",
                              }}
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faHeart}
                              style={{
                                color: "grey",
                              }}
                            />
                          )}
                        </motion.div>
                      </div>
                    </div>
                  </div>
                  <div className="row p-0 m-0 mt-3 g-0">
                    {showGstNote && (
                    <div className="col-12 col-md-6">
                      <div
                        className="w-100 h-100 d-flex flex-row align-items-center"
                        style={{
                          border: "1px solid #808080",
                          minHeight: "58px",
                        }}
                      >
                        <p
                          style={{
                            marginLeft: "15px",
                            marginBottom: "0px",
                            color: "#000",
                            fontFamily: "Montserrat",
                            fontSize: "16px",
                            fontStyle: "normal",
                            fontWeight: "500",
                          }}
                          className="pt-3 pb-3"
                        >
                          Price is excluding GST
                        </p>
                      </div>
                    </div>
                    )}
                    {showDeliveryNote && (
                    <div className="col-12 col-md-6">
                      <div
                        className="w-100 h-100 d-flex flex-row align-items-center"
                        style={{
                          border: "1px solid #808080",
                          minHeight: "58px",
                        }}
                      >
                        <img
                          src="/deliverytruck-img.png"
                          alt="Delivery truck"
                          width="40px"
                          style={{ marginLeft: "16px" }}
                        />
                        <p
                          style={{
                            marginLeft: "15px",
                            marginBottom: "0px",
                            color: "#000",
                            fontFamily: "Montserrat",
                            fontSize: "16px",
                            fontStyle: "normal",
                            fontWeight: "500",
                            lineHeight: "24px",
                          }}
                          className="pt-3 pb-3"
                        >
                          Delivery within 7-10 working days
                        </p>
                      </div>
                    </div>
                    )}
                  </div>
                  <div className="row p-0 m-0">
                    {showBadgeFreeDelivery && (
                    <div className="col-6 col-md-3 text-center mt-3">
                      <Image
                        src="/icons/free-delivery.png"
                        height={50}
                        width={50}
                        alt="Free Delivery"
                      />
                      <br />
                      <span>Free Delivery</span>
                    </div>
                    )}
                    {showBadgeSecureTransaction && (
                    <div className="col-6 col-md-3 text-center mt-3">
                      <Image
                        src="/icons/secure-transaction.png"
                        height={50}
                        width={50}
                        alt="Secure Transaction"
                      />
                      <br />
                      <span>Secure Transaction</span>
                    </div>
                    )}
                    {showBadgeNoReturns && (
                    <div className="col-6 col-md-3 text-center mt-3">
                      <Image
                        src="/icons/no-return.png"
                        height={50}
                        width={50}
                        alt=" No Returns"
                      />
                      <br />
                      <span>No Returns</span>
                    </div>
                    )}
                    {showBadgeRecyclable && (
                    <div className="col-6 col-md-3 text-center mt-3">
                      <Image
                        src="/icons/recyclable.png"
                        height={50}
                        width={50}
                        alt="100% Recyclable"
                      />
                      <br />
                      <span>100% Recyclable</span>
                    </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="row mt-5 m-0">
              <Info
                product={product}
                weight={selectedPackWeight}
                packSize={selectedNumber}
                mrp={MRP}
                sp={price}
                stock={stock}
              />
            </div>

            <BuySection product={product} />
            <RelatedSection product={product} />
          </div>
        </div>
      </div>
      <Global styles={css`
        .detail-card-left, .detail-card-right {
          background-color: #fff;
          border-radius: 12px;
          border: 1px solid #ebebeb;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
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
        @media (max-width: 900px) {
          .detail-card-left, .detail-card-right {
            padding: 24px 20px !important;
            margin-left: 40px !important;
            margin-right: 40px !important;
            width: calc(100% - 80px) !important;
          }
        }
      `} />
    </>
  );
};

export default Productpage;
