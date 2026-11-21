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
  const breakpoint = 1100;
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const updateNavbarHeight = () => {
      const nextHeight = Math.ceil(
        navbarRef.current?.getBoundingClientRect().height || 0,
      );

      if (nextHeight > 0) {
        document.documentElement.style.setProperty("--store-navbar-height", `${nextHeight}px`);
        setNavbarHeight((currentHeight) =>
          currentHeight === nextHeight ? currentHeight : nextHeight,
        );
      }
    };

    updateNavbarHeight();

    if (!navbarRef.current) {
      return undefined;
    }

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateNavbarHeight)
        : null;

    if (resizeObserver) {
      resizeObserver.observe(navbarRef.current);
    }

    window.addEventListener("resize", updateNavbarHeight);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateNavbarHeight);
    };
  }, [width]);

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
      if (response?.data?.success && trimmedQuery !== lastTrackedSearchRef.current) {
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
      if (response?.data?.success && trimmedQuery !== lastTrackedSearchRef.current) {
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
        <div className="legacyAnnouncement tw-bg-[#0B2348] tw-text-white tw-text-sm sm:tw-text-base tw-py-1.5 tw-px-4 tw-w-full">
          <div className="storefront-shell tw-flex tw-items-center tw-justify-between tw-text-center">
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

        {width > breakpoint && (
          <div className="desktopB2BNav">
            <div className="desktopB2BNav__top">
              <div className="storefront-shell desktopB2BNav__topInner">
                <Link href="/" className="desktopB2BNav__brand tw-flex tw-flex-nowrap tw-items-center tw-gap-2 tw-no-underline" aria-label="Prem Industries home">
                  <img src="/Logohead.png" alt="" width={52} height={56} className="tw-w-[52px] tw-h-[56px] tw-object-contain" />
                  <img src="/Logotext.png" alt="Prem Industries — Innovation in action" width={168} height={28} className="tw-w-[168px] tw-h-[28px] tw-object-contain" />
                </Link>

                <div className="desktopB2BNav__storeLabel">
                  <span>B2B packaging</span>
                  <span>online store</span>
                </div>

                <div className="desktopB2BNav__search">
                  <FontAwesomeIcon icon={faSearch} aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Search for boxes, mailer bags, tapes, pouches..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    aria-label="Search packaging products"
                  />
                  <button type="button" onClick={() => handleSearch(searchQuery)} aria-label="Search products">
                    <FontAwesomeIcon icon={faSearch} aria-hidden="true" />
                  </button>

                  {searchProducts.length > 0 && searchQuery.length >= 2 && showDropdown && (
                    <div ref={dropdownRef} className="desktopB2BNav__searchResults">
                      {searchProducts.map((product, index) => (
                        <button
                          type="button"
                          key={product?._id || product?.slug || index}
                          onClick={() => openSearchResult(product, setShowDropdown)}
                        >
                          {getSearchResultLabel(product)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="desktopB2BNav__account"
                  onMouseEnter={openUserMenu}
                  onMouseLeave={closeUserMenu}
                >
                  <button type="button" onClick={isLoggedIn ? handleClickProfile : handleClickSignIn}>
                    <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                    <span>{isLoggedIn ? accountLabel : <>Sign in /<br />Register</>}</span>
                  </button>
                  {isMounted && isLoggedIn && isOpen && (
                    <div className="desktopB2BNav__accountMenu">
                      <button type="button" onClick={handleClickProfile}>My profile</button>
                      <button type="button" onClick={handleClickMyAccount}>My orders</button>
                      <button type="button" onClick={handleLogout}>Log out</button>
                    </div>
                  )}
                </div>

                <Link href="/my-cart" onClick={handleClickCart} className="desktopB2BNav__cart tw-text-[#071d44] tw-no-underline hover:tw-text-[#d71920]">
                  <span ref={desktopCartRef} className="desktopB2BNav__cartIcon">
                    <FontAwesomeIcon icon={faCartShopping} aria-hidden="true" />
                    {cartCount > 0 && <strong>{cartCount}</strong>}
                  </span>
                  <span>Cart</span>
                </Link>
              </div>
            </div>

            <nav className="desktopB2BNav__categories" aria-label="Product categories">
              <div className="storefront-shell desktopB2BNav__categoryInner">
                <div
                  ref={categoriesRef}
                  className="desktopB2BNav__allProducts"
                  onMouseEnter={openCategoriesMenu}
                  onMouseLeave={closeCategoriesMenu}
                >
                  <button type="button" onClick={toggleCategoriesMenu} aria-expanded={isCategoriesOpen}>
                    <FontAwesomeIcon icon={faNavicon} aria-hidden="true" />
                    <span>All products</span>
                    <FontAwesomeIcon icon={faChevronDown} aria-hidden="true" />
                  </button>
                  {isCategoriesOpen && (
                    <div className="desktopB2BNav__categoryMenu">
                      {CATEGORY_DROPDOWN_ITEMS.map((item) => (
                        <Link key={item.id} href={item.path} onClick={() => setIsCategoriesOpen(false)} className="tw-text-[#071d44] tw-no-underline hover:tw-text-[#d71920]">
                          <span>{item.label}</span>
                          {item.subItems.length > 0 && <FontAwesomeIcon icon={faChevronRight} aria-hidden="true" />}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <Link className="tw-text-white tw-no-underline hover:tw-text-white" href="/corrugated-boxes">Corrugated boxes</Link>
                <Link className="tw-text-white tw-no-underline hover:tw-text-white" href="/poly-bags">Mailer bags</Link>
                <Link className="tw-text-white tw-no-underline hover:tw-text-white" href="/paper-bags">Paper bags</Link>
                <Link className="tw-text-white tw-no-underline hover:tw-text-white" href="/packpro-tapes">Tapes &amp; labels</Link>
                <Link className="tw-text-white tw-no-underline hover:tw-text-white" href="/poly-bags">Pouches</Link>
                <Link className="tw-text-white tw-no-underline hover:tw-text-white" href="/custom-packaging">Custom packaging</Link>
                <Link className="tw-text-white tw-no-underline hover:tw-text-white" href="/contact-us">Bulk enquiry</Link>
              </div>
            </nav>
          </div>
        )}

        {/* Main Desktop Navigation Bar */}
        {width > breakpoint ? (
          <nav className="legacyDesktopNav tw-bg-white tw-border-b tw-border-solid tw-border-[#E6E8EC] tw-w-full">
            <div className="storefront-shell tw-py-2.5">
              <div className="tw-flex tw-items-center tw-justify-between tw-gap-8">
                
                {/* Logo & Category Links */}
                <div className="tw-flex tw-items-center tw-gap-8 lg:tw-gap-10">
                  <Link href="/" className="tw-flex tw-items-center tw-no-underline">
                    <img
                      src="/pp_logo.png"
                      alt="Prem Packaging Logo"
                      className="tw-h-12 tw-w-auto"
                    />
                  </Link>

                  <div className="tw-flex tw-items-center tw-gap-7 tw-text-base tw-font-semibold tw-text-[#10213D]">
                    {/* Categories Dropdown Menu */}
                    <div
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
                          className="tw-absolute tw-left-0 tw-top-full tw-mt-2 tw-w-72 tw-bg-white tw-border tw-border-solid tw-border-[#E6E8EC] tw-rounded tw-shadow-sm tw-py-2 tw-z-[99999] before:tw-content-[''] before:tw-absolute before:-tw-top-3 before:tw-left-0 before:tw-w-full before:tw-h-3"
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
                                      className="tw-absolute tw-left-full tw-top-0 -tw-mt-2 tw-ml-1.5 tw-w-64 tw-bg-white tw-border tw-border-solid tw-border-[#E6E8EC] tw-rounded tw-shadow-sm tw-py-2.5 tw-z-[99999]"
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
                                <span className="tw-text-[10px] tw-font-bold tw-text-[#667085] tw-uppercase tw-tracking-normal tw-block tw-mb-1.5">
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
                      className="tw-w-full tw-pl-11 tw-pr-4 tw-py-2 tw-bg-[#F7F8FA] tw-border tw-border-solid tw-border-[#E6E8EC] tw-rounded tw-text-base tw-text-[#10213D] focus:tw-outline-none focus:tw-bg-white focus:tw-border-[#0B2348] tw-transition-all"
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {searchProducts.length > 0 && searchQuery.length >= 2 && showDropdown && (
                    <div
                      className="tw-absolute tw-left-0 tw-right-0 tw-top-full tw-mt-2 tw-bg-white tw-border tw-border-solid tw-border-[#E6E8EC] tw-rounded tw-shadow-sm tw-z-50 tw-max-h-[300px] tw-overflow-y-auto tw-p-2"
                    >
                      {searchProducts.map((product, index) => (
                        <div
                          key={product?._id || product?.slug || index}
                          onClick={() => openSearchResult(product, setShowDropdown)}
                          className="tw-px-4 tw-py-2.5 hover:tw-bg-[#FAF9F6] tw-rounded tw-cursor-pointer tw-text-base tw-text-[#10213D] tw-font-medium tw-transition-colors tw-capitalize"
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
                          <div className="tw-absolute tw-right-0 tw-top-full tw-mt-2 tw-w-48 tw-bg-white tw-border tw-border-solid tw-border-[#E6E8EC] tw-rounded tw-shadow-sm tw-py-2 tw-z-50">
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
                <img src="/pp_logo.png" alt="Prem Packaging Logo" className="tw-h-9 tw-w-auto" />
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
.legacyAnnouncement,
.legacyDesktopNav { display: none !important; }
.desktopB2BNav { width: 100%; background: #fff; color: #071d44; font-family: var(--font-store); }
.desktopB2BNav__top { min-height: 82px; border-bottom: 1px solid #d8dee8; background: #fff; }
.desktopB2BNav__topInner { min-height: 82px; display: grid; grid-template-columns: auto auto minmax(320px, 1fr) auto auto; align-items: center; gap: 24px; }
.desktopB2BNav__brand { display: inline-flex; align-items: center; gap: 8px; min-width: 224px; text-decoration: none; }
.desktopB2BNav__brand img:first-child { width: 50px; height: 54px; object-fit: contain; }
.desktopB2BNav__brand img:last-child { width: 168px; height: 28px; object-fit: contain; }
.desktopB2BNav__storeLabel { min-width: 142px; padding-left: 22px; border-left: 1px solid #9ca8bb; color: #071d44; font-size: 14px; font-weight: 700; line-height: 1.25; text-transform: uppercase; }
.desktopB2BNav__storeLabel span { display: block; }
.desktopB2BNav__search { position: relative; display: grid; grid-template-columns: 46px minmax(0, 1fr) 58px; min-height: 50px; align-items: center; border: 1px solid #aab4c4; border-radius: 6px; background: #fff; overflow: visible; }
.desktopB2BNav__search > svg { width: 20px; height: 20px; justify-self: center; color: #071d44; }
.desktopB2BNav__search input { width: 100%; height: 48px; padding: 0 8px; border: 0; outline: 0; background: transparent; color: #071d44; font-size: 15px; }
.desktopB2BNav__search > button { width: 58px; height: 50px; margin: -1px -1px -1px 0; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 0 6px 6px 0; background: #d71920; color: #fff; cursor: pointer; }
.desktopB2BNav__search > button:hover { background: #b91019; }
.desktopB2BNav__search > button svg { width: 20px; height: 20px; }
.desktopB2BNav__searchResults { position: absolute; top: calc(100% + 8px); left: 0; right: 0; z-index: 100; max-height: 320px; padding: 8px; overflow-y: auto; border: 1px solid #d8dee8; border-radius: 6px; background: #fff; box-shadow: 0 16px 32px rgb(7 29 68 / 14%); }
.desktopB2BNav__searchResults button { width: 100%; min-height: 44px; padding: 10px 12px; border: 0; background: #fff; color: #263750; text-align: left; text-transform: capitalize; cursor: pointer; }
.desktopB2BNav__searchResults button:hover { background: #f3f6fa; color: #d71920; }
.desktopB2BNav__account { position: relative; }
.desktopB2BNav__account > button { min-height: 48px; display: inline-flex; align-items: center; gap: 10px; padding: 0; border: 0; background: transparent; color: #071d44; font-size: 14px; font-weight: 700; line-height: 1.15; text-align: left; cursor: pointer; }
.desktopB2BNav__account > button svg { width: 26px; height: 26px; }
.desktopB2BNav__accountMenu { position: absolute; top: 100%; right: 0; z-index: 100; width: 170px; padding: 8px; border: 1px solid #d8dee8; border-radius: 6px; background: #fff; box-shadow: 0 16px 32px rgb(7 29 68 / 14%); }
.desktopB2BNav__accountMenu button { width: 100%; min-height: 40px; padding: 8px 10px; border: 0; background: #fff; color: #263750; text-align: left; cursor: pointer; }
.desktopB2BNav__accountMenu button:hover { background: #f3f6fa; color: #d71920; }
.desktopB2BNav__cart { min-height: 48px; display: inline-flex; align-items: center; gap: 9px; padding-left: 20px; border-left: 1px solid #aab4c4; color: #071d44; font-size: 15px; font-weight: 700; text-decoration: none; }
.desktopB2BNav__cart:hover { color: #d71920; }
.desktopB2BNav__cartIcon { position: relative; display: inline-flex; }
.desktopB2BNav__cartIcon svg { width: 26px; height: 26px; }
.desktopB2BNav__cartIcon strong { position: absolute; top: -9px; right: -10px; min-width: 19px; height: 19px; padding: 0 4px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: #d71920; color: #fff; font-size: 10px; }
.desktopB2BNav__categories { min-height: 56px; background: #071d44; }
.desktopB2BNav__categoryInner { min-height: 56px; display: flex; align-items: stretch; justify-content: space-between; }
.desktopB2BNav__categoryInner > a { min-height: 56px; display: inline-flex; align-items: center; padding: 0 14px; color: #fff; font-size: 14px; font-weight: 600; text-decoration: none; white-space: nowrap; }
.desktopB2BNav__categoryInner > a:hover { background: #0d2f67; color: #fff; }
.desktopB2BNav__allProducts { position: relative; flex: 0 0 auto; }
.desktopB2BNav__allProducts > button { min-width: 190px; height: 56px; display: inline-flex; align-items: center; justify-content: center; gap: 12px; padding: 0 18px; border: 0; border-radius: 6px 6px 0 0; background: #d71920; color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; }
.desktopB2BNav__allProducts > button:hover { background: #b91019; }
.desktopB2BNav__allProducts > button svg:first-child { width: 18px; height: 18px; }
.desktopB2BNav__allProducts > button svg:last-child { width: 12px; height: 12px; }
.desktopB2BNav__categoryMenu { position: absolute; top: 100%; left: 0; z-index: 100; width: 300px; padding: 8px 0; border: 1px solid #d8dee8; border-top: 0; background: #fff; box-shadow: 0 16px 32px rgb(7 29 68 / 16%); }
.desktopB2BNav__categoryMenu a { min-height: 46px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 16px; color: #071d44; font-size: 13px; font-weight: 700; text-decoration: none; }
.desktopB2BNav__categoryMenu a:hover { background: #f3f6fa; color: #d71920; }
.desktopB2BNav__categoryMenu svg { width: 12px; height: 12px; }
@media (max-width: 1280px) {
  .desktopB2BNav__topInner { gap: 16px; grid-template-columns: auto auto minmax(260px, 1fr) auto auto; }
  .desktopB2BNav__brand { min-width: 190px; }
  .desktopB2BNav__brand img:last-child { width: 140px; }
  .desktopB2BNav__storeLabel { min-width: 118px; padding-left: 16px; font-size: 12px; }
  .desktopB2BNav__categoryInner > a { padding-inline: 9px; font-size: 13px; }
  .desktopB2BNav__allProducts > button { min-width: 170px; }
}
.mobileSidebarOverlay { display: none; }
@media (max-width: 1100px) {
  .mobileSidebarOverlay { display: block; position: fixed; inset: 0; border: 0; background: rgba(17, 24, 39, 0.4); z-index: 999999; }
}
.mobileHeader { display: none; }
@media (max-width: 1100px) {
  .mobileHeader { display: flex; flex-direction: column; gap: 12px; width: 100%; padding: 12px 16px; background: #fff; border-bottom: 1px solid #e5e7eb; }
}
.mobileHeaderTopRow { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; }
.mobileHeaderGroup { display: flex; align-items: center; gap: 12px; }
.mobileHeaderGroup:last-child { justify-content: flex-end; }
.mobileIconButton { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; text-decoration: none; }
.mobileLogoLink { display: inline-flex; align-items: center; justify-content: center; }
.mobileSearchSection { width: 100%; }
.mobileSearchBox { position: relative; display: flex; align-items: center; width: 100%; min-height: 44px; padding-left: 38px; border: 1px solid #e5e7eb; border-radius: var(--radius-control); background: #f7f8fa; }
.mobileSearchIcon { position: absolute; left: 14px; width: 16px; height: 16px; }
.mobileSearchInput { width: 100%; border: 0; background: transparent; color: #111827; font-family: inherit; font-size: 14px; padding: 10px 14px 10px 0; }
.mobileSearchInput:focus-visible { outline: 2px solid #182c5a; outline-offset: 2px; }
.mobileSearchDropdown { position: absolute; top: calc(100% + 8px); left: 0; width: 100%; max-height: 220px; overflow-y: auto; border: 1px solid #d1d5db; background: #fff; z-index: 1001; border-radius: var(--radius-control); box-shadow: var(--shadow-surface); }
.mobileSearchDropdownItem { padding: 10px 14px; cursor: pointer; text-transform: capitalize; font-size: 13px; line-height: 1.5; border-bottom: 1px solid #f3f4f6; }
`}</style>
    </>
  );
};

export default Navbar;
