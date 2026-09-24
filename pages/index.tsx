"use client";

/* The homepage is a faithful port of the premium storefront concept
   (hero -> benefits -> category grid -> product grid -> steps -> custom
   packaging -> testimonial -> newsletter). It is wired to the real catalog
   API instead of static mockups. Styling lives in public/homepage-store.css
   (scoped under `.hps`); homepage.css still powers BestDeals & friends. */

import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Box,
  Check,
  Plus,
  Search,
  ShoppingBag,
  Truck,
} from "lucide-react";
import JsonLd from "../components/common/JsonLd";
import { canonicalUrl, homePageSchema } from "../utils/schema";
import { getService } from "../services/service";
import { getPrimaryPriceTier, getProductImageSrc } from "../utils/productCatalog";
import {
  formatProductCardPrice,
  getProductCardBadge,
  getProductCardDiscountLabel,
  getProductCardSummary,
  getProductDisplayName,
} from "../components/listing/productDisplay";
import { useBrands } from "../context/BrandContext";
import WishlistButton from "../components/common/WishlistButton";
import { addToCart as apiAddToCart } from "../utils/cart";
import ProcessJourneySection from "../components/landing/ProcessJourneySection";

const HOME_CATEGORY_LINKS = [
  { name: "Corrugated Boxes", path: "/corrugated-boxes" },
  { name: "Paper Bags", path: "/paper-bags" },
  { name: "Poly Bags & Mailers", path: "/poly-bags" },
  { name: "Carry Bags", path: "/carry-bags" },
  { name: "Packaging Tapes", path: "/packpro-tapes" },
  { name: "Labels", path: "/rollabel" },
  { name: "Food Wrapping Papers", path: "/packpro-food-wrapping-papers" },
  { name: "Best Deals", path: "/BestDeals" },
];

const CATEGORY_META: Record<
  string,
  { name: string; href: string; image: string; tone: string }
> = {
  "Corrugated Box": {
    name: "Corrugated boxes",
    href: "/corrugated-boxes",
    image: "/category-cutouts/corrugated-boxes.png",
    tone: "sand",
  },
  "Paper Bag": {
    name: "Paper bags",
    href: "/paper-bags",
    image: "/category-cutouts/paper-bags.png",
    tone: "mint",
  },
  "Poly Bag": {
    name: "Poly bags & mailers",
    href: "/poly-bags",
    image: "/category-cutouts/poly-bags.png",
    tone: "blue",
  },
  "Pack Pro": {
    name: "Tapes & sealing",
    href: "/packpro-tapes",
    image: "/category-cutouts/bopp-tapes.png",
    tone: "peach",
  },
  Rollabel: {
    name: "Labels & finishing",
    href: "/rollabel",
    image: "/category-cutouts/chromo-labels.png",
    tone: "yellow",
  },
  "Carry Bag": {
    name: "Carry bags",
    href: "/carry-bags",
    image: "/category-cutouts/carry-bags.png",
    tone: "sky",
  },
  "Food Wrapping Paper": {
    name: "Food wrapping",
    href: "/packpro-food-wrapping-papers",
    image: "/category-cutouts/wrapping-papers.png",
    tone: "rose",
  },
};

const getCategoryName = (product: any): string => {
  const category = product?.category;
  if (typeof category === "string") return category;
  return category?.name || "";
};

const FILTERS = [
  { key: "all", label: "All products", match: [] as string[] },
  { key: "corrugated", label: "Corrugated boxes", match: ["corrugated"] },
  { key: "paper", label: "Paper bags", match: ["paper"] },
  { key: "poly", label: "Poly mailers", match: ["poly"] },
  { key: "tapes", label: "Tapes & labels", match: ["tape", "label"] },
  { key: "food", label: "Food packaging", match: ["food", "wrap"] },
];


const TESTIMONIAL = {
  quote:
    "Prem's innovative e-commerce packaging has enhanced both the durability and presentation of our products.",
  name: "Fruitri",
  role: "Long-term packaging partner",
};

const TESTIMONIAL_PROOF = [
  {
    title: "Since 1977",
    text: "Decades of manufacturing knowledge behind every order.",
  },
  {
    title: "One direct source",
    text: "Boxes, bags, labels, tapes and more under one roof.",
  },
];

