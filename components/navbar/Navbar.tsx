"use client"; // This is a client component ðŸ‘ˆðŸ½
import React, { useEffect, useRef, useState } from "react";
import MuiAccordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LocalPhoneOutlinedIcon from "@mui/icons-material/LocalPhoneOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import axios from "axios";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LockIcon from "@mui/icons-material/Lock";
import Select from "react-select";
import { Dropdown } from "react-bootstrap";
import CustomDropdown from "./CustomDropdown";
import { getCartCount } from "../../utils/cart";
import {
  CART_FLY_ARRIVED_EVENT,
  hasCartFlightInProgress,
  registerCartTarget,
} from "../../utils/flyToCart";
import {
  faChevronDown,
  faChevronRight,
  faNavicon,
  faPhone,
  faHeart,
  faSearch,
  faCartShopping,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import styled from "@emotion/styled";
import Link from "next/link";
import { getService, postService } from "../../services/service";
import { useBrands } from "../../context/BrandContext";
import { trackSearch } from "../../lib/analytics";
import { cdn } from "../../lib/cdn";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { clearWishlistCache } from "../../utils/favourites";
import { AUTH_STATE_EVENT, clearToken } from "../../services/token";
import { getProductDisplayName } from "../listing/productDisplay";

const marqueeStyle = {
  backgroundColor: "#E92227",
  fontWeight: "600",
  height: "35px",
};

const marqueeContent = (
  <h5>
    Summer Sale is Here! Enjoy 10% OFF on All Packaging Solutions When You Shop
    Through our Website or Mobile App. Use Code SUMMERSALE10 At Checkout. Hurry
    - "Offer Valid for a Limited Time!" &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp;
    &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
  </h5>
);

const MarqueeFallback = () => (
  <div className="text-white" style={marqueeStyle}>
    {marqueeContent}
  </div>
);

const Marquee = dynamic(() => import("react-fast-marquee"), {
  ssr: false,
  loading: MarqueeFallback,
});

const Navbar = () => {
  const router = useRouter();
  const { brandNameById } = useBrands();
  // Helpers to safely read auth state from localStorage
  const readStoredToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("PIToken");
  };

  const readStoredUserName = () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("PIUser");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const firstName = String(parsed?.first_name || parsed?.firstName || "").trim();
      const lastName = String(parsed?.last_name || parsed?.lastName || "").trim();
      const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
      const emailName = String(parsed?.email_address || parsed?.email || "")
        .split("@")[0]
        .trim();
      return (
        fullName ||
        String(
          parsed?.name ||
            parsed?.full_name ||
            parsed?.fullName ||
            parsed?.username ||
            parsed?.user_name ||
            "",
        ).trim() ||
        emailName ||
        null
      );
    } catch {
      return null;
    }
  };

  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [cart, setCart] = useState<any>(null);
  const [isCartLanding, setIsCartLanding] = useState(false);
  const cartLandingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sidebartranslatevalue, Setsidebartranslatevalue] = useState(100);
  const [isPackproDropdownOpen, setPackproDropdownOpen] = useState(false);
  const [isRollabelDropdownOpen, setRollabelDropdownOpen] = useState(false);
  const [isNewDropdownOpen, setIsNewDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const categoriesMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const categoriesRef = useRef<HTMLDivElement | null>(null);

  const openCategoriesMenu = () => {
    if (categoriesMenuTimerRef.current) {
      clearTimeout(categoriesMenuTimerRef.current);
    }
    setIsCategoriesOpen(true);
  };

  const closeCategoriesMenu = () => {
    if (categoriesMenuTimerRef.current) {
      clearTimeout(categoriesMenuTimerRef.current);
    }
    categoriesMenuTimerRef.current = setTimeout(() => setIsCategoriesOpen(false), 150);
  };

  const toggleCategoriesMenu = () => {
    setIsCategoriesOpen((prev) => !prev);
  };

  const [activeCategoryHover, setActiveCategoryHover] = useState<string | null>(null);

  const CATEGORY_DROPDOWN_ITEMS = [
    {
      id: "corrugated-boxes",
      label: "CORRUGATED BOXES",
      path: "/corrugated-boxes",
      subItems: [
        { name: "All Corrugated Shipping Boxes", path: "/corrugated-boxes" },
        { name: "3-Ply & 5-Ply Shipping Boxes", path: "/corrugated-boxes" },
        { name: "E-Commerce Shipping Boxes", path: "/corrugated-boxes" },
        { name: "Custom Printed Boxes", path: "/custom-packaging" },
      ],
    },
    {
      id: "paper-bags",
      label: "PAPER BAGS",
      path: "/paper-bags",
      subItems: [
        { name: "All Paper Bags", path: "/paper-bags" },
        { name: "Twist Handle Paper Bags", path: "/paper-bags" },
        { name: "Brown & White Kraft Bags", path: "/paper-bags" },
      ],
    },
    {
      id: "poly-bags",
      label: "POLY BAGS & MAILERS",
      path: "/poly-bags",
      subItems: [
        { name: "All Poly Courier Mailers", path: "/poly-bags" },
        { name: "Tamper Evident Mailers", path: "/poly-bags" },
        { name: "POD Jacket Courier Bags", path: "/poly-bags" },
      ],
    },
    {
      id: "packpro",
      label: "PACKPRO™",
      path: "/packpro-tapes",
      subItems: [
        { name: "CARRY BAGS", path: "/carry-bags" },
        { name: "FOOD WRAPPING PAPERS", path: "/packpro-food-wrapping-papers" },
        { name: "TAPES", path: "/packpro-tapes" },
      ],
    },
    {
      id: "rollabel",
      label: "ROLLABEL™",
      path: "/rollabel",
      subItems: [
        { name: "DIRECT THERMAL LABELS", path: "/direct-thermal-labels" },
        { name: "CHROMO LABELS", path: "/chromo-labels" },
      ],
    },
    {
      id: "tapes-labels",
      label: "PACKAGING TAPES & LABELS",
      path: "/packpro-tapes",
      subItems: [
        { name: "BOPP Packaging Tapes", path: "/bopp-tapes" },
        { name: "Water-Activated Paper Tapes", path: "/paper-tapes" },
        { name: "Security & Void Tapes", path: "/void-tapes" },
        { name: "Carry Handle Tapes", path: "/packpro-carry-handle-tapes" },
      ],
    },
    {
      id: "marketplace",
      label: "MARKETPLACE PACKAGING",
      path: "/amazon",
      subItems: [
        { name: "Amazon Packaging", path: "/amazon" },
        { name: "Flipkart Packaging", path: "/flipkart" },
        { name: "Myntra Packaging", path: "/myntra" },
        { name: "Ajio Packaging", path: "/ajio" },
      ],
    },
    {
      id: "custom-packaging",
      label: "CUSTOM PACKAGING",
      path: "/custom-packaging",
      subItems: [],
    },
  ];

  const getCategoryUrl = (cat: any) => {
    if (!cat) return "/corrugated-boxes";

    const rawName = String(typeof cat === "string" ? cat : cat?.name || cat?.slug || cat?.title || "").trim();
    const name = rawName.toLowerCase();
    const rawSlug = String(typeof cat === "object" && cat?.slug ? cat.slug : "").trim();

    if (name.includes("corrugated") || rawSlug.includes("corrugated")) return "/corrugated-boxes";
    if (name.includes("paper bag") || rawSlug.includes("paper-bag") || rawSlug.includes("paperbag")) return "/paper-bags";
    if (name.includes("poly bag") || name.includes("poly mailer") || rawSlug.includes("poly-bag") || rawSlug.includes("polybag")) return "/poly-bags";
    if (name.includes("carry bag") || rawSlug.includes("carry-bag") || rawSlug.includes("carrybag")) return "/carry-bags";
    if (name.includes("rollabel") || rawSlug.includes("rollabel")) return "/rollabel";
    if (name.includes("food") || name.includes("parchment") || name.includes("wrapping") || rawSlug.includes("food")) return "/packpro-food-wrapping-papers";
    if (name.includes("pack pro") || name.includes("packpro") || name.includes("tape")) return "/packpro-tapes";
    if (name.includes("bopp") || rawSlug.includes("bopp")) return "/bopp-tapes";
    if (name.includes("paper tape") || rawSlug.includes("paper-tape")) return "/paper-tapes";
    if (name.includes("void") || rawSlug.includes("void")) return "/void-tapes";
    if (name.includes("chromo") || rawSlug.includes("chromo")) return "/chromo-labels";
    if (name.includes("thermal") || rawSlug.includes("thermal")) return "/direct-thermal-labels";
    if (name.includes("amazon")) return "/amazon";
    if (name.includes("flipkart")) return "/flipkart";
    if (name.includes("myntra")) return "/myntra";
    if (name.includes("ajio")) return "/ajio";
    if (name.includes("custom")) return "/custom-packaging";
    if (name.includes("bestseller") || name.includes("deal")) return "/BestDeals";

    if (rawSlug && !rawSlug.includes(" ") && !rawSlug.includes("%") && rawSlug !== "null" && rawSlug !== "undefined") {
      return `/${rawSlug}`;
    }

    if (typeof cat === "object" && cat?._id) {
      return `/listingpage?category=${cat._id}`;
    }

    return "/corrugated-boxes";
  };

  const [brands, setBrands] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subCat, setSubCat] = useState([]);
  const [selctedBrand, setSelectedBrand] = useState("");
  const [selectedSubCat, setSelectedSubCat] = useState("");
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchProducts, setSearchProducts] = useState<any[]>([]);
  const [showDropdownMobile, setShowDropdownMobile] = useState(false);
  const [searchQueryMobile, setSearchQueryMobile] = useState("");
  const [searchProductsMobile, setSearchProductsMobile] = useState<any[]>([]);
  const breakpoint = 700;
  const DEFAULT_NAVBAR_HEIGHT = 120;
  const [width, setWidth] = useState(1200);
  const [navbarHeight, setNavbarHeight] = useState(DEFAULT_NAVBAR_HEIGHT);
  const navbarRef = useRef<any>(null);
  const userMenuTimerRef = useRef<any>(null);
  const DEBOUNCE_DELAY = 500;
  const MIN_SEARCH_LENGTH = 2;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWidth(window.innerWidth);
      const handleResize = () => setWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);
  // Avoid re-tracking the same (debounced) query repeatedly for demand signals.
  const lastTrackedSearchRef = useRef("");
  const phoneNumber = "+918447247227";
  const dropdownRef = useRef<any>(null);
  const dropdownRef2 = useRef<any>(null);
  const packproDropdownRef = useRef<any>(null);
  const rollabelDropdownRef = useRef<any>(null);

  const getSearchResults = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.products)) return value.products;
    return [];
  };

  const getSearchResultLabel = (product: any) =>
    getProductDisplayName(product, { brandNameById }) ||
    [product?.name, product?.model].filter(Boolean).join(" ");

  const openSearchResult = (
    product: any,
    closeDropdown: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    if (!product?.slug) return;
    router.push(`/${product.slug}`);
    closeDropdown(false);
  };

  const handleCart = async () => {
    const c = await getCartCount();
    if (c !== null) {
      setCart(c);
    }
  };

  useEffect(() => {
    setToken(readStoredToken());
    setUserName(readStoredUserName());
    setIsMounted(true);
    handleCart();
  }, []);

  useEffect(() => {
    const handleCartUpdate = () => {
      if (hasCartFlightInProgress()) return;
      handleCart();
    };

    const handleCartFlyArrived = () => {
      handleCart();
      setIsCartLanding(true);
      if (cartLandingTimerRef.current) {
        clearTimeout(cartLandingTimerRef.current);
      }
      cartLandingTimerRef.current = setTimeout(
        () => setIsCartLanding(false),
        520,
      );
    };

    if (typeof window !== "undefined") {
      window.addEventListener("cartUpdated", handleCartUpdate);
      window.addEventListener(CART_FLY_ARRIVED_EVENT, handleCartFlyArrived);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("cartUpdated", handleCartUpdate);
        window.removeEventListener(CART_FLY_ARRIVED_EVENT, handleCartFlyArrived);
      }
      if (userMenuTimerRef.current) {
        clearTimeout(userMenuTimerRef.current);
      }
      if (cartLandingTimerRef.current) {
        clearTimeout(cartLandingTimerRef.current);
      }
    };
  }, []);

  // Both headers register their icon; flyToCart aims at whichever is on screen.
  const desktopCartRef = useRef<HTMLSpanElement | null>(null);
  const mobileCartRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const unregister = [
      registerCartTarget(desktopCartRef.current),
      registerCartTarget(mobileCartRef.current),
    ];
    return () => unregister.forEach((remove) => remove());
  });

  const Accordion = styled((props: any) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
  ))(({ theme }) => ({
    paddingLeft: "30px",
    border: `0px`,
    "&:not(:last-child)": {
      borderBottom: 0,
    },
    "&:before": {
      display: "none",
    },
  }));

  const changetranslate = () => {
    if (sidebartranslatevalue == 0) {
      Setsidebartranslatevalue(100);
    } else {
      Setsidebartranslatevalue(0);
    }
  };

  const togglePackproDropdown = () => {
    setPackproDropdownOpen((current) => !current);
    setRollabelDropdownOpen(false);
  };

  const toggleRollabelDropdown = () => {
    setRollabelDropdownOpen((current) => !current);
    setPackproDropdownOpen(false);
  };

  const handleNavDropdownOutside = (event: any) => {
    const clickedInsidePackpro =
      packproDropdownRef.current &&
      packproDropdownRef.current.contains(event.target);
    const clickedInsideRollabel =
      rollabelDropdownRef.current &&
      rollabelDropdownRef.current.contains(event.target);

    if (!clickedInsidePackpro && !clickedInsideRollabel) {
      setPackproDropdownOpen(false);
      setRollabelDropdownOpen(false);
    }
  };

  const readStoredUserId = () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("PIUser");
      if (!raw) return null;
      return JSON.parse(raw)?._id || null;
    } catch {
      return null;
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const openUserMenu = () => {
    if (!token) return;
    if (userMenuTimerRef.current) {
      clearTimeout(userMenuTimerRef.current);
    }
    setIsOpen(true);
  };

  const closeUserMenu = () => {
    if (userMenuTimerRef.current) {
      clearTimeout(userMenuTimerRef.current);
    }
    userMenuTimerRef.current = setTimeout(() => setIsOpen(false), 120);
  };

  const handleCategoriesOutsideClick = (event: MouseEvent) => {
    if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
      setIsCategoriesOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleNavDropdownOutside);
    document.addEventListener("mousedown", handleCategoriesOutsideClick);

    const fetchCategories = async () => {
      try {
        const res = await getService("category/all", {}, { silent: true });
        if (res?.data?.success && Array.isArray(res.data.data)) {
          setCategories(res.data.data);
        }
      } catch (e) {
        console.warn("Failed to fetch backend categories:", e);
      }
    };
    fetchCategories();

    return () => {
      document.removeEventListener("mousedown", handleNavDropdownOutside);
      document.removeEventListener("mousedown", handleCategoriesOutsideClick);
      if (categoriesMenuTimerRef.current) {
        clearTimeout(categoriesMenuTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setToken(readStoredToken());
    setUserName(readStoredUserName());
    handleCart();
  }, [router.asPath]);

  useEffect(() => {
    const handleStorage = () => {
      setToken(readStoredToken());
      setUserName(readStoredUserName());
      handleCart();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(AUTH_STATE_EVENT, handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(AUTH_STATE_EVENT, handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setUserName(null);
    }
  }, [token]);

  const handleLogout = () => {
    const currentUserId = readStoredUserId();
    clearToken();
    clearWishlistCache(currentUserId);
    setToken(null);
    setUserName(null);
    setCart({ count: 0 });
    router.push("/login");
  };

  const handleClickMyAccount = () => {
    if (token) {
      router.push("/my-orders");
    } else {
      router.push("/login");
    }
  };

  const handleClickProfile = () => {
    if (token) {
      router.push("/profile");
    } else {
      router.push("/login");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);


  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length < MIN_SEARCH_LENGTH) {
      setSearchProducts([]);
      setShowDropdown(false);
      return;
    }

    const debounceTimeout = setTimeout(() => {
      handleSearch(trimmedQuery);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(debounceTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSearch = async (queryValue = searchQuery) => {
    try {
      const trimmedQuery = queryValue.trim();

      if (trimmedQuery.length < MIN_SEARCH_LENGTH) {
        setSearchProducts([]);
        setShowDropdown(false);
        return;
      }

      const response = await postService(
        "product/main/search",
        {
          search: trimmedQuery,
        },
        { silent: true },
      );

      const results = response?.data?.success
        ? getSearchResults(response.data.data)
        : [];
      if (response?.data?.success) {
        setSearchProducts(results);
        setShowDropdown(true);
      } else {
        setSearchProducts([]);
        setShowDropdown(false);
      }

      // Demand signal + Mixpanel (via dataLayer). Dedupe the debounced query.
      if (trimmedQuery !== lastTrackedSearchRef.current) {
        lastTrackedSearchRef.current = trimmedQuery;
        trackSearch(trimmedQuery, results.length);
      }
    } catch (error) {
      console.error("Error searching products:", error);
      setSearchProducts([]);
      setShowDropdown(false);
    }
  };

  const handleSearchMobile = async (queryValue = searchQueryMobile) => {
    try {
      const trimmedQuery = queryValue.trim();

      if (trimmedQuery.length < MIN_SEARCH_LENGTH) {
        setSearchProductsMobile([]);
        setShowDropdownMobile(false);
        return;
      }

      const response = await postService(
        "product/main/search",
        {
          search: trimmedQuery,
        },
        { silent: true },
      );

      const results = response?.data?.success
        ? getSearchResults(response.data.data)
        : [];
      if (response?.data?.success) {
        setSearchProductsMobile(results);
        setShowDropdownMobile(true);
      } else {
        setSearchProductsMobile([]);
        setShowDropdownMobile(false);
      }

      // Demand signal + Mixpanel (via dataLayer). Dedupe the debounced query.
      if (trimmedQuery !== lastTrackedSearchRef.current) {
        lastTrackedSearchRef.current = trimmedQuery;
        trackSearch(trimmedQuery, results.length);
      }
    } catch (error) {
      console.error("Error searching products:", error);
      setSearchProductsMobile([]);
      setShowDropdownMobile(false);
    }
  };

  const handleClick = () => {
    router.push("/corrugated-boxes");
  };

  const handleClickHome = () => {
    router.push("/");
  };

  const handleClickLabel = () => {
    router.push("/label");
  };

  const handleClickDTL = () => {
    router.push("/direct-thermal-labels");
  };
  const handleClickCL = () => {
    router.push("/chromo-labels");
  };

  const handleClickPaperBag = () => {
    router.push("/paper-bags");
  };

  const handleClickPolyBag = () => {
    router.push("/poly-bags");
  };

  const handleClickCarryBag = () => {
    router.push("/carry-bags");
  };

  const handleClickPackpro = () => {
    router.push("/packpro");
  };

  const handleClickRollabel = () => {
    router.push("/rollabel");
  };

  const handleClickBOPPTape = () => {
    router.push("/bopp-tapes");
  };

  const handleClickPackproTapes = () => {
    router.push("/packpro-tapes");
  };

  const handleClickFoodWrappingPaper = () => {
    router.push("/packpro-food-wrapping-papers");
  };
  const handleClickSignUp = () => {
    router.push("/sign-up");
  };

  const handleClickSignIn = () => {
    router.push("/login");
  };

  const handleClickCart = () => {
    router.push("/my-cart");
  };

  const cartCount = typeof cart === "number" ? cart : cart?.count || 0;
  const isSidebarOpen = sidebartranslatevalue === 0;
  const isLoggedIn = Boolean(token);
  const accountLabel = userName || (isLoggedIn ? readStoredUserName() : null) || "My Account";

  return (
    <>
      <div
        ref={navbarRef}
        className="tw-w-full tw-fixed tw-top-0 tw-left-0 tw-z-50 tw-bg-white tw-shadow-sm"
      >
        {/* Top Announcement Bar */}
        <div className="tw-bg-[#0B2348] tw-text-white tw-text-sm sm:tw-text-base tw-py-1.5 tw-px-4 tw-w-full">
          <div className="tw-max-w-[1320px] tw-mx-auto tw-flex tw-items-center tw-justify-between tw-text-center">
            <div className="tw-flex tw-items-center tw-gap-6 tw-mx-auto lg:tw-mx-0">
              <span className="tw-font-medium">
                Summer edit: 10% off storewide with code{" "}
                <strong className="tw-underline tw-font-bold tw-text-white">SUMMERSALE10</strong>
              </span>
              <span className="tw-hidden sm:tw-inline tw-text-white/80">Pan-India Express Dispatch</span>
            </div>
            {width > breakpoint && (
              <div className="tw-hidden lg:tw-flex tw-items-center tw-gap-4 tw-text-sm tw-text-white/80">
                <Link
                  href="https://wa.me/8447247227?text=Hi"
                  target="_blank"
                  className="tw-text-white hover:tw-text-white/80 tw-no-underline tw-flex tw-items-center tw-gap-1.5"
                >
                  <WhatsAppIcon sx={{ fontSize: 18, color: "#25D366" }} />
                  <span>+91 84472 47227</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Main Desktop Navigation Bar */}
        {width > breakpoint ? (
          <nav className="tw-bg-white tw-border-b tw-border-solid tw-border-[#E6E8EC] tw-w-full">
            <div className="tw-max-w-[1320px] tw-mx-auto tw-px-6 tw-py-2.5">
              <div className="tw-flex tw-items-center tw-justify-between tw-gap-8">
                
                {/* Logo & Category Links */}
                <div className="tw-flex tw-items-center tw-gap-8 lg:tw-gap-10">
                  <Link href="/" className="tw-flex tw-items-center tw-no-underline">
                    <img
                      src={cdn("/pp_logo.png")}
                      alt="Prem Packaging Logo"
                      className="tw-h-12 tw-w-auto"
                    />
                  </Link>

                  <div className="tw-flex tw-items-center tw-gap-7 tw-text-base tw-font-semibold tw-text-[#10213D]">
                    {/* Categories Dropdown Menu */}
                    <div
                      ref={categoriesRef}
                      className="tw-relative"
                      onMouseEnter={openCategoriesMenu}
                      onMouseLeave={closeCategoriesMenu}
                    >
                      <button
                        type="button"
                        onClick={toggleCategoriesMenu}
                        className={`tw-flex tw-items-center tw-gap-1.5 tw-bg-transparent tw-border-0 tw-p-0 tw-text-base tw-font-semibold tw-transition-colors tw-cursor-pointer ${
                          isCategoriesOpen
                            ? "tw-text-[#D7192D]"
                            : "tw-text-[#10213D] hover:tw-text-[#D7192D]"
                        }`}
                        aria-expanded={isCategoriesOpen}
                      >
                        <span>Categories</span>
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className={`tw-w-3.5 tw-h-3.5 tw-transition-transform tw-duration-200 ${
                            isCategoriesOpen ? "tw-rotate-180 tw-text-[#D7192D]" : "tw-text-[#10213D]"
                          }`}
                        />
                      </button>

                      {/* Vertical Categories Dropdown Menu */}
                      {isCategoriesOpen && (
                        <div
                          className="tw-absolute tw-left-0 tw-top-full tw-mt-2 tw-w-72 tw-bg-white tw-border tw-border-solid tw-border-[#E6E8EC] tw-rounded-2xl tw-shadow-2xl tw-py-2 tw-z-[99999] before:tw-content-[''] before:tw-absolute before:-tw-top-3 before:tw-left-0 before:tw-w-full before:tw-h-3"
                          onMouseLeave={() => setActiveCategoryHover(null)}
                        >
                          <div className="tw-flex tw-flex-col">
                            {CATEGORY_DROPDOWN_ITEMS.map((item) => {
                              const hasSubItems = item.subItems && item.subItems.length > 0;
                              const isHovered = activeCategoryHover === item.id;

                              return (
                                <div
                                  key={item.id}
                                  className="tw-relative"
                                  onMouseEnter={() => setActiveCategoryHover(item.id)}
                                >
                                  <Link
                                    href={item.path}
                                    onClick={() => {
                                      setIsCategoriesOpen(false);
                                    }}
                                    className={`tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-3.5 tw-no-underline tw-transition-colors ${
                                      isHovered
                                        ? "tw-bg-[#FAF9F6] tw-text-[#D7192D]"
                                        : "tw-text-[#10213D] hover:tw-bg-[#FAF9F6] hover:tw-text-[#D7192D]"
                                    }`}
                                  >
                                    <span className="tw-text-xs tw-font-bold tw-tracking-wide tw-uppercase">
                                      {item.label}
                                    </span>
                                    {hasSubItems && (
                                      <FontAwesomeIcon
                                        icon={faChevronRight}
                                        className={`tw-w-2.5 tw-h-2.5 ${
                                          isHovered ? "tw-text-[#D7192D]" : "tw-text-[#667085]"
                                        }`}
                                      />
                                    )}
                                  </Link>

                                  {/* Sub-menu Flyout */}
                                  {hasSubItems && isHovered && (
                                    <div
                                      className="tw-absolute tw-left-full tw-top-0 -tw-mt-2 tw-ml-1.5 tw-w-64 tw-bg-white tw-border tw-border-solid tw-border-[#E6E8EC] tw-rounded-2xl tw-shadow-2xl tw-py-2.5 tw-z-[99999]"
                                      onMouseEnter={openCategoriesMenu}
                                    >
                                      {item.subItems.map((sub, sIdx) => (
                                        <Link
                                          key={sIdx}
                                          href={sub.path}
                                          onClick={() => {
                                            setIsCategoriesOpen(false);
                                          }}
                                          className="tw-block tw-px-4 tw-py-2.5 tw-text-xs tw-font-medium tw-text-[#475467] hover:tw-text-[#D7192D] hover:tw-bg-[#FAF9F6] tw-no-underline tw-transition-colors"
                                        >
                                          {sub.name}
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Dynamic backend categories if available */}
                            {categories.length > 0 && (
                              <div className="tw-mt-2 tw-pt-2 tw-border-t tw-border-solid tw-border-[#E6E8EC] tw-px-5">
                                <span className="tw-text-[10px] tw-font-bold tw-text-[#667085] tw-uppercase tw-tracking-wider tw-block tw-mb-1.5">
                                  All Database Categories
                                </span>
                                <div className="tw-flex tw-flex-col tw-gap-1">
                                  {categories.map((cat: any) => (
                                    <Link
                                      key={cat._id || cat.slug}
                                      href={getCategoryUrl(cat)}
                                      onClick={() => setIsCategoriesOpen(false)}
                                      className="tw-text-xs tw-text-[#475467] hover:tw-text-[#D7192D] tw-no-underline tw-py-1 tw-font-medium tw-block"
                                    >
                                      {cat.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <Link
                      href="/BestDeals"
                      className="tw-text-[#10213D] hover:tw-text-[#D7192D] tw-transition-colors tw-no-underline"
                    >
                      Bestsellers
                    </Link>

                    <Link
                      href="/custom-packaging"
                      className="tw-text-[#10213D] hover:tw-text-[#D7192D] tw-transition-colors tw-no-underline"
                    >
                      Custom packaging
                    </Link>

                    <Link
                      href="https://prempackaging.com/about-us"
                      className="tw-text-[#10213D] hover:tw-text-[#D7192D] tw-transition-colors tw-no-underline"
                    >
                      About Us
                    </Link>
                  </div>
                </div>

                {/* Pill Search Input */}
                <div className="tw-flex-1 tw-max-w-[440px] lg:tw-max-w-[500px] tw-relative">
                  <div className="tw-relative tw-w-full">
                    <span className="tw-absolute tw-left-4 tw-top-1/2 -tw-translate-y-1/2 tw-text-[#667085]">
                      <FontAwesomeIcon icon={faSearch} className="tw-w-4 tw-h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search boxes, bags, tapes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="tw-w-full tw-pl-11 tw-pr-4 tw-py-2 tw-bg-[#F7F8FA] tw-border tw-border-solid tw-border-[#E6E8EC] tw-rounded-full tw-text-base tw-text-[#10213D] focus:tw-outline-none focus:tw-bg-white focus:tw-border-[#0B2348] tw-transition-all"
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {searchProducts.length > 0 && searchQuery.length >= 2 && showDropdown && (
                    <div
                      ref={dropdownRef}
                      className="tw-absolute tw-left-0 tw-right-0 tw-top-full tw-mt-2 tw-bg-white tw-border tw-border-solid tw-border-[#E6E8EC] tw-rounded-xl tw-shadow-xl tw-z-50 tw-max-h-[300px] tw-overflow-y-auto tw-p-2"
                    >
                      {searchProducts.map((product, index) => (
                        <div
                          key={product?._id || product?.slug || index}
                          onClick={() => openSearchResult(product, setShowDropdown)}
                          className="tw-px-4 tw-py-2.5 hover:tw-bg-[#FAF9F6] tw-rounded-lg tw-cursor-pointer tw-text-base tw-text-[#10213D] tw-font-medium tw-transition-colors tw-capitalize"
                        >
                          {getSearchResultLabel(product)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Right Action Icons: Account, Wishlist, Cart */}
                <div className="tw-flex tw-items-center tw-gap-6 lg:tw-gap-8">
                  
                  {/* Account */}
                  <div className="tw-relative">
                    {isMounted && isLoggedIn ? (
                      <div
                        onMouseEnter={openUserMenu}
                        onMouseLeave={closeUserMenu}
                        className="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-text-base tw-font-semibold tw-text-[#10213D] hover:tw-text-[#D7192D] tw-transition-colors"
                      >
                        <FontAwesomeIcon icon={faUser} className="tw-w-4 tw-h-4 tw-text-[#10213D]" />
                        <span className="tw-max-w-32 tw-truncate" title={accountLabel}>
                          {accountLabel}
                        </span>
                        <ArrowDropDownIcon sx={{ color: "#10213D", fontSize: "18px", marginLeft: "-4px" }} />
                        
                        {isOpen && (
                          <div className="tw-absolute tw-right-0 tw-top-full tw-mt-2 tw-w-48 tw-bg-white tw-border tw-border-solid tw-border-[#E6E8EC] tw-rounded-xl tw-shadow-xl tw-py-2 tw-z-50">
                            <div
                              onClick={handleClickProfile}
                              className="tw-px-4 tw-py-2.5 hover:tw-bg-[#FAF9F6] tw-cursor-pointer tw-text-sm tw-text-[#10213D] tw-font-medium"
                            >
                              My Profile
                            </div>
                            <div
                              onClick={handleClickMyAccount}
                              className="tw-px-4 tw-py-2.5 hover:tw-bg-[#FAF9F6] tw-cursor-pointer tw-text-sm tw-text-[#10213D] tw-font-medium"
                            >
                              My Orders
                            </div>
                            <div
                              onClick={handleLogout}
                              className="tw-px-4 tw-py-2.5 hover:tw-bg-[#FAF9F6] tw-cursor-pointer tw-text-sm tw-text-[#D7192D] tw-font-medium tw-border-t tw-border-solid tw-border-[#E6E8EC]"
                            >
                              Logout
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={handleClickSignIn}
                        className="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-text-base tw-font-semibold tw-text-[#10213D] hover:tw-text-[#D7192D] tw-transition-colors"
                      >
                        <FontAwesomeIcon icon={faUser} className="tw-w-4 tw-h-4 tw-text-[#10213D]" />
                        <span>Sign in</span>
                      </div>
                    )}
                  </div>

                  {/* Wishlist */}
                  <Link
                    href="/wishlist"
                    className="tw-flex tw-items-center tw-gap-2 tw-text-base tw-font-semibold tw-text-[#10213D] hover:tw-text-[#D7192D] tw-transition-colors tw-no-underline"
                  >
                    <FontAwesomeIcon icon={faHeart} className="tw-w-4 tw-h-4 tw-text-[#10213D]" />
                  </Link>

                  {/* Cart */}
                  <Link
                    href="/my-cart"
                    onClick={handleClickCart}
                    className="tw-flex tw-items-center tw-gap-2 tw-text-base tw-font-semibold tw-text-[#10213D] hover:tw-text-[#D7192D] tw-transition-colors tw-no-underline"
                  >
                    <span
                      ref={desktopCartRef}
                      className="tw-relative tw-inline-flex tw-items-center tw-justify-center"
                      style={{
                        isolation: "isolate",
                        transition: "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                        transform: isCartLanding ? "scale(1.35) rotate(-8deg)" : "scale(1)",
                      }}
                    >
                      <FontAwesomeIcon icon={faCartShopping} className="tw-w-4 tw-h-4 tw-text-[#10213D]" />
                      {cartCount > 0 && (
                        <span className="tw-absolute -tw-top-2 -tw-right-2.5 tw-bg-[#D7192D] tw-text-white tw-text-[10px] tw-font-bold tw-w-4 tw-h-4 tw-rounded-full tw-flex tw-items-center tw-justify-center">
                          {cartCount}
                        </span>
                      )}
                    </span>
                    <span>Cart</span>
                  </Link>

                </div>
              </div>
            </div>
          </nav>
        ) : (
          /* Mobile View Header */
          <div className="mobileHeader">
            <div className="mobileHeaderTopRow">
              <div className="mobileHeaderGroup">
                <button
                  type="button"
                  className="mobileIconButton"
                  onClick={changetranslate}
                  aria-label="Open navigation menu"
                >
                  <FontAwesomeIcon icon={faNavicon} style={{ color: "#10213D", height: "22px", width: "22px" }} />
                </button>
              </div>

              <Link href="/" className="mobileLogoLink tw-flex tw-items-center" style={{ textDecoration: "none" }}>
                <img src={cdn("/pp_logo.png")} alt="Prem Packaging Logo" className="tw-h-9 tw-w-auto" />
              </Link>

              <div className="mobileHeaderGroup">
                <button
                  type="button"
                  className="mobileIconButton"
                  onClick={handleClickProfile}
                  aria-label="Account"
                >
                  <FontAwesomeIcon icon={faUser} style={{ color: "#10213D", height: "20px", width: "20px" }} />
                </button>
                <Link href="/my-cart" className="mobileIconButton" aria-label="Cart">
                  <div className="tw-relative">
                    <FontAwesomeIcon icon={faCartShopping} style={{ color: "#10213D", height: "20px", width: "20px" }} />
                    {cartCount > 0 && (
                      <span className="tw-absolute -tw-top-2 -tw-right-2 tw-bg-[#D7192D] tw-text-white tw-text-[10px] tw-font-bold tw-w-4 tw-h-4 tw-rounded-full tw-flex tw-items-center tw-justify-center">
                        {cartCount}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            </div>

            <div className="mobileSearchSection">
              <div className="mobileSearchBox">
                <FontAwesomeIcon icon={faSearch} className="mobileSearchIcon tw-text-[#667085]" />
                <input
                  className="mobileSearchInput"
                  type="text"
                  placeholder="Search boxes, bags, tapes..."
                  value={searchQueryMobile}
                  onChange={(e) => {
                    const nextQuery = e.target.value;
                    setSearchQueryMobile(nextQuery);
                    if (nextQuery.trim().length >= MIN_SEARCH_LENGTH) {
                      handleSearchMobile(nextQuery);
                    } else {
                      setSearchProductsMobile([]);
                      setShowDropdownMobile(false);
                    }
                  }}
                />
                {searchProductsMobile.length > 0 && searchQueryMobile.length >= 2 && showDropdownMobile && (
                  <div ref={dropdownRef} className="mobileSearchDropdown">
                    {searchProductsMobile.map((product, index) => (
                      <div
                        key={product?._id || product?.slug || index}
                        className="mobileSearchDropdownItem"
                        onClick={() => openSearchResult(product, setShowDropdownMobile)}
                      >
                        {getSearchResultLabel(product)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Sidebar Overlay & Drawer */}
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            className="mobileSidebarOverlay"
            onClick={changetranslate}
          />
        )}

        <div
          className="tw-bg-white"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            maxHeight: "100vh",
            overflowY: "auto",
            width: "min(320px, 82vw)",
            zIndex: 1000000,
            transition: "all 0.3s ease",
            transform: "translate(-" + sidebartranslatevalue + "%, 0)",
          }}
        >
          <div className="tw-bg-[#0B2348] tw-p-4 tw-flex tw-items-center tw-justify-between tw-text-[#FFFFFF]">
            <div className="tw-flex tw-items-center tw-gap-3">
              <FontAwesomeIcon icon={faUser} className="tw-text-[#D7192D] tw-w-5 tw-h-5" />
              <span className="tw-font-semibold tw-text-base tw-cursor-pointer" onClick={toggleDropdown}>
                {isMounted && isLoggedIn ? accountLabel : "Sign Up / Sign In"}
              </span>
            </div>
            <img
              src={cdn("/sidebarcross.png")}
              alt="Close"
              onClick={changetranslate}
              className="tw-w-5 tw-h-5 tw-cursor-pointer"
            />
          </div>

          <div className="tw-p-4 tw-space-y-4 tw-font-medium tw-text-[#10213D]">
            {/* Mobile Categories Accordion */}
            <Accordion elevation={0} style={{ background: "transparent" }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                style={{ padding: 0, minHeight: "auto" }}
              >
                <span className="tw-font-semibold tw-text-[#10213D] tw-text-base">
                  Categories
                </span>
              </AccordionSummary>
              <AccordionDetails style={{ padding: "8px 0 0 8px" }}>
                <div className="tw-space-y-3 tw-text-sm">
                  {CATEGORY_DROPDOWN_ITEMS.map((catItem, idx) => (
                    <div key={idx} className="tw-space-y-1">
                      <Link
                        href={catItem.path}
                        onClick={changetranslate}
                        className="tw-block tw-font-bold tw-text-xs tw-text-[#0B2348] hover:tw-text-[#D7192D] tw-no-underline"
                      >
                        {catItem.label}
                      </Link>
                      {catItem.subItems && catItem.subItems.map((item, subIdx) => (
                        <Link
                          key={subIdx}
                          href={item.path}
                          onClick={changetranslate}
                          className="tw-block tw-text-xs tw-text-[#667085] hover:tw-text-[#D7192D] tw-no-underline tw-pl-2 tw-py-0.5"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </AccordionDetails>
            </Accordion>

            <Link href="/BestDeals" onClick={changetranslate} className="tw-block tw-py-2 tw-text-[#10213D] tw-no-underline">
              Bestsellers
            </Link>
            <Link href="/custom-packaging" onClick={changetranslate} className="tw-block tw-py-2 tw-text-[#10213D] tw-no-underline">
              Custom Packaging
            </Link>
            <Link href="https://prempackaging.com/about-us" onClick={changetranslate} className="tw-block tw-py-2 tw-text-[#10213D] tw-no-underline">
              About Us
            </Link>
          </div>
        </div>

      </div>
      <div aria-hidden="true" style={{ height: `${navbarHeight}px` }} />
      <style jsx>{`
.mobileSidebarOverlay { display: none; }
@media (max-width: 700px) {
  .mobileSidebarOverlay { display: block; position: fixed; inset: 0; border: 0; background: rgba(17, 24, 39, 0.4); z-index: 999999; }
}
.mobileHeader { display: none; }
@media (max-width: 700px) {
  .mobileHeader { display: flex; flex-direction: column; gap: 12px; width: 100%; padding: 12px 16px; background: #fff; border-bottom: 1px solid #e5e7eb; }
}
.mobileHeaderTopRow { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; }
.mobileHeaderGroup { display: flex; align-items: center; gap: 12px; }
.mobileHeaderGroup:last-child { justify-content: flex-end; }
.mobileIconButton { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; padding: 0; border: 0; background: transparent; text-decoration: none; }
.mobileLogoLink { display: inline-flex; align-items: center; justify-content: center; }
.mobileSearchSection { width: 100%; }
.mobileSearchBox { position: relative; display: flex; align-items: center; width: 100%; min-height: 42px; padding-left: 38px; border: 1px solid #e5e7eb; border-radius: 9999px; background: #f7f8fa; }
.mobileSearchIcon { position: absolute; left: 14px; width: 16px; height: 16px; }
.mobileSearchInput { width: 100%; border: 0; background: transparent; color: #111827; font-family: inherit; font-size: 14px; padding: 10px 14px 10px 0; }
.mobileSearchInput:focus { outline: none; }
.mobileSearchDropdown { position: absolute; top: calc(100% + 8px); left: 0; width: 100%; max-height: 220px; overflow-y: auto; border: 1px solid #d1d5db; background: #fff; z-index: 1001; border-radius: 12px; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); }
.mobileSearchDropdownItem { padding: 10px 14px; cursor: pointer; text-transform: capitalize; font-size: 13px; line-height: 1.5; border-bottom: 1px solid #f3f4f6; }
`}</style>
    </>
  );
};

export default Navbar;
