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
  faChevronDown,
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
  const breakpoint = 700;
  const DEFAULT_NAVBAR_HEIGHT = 167;
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
      return (
        fullName ||
        String(parsed?.name || parsed?.full_name || parsed?.fullName || "").trim() ||
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
  const [sidebartranslatevalue, Setsidebartranslatevalue] = useState(100);
  const [isPackproDropdownOpen, setPackproDropdownOpen] = useState(false);
  const [isRollabelDropdownOpen, setRollabelDropdownOpen] = useState(false);
  const [isNewDropdownOpen, setIsNewDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subCat, setSubCat] = useState([]);
  const [width, setWidth] = useState(0);
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
  const [navbarHeight, setNavbarHeight] = useState(DEFAULT_NAVBAR_HEIGHT);
  const userMenuTimerRef = useRef<any>(null);
  const navbarRef = useRef<any>(null);
  const DEBOUNCE_DELAY = 500;
  const MIN_SEARCH_LENGTH = 2;
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
    // console.log(PRODUCTION);
  }, []);

  useEffect(() => {
    const handleCartUpdate = () => {
      handleCart();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("cartUpdated", handleCartUpdate);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("cartUpdated", handleCartUpdate);
      }
      if (userMenuTimerRef.current) {
        clearTimeout(userMenuTimerRef.current);
      }
    };
  }, []);

  const Accordion = styled((props) => (
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

  const handleNavDropdownOutside = (event) => {
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

  const handleCloseDropdown = () => {
    setPackproDropdownOpen(false);
    setRollabelDropdownOpen(false);
  };

  const handleClickOutside2 = (event) => {
    if (dropdownRef2.current && !dropdownRef2.current.contains(event.target)) {
      setIsOpen(false);
      // setDropdownTapeOpen(false);
      // setIsOpen(false);
    }
  };

  const toggleNewDropdown = () => {
    setIsNewDropdownOpen(!isNewDropdownOpen);
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleNavDropdownOutside);
    // document.addEventListener("mousedown", handleClickOutside2);

    return () => {
      document.removeEventListener("mousedown", handleNavDropdownOutside);
      // document.removeEventListener("mousedown", handleClickOutside2);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWidth(window.innerWidth);
      const handleResizeWindow = () => setWidth(window.innerWidth);
      // subscribe to window resize event "onComponentDidMount"

      window.addEventListener("resize", handleResizeWindow);
      return () => {
        // unsubscribe "onComponentDestroy"
        window.removeEventListener("resize", handleResizeWindow);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const updateNavbarHeight = () => {
      const nextHeight = Math.ceil(
        navbarRef.current?.getBoundingClientRect().height || 0,
      );

      if (nextHeight > 0) {
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

  const customStyles = {
    control: (provided) => ({
      ...provided,
      border: "none", // Remove the border
      fontFamily: "Montserrat", // Set the custom font family
      fontSize: "16px",
      textAlign: "right",
      color: "#333333",
      fontWeight: 400,
      textTransform: "capitalize",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#333333",
      textAlign: "right",
      width: "auto",
      minWidth: "40px", // Set the placeholder color to black
    }),
    menu: (provided) => ({
      ...provided,
      width: "120px", // Set the desired fixed width for the menu
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      backgroundImage:
        'url("https://res.cloudinary.com/dwxqg9so3/image/upload/v1693866197/Stroke-1_ymridf.png")', // Set your custom arrow image
      backgroundSize: "10px", // Adjust the size of your custom arrow
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      width: "0px", // Set the width of the dropdown indicator
    }),
    // Add any other custom styles here for other components like menu, option, etc.
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const openUserMenu = () => {
    if (!token) return; // do not open dropdown when logged out
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

  useEffect(() => {
    // Refresh auth state on navigation (helps after login redirects)
    setToken(readStoredToken());
    setUserName(readStoredUserName());
    handleCart();
  }, [router.asPath]);

  useEffect(() => {
    // Keep auth state in sync across tabs and storage updates
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

  // Ensure name clears when auth token is missing
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Clicked outside the dropdown, close it
        setShowDropdown(false);
      }
    };

    // Attach the event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener on component unmount
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
        className="row m-0"
        style={{
          position: "fixed",
          backgroundColor: "white",
          zIndex: "20",
          width: `${width > breakpoint ? "100vw" : "100vw"}`,
          boxShadow: "rgba(0, 0, 0, 0.1) 0px 4px 12px",
        }}
      >
        <Marquee className="text-white" style={marqueeStyle}>
          {marqueeContent}
        </Marquee>
        {width > breakpoint && (
          <div
            className="topbar w-100"
            style={{
              backgroundColor: "#EAEAEA",
              height: "32px",
              fontSize: "12px",
              fontFamily: "Montserrat, sans-serif",
              fontWeight: "500",
              color: "#333333",
              borderBottom: "1px solid #dcdcdc"
            }}
          >
            <div className="d-flex align-items-center justify-content-end h-100 w-100" style={{ gap: "12px", paddingRight: "75px" }}>
              {/* Account Dropdown */}
              <div style={{ position: "relative" }}>
                {isMounted && isLoggedIn ? (
                  <div
                    onMouseEnter={openUserMenu}
                    onMouseLeave={closeUserMenu}
                    style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <FontAwesomeIcon
                      icon={faUser}
                      style={{
                        color: "#E92227",
                        width: "12px",
                        height: "12px",
                      }}
                    />
                    <span>{accountLabel}</span>
                    <ArrowDropDownIcon sx={{ color: "#333333", fontSize: "14px", marginLeft: "-4px" }} />
                    
                    {isOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          right: "0",
                          backgroundColor: "white",
                          border: "1px solid #ccc",
                          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
                          zIndex: 1000,
                          minWidth: "120px",
                          borderRadius: "4px",
                          marginTop: "4px",
                        }}
                      >
                        <div
                          style={{
                            padding: "8px 12px",
                            borderBottom: "1px solid #eee",
                            fontSize: "12px",
                            color: "#333333",
                            fontWeight: "500",
                          }}
                          onClick={handleClickMyAccount}
                        >
                          My Orders
                        </div>
                        <div
                          style={{
                            padding: "8px 12px",
                            fontSize: "12px",
                            color: "#E92227",
                            fontWeight: "500",
                          }}
                          onClick={handleLogout}
                        >
                          Logout
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                    onClick={handleClickSignIn}
                  >
                    <FontAwesomeIcon
                      icon={faUser}
                      style={{
                        color: "#E92227",
                        width: "12px",
                        height: "12px",
                      }}
                    />
                    <span>Sign Up / Sign In</span>
                  </div>
                )}
              </div>

              <span style={{ color: "#ccc" }}>|</span>

              {/* Cart */}
              <Link
                href="/my-cart"
                style={{
                  textDecoration: "none",
                  color: "#333333",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FontAwesomeIcon
                  icon={faCartShopping}
                  style={{
                    color: "#E92227",
                    width: "12px",
                    height: "12px",
                  }}
                />
                <span>Cart ({cartCount})</span>
              </Link>

              <span style={{ color: "#ccc" }}>|</span>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                style={{
                  textDecoration: "none",
                  color: "#333333",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FontAwesomeIcon
                  icon={faHeart}
                  style={{
                    color: "#E92227",
                    width: "12px",
                    height: "12px",
                  }}
                />
                <span>Wishlist</span>
              </Link>
            </div>
          </div>
        )}
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            className={"mobileSidebarOverlay"}
            onClick={changetranslate}
          />
        )}
        {/* sidebar mobile view */}
        <div
          className="bg-white"
          style={{
            position: "absolute",
            height: "100vh",
            maxHeight: "100vh",
            overflowY: "auto",
            width: "min(320px, 82vw)",
            zIndex: "1000000",
            transition: "all 0.3s ease",
            transform: "translate(-" + sidebartranslatevalue + "%, 0)",
          }}
        >
          <div
            className="row "
            style={{ backgroundColor: "#182C5A", height: "50px" }}
          >
            <div
              className="d-flex flex-row align-items-center "
              style={{
                justifyContent: "space-between",
                marginTop: "10px",
                // padding: "0px",
                paddingLeft: "10px",
                paddingRight: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "5px",
                  alignItems: "center",
                  paddingLeft: "20px",
                  paddingRight: "10px",
                }}
              >
                <FontAwesomeIcon
                  icon={faUser}
                  // onClick={toggleDropdown}
                  style={{
                    color: "#e92227",
                    width: "20px",
                    height: "20px",
                    paddingLeft: "0px",
                  }}
                />
                <p
                  className="headertext"
                  style={{
                    marginLeft: "7px",
                    marginBottom: "0px",
                    color: "#FFF",
                    fontFeatureSettings: "'liga' off",
                    fontFamily: "Montserrat",
                    fontSize: "16px",
                    fontStyle: "normal",
                    fontWeight: "500",
                    lineHeight: "18px",
                    cursor: "pointer",
                    textTransform: "capitalize",
                    userSelect: "none",
                  }}
                  onClick={toggleDropdown}
                >
                  <span suppressHydrationWarning>
                    {isMounted && isLoggedIn ? accountLabel : "Sign Up / Sign In"}
                  </span>
                </p>
              </div>

              <div className="m-0 d-flex" style={{ width: "fit-content" }}>
                <img
                  src="/sidebarcross.png"
                  alt="Close navigation menu"
                  onClick={changetranslate}
                  style={{ cursor: "pointer", height: "24px", width: "24px" }}
                />
              </div>
              {isOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "15%",
                  right: "15%",
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  marginTop: "5px",
                    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                    zIndex: "999",
                  }}
                >
                <div
                  className="dropdown-item"
                  style={{ padding: "8px", borderBottom: "1px solid #ccc" }}
                  onClick={handleLogout}
                >
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      textDecoration: "none solid rgb(51,51,51)",
                      color: "#333333",
                      cursor: "pointer",
                    }}
                  >
                    Logout
                  </span>
                </div>

                <div
                  className="dropdown-item text-center"
                  style={{ padding: "8px", borderBottom: "1px solid #ccc" }}
                >
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      textDecoration: "none solid rgb(51,51,51)",
                      color: "#333333",
                      cursor: "pointer",
                    }}
                    onClick={handleClickMyAccount}
                  >
                    My Orders
                  </span>
                </div>
              </div>
            )}

            <div
              style={{
                marginLeft: "12px",
                height: "18px",
                borderLeft: "2px solid #D9D9D9",
              }}
            ></div>
            <Link
              href="/my-cart"
              onClick={handleClickCart}
              style={{ textDecoration: "none", color: "black" }}
            >
              <FontAwesomeIcon
                icon={faCartShopping}
                style={{
                  color: "#e92227",
                  width: "15px",
                  height: "15px",
                  paddingLeft: "10px",
                }}
              />
            </Link>
            <p
              className="headertext"
              style={{ marginLeft: "7px", marginBottom: "0px" }}
            >
              <Link
                href="/my-cart"
                onClick={handleClickCart}
                style={{
                  textDecoration: "none solid rgb(51,51,51)",
                  color: "#333333",
                }}
              >
                Cart ({cart?.count !== undefined ? cart.count : 0})
              </Link>
            </p>
            <div
              style={{
                marginLeft: "12px",
                height: "18px",
                borderLeft: "2px solid #D9D9D9",
              }}
            ></div>
            <Link
              href="/wishlist"
              style={{ textDecoration: "none", color: "black" }}
            >
              <FontAwesomeIcon
                icon={faHeart}
                style={{
                  color: "#E92227",
                  width: "15px",
                  height: "15px",
                  paddingLeft: "10px",
                }}
              />
            </Link>
            <p
              className="headertext"
              style={{ marginLeft: "7px", marginBottom: "0px" }}
            >
              <Link
                href="/wishlist"
                style={{
                  textDecoration: "none solid rgb(51,51,51)",
                  color: "#333333",
                }}
              >
                Wishlist
              </Link>
            </p>
          </div>
        </div>
        </div>

        {/* header part 1 */}

        {width > breakpoint ? (
          <div className="row p-0 m-0" style={{ height: "100px" }}>
            <div className="row p-0 m-0">
              <div className="col-3 m-0 p-0 d-flex justify-content-center align-items-center">
                <Link href="https://prempackaging.com">
                  <div className="row ml-3 d-flex flex-column justify-content-center align-items-center">
                    <img
                      src="/pp_logo_1.png"
                      alt="Premium Packaging Logo"
                      style={{ width: "110px", padding: "0px" }}
                    />
                  </div>
                </Link>

                <div
                  className="col-8 pl-5 d-flex justify-content-center align-items-center"
                  style={{ position: "relative" }}
                >
                  <input
                    className="w-100 px-2 bg-transparent border-1"
                    style={{
                      fontSize: "14px",
                      borderRadius: "4px",
                      paddingBlock: "8px",
                    }}
                    type="text"
                    placeholder="Search for Products"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {searchProducts.length > 0 &&
                searchQuery.length >= 2 &&
                showDropdown && (
                  <div
                    ref={dropdownRef}
                    className="dropdown-content"
                    style={{
                      position: "absolute",
                      backgroundColor: "#ffffff",
                      border: "1px solid #ccc",
                      maxWidth: "280px",
                      zIndex: "1000",
                      marginTop: "67px",
                      marginLeft: "147px",
                      maxHeight: "150px",
                      overflowY: "auto",
                    }}
                  >
                    {searchProducts.map((product, index) => (
                      <div
                        key={product?._id || product?.slug || index}
                        style={{
                          padding: "8px",
                          textTransform: "capitalize",
                          // borderRadius: "40px",
                          borderBottom:
                            index !== searchProducts.length - 1
                              ? "1px solid #ccc"
                              : "none",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          openSearchResult(product, setShowDropdown);
                        }}
                      >
                        {getSearchResultLabel(product)}
                      </div>
                    ))}
                  </div>
                )}

              <div className="col-7 m-0 p-0 d-flex align-items-center justify-content-center">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "30px",
                    fontSize: "18px",
                    fontFamily: "Montserrat",
                    fontWeight: "400",
                    lineHeight: "24px",
                  }}
                >
                  <Link
                    href="/corrugated-boxes"
                    onClick={handleClick}
                    style={{
                      textDecoration: "none solid rgb(51,51,51)",
                      color: "#333333",
                      fontWeight: "600",
                      fontSize: "14px",
                      lineHeight: "21px",
                    }}
                  >
                    <span>CORRUGATED BOXES</span>
                  </Link>

                  <Link
                    href="/paper-bags"
                    onClick={handleClickPaperBag}
                    style={{
                      textDecoration: "none solid rgb(51,51,51)",
                      color: "#333333",
                      fontWeight: "600",
                      fontSize: "14px",
                      lineHeight: "21px",
                    }}
                  >
                    <span>PAPER BAGS</span>
                  </Link>

                  <Link
                    href="/poly-bags"
                    onClick={handleClickPolyBag}
                    style={{
                      textDecoration: "none solid rgb(51,51,51)",
                      color: "#333333",
                      fontWeight: "600",
                      fontSize: "14px",
                      lineHeight: "21px",
                    }}
                  >
                    <span>POLY BAGS</span>
                  </Link>

                  <div
                    ref={packproDropdownRef}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      position: "relative",
                      gap: "4px",
                    }}
                  >
                    <Link
                      href="/packpro"
                      onClick={() => {
                        handleCloseDropdown();
                        handleClickPackpro();
                      }}
                      style={{
                        textDecoration: "none solid rgb(51,51,51)",
                        color: "#333333",
                        fontWeight: "600",
                        fontSize: "14px",
                        lineHeight: "21px",
                      }}
                    >
                      <span>PACKPRO&trade;</span>
                    </Link>
                    <div
                      onClick={togglePackproDropdown}
                      style={{
                        textDecoration: "none solid rgb(51,51,51)",
                        color: "#333333",
                        fontWeight: "600",
                        fontSize: "14px",
                        lineHeight: "21px",
                        cursor: "pointer",
                        position: "relative",
                      }}
                    >
                      <ArrowDropDownIcon sx={{ color: "#333333" }} />
                    </div>
                    {isPackproDropdownOpen && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                          position: "absolute",
                          backgroundColor: "white",
                          top: "20px",
                          left: "0",
                          border: "1px solid #ccc",
                          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                          width: "220px",
                          zIndex: 9999,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderBottom: "1px solid #ccc",
                            paddingBlock: "10px",
                          }}
                        >
                          <Link
                            href="/carry-bags"
                            onClick={() => {
                              handleCloseDropdown();
                              handleClickCarryBag();
                            }}
                            style={{
                              textDecoration: "none",
                              width: "100%",
                              textAlign: "center",
                            }}
                          >
                            <span
                              style={{
                                textDecoration: "none",
                                color: "#333",
                                fontWeight: 500,
                                fontSize: "14px",
                              }}
                            >
                              CARRY BAGS
                            </span>
                          </Link>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderBottom: "1px solid #ccc",
                            paddingBlock: "10px",
                          }}
                        >
                          <Link
                            href="/packpro-food-wrapping-papers"
                            style={{
                              textDecoration: "none solid rgb(51,51,51)",
                              color: "#333333",
                              fontWeight: "500",
                              fontSize: "14px",
                              lineHeight: "21px",
                              textAlign: "center",
                              width: "100%",
                            }}
                            onClick={() => {
                              handleCloseDropdown();
                              handleClickFoodWrappingPaper();
                            }}
                          >
                            FOOD WRAPPING PAPERS
                          </Link>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            borderBottom: "1px solid #ccc",
                          }}
                        >
                          <Link
                            href="/packpro-tapes"
                            onClick={() => {
                              handleCloseDropdown();
                              handleClickPackproTapes();
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "10px 14px",
                              color: "#333333",
                              fontWeight: "500",
                              fontSize: "14px",
                              lineHeight: "21px",
                              textAlign: "center",
                              textDecoration: "none",
                            }}
                          >
                            TAPES
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    ref={rollabelDropdownRef}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      position: "relative",
                      gap: "4px",
                    }}
                  >
                    <Link
                      href="/rollabel"
                      onClick={() => {
                        handleCloseDropdown();
                        handleClickRollabel();
                      }}
                      style={{
                        textDecoration: "none solid rgb(51,51,51)",
                        color: "#333333",
                        fontWeight: "600",
                        fontSize: "14px",
                        lineHeight: "21px",
                      }}
                    >
                      <span>ROLLABEL&trade;</span>
                    </Link>
                    <div
                      onClick={toggleRollabelDropdown}
                      style={{
                        textDecoration: "none solid rgb(51,51,51)",
                        color: "#333333",
                        fontWeight: "600",
                        fontSize: "14px",
                        lineHeight: "21px",
                        cursor: "pointer",
                        position: "relative",
                      }}
                    >
                      <ArrowDropDownIcon sx={{ color: "#333333" }} />
                    </div>
                    {isRollabelDropdownOpen && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          position: "absolute",
                          backgroundColor: "white",
                          top: "20px",
                          left: "0",
                          border: "1px solid #ccc",
                          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                          width: "220px",
                          zIndex: 9999,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderBottom: "1px solid #ccc",
                            paddingBlock: "10px",
                          }}
                        >
                          <Link
                            href="/direct-thermal-labels"
                            style={{
                              textDecoration: "none solid rgb(51,51,51)",
                              color: "#333333",
                              fontWeight: "500",
                              fontSize: "14px",
                              lineHeight: "21px",
                            }}
                            onClick={() => {
                              handleCloseDropdown();
                              handleClickDTL();
                            }}
                          >
                            DIRECT THERMAL LABELS
                          </Link>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderBottom: "1px solid #ccc",
                            paddingBlock: "10px",
                          }}
                        >
                          <Link
                            href="/chromo-labels"
                            style={{
                              textDecoration: "none solid rgb(51,51,51)",
                              color: "#333333",
                              fontWeight: "500",
                              fontSize: "14px",
                              lineHeight: "21px",
                            }}
                            onClick={() => {
                              handleCloseDropdown();
                              handleClickCL();
                            }}
                          >
                            CHROMO LABELS
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>


              <div className="col-2 p-0 mx-0">
                <div className="row h-100 m-0">
                  <div
                    className="col-9 p-0 d-flex justify-content-center align-items-center"
                    style={{ backgroundColor: "#182C5A" }}
                  >
                    <Link
                      href={`tel:${phoneNumber}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      <span className="w-100 h-100 d-flex flex-column justify-content-center pt-3  bg-transparent">
                        <p
                          className="m-0 text-center"
                          style={{
                            color: "white",
                            fontSize: "14px",
                            fontFamily: "Montserrat",
                          }}
                        >
                          Talk to an expert
                        </p>
                        <p className={"whatsappNo"}>{phoneNumber}</p>
                      </span>
                    </Link>
                  </div>
                  <div
                    className="col-3 d-flex justify-content-left align-items-center"
                    style={{ backgroundColor: "#E92227" }}
                  >
                    <Link
                      href="https://wa.me/8447247227?text=Hi"
                      target="_blank"
                    >
                      <WhatsAppIcon
                        fontSize="large"
                        sx={{ color: "#FFFFFF" }}
                      />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={"mobileHeader"}>
            <div className={"mobileHeaderTopRow"}>
              <div className={"mobileHeaderGroup"}>
                <button
                  type="button"
                  className={"mobileIconButton"}
                  onClick={changetranslate}
                  aria-label="Open navigation menu"
                >
                  <FontAwesomeIcon
                    icon={faNavicon}
                    style={{ color: "#182C5A", height: "25px", width: "25px" }}
                  />
                </button>
                <Link
                  href="/"
                  className={"mobileIconButton"}
                  aria-label="Go to homepage"
                >
                  <HomeOutlinedIcon sx={{ fontSize: 30, color: "#182C5A" }} />
                </Link>
              </div>

              <Link
                href="https://prempackaging.com"
                className={"mobileLogoLink"}
                style={{ textDecoration: "none", color: "black" }}
              >
                <img
                  src="/pp_logo_1.png"
                  alt="Premium Packaging Logo"
                  width="88"
                />
              </Link>

              <div className={"mobileHeaderGroup"}>
                <button
                  type="button"
                  className={"mobileIconButton"}
                  onClick={handleClickMyAccount}
                  aria-label={token ? "Open my account" : "Open sign in"}
                >
                  <img
                    src="/outlineduser.png"
                    alt="User account"
                    width="31"
                    height="31"
                  />
                </button>
                <Link
                  href="/my-cart"
                  className={"mobileIconButton"}
                  aria-label="Open shopping cart"
                >
                  <span className={"mobileCartIconWrap"}>
                    <img
                      src="/cartnumbered.png"
                      alt="Shopping cart"
                      width="31"
                      height="31"
                    />
                    {cartCount > 0 && (
                      <span className={"mobileCartBadge"}>{cartCount}</span>
                    )}
                  </span>
                </Link>
              </div>
            </div>

            <div className={"mobileSearchSection"}>
              <div className={"mobileSearchBox"}>
                <img
                  src="/Search.png"
                  alt="Search"
                  className={"mobileSearchIcon"}
                />
                <input
                  className={"mobileSearchInput"}
                  type="text"
                  placeholder="Search for Products"
                  value={searchQueryMobile}
                  onChange={(e) => {
                    const nextSearchQuery = e.target.value;
                    setSearchQueryMobile(nextSearchQuery);
                    if (nextSearchQuery.trim().length >= MIN_SEARCH_LENGTH) {
                      handleSearchMobile(nextSearchQuery);
                    } else {
                      setSearchProductsMobile([]);
                      setShowDropdownMobile(false);
                    }
                  }}
                />

                {searchProductsMobile.length > 0 &&
                  searchQueryMobile.length >= 2 &&
                  showDropdownMobile && (
                    <div
                      ref={dropdownRef}
                      className={"mobileSearchDropdown"}
                    >
                      {searchProductsMobile.map((product, index) => (
                        <div
                          key={product?._id || product?.slug || index}
                          className={"mobileSearchDropdownItem"}
                          style={{
                            borderBottom:
                              index !== searchProductsMobile.length - 1
                                ? "1px solid #ccc"
                                : "none",
                          }}
                          onClick={() => {
                            openSearchResult(product, setShowDropdownMobile);
                          }}
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
      </div>
      <div aria-hidden="true" style={{ height: `${navbarHeight}px` }} />
      <style jsx>{`
.topbar { display: block; background-color: #EAEAEA; height: 32px; padding: 0 !important; margin: 0 !important; }
@media (max-width: 700px) { .topbar { display: none; } }
.whatsappNo { color: white; font-size: 18px; line-height: 28px; font-weight: 600; font-family: "Montserrat"; }
.mobileSidebarOverlay { display: none; }
@media (max-width: 700px) {
  .mobileSidebarOverlay { display: block; position: fixed; inset: 35px 0 0; border: 0; background: rgba(17, 24, 39, 0.22); z-index: 999999; }
}
.mobileHeader { display: none; }
@media (max-width: 700px) {
  .mobileHeader { display: flex; flex-direction: column; gap: 14px; width: 100%; padding: 14px 16px 12px; background: #fff; }
}
.mobileHeaderTopRow { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; }
.mobileHeaderGroup { display: flex; align-items: center; gap: 10px; }
.mobileHeaderGroup:last-child { justify-content: flex-end; }
.mobileIconButton { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; padding: 0; border: 0; background: transparent; text-decoration: none; }
.mobileLogoLink { display: inline-flex; align-items: center; justify-content: center; }
.mobileSearchSection { width: 100%; }
.mobileSearchBox { position: relative; display: flex; align-items: center; width: 100%; min-height: 48px; padding-left: 40px; border: 1px solid #e5e7eb; background: #f7f7f7; }
.mobileSearchIcon { position: absolute; left: 14px; width: 18px; height: 18px; }
.mobileSearchInput { width: 100%; border: 0; background: transparent; color: #111827; font-family: "Montserrat", sans-serif; font-size: 14px; padding: 12px 14px 12px 0; }
.mobileSearchInput:focus { outline: none; }
.mobileSearchDropdown { position: absolute; top: calc(100% + 8px); left: 0; width: 100%; max-height: 220px; overflow-y: auto; border: 1px solid #d1d5db; background: #fff; z-index: 1001; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); }
.mobileSearchDropdownItem { padding: 10px 12px; cursor: pointer; text-transform: capitalize; font-family: "Montserrat", sans-serif; font-size: 13px; line-height: 1.5; }
.mobileCartIconWrap { position: relative; display: inline-flex; align-items: center; justify-content: center; }
.mobileCartBadge { position: absolute; top: -6px; right: -8px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: #E92227; color: #fff; font-family: "Montserrat", sans-serif; font-size: 10px; font-weight: 700; line-height: 18px; text-align: center; }
`}</style>
    </>
  );
};

export default Navbar;