const FALLBACK_PRODUCTS = [
  {
    _id: "fb-1",
    slug: "flipkart-corrugated-box-d4",
    name: "Flipkart Corrugated Box D4",
    model: "D4",
    category: "Corrugated boxes",
    top_product: true,
    deal_product: true,
    priceList: [{ number: 50, SP: 494, MRP: 600 }],
    images: [{ image: "/category-cutouts/corrugated-boxes.png" }],
  },
  {
    _id: "fb-2",
    slug: "amazon-paper-bag-pm2",
    name: "Amazon Paper Bag PM2",
    model: "PM2",
    category: "Paper bags",
    top_product: true,
    deal_product: true,
    priceList: [{ number: 100, SP: 400, MRP: 450 }],
    images: [{ image: "/category-cutouts/paper-bags.png" }],
  },
  {
    _id: "fb-3",
    slug: "amazon-poly-mailer-nmt2",
    name: "Amazon Poly Mailer NMT2",
    model: "NMT2",
    category: "Poly bags",
    top_product: true,
    deal_product: true,
    priceList: [{ number: 100, SP: 620, MRP: 760 }],
    images: [{ image: "/category-cutouts/poly-bags.png" }],
  },
  {
    _id: "fb-4",
    slug: "packpro-brown-bopp-tape",
    name: "PackPro Brown BOPP Tape",
    model: "48mm x 65m",
    category: "Packaging Tapes",
    top_product: true,
    deal_product: true,
    priceList: [{ number: 6, SP: 299, MRP: 349 }],
    images: [{ image: "/category-cutouts/bopp-tapes.png" }],
  },
  {
    _id: "fb-5",
    slug: "rollabel-chromo-labels",
    name: "Rollabel Chromo Labels",
    model: "CL_65x70",
    category: "Labels",
    top_product: true,
    deal_product: true,
    priceList: [{ number: 400, SP: 245, MRP: 299 }],
    images: [{ image: "/category-cutouts/chromo-labels.png" }],
  },
  {
    _id: "fb-6",
    slug: "packpro-food-wrapping-paper",
    name: "PackPro Food Wrapping Paper",
    model: "11x12 in",
    category: "Food Wrapping Papers",
    top_product: true,
    deal_product: true,
    priceList: [{ number: 100, SP: 349, MRP: 399 }],
    images: [{ image: "/category-cutouts/wrapping-papers.png" }],
  },
];

const getCategoryText = (product: any): string => {
  const category = product?.category;
  const subCategory = product?.sub_category;
  const parts: string[] = [];
  if (typeof category === "string") parts.push(category);
  else if (category?.name) parts.push(category.name);
  if (typeof subCategory === "string") parts.push(subCategory);
  else if (subCategory?.name) parts.push(subCategory.name);
  return parts.join(" ").toLowerCase();
};

const getCategoryLabel = (product: any): string => {
  const subCategory = product?.sub_category;
  if (typeof subCategory === "string") return subCategory;
  if (subCategory?.name) return subCategory.name;
  const category = product?.category;
  if (typeof category === "string") return category;
  return category?.name || "Prem Packaging";
};

const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-img" />
    <div className="skeleton-line" />
    <div className="skeleton-line short" />
    <div className="skeleton-line tiny" />
  </div>
);

type CategoryCardItem = {
  name: string;
  tag: string;
  href: string;
  image: string;
  tone: string;
};

