import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import JsonLd from "../components/common/JsonLd";
import { canonicalUrl, collectionPageSchema } from "../utils/schema";
import { ChevronDown, Plus, Search } from "lucide-react";
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

      <main className="deals-bestsellersFreshPage">
        <header className="deals-catalogHeader">
          <div className="deals-container">
            <nav className="deals-breadcrumbNav" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Best deals</span></nav>
            <h1>Best deals on packaging supplies</h1>
            <p>Compare pack sizes and prices on boxes, bags, tapes and labels.</p>
          </div>
        </header>

        {/* Main Bestseller Catalog & Filter Section */}
        <section className="deals-catalogSection">
          <div className="deals-container">
            {/* Filter Tabs & Search Controls */}
            <div className="deals-controlsContainer">
              <div className="deals-filterPillsRow">
                {categoryFilters.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`deals-pillTab ${activeFilter === cat ? "deals-pillActive" : ""}`}
                    aria-pressed={activeFilter === cat}
                    onClick={() => setActiveFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="deals-searchSortRow">
                <div className="deals-searchField">
                  <span className="deals-searchIconWrap">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    aria-label="Search packaging products"
                    placeholder="Search products or sizes"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="deals-clearSearchBtn"
                      aria-label="Clear product search"
                      onClick={() => setSearchQuery("")}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="deals-sortField">
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
                  <span className="deals-selectChevronWrap">
                    <ChevronDown size={16} />
                  </span>
                </div>
              </div>
            </div>

            {/* Results Count & Reset */}
            <div className="deals-resultsSummaryBar">
              <span><strong>{filteredProducts.length}</strong> products</span>
              {(activeFilter !== "All Bestsellers" || searchQuery) && (
                <button
                  type="button"
                  className="deals-resetLink"
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
              <div className="deals-freshGrid">
                {filteredProducts.map((item, index) => {
                  const isAdding = addingId === String(item.id);
                  const itemId = String(item._id || item.id);
                  const isFailed = failedImages[itemId];
                  const displayImgSrc =
                    !isFailed && isValidImageSrc(item.image)
                      ? item.image!
                      : getCategoryFallbackImage(item.category, index);

                  return (
                    <article className="deals-productCard" key={item._id}>
                      <div className="deals-productImageWrap">

                        <WishlistButton product={item.rawItem} />

                        <Link className="deals-imageClickArea" href={item.slug ? `/${item.slug}` : "/listingpage"} aria-label={`View ${item.name}`}>

                          <Image
                            src={displayImgSrc}
                            alt={item.name}
                            fill
                            sizes="(max-width: 700px) 100vw, 300px"
                            style={{ objectFit: "contain", padding: "14px" }}
                            className="productImage"
                            onError={() => handleImageError(itemId)}
                          />
                        </Link>
                      </div>

                      <div className="deals-productMeta">
                        <div className="deals-productMetaTop">
                          <p>{item.category}</p>
                        </div>

                        <h3 className="deals-productTitle"><Link href={item.slug ? `/${item.slug}` : "/listingpage"}>{item.name}</Link></h3>

                        <div className="deals-packLine">
                          <span>{item.pack}</span>
                          <span className="packSeparator">•</span>
                          <span>{item.unit}</span>
                        </div>

                        <div className="deals-productPurchaseRow">
                          <div className="deals-priceLine">
                            <strong>₹{item.price}</strong>
                            {item.oldPrice > item.price && <s>₹{item.oldPrice}</s>}
                            {item.oldPrice > item.price && <span>{item.discount}</span>}
                          </div>

                          <div className="deals-cardActions">
                            <button
                              type="button"
                              className="deals-addButton"
                              disabled={isAdding}
                              onClick={() => handleAddToCart(item)}
                            >
                              <Plus size={16} />
                              <span>{isAdding ? "Adding..." : "Add to cart"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="deals-emptyCatalogState">
                <Search size={32} />
                <h3>No matching bestsellers found</h3>
                <p>Try resetting search keywords or category filters.</p>
                <button
                  type="button"
                  className="deals-resetCatalogBtn"
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

        <aside className="deals-catalogHelp deals-container">
          <div><h2>Need a different size or printed packaging?</h2><p>Discuss quantities, materials and printing with our packaging team.</p></div>
          <Link href="/custom-packaging">Request custom packaging</Link>
        </aside>
      </main>

      <style jsx>{`
        .deals-bestsellersFreshPage { background: #fff; color: var(--ink); font-family: var(--font-store); padding-bottom: 32px; }
        .deals-container { width: var(--store-content-width); max-width: 1280px; margin-inline: auto; padding: 0; }
        .deals-catalogHeader { padding: 24px 0; }
        .deals-breadcrumbNav { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; color: var(--muted); font-size: 13px; }
        .deals-breadcrumbNav :global(a) { color: var(--muted); text-decoration: none; }
        h1 { margin: 0 0 8px; color: var(--brand-navy); font-size: 30px; line-height: 1.3; font-weight: 600; letter-spacing: -.02em; }
        .deals-catalogHeader p { margin: 0; color: var(--muted); font-size: 15px; line-height: 1.6; }
        .deals-catalogSection { padding: 0; }
        .deals-controlsContainer { padding: 16px 0; border-block: 1px solid var(--border); }
        .deals-filterPillsRow { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .deals-pillTab { min-height: 44px; padding: 8px 16px; border: 1px solid var(--border); border-radius: 4px; background: #fff; color: var(--brand-navy); font-size: 14px; font-weight: 500; cursor: pointer; }
        .deals-pillTab:hover { border-color: var(--brand-navy); }
        .deals-pillActive { background: var(--brand-navy); color: #fff; border-color: var(--brand-navy); }
        .deals-searchSortRow { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .deals-searchField { display: flex; align-items: center; position: relative; width: min(100%, 440px); }
        .deals-searchIconWrap { position: absolute; left: 12px; color: var(--muted); display: flex; pointer-events: none; }
        .deals-searchField input { width: 100%; height: 44px; padding: 10px 44px 10px 40px; border: 1px solid var(--border); border-radius: 4px; font-size: 14px; }
        .deals-clearSearchBtn { position: absolute; right: 0; height: 44px; width: 44px; background: transparent; border: 0; color: var(--muted); font-size: 22px; }
        .deals-sortField { position: relative; width: 260px; flex-shrink: 0; }
        .deals-sortField select { width: 100%; min-height: 44px; padding: 10px 36px 10px 12px; border: 1px solid var(--border); border-radius: 4px; appearance: none; font-size: 14px; }
        .deals-selectChevronWrap { position: absolute; right: 12px; top: 12px; pointer-events: none; }
        .deals-resultsSummaryBar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 0; color: var(--muted); font-size: 14px; }
        .deals-resetLink { padding: 4px 0; border: 0; background: transparent; color: var(--brand-navy); text-decoration: underline; font-size: 14px; }
        .deals-freshGrid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 24px; }
        .deals-productCard { display: flex; flex-direction: column; min-width: 0; border: 1px solid var(--border); border-radius: 4px; background: #fff; overflow: hidden; }
        .deals-productImageWrap { position: relative; height: 208px; }
        .deals-imageClickArea { position: absolute; inset: 0; display: block; }
        .deals-productMeta { display: flex; flex-direction: column; flex: 1; gap: 8px; padding: 16px; border-top: 1px solid var(--border); }
        .deals-productMetaTop p { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.5; }
        .deals-productTitle { min-height: 44px; margin: 0; font-size: 15px; font-weight: 600; line-height: 1.5; }
        .deals-productTitle :global(a) { color: var(--brand-navy); text-decoration: none; }
        .deals-productTitle :global(a:hover) { text-decoration: underline; }
        .deals-packLine { display: flex; flex-wrap: wrap; gap: 4px 8px; min-height: 40px; font-size: 13px; line-height: 1.5; color: var(--muted); }
        .deals-productPurchaseRow { display: flex; align-items: stretch; flex-direction: column; gap: 12px; margin-top: auto; padding-top: 4px; }
        .deals-cardActions { width: 100%; }
        .deals-priceLine { display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; font-variant-numeric: tabular-nums; }
        .deals-priceLine strong { font-size: 20px; font-weight: 600; color: var(--brand-navy); }
        .deals-priceLine s { font-size: 13px; color: var(--muted); }
        .deals-priceLine > span { font-size: 12px; color: #17683a; }
        .deals-addButton, .deals-resetCatalogBtn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; min-height: 44px; padding: 10px 12px; border: 0; border-radius: 4px; background: var(--brand-navy); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
        .deals-addButton:disabled { opacity: .65; cursor: wait; }
        .deals-emptyCatalogState { padding: 48px 16px; text-align: center; }
        .deals-emptyCatalogState h3 { font-size: 20px; margin: 16px 0 8px; }
        .deals-emptyCatalogState p { color: var(--muted); }
        .deals-resetCatalogBtn { width: auto; }
        .deals-catalogHelp { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); }
        .deals-catalogHelp h2 { margin: 0 0 8px; font-size: 18px; font-weight: 600; color: var(--brand-navy); }
        .deals-catalogHelp p { margin: 0; font-size: 14px; color: var(--muted); }
        .deals-catalogHelp :global(a) { flex-shrink: 0; font-size: 14px; color: var(--brand-navy); text-decoration: underline; text-underline-offset: 3px; }
        @media (max-width: 1100px) { .deals-freshGrid { grid-template-columns: repeat(3,minmax(0,1fr)); gap: 16px; } }
        @media (max-width: 767px) {
          .deals-catalogHeader { padding: 20px 0; }
          h1 { font-size: 26px; }
          .deals-freshGrid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; }
          .deals-searchSortRow { flex-direction: column; align-items: stretch; gap: 12px; }
          .deals-searchField, .deals-sortField { width: 100%; }
          .deals-filterPillsRow { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 4px; }
          .deals-pillTab { white-space: nowrap; }
          .deals-productImageWrap { height: 160px; }
          .deals-productMeta { padding: 12px; }
          .deals-productTitle { min-height: 64px; font-size: 14px; }
          .deals-packLine { min-height: 60px; }
          .deals-priceLine { min-height: 56px; align-content: end; }
          .deals-priceLine strong { font-size: 18px; }
          .deals-catalogHelp { flex-direction: column; align-items: flex-start; gap: 16px; }
        }
      `}</style>
    </>
  );
}
