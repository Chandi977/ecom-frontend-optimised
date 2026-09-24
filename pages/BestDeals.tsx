import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import JsonLd from "../components/common/JsonLd";
import { canonicalUrl, collectionPageSchema } from "../utils/schema";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Boxes,
  Check,
  CircleCheckBig as CheckCircle2,
  ChevronDown,
  Copy,
  Flame,
  Layers3,
  Minus,
  PackageCheck,
  Palette,
  Plus,
  Ruler,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Truck,
  Zap,
} from "lucide-react";
import { toast } from "react-toastify";
import { getService } from "../services/service";
import { addToCart as apiAddToCart } from "../utils/cart";
import { getProductImageSrc } from "../utils/productCatalog";
import { getProductDisplayName } from "../components/listing/productDisplay";
import WishlistButton from "../components/common/WishlistButton";

type CategoryFilter =
  | "All Bestsellers"
  | "Corrugated boxes"
  | "Paper bags"
  | "Poly mailers"
  | "Tapes & labels"
  | "Food packaging";

type SortOption =
  | "popularity"
  | "discount-desc"
  | "price-low"
  | "price-high"
  | "rating-desc";

export interface BestsellerProduct {
  _id: string;
  id: string | number;
  name: string;
  slug: string;
  category: string;
  categorySlug?: string;
  pack: string;
  unit: string;
  price: number;
  oldPrice: number;
  discount: string;
  discountPct: number;
  rating: number;
  reviewsCount: number;
  salesCount: string;
  badge?: string;
  badgeType?: "navy" | "red" | "green" | "gold";
  image?: string;
  rawItem?: any;
}

const FALLBACK_BESTSELLERS: BestsellerProduct[] = [
  {
    _id: "bs-1",
    id: "bs-1",
    name: "Flipkart Corrugated Box D6 (203x152x152 mm)",
    slug: "flipkart-corrugated-box-d6",
    category: "Corrugated boxes",
    categorySlug: "corrugated-boxes",
    pack: "Pack of 50",
    unit: "₹10.20 / box",
    price: 510,
    oldPrice: 700,
    discount: "27% OFF",
    discountPct: 27,
    rating: 4.9,
    reviewsCount: 1420,
    salesCount: "15,000+ sold",
    badge: "#1 BESTSELLER",
    badgeType: "gold",
    image: "/category-cutouts/corrugated-boxes.png",
  },
  {
    _id: "bs-2",
    id: "bs-2",
    name: "Flipkart Corrugated Box D8 (254x203x203 mm)",
    slug: "flipkart-corrugated-box-d8",
    category: "Corrugated boxes",
    categorySlug: "corrugated-boxes",
    pack: "Pack of 50",
    unit: "₹10.54 / box",
    price: 527,
    oldPrice: 700,
    discount: "25% OFF",
    discountPct: 25,
    rating: 4.8,
    reviewsCount: 980,
    salesCount: "12,400+ sold",
    badge: "TOP RATED",
    badgeType: "red",
    image: "/category-cutouts/box-cutout.png",
  },
  {
    _id: "bs-3",
    id: "bs-3",
    name: "Amazon Corrugated Box NC30 (150x100x100 mm)",
    slug: "amazon-corrugated-box-nc30",
    category: "Corrugated boxes",
    categorySlug: "corrugated-boxes",
    pack: "Pack of 50",
    unit: "₹4.86 / box",
    price: 243,
    oldPrice: 400,
    discount: "39% OFF",
    discountPct: 39,
    rating: 4.9,
    reviewsCount: 2150,
    salesCount: "28,000+ sold",
    badge: "HOT DEAL",
    badgeType: "red",
    image: "/category-cutouts/corrugated-boxes.png",
  },
  {
    _id: "bs-4",
    id: "bs-4",
    name: "Amazon Paper Bag PM4 (Kraft Grocery Bag)",
    slug: "amazon-paper-bag-pm4",
    category: "Paper bags",
    categorySlug: "paper-bags",
    pack: "Pack of 100",
    unit: "₹8.36 / bag",
    price: 836,
    oldPrice: 1000,
    discount: "16% OFF",
    discountPct: 16,
    rating: 4.7,
    reviewsCount: 640,
    salesCount: "8,900+ sold",
    badge: "PLASTIC-FREE",
    badgeType: "green",
    image: "/category-cutouts/paper-bags.png",
  },
  {
    _id: "bs-5",
    id: "bs-5",
    name: "Rollabel™ Chromo Shipping Label 100x150mm",
    slug: "rollabel-chromo-label-100x150mm",
    category: "Tapes & labels",
    categorySlug: "direct-thermal-labels",
    pack: "Roll of 250 Labels",
    unit: "₹0.81 / label",
    price: 203,
    oldPrice: 485,
    discount: "58% OFF",
    discountPct: 58,
    rating: 4.9,
    reviewsCount: 3100,
    salesCount: "45,000+ sold",
    badge: "MEGA SAVER",
    badgeType: "red",
    image: "/category-cutouts/chromo-labels.png",
  },
  {
    _id: "bs-6",
    id: "bs-6",
    name: "PackPro™ Brown BOPP Tape (48mm x 65m)",
    slug: "packpro-brown-bopp-tape",
    category: "Tapes & labels",
    categorySlug: "bopp-tapes",
    pack: "Pack of 6 Rolls",
    unit: "₹49.83 / roll",
    price: 299,
    oldPrice: 450,
    discount: "33% OFF",
    discountPct: 33,
    rating: 4.8,
    reviewsCount: 1850,
    salesCount: "30,000+ sold",
    badge: "HEAVY DUTY",
    badgeType: "navy",
    image: "/category-cutouts/bopp-tapes.png",
  },
  {
    _id: "bs-7",
    id: "bs-7",
    name: "Tamper Evident Poly Courier Mailer NMT2",
    slug: "poly-courier-mailer-nmt2",
    category: "Poly mailers",
    categorySlug: "poly-bags",
    pack: "Pack of 100",
    unit: "₹5.50 / mailer",
    price: 550,
    oldPrice: 750,
    discount: "26% OFF",
    discountPct: 26,
    rating: 4.8,
    reviewsCount: 1120,
    salesCount: "19,000+ sold",
    badge: "WATERPROOF",
    badgeType: "navy",
    image: "/category-cutouts/poly-bags.png",
  },
  {
    _id: "bs-8",
    id: "bs-8",
    name: "PackPro™ Food Wrapping Paper Sheet (100 Sheets)",
    slug: "packpro-food-wrapping-paper",
    category: "Food packaging",
    categorySlug: "packpro-food-wrapping-papers",
    pack: "Pack of 100 Sheets",
    unit: "₹3.49 / sheet",
    price: 349,
    oldPrice: 500,
    discount: "30% OFF",
    discountPct: 30,
    rating: 4.9,
    reviewsCount: 780,
    salesCount: "9,500+ sold",
    badge: "FOOD GRADE",
    badgeType: "green",
    image: "/category-cutouts/wrapping-papers.png",
  },
];