const CategoryCarousel = ({ cards }: { cards: CategoryCardItem[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const [perView, setPerView] = useState(5);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const measure = () => {
      const width = containerRef.current?.clientWidth ?? 0;
      let pv = 5;
      if (width > 0 && width <= 520) pv = 1;
      else if (width <= 760) pv = 2;
      else if (width <= 980) pv = 3;
      else if (width <= 1200) pv = 4;
      setPerView(pv);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    setIndex((i) => Math.max(0, Math.min(i, Math.max(0, cards.length - perView))));
  }, [perView, cards.length]);

  const advance = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => {
        const max = Math.max(0, cards.length - perView);
        return Math.max(0, Math.min(max, i + dir));
      });
    },
    [cards.length, perView],
  );

  const startAutoplay = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      if (pausedRef.current) return;
      setIndex((i) => {
        const max = Math.max(0, cards.length - perView);
        return i >= max ? i : i + 1;
      });
    }, 3500);
  }, [cards.length, perView]);

  useEffect(() => {
    startAutoplay();
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [startAutoplay]);

  const go = useCallback(
    (dir: 1 | -1) => {
      advance(dir);
      startAutoplay();
    },
    [advance, startAutoplay],
  );

  const maxIndex = Math.max(0, cards.length - perView);
  const slideWidth = 100 / perView;

  return (
    <div
      className="cat-carousel"
      ref={containerRef}
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      <div className="cat-viewport">
        <div className="cat-track" style={{ transform: `translateX(-${index * slideWidth}%)` }}>
          {cards.map((category) => (
            <div className="cat-slide" style={{ width: `${slideWidth}%` }} key={category.name}>
              <Link href={category.href} className={`category-card ${category.tone}`}>
                <span>{category.tag}</span>
                <h3>{category.name}</h3>
                <img src={category.image} alt="" loading="lazy" />
                <i>
                  <ArrowRight size={18} strokeWidth={1.8} />
                </i>
              </Link>
            </div>
          ))}
        </div>
      </div>
      <div className="cat-arrows">
        <button
          type="button"
          className="cat-btn cat-btn-prev"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label="Previous categories"
        >
          <span className="cat-arrow-icon">
            <ArrowRight size={15} strokeWidth={1.75} />
          </span>
        </button>
        <button
          type="button"
          className="cat-btn cat-btn-next"
          onClick={() => go(1)}
          disabled={index === maxIndex}
          aria-label="Next categories"
        >
          <span className="cat-arrow-icon">
            <ArrowRight size={15} strokeWidth={1.75} />
          </span>
        </button>
      </div>
    </div>
  );
};