const categoryFilters: CategoryFilter[] = [
  "All Bestsellers",
  "Corrugated boxes",
  "Paper bags",
  "Poly mailers",
  "Tapes & labels",
  "Food packaging",
];

export async function getServerSideProps() {
  try {
    const brandRes = await getService("brand/all", {}, { silent: true });
    const prodRes = await getService("product/all", {}, { silent: true });
    const dealRes = await getService("deal/all", {}, { silent: true });

    return {
      props: {
        brand: brandRes?.data?.data || [],
        product: prodRes?.data?.data || [],
        deal: dealRes?.data?.data || [],
      },
    };
  } catch (error) {
    return {
      props: {
        brand: [],
        product: [],
        deal: [],
      },
    };
  }
}

const resolveProductCategory = (item: any): string => {
  const catName = String(item?.category?.name || item?.category?.slug || item?.category || "").toLowerCase();
  const subCatName = String(item?.sub_category?.name || item?.sub_category || item?.subCategory || "").toLowerCase();
  const prodName = String(item?.name || "").toLowerCase();
  const prodModel = String(item?.model || "").toLowerCase();

  const text = `${catName} ${subCatName} ${prodName} ${prodModel}`;

  // 1. Tapes & Labels (check before "paper" to avoid miscategorizing paper tapes as paper bags)
  if (
    text.includes("tape") ||
    text.includes("label") ||
    text.includes("rollabel") ||
    text.includes("bopp") ||
    text.includes("sticker") ||
    text.includes("direct thermal") ||
    text.includes("chromo") ||
    text.includes("packpro") ||
    text.includes("pack-pro")
  ) {
    return "Tapes & labels";
  }

  // 2. Food Packaging
  if (
    text.includes("food") ||
    text.includes("wrapping paper") ||
    text.includes("parchment") ||
    text.includes("butter paper") ||
    text.includes("greaseproof")
  ) {
    return "Food packaging";
  }

  // 3. Poly Mailers & Bags
  if (
    text.includes("poly") ||
    text.includes("mailer") ||
    text.includes("courier bag") ||
    text.includes("pod jacket") ||
    text.includes("tamper evident")
  ) {
    return "Poly mailers";
  }

  // 4. Paper Bags
  if (
    text.includes("paper bag") ||
    text.includes("kraft bag") ||
    text.includes("carry bag") ||
    text.includes("twist handle")
  ) {
    return "Paper bags";
  }

  // 5. Corrugated Boxes
  if (
    text.includes("box") ||
    text.includes("corrugated") ||
    text.includes("carton") ||
    text.includes("shipping box") ||
    text.includes("flipkart d") ||
    text.includes("amazon nc") ||
    text.includes("amazon box") ||
    text.includes("3-ply") ||
    text.includes("5-ply")
  ) {
    return "Corrugated boxes";
  }

  // Fallback checks
  if (text.includes("bag")) return "Paper bags";
  return "Corrugated boxes";
};

const getCategoryFallbackImage = (category: string, idx: number): string => {
  switch (category) {
    case "Paper bags":
      return "/category-cutouts/paper-bags.png";
    case "Poly mailers":
      return "/category-cutouts/poly-bags.png";
    case "Tapes & labels":
      return idx % 2 === 0
        ? "/category-cutouts/bopp-tapes.png"
        : "/category-cutouts/chromo-labels.png";
    case "Food packaging":
      return "/category-cutouts/wrapping-papers.png";
    case "Corrugated boxes":
    default:
      return idx % 2 === 0
        ? "/category-cutouts/corrugated-boxes.png"
        : "/category-cutouts/box-cutout.png";
  }
};

const isValidImageSrc = (src?: string | null): boolean => {
  if (!src || typeof src !== "string") return false;
  const trimmed = src.trim();
  if (!trimmed || trimmed === "/pp_logo_1.png") return false;
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return true;
  }
  if (
    !trimmed.includes(" ") &&
    /\.(jpg|jpeg|png|webp|svg|gif|avif)(\?.*)?$/i.test(trimmed)
  ) {
    return true;
  }
  return false;
};

export default function BestDeals({ product }: any) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] =
    useState<CategoryFilter>("All Bestsellers");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("popularity");
  const [copiedCode, setCopiedCode] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText("BESTSELLER10");
      setCopiedCode(true);
      toast.success("Coupon code BESTSELLER10 copied!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  // Map API products to Bestseller format
  const mappedProducts = useMemo<BestsellerProduct[]>(() => {
    if (!Array.isArray(product) || product.length === 0) {
      return FALLBACK_BESTSELLERS;
    }

    const apiMapped: BestsellerProduct[] = product.map((item: any, idx) => {
      const priceTier = item?.priceList?.[0];
      const sellingPrice = Number(
        priceTier?.SP || priceTier?.price || item?.newPrice || item?.price || 499,
      );
      const mrp = Number(
        priceTier?.MRP || item?.mrp || Math.round(sellingPrice * 1.3),
      );
      const discountPct =
        mrp > sellingPrice
          ? Math.round(((mrp - sellingPrice) / mrp) * 100)
          : 20;

      const normCategory = resolveProductCategory(item);
      const imgSrc = getProductImageSrc(item);
      const badgeTypes: ("navy" | "red" | "green" | "gold")[] = [
        "gold",
        "red",
        "green",
        "navy",
      ];

      return {
        _id: item?._id || `api-${idx}`,
        id: item?._id || item?.id || `api-${idx}`,
        name: getProductDisplayName(item) || item?.name || "Premium Packaging",
        slug: item?.slug || "",
        category: normCategory,
        categorySlug: item?.category?.slug,
        pack: priceTier?.number ? `Pack of ${priceTier.number}` : "Pack of 50",
        unit: `₹${(sellingPrice / (priceTier?.number || 50)).toFixed(2)} / unit`,
        price: sellingPrice,
        oldPrice: mrp,
        discount: `${discountPct}% OFF`,
        discountPct,
        rating: 4.7 + (idx % 3) * 0.1,
        reviewsCount: 450 + (idx * 170) % 2500,
        salesCount: `${(idx + 5) * 1200}+ sold`,
        badge:
          item?.isBestseller || item?.deal_product
            ? "#1 BESTSELLER"
            : idx % 2 === 0
              ? "TOP RATED"
              : "POPULAR",
        badgeType: badgeTypes[idx % badgeTypes.length],
        image: isValidImageSrc(imgSrc)
          ? imgSrc
          : getCategoryFallbackImage(normCategory, idx),
        rawItem: item,
      };
    });

    // When the API is available, every rendered card must retain its real
    // product payload so cart and wishlist mutations use a valid backend id.
    // The curated placeholders are only for a fully unavailable catalog.
    return apiMapped;
  }, [product]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = mappedProducts.filter((item) => {
      const matchesCategory =
        activeFilter === "All Bestsellers" ||
        item.category.toLowerCase() === activeFilter.toLowerCase();

      const term = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !term ||
        `${item.name} ${item.category} ${item.pack}`
          .toLowerCase()
          .includes(term);

      return matchesCategory && matchesSearch;
    });

    return result.sort((a, b) => {
      if (sortBy === "discount-desc") return b.discountPct - a.discountPct;
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating-desc") return b.rating - a.rating;
      return b.reviewsCount - a.reviewsCount;
    });
  }, [mappedProducts, activeFilter, searchQuery, sortBy]);

  const handleAddToCart = async (productItem: BestsellerProduct) => {
    try {
      setAddingId(String(productItem.id));
      const rawProduct = productItem.rawItem || {
        _id: productItem._id,
        name: productItem.name,
        price: productItem.price,
      };

      const packNumber = parseInt(productItem.pack.replace(/\D/g, ""), 10) || 50;
      const success = await apiAddToCart(
        rawProduct,
        1,
        productItem.price,
        0.5,
        packNumber,
        packNumber,
      );

      if (success) {
        toast.success(`Added ${productItem.name} to cart!`);
      }
    } catch (err) {
      toast.error("Unable to add product to cart. Please try again.");
    } finally {
      setAddingId(null);
    }
  };

  const topThreeBestsellers = mappedProducts.slice(0, 3);

  return (
    <>
      <Head>
        <title>Best Sellers & Top Packaging Deals | Prem Packaging</title>
        <meta
          name="description"
          content="Explore top-selling corrugated boxes, paper bags, poly mailers, packaging tapes and shipping labels. Direct factory prices with fast dispatch."
        />
        {/* /best-sellers and /bestsellers re-export this same component, so all
            three URLs canonicalise to the one the nav and footer link to. */}
        <link rel="canonical" href={canonicalUrl("/BestDeals")} />
      </Head>

      <JsonLd
        id="collection"
        data={collectionPageSchema({
          path: "/BestDeals",
          name: "Best Sellers & Top Packaging Deals",
          description:
            "Explore top-selling corrugated boxes, paper bags, poly mailers, packaging tapes and shipping labels. Direct factory prices with fast dispatch.",
          products: product,
          breadcrumb: [{ name: "Best Deals", path: "/BestDeals" }],
        })}
      />

      <main className="bestsellersFreshPage">
        {/* Fresh Light Hero Section */}
        <section className="freshHero">
          <div className="container freshHeroContainer">
            <div className="heroHeaderBlock">
              <span className="eyebrow redEyebrow">MOST POPULAR PACKAGING SOLUTIONS</span>
              <h1>Best Deals & Top Selling Packaging</h1>
              <p className="heroSubtext">
                Proven strength, certified quality, and factory-direct pricing. Shop the most trusted boxes, bags, mailers, tapes, and labels across India.
              </p>
            </div>

            {/* 4 Metric Highlight Cards */}
            <div className="heroMetricsGrid">
              <div className="metricCard">
                <div className="metricIcon"><Award size={22} /></div>
                <div>
                  <strong>#1 Choice in India</strong>
                  <small>50M+ Boxes Shipped</small>
                </div>
              </div>
              <div className="metricCard">
                <div className="metricIcon"><Star size={22} /></div>
                <div>
                  <strong>4.9 / 5.0 Rating</strong>
                  <small>12,000+ Verified Reviews</small>
                </div>
              </div>
              <div className="metricCard">
                <div className="metricIcon"><Truck size={22} /></div>
                <div>
                  <strong>24h Fast Dispatch</strong>
                  <small>Direct from Prem Factory</small>
                </div>
              </div>
              <div className="metricCard">
                <div className="metricIcon"><ShieldCheck size={22} /></div>
                <div>
                  <strong>GST Tax Credit</strong>
                  <small>Instant Invoice Downloads</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Spotlight Top 3 Bestseller Cards Showcase */}
        <section className="spotlightShowcase">
          <div className="container">
            <div className="showcaseHeader">
              <div>
                <p className="eyebrow redEyebrow">MONTHLY LEADERS</p>
                <h2>Top 3 Bestsellers of the Month</h2>
              </div>
              <p className="showcaseSub">High-demand packaging items with maximum buyer satisfaction.</p>
            </div>

            <div className="spotlightGrid">
              {topThreeBestsellers.map((item, index) => {
                const rankBadges = [
                  { label: "👑 #1 OVERALL BESTSELLER", color: "goldRank" },
                  { label: "⚡ #2 FASTEST MOVER", color: "silverRank" },
                  { label: "🌱 #3 TOP RATED CHOICE", color: "bronzeRank" },
                ];
                const rank = rankBadges[index % rankBadges.length];
                const itemId = String(item._id || item.id);
                const isFailed = failedImages[itemId];
                const displayImgSrc =
                  !isFailed && isValidImageSrc(item.image)
                    ? item.image!
                    : getCategoryFallbackImage(item.category, index);

                return (
                  <article className={`spotlightCard ${rank.color}`} key={item._id}>
                    <div className="spotlightBadgeRow">
                      <span className="rankTag">{rank.label}</span>
                      <span className="spotlightDiscountTag">{item.discount}</span>
                    </div>

                    <div
                      className="spotlightImgContainer"
                      onClick={() => (item.slug ? router.push(`/${item.slug}`) : null)}
                    >
                      <WishlistButton product={item.rawItem} />
                      <Image
                        src={displayImgSrc}
                        alt={item.name}
                        fill
                        sizes="(max-width: 900px) 100vw, 380px"
                        priority
                        style={{ objectFit: "contain", padding: "14px" }}
                        className="spotlightImage"
                        onError={() => handleImageError(itemId)}
                      />
                    </div>

                    <div className="spotlightCardContent">
                      <span className="spotlightCategoryLabel">{item.category}</span>
                      <h3
                        className="spotlightCardTitle"
                        onClick={() => (item.slug ? router.push(`/${item.slug}`) : null)}
                      >
                        {item.name}
                      </h3>

                      <div className="spotlightMeta">
                        <span>{item.pack}</span>
                        <span>•</span>
                        <span>{item.unit}</span>
                      </div>

                      <div className="spotlightPriceLine">
                        <div>
                          <strong className="spotlightPrice">₹{item.price}</strong>
                          {item.oldPrice > item.price && (
                            <s className="spotlightOldPrice">₹{item.oldPrice}</s>
                          )}
                        </div>
                        <button
                          type="button"
                          className="spotlightAddBtn"
                          onClick={() => handleAddToCart(item)}
                        >
                          <Plus size={16} /> Add
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Main Bestseller Catalog & Filter Section */}
        <section className="catalogSection">
          <div className="container">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow redEyebrow">EXPLORE CATALOG</p>
                <h2>All Bestselling Packaging Solutions</h2>
              </div>
              <p className="sectionSub">Filter by category or search by item size & format.</p>
            </div>

            {/* Filter Tabs & Search Controls */}
            <div className="controlsContainer">
              <div className="filterPillsRow">
                {categoryFilters.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`pillTab ${activeFilter === cat ? "pillActive" : ""}`}
                    onClick={() => setActiveFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="searchSortRow">
                <div className="searchField">
                  <span className="searchIconWrap">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search bestsellers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="clearSearchBtn"
                      onClick={() => setSearchQuery("")}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="sortField">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    aria-label="Sort bestsellers"
                  >
                    <option value="popularity">Sort by: Popularity</option>
                    <option value="discount-desc">Sort by: Highest Discount</option>
                    <option value="price-low">Sort by: Price (Low to High)</option>
                    <option value="price-high">Sort by: Price (High to Low)</option>
                    <option value="rating-desc">Sort by: Highest Rated</option>
                  </select>
                  <span className="selectChevronWrap">
                    <ChevronDown size={16} />
                  </span>
                </div>
              </div>
            </div>

            {/* Results Count & Reset */}
            <div className="resultsSummaryBar">
              <span>Showing <strong>{filteredProducts.length}</strong> bestselling products</span>
              {(activeFilter !== "All Bestsellers" || searchQuery) && (
                <button
                  type="button"
                  className="resetLink"
                  onClick={() => {
                    setActiveFilter("All Bestsellers");
                    setSearchQuery("");
                  }}
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <div className="freshGrid">
                {filteredProducts.map((item, index) => {
                  const isAdding = addingId === String(item.id);
                  const itemId = String(item._id || item.id);
                  const isFailed = failedImages[itemId];
                  const displayImgSrc =
                    !isFailed && isValidImageSrc(item.image)
                      ? item.image!
                      : getCategoryFallbackImage(item.category, index);

                  return (
                    <article className="productCard" key={item._id}>
                      <div className="productImageWrap">
                        {item.badge && (
                          <span className={`productBadge badge-${item.badgeType || "navy"}`}>
                            {item.badge}
                          </span>
                        )}

                        <WishlistButton product={item.rawItem} />

                        <div
                          className="imageClickArea"
                          onClick={() => (item.slug ? router.push(`/${item.slug}`) : null)}
                        >
                          <Image
                            src={displayImgSrc}
                            alt={item.name}
                            fill
                            sizes="(max-width: 700px) 100vw, 300px"
                            style={{ objectFit: "contain", padding: "14px" }}
                            className="productImage"
                            onError={() => handleImageError(itemId)}
                          />
                        </div>
                      </div>

                      <div className="productMeta">
                        <div className="productMetaTop">
                          <p>{item.category}</p>
                          <span className="ratingPill">
                            <Star size={12} fill="#FF9800" color="#FF9800" />
                            <strong>{item.rating}</strong>
                          </span>
                        </div>

                        <h3
                          className="productTitle"
                          onClick={() => (item.slug ? router.push(`/${item.slug}`) : null)}
                        >
                          {item.name}
                        </h3>

                        <div className="packLine">
                          <span>{item.pack}</span>
                          <span className="packSeparator">•</span>
                          <span>{item.unit}</span>
                        </div>

                        <div className="productPurchaseRow">
                          <div className="priceLine">
                            <strong>₹{item.price}</strong>
                            {item.oldPrice > item.price && <s>₹{item.oldPrice}</s>}
                            <span>{item.discount}</span>
                          </div>

                          <div className="cardActions">
                            <button
                              type="button"
                              className="addButton"
                              disabled={isAdding}
                              onClick={() => handleAddToCart(item)}
                            >
                              <Plus size={16} />
                              <span>{isAdding ? "Adding..." : "Add"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="emptyCatalogState">
                <Search size={32} />
                <h3>No matching bestsellers found</h3>
                <p>Try resetting search keywords or category filters.</p>
                <button
                  type="button"
                  className="resetCatalogBtn"
                  onClick={() => {
                    setActiveFilter("All Bestsellers");
                    setSearchQuery("");
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Custom Packaging Inquiry Section */}
        <section className="section customSection">
          <div className="container customGrid">
            <div className="customVisual">
              <Image
                src="/hero-banner-beige.png"
                alt="Custom shipping boxes with printing"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
              />
              <div className="customVisualOverlay">
                <span>Made for your brand</span>
                <strong>Size · Print · Material</strong>
              </div>
            </div>

            <div className="customCopy">
              <p className="eyebrow redEyebrow">MAKE IT UNMISTAKABLY YOURS</p>
              <h2>Need custom sizes or logo printing on bestsellers?</h2>
              <p className="customDescription">
                From custom structural dimensions to multi-color brand printing, our engineering team manufactures high-volume packaging tailored for your business.
              </p>
              <ul className="customList">
                <li>
                  <span><Ruler size={20} /></span>
                  Expert structural box dimensioning
                </li>
                <li>
                  <span><Layers3 size={20} /></span>
                  Multi-format corrugated, paper & film support
                </li>
                <li>
                  <span><Palette size={20} /></span>
                  Precision flexo & offset logo printing
                </li>
              </ul>
              <a
                className="primaryButton"
                href="mailto:ecommerce@premindustries.in?subject=Custom Bestseller Order Inquiry"
              >
                Start a custom inquiry <ArrowUpRight size={18} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .bestsellersFreshPage {
          background-color: #ffffff;
          min-height: 100vh;
          font-family: "Geist", "Inter", -apple-system, sans-serif;
          color: #151922;
        }

        .eyebrow {
          margin: 0 0 10px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .redEyebrow {
          color: #e4232c;
        }

        /* Promo Coupon Ticker Bar */
        .promoTicker {
          background: #e4232c;
          color: #ffffff;
          padding: 9px 0;
          font-size: 13px;
        }
        .promoTickerInner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .promoTickerLeft {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .flameTag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #0b1d3e;
          color: #ffffff;
          font-weight: 800;
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 999px;
          letter-spacing: 0.05em;
        }
        .promoTickerLeft p {
          margin: 0;
        }
        .copyCodeBtn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          color: #e4232c;
          border: none;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .copyCodeBtn:hover {
          background: #fbfbfa;
        }

        /* Fresh Light Hero Section */
        .freshHero {
          background: linear-gradient(180deg, #fbfbfa 0%, #f4f5f5 100%);
          border-bottom: 1px solid #e5e7eb;
          padding: 50px 0 45px;
        }
        .heroHeaderBlock {
          max-width: 780px;
          margin-bottom: 36px;
        }
        .heroHeaderBlock h1 {
          font-size: 44px;
          font-weight: 800;
          color: #0b1d3e;
          line-height: 1.15;
          margin: 0 0 16px;
          letter-spacing: -0.02em;
        }
        .heroSubtext {
          font-size: 18px;
          color: #667085;
          line-height: 1.55;
          margin: 0;
        }

        .heroMetricsGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .metricCard {
          background: #ffffff;
          border-radius: 14px;
          padding: 16px 20px;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 4px 16px rgba(17, 24, 39, 0.04);
        }
        .metricIcon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: #f4f5f5;
          color: #142a55;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .metricCard strong {
          display: block;
          font-size: 14px;
          color: #151922;
        }
        .metricCard small {
          font-size: 12px;
          color: #667085;
        }

        /* Monthly Top 3 Showcase */
        .spotlightShowcase {
          padding: 55px 0 40px;
          background: #ffffff;
        }
        .showcaseHeader {
          margin-bottom: 28px;
        }
        .showcaseHeader h2 {
          font-size: 32px;
          font-weight: 800;
          color: #0b1d3e;
          margin: 0 0 6px;
        }
        .showcaseSub {
          font-size: 16px;
          color: #667085;
          margin: 0;
        }

        .spotlightGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          align-items: stretch;
          max-width: 1020px;
          margin: 0 auto;
        }
        .spotlightCard {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          padding: 16px;
          display: flex;
          flex-direction: column;
          position: relative;
          width: 100%;
          max-width: 320px;
          margin: 0 auto;
          box-sizing: border-box;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .spotlightCard:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 36px rgba(11, 29, 62, 0.1);
        }
        .goldRank {
          border-top: 4px solid #ff9800;
        }
        .silverRank {
          border-top: 4px solid #142a55;
        }
        .bronzeRank {
          border-top: 4px solid #e4232c;
        }

        .spotlightBadgeRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .rankTag {
          font-size: 11px;
          font-weight: 800;
          color: #0b1d3e;
          letter-spacing: 0.04em;
        }
        .spotlightDiscountTag {
          background: #e4232c;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .spotlightImgContainer {
          position: relative;
          height: 165px;
          width: 100%;
          background: #f9fafb;
          border-radius: 10px;
          margin-bottom: 14px;
          cursor: pointer;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .spotlightImage {
          object-fit: contain !important;
          max-width: 100% !important;
          max-height: 100% !important;
          padding: 10px;
          transition: transform 0.3s ease;
        }
        .spotlightCard:hover .spotlightImage {
          transform: scale(1.05);
        }

        .spotlightCardContent {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .spotlightCategoryLabel {
          font-size: 11px;
          font-weight: 700;
          color: #667085;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }
        .spotlightCardTitle {
          font-size: 16px;
          font-weight: 700;
          color: #0b1d3e;
          margin: 0 0 8px;
          line-height: 1.35;
          cursor: pointer;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 44px;
        }
        .spotlightCardTitle:hover {
          color: #e4232c;
        }

        .spotlightMeta {
          font-size: 12px;
          color: #667085;
          display: flex;
          gap: 6px;
          margin-bottom: 14px;
        }
        .spotlightPriceLine {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }
        .spotlightPrice {
          font-size: 20px;
          font-weight: 800;
          color: #0b1d3e;
          margin-right: 6px;
        }
        .spotlightOldPrice {
          font-size: 13px;
          color: #9ca3af;
        }

        .spotlightAddBtn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #142a55;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .spotlightAddBtn:hover {
          background: #e4232c;
        }

        /* Catalog Section */
        .catalogSection {
          padding: 40px 0 80px;
          background: #ffffff;
        }
        .sectionHeader h2 {
          font-size: 32px;
          font-weight: 800;
          color: #0b1d3e;
          margin: 0 0 6px;
        }
        .sectionSub {
          font-size: 16px;
          color: #667085;
          margin: 0 0 24px;
        }

        /* Filter Controls */
        .controlsContainer {
          background: #fbfbfa;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 16px 20px;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .filterPillsRow {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .filterPillsRow::-webkit-scrollbar {
          display: none;
        }
        .pillTab {
          background: #ffffff;
          color: #4b5563;
          border: 1px solid #e5e7eb;
          padding: 8px 18px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pillTab:hover {
          border-color: #142a55;
          color: #142a55;
        }
        .pillActive {
          background: #142a55 !important;
          color: #ffffff !important;
          border-color: #142a55 !important;
          font-weight: 700;
        }

        .searchSortRow {
          display: flex;
          gap: 16px;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          width: 100%;
        }
        .searchField {
          position: relative;
          flex: 1;
          min-width: 280px;
          display: flex;
          align-items: center;
          height: 44px;
        }
        .searchIconWrap {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          width: 18px;
          height: 18px;
        }
        .searchField input {
          width: 100%;
          height: 44px !important;
          line-height: 44px !important;
          padding: 0 36px 0 42px !important;
          background: #ffffff !important;
          border: 1px solid #d1d5db !important;
          border-radius: 10px !important;
          font-size: 14px !important;
          color: #111827 !important;
          outline: none !important;
          box-shadow: none !important;
          margin: 0 !important;
        }
        .searchField input:focus {
          border-color: #142a55 !important;
          box-shadow: 0 0 0 3px rgba(20, 42, 85, 0.1) !important;
        }
        .clearSearchBtn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 18px;
          color: #9ca3af;
          cursor: pointer;
          padding: 0;
          margin: 0;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sortField {
          position: relative;
          min-width: 220px;
          display: flex;
          align-items: center;
          height: 44px;
        }
        .sortField select {
          width: 100%;
          height: 44px !important;
          line-height: 44px !important;
          appearance: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          padding: 0 36px 0 14px !important;
          background: #ffffff !important;
          border: 1px solid #d1d5db !important;
          border-radius: 10px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          color: #374151 !important;
          cursor: pointer;
          outline: none !important;
          box-shadow: none !important;
          margin: 0 !important;
        }
        .sortField select:focus {
          border-color: #142a55 !important;
        }
        .selectChevronWrap {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          width: 16px;
          height: 16px;
        }

        .resultsSummaryBar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: #667085;
          margin-bottom: 20px;
        }
        .resetLink {
          background: none;
          border: none;
          color: #e4232c;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
        }

        /* Product Grid (Matches Home Page Cards) */
        .freshGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          align-items: stretch;
          max-width: 1140px;
          margin: 0 auto;
        }

        .productCard {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 270px;
          margin: 0 auto;
          box-sizing: border-box;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
        }
        .productCard:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 40px rgba(17, 24, 39, 0.08);
          border-color: rgba(11, 29, 62, 0.2);
        }

        .productImageWrap {
          position: relative;
          height: 175px;
          width: 100%;
          background: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .productBadge {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 2;
          font-size: 10px;
          font-weight: 800;
          padding: 4px 9px;
          border-radius: 6px;
          letter-spacing: 0.04em;
        }
        .badge-navy {
          background: #142a55;
          color: #ffffff;
        }
        .badge-red {
          background: #e4232c;
          color: #ffffff;
        }
        .badge-green {
          background: #16a34a;
          color: #ffffff;
        }
        .badge-gold {
          background: #ff9800;
          color: #ffffff;
        }

        .productHeart {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 2;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          color: #9ca3af;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .productHeart:hover {
          color: #e4232c;
          transform: scale(1.1);
        }
        .productHeartActive {
          color: #e4232c !important;
          background: #fdecec !important;
          border-color: #fca5a5 !important;
        }

        .imageClickArea {
          position: relative;
          width: 100%;
          height: 100%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .productImage {
          object-fit: contain !important;
          max-width: 100% !important;
          max-height: 100% !important;
          padding: 14px;
          transition: transform 0.4s ease;
        }
        .productCard:hover .productImage {
          transform: scale(1.05);
        }
        .imageFallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #cbd5e1;
          font-weight: 900;
          font-size: 22px;
        }

        .productMeta {
          padding: 18px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .productMetaTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #667085;
          margin-bottom: 6px;
        }
        .productMetaTop p {
          margin: 0;
          font-weight: 600;
        }
        .ratingPill {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          color: #374151;
        }

        .productTitle {
          font-size: 15px;
          font-weight: 700;
          color: #0b1d3e;
          line-height: 1.35;
          margin: 0 0 8px;
          cursor: pointer;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 40px;
        }
        .productTitle:hover {
          color: #e4232c;
        }

        .packLine {
          font-size: 12px;
          color: #667085;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 14px;
        }
        .packSeparator {
          color: #cbd5e1;
        }

        .productPurchaseRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }
        .priceLine {
          display: flex;
          align-items: baseline;
          gap: 6px;
          flex-wrap: wrap;
        }
        .priceLine strong {
          font-size: 18px;
          font-weight: 800;
          color: #0b1d3e;
        }
        .priceLine s {
          font-size: 12px;
          color: #9ca3af;
        }
        .priceLine span {
          font-size: 11px;
          font-weight: 800;
          color: #16a34a;
          background: #dcfce7;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .addButton {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #142a55;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .addButton:hover {
          background: #e4232c;
        }

        .emptyCatalogState {
          text-align: center;
          padding: 60px 20px;
          background: #fbfbfa;
          border-radius: 16px;
          border: 1px dashed #cbd5e1;
          color: #64748b;
        }
        .emptyCatalogState h3 {
          font-size: 20px;
          color: #0b1d3e;
          margin: 12px 0 6px;
        }
        .resetCatalogBtn {
          margin-top: 14px;
          background: #142a55;
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1200px) {
          .freshGrid {
            grid-template-columns: repeat(3, 1fr);
          }
          .heroMetricsGrid {
            grid-template-columns: repeat(2, 1fr);
          }
          .spotlightGrid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 900px) {
          .spotlightGrid {
            grid-template-columns: 1fr;
          }
          .freshGrid {
            grid-template-columns: repeat(2, 1fr);
          }
          .heroHeaderBlock h1 {
            font-size: 32px;
          }
        }
        @media (max-width: 640px) {
          .freshGrid {
            grid-template-columns: 1fr;
          }
          .heroMetricsGrid {
            grid-template-columns: 1fr;
          }
          .heroHeaderBlock h1 {
            font-size: 26px;
          }
        }
      `}</style>
    </>
  );
}