export default function Home() {
  const { brandNameById } = useBrands();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categoryList, setCategoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [toast, setToast] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const toastTimer = useRef<any>(null);
  const addedTimer = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [productRes, categoryRes] = await Promise.all([
          getService("product/all", {}, { silent: true }),
          getService("category/all", {}, { silent: true }),
        ]);
        if (!mounted) return;
        const products = Array.isArray(productRes?.data?.data)
          ? productRes.data.data
          : Array.isArray(productRes?.data)
            ? productRes.data
            : [];
        const categories = Array.isArray(categoryRes?.data?.data)
          ? categoryRes.data.data
          : Array.isArray(categoryRes?.data)
            ? categoryRes.data
            : [];
        setAllProducts(products);
        setCategoryList(categories);
      } catch (error) {
        console.warn("Failed to load catalog:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const categoryCards = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of allProducts) {
      const name = getCategoryName(product);
      if (name) counts.set(name, (counts.get(name) || 0) + 1);
    }
    return categoryList
      .map((category) => {
        const name = typeof category?.name === "string" ? category.name : "";
        const meta = CATEGORY_META[name];
        if (!meta) return null;
        return {
          name: meta.name,
          tag: `${counts.get(name) || 0} products`,
          href: meta.href,
          image: meta.image,
          tone: meta.tone,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [categoryList, allProducts]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  }, []);

  const handleAddToCart = useCallback(
    async (product: any) => {
      const tier = getPrimaryPriceTier(product);
      const name =
        getProductDisplayName(product, { brandNameById }) ||
        product?.name ||
        "Product";
      try {
        await apiAddToCart(
          product,
          1,
          tier.sellingPrice,
          0.5,
          tier.number,
          tier.number,
          "Prem Packaging",
          product?.category,
          100,
        );
        setAddedIds((prev) => new Set(prev).add(String(product?._id || "")));
        if (addedTimer.current) clearTimeout(addedTimer.current);
        addedTimer.current = setTimeout(() => setAddedIds(new Set()), 1800);
        showToast(`${name} added to your cart`);
      } catch (error) {
        console.warn("Failed to add to cart:", error);
      }
    },
    [brandNameById, showToast],
  );

  const shelf = useMemo(() => {
    const source = allProducts.length ? allProducts : FALLBACK_PRODUCTS;
    const scored = [...source].map((p) => {
      let rank = 0;
      if (p?.deal_product) rank -= 3;
      if (p?.top_product) rank -= 2;
      return { p, rank };
    });
    scored.sort((a, b) => a.rank - b.rank);
    return scored.map((entry) => entry.p);
  }, [allProducts]);

  const visibleProducts = useMemo(() => {
    const filter = FILTERS.find((f) => f.key === activeFilter);
    const keywords = filter?.match || [];
    const pool = keywords.length
      ? shelf.filter((p) => {
          const text = getCategoryText(p);
          return keywords.some((keyword) => text.includes(keyword));
        })
      : shelf;
    return pool.slice(0, 12);
  }, [shelf, activeFilter]);

  const selectedFilter = FILTERS.find((f) => f.key === activeFilter);

  return (
    <>
      <Head>
        <title>Prem Packaging Store | Better Packaging Starts Here</title>
        <meta
          name="description"
          content="Shop boxes, paper bags, poly mailers, tapes, labels and food packaging directly from Prem Industries India Limited."
        />
        <link rel="canonical" href={canonicalUrl("/")} />
      </Head>

      <JsonLd
        id="home"
        data={homePageSchema({
          name: "Prem Packaging Store",
          description:
            "Shop boxes, paper bags, poly mailers, tapes, labels and food packaging directly from Prem Industries India Limited.",
          categories: HOME_CATEGORY_LINKS,
        })}
      />

      <main className="hps">
        {/* Hero */}
        <section className="hero" aria-labelledby="hero-title">
          <img
            className="hero-background"
            src="/hero-packaging.webp"
            alt="Boxes, paper bags, mailers and packaging supplies"
          />
          <div className="hero-overlay" />
          <div className="hero-copy">
            <p className="eyebrow">Made to pack. Ready to send.</p>
            <h1 id="hero-title">
              Better packaging
              <br />
              starts right here.
            </h1>
            <p className="hero-sub">
              Shop dependable boxes, bags, mailers, tapes and labels for your
              everyday orders — delivered directly from the manufacturer.
            </p>
            <div className="hero-ctas">
              <a className="button primary" href="#products">
                Shop bestsellers <ArrowRight size={19} strokeWidth={1.8} />
              </a>
              <a className="button text-button" href="#categories">
                Explore categories
              </a>
            </div>
            <div className="hero-proof">
              <span>
                <Check size={15} strokeWidth={1.8} /> GST invoice
              </span>
              <span>
                <Check size={15} strokeWidth={1.8} /> Secure checkout
              </span>
              <span>
                <Check size={15} strokeWidth={1.8} /> Pan-India delivery
              </span>
            </div>
          </div>
          <div className="hero-note">
            <span>Authorised packaging for</span>
            <strong>amazon</strong>
            <strong>Flipkart</strong>
            <strong>AJIO</strong>
          </div>
        </section>

        {/* Categories */}
        <section className="category-section shell" id="categories">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Find your everyday essentials</p>
              <h2>Shop top categories</h2>
            </div>
            <a href="#products">
              View everything <ArrowRight size={18} strokeWidth={1.8} />
            </a>
          </div>
          {categoryCards.length > 0 ? (
            <CategoryCarousel cards={categoryCards} />
          ) : (
            <div className="category-grid">
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="category-card sand skeleton-cat" />
              ))}
            </div>
          )}
        </section>

        {/* Products */}
        <section className="products-section shell" id="products">
          <div className="section-heading product-heading">
            <div>
              <p className="eyebrow">Customer favourites</p>
              <h2>Packaging people keep coming back for</h2>
            </div>
            <p>
              {selectedFilter?.label === "All products"
                ? "Useful sizes, honest prices and no catalogue confusion."
                : `Showing ${visibleProducts.length} ${selectedFilter?.label.toLowerCase()} products`}
            </p>
          </div>

          <div className="filter-row" role="group" aria-label="Filter products">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={activeFilter === filter.key ? "active" : ""}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid-skeleton" aria-label="Loading products">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : (
            <div className="product-grid">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product?._id || product?.slug}
                  product={product}
                  brandNameById={brandNameById}
                  justAdded={addedIds.has(String(product?._id || ""))}
                  onAdd={handleAddToCart}
                />
              ))}
            </div>
          )}
        </section>

        {/* Redesigned Process Journey Section */}
        <ProcessJourneySection />

        {/* Custom packaging */}
        <section className="custom-section shell" id="custom">
          <div className="custom-visual">
            <img src="/custom-box.webp" alt="Custom kraft mailer box and labels" loading="lazy" />
            <div className="custom-float">
              <strong>Made for your brand</strong>
              <span>Size · Print · Material</span>
            </div>
          </div>
          <div className="custom-copy">
            <p className="eyebrow">Make it unmistakably yours</p>
            <h2>Need packaging with your name on it?</h2>
            <p>
              From the right box size to print, finish and material, our
              packaging team can help turn your idea into a production-ready
              pack.
            </p>
            <ul>
              <li>
                <Check size={17} strokeWidth={1.8} /> Expert structural guidance
              </li>
              <li>
                <Check size={17} strokeWidth={1.8} /> Multi-format packaging support
              </li>
              <li>
                <Check size={17} strokeWidth={1.8} /> Clear quotation and sampling
              </li>
            </ul>
            <Link className="button primary" href="/custom-packaging">
              Start a custom project <ArrowRight size={19} strokeWidth={1.8} />
            </Link>
          </div>
        </section>

        {/* Testimonial */}
        <section className="testimonial-section shell">
          <div className="testimonial-copy">
            <p className="eyebrow">Loved by growing brands</p>
            <blockquote>“{TESTIMONIAL.quote}”</blockquote>
            <div className="quote-by">
              <strong>{TESTIMONIAL.name}</strong>
              <span>{TESTIMONIAL.role}</span>
            </div>
          </div>
          <div className="testimonial-proof">
            <span>Why shoppers choose Prem</span>
            {TESTIMONIAL_PROOF.map((proof) => (
              <div key={proof.title}>
                <strong>{proof.title}</strong>
                <p>{proof.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <div className={`hps-toast ${toast ? "visible" : ""}`}>
        <Check size={16} strokeWidth={2.2} /> {toast}
      </div>
    </>
  );
}

function ProductCard({
  product,
  brandNameById,
  justAdded,
  onAdd,
}: {
  product: any;
  brandNameById: Record<string, string>;
  justAdded: boolean;
  onAdd: (product: any) => void;
}) {
  const tier = getPrimaryPriceTier(product);
  const badge = getProductCardBadge(product);
  const discountLabel = getProductCardDiscountLabel(tier);
  const showMrp = tier.mrp > tier.sellingPrice;
  const name = getProductDisplayName(product, { brandNameById });
  const href = product?.slug ? `/${product.slug}` : "/listingpage";

  return (
    <article className="product-card">
      <Link href={href} className="product-image">
        <img src={getProductImageSrc(product)} alt={name} loading="lazy" />
        {badge === "SALE" && <span className="badge">Sale</span>}
        {badge === "POPULAR" && <span className="badge">Bestseller</span>}
      </Link>
      <WishlistButton product={product} size="md" variant="overlay" placement="top-right" />
      <div className="product-info">
        <div className="product-meta">
          <span>{getCategoryLabel(product)}</span>
          <span>Quality checked</span>
        </div>
        <Link href={href}>
          <h3>{name}</h3>
        </Link>
        <p>
          {getProductCardSummary(product) ||
            (tier.number ? `Pack of ${tier.number}` : "Everyday packaging")}
          <span> · ₹{(Number(tier.sellingPrice) / (Number(tier.number) || 1)).toFixed(0)} / unit</span>
        </p>
        <div className="product-buy">
          <div className="price">
            <strong>{formatProductCardPrice(tier.sellingPrice)}</strong>
            {showMrp && <s>{formatProductCardPrice(tier.mrp)}</s>}
            {discountLabel && <small>{discountLabel}</small>}
          </div>
          <button
            type="button"
            className={justAdded ? "added" : ""}
            onClick={() => onAdd(product)}
            aria-label={`Add ${name} to cart`}
          >
            {justAdded ? (
              <>
                <Check size={17} strokeWidth={2} /> Added
              </>
            ) : (
              <>
                <Plus size={17} strokeWidth={2} /> Add
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
