"use client";

/* Product-first homepage, using the existing catalog and cart services. */

import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Factory,
  Headphones,
  Plus,
  ReceiptText,
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

const CategoryCarousel = ({ cards }: { cards: CategoryCardItem[] }) => (
  <div className="category-grid">
    {cards.map((category) => (
      <Link href={category.href} className="category-card" key={category.name}>
        <span className="category-card__image">
          <img src={category.image} alt="" loading="lazy" />
        </span>
        <span className="category-card__copy">
          <h3>{category.name}</h3>
          <small>{category.tag}</small>
        </span>
      </Link>
    ))}
  </div>
);

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
        const productCount = counts.get(name) || 0;
        return {
          name: meta.name,
          tag: `${productCount} ${productCount === 1 ? "product" : "products"}`,
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
        <meta name="page-type" content="product" />
        <meta name="site-kind" content="other" />
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
          <div className="hero-copy" data-enter>
            <span className="hero-eyebrow">B2B packaging supplier</span>
            <h1 id="hero-title">Packaging solutions for every business</h1>
            <p className="hero-sub">
              Source boxes, mailer bags, paper bags, tapes, pouches and custom
              packaging from one supplier, with pack and bulk pricing.
            </p>
            <div className="hero-ctas">
              <a className="button primary" href="#products">
                Browse products <ArrowRight size={17} aria-hidden="true" />
              </a>
              <Link className="button text-button" href="/contact-us">
                Request a quote
              </Link>
            </div>
          </div>
          <figure className="hero-visual">
            <img
              className="hero-background"
              src="/hero-packaging.webp"
              alt="Corrugated boxes, paper bags, poly mailers, tape and labels"
              width={1586}
              height={992}
              fetchPriority="high"
            />
          </figure>
        </section>

        <section className="commerce-benefits shell" aria-label="Why shop with Prem Packaging">
          <article>
            <Factory aria-hidden="true" />
            <div><strong>Made by the manufacturer</strong><span>Reliable quality without extra layers</span></div>
          </article>
          <article>
            <ReceiptText aria-hidden="true" />
            <div><strong>Clear business pricing</strong><span>Pack sizes, unit rates and GST support</span></div>
          </article>
          <article>
            <Truck aria-hidden="true" />
            <div><strong>Pan-India dispatch</strong><span>Dependable delivery for daily operations</span></div>
          </article>
          <article>
            <Headphones aria-hidden="true" />
            <div><strong>Packaging specialists</strong><span>Practical support before and after purchase</span></div>
          </article>
        </section>

        <section className="buying-section shell" aria-labelledby="buying-title">
          <div className="buying-heading">
            <h2 id="buying-title">Choose how you buy</h2>
            <p>Start with ready stock, a custom brief, or a previous order.</p>
          </div>

          <div className="buying-grid">
            <Link className="buying-banner buying-banner--stock" href="#products">
              <div className="buying-banner__copy">
                <span>Ready-stock catalogue</span>
                <h3>Order standard packaging online</h3>
                <p>Compare pack quantities and unit rates across the range.</p>
                <strong>Shop ready stock <ArrowRight size={16} aria-hidden="true" /></strong>
              </div>
              <div className="buying-banner__products" aria-hidden="true">
                <img src="/category-cutouts/corrugated-boxes.png" alt="" width={500} height={500} loading="lazy" />
                <img src="/category-cutouts/bopp-tapes.png" alt="" width={571} height={437} loading="lazy" />
              </div>
            </Link>

            <Link className="buying-banner buying-banner--custom" href="/custom-packaging">
              <div className="buying-banner__copy">
                <span>Custom production</span>
                <h3>Build a pack around your product</h3>
                <p>Share the size, print, finish and material you need.</p>
                <strong>Start a custom project <ArrowRight size={16} aria-hidden="true" /></strong>
              </div>
              <img
                className="buying-banner__custom-image"
                src="/custom-box.webp"
                alt=""
                width={1448}
                height={1086}
                loading="lazy"
                aria-hidden="true"
              />
            </Link>

            <Link className="buying-banner buying-banner--repeat" href="/my-orders">
              <ReceiptText aria-hidden="true" />
              <div className="buying-banner__copy">
                <span>Repeat purchase</span>
                <h3>Find a previous business order</h3>
                <strong>View your orders <ArrowRight size={16} aria-hidden="true" /></strong>
              </div>
            </Link>
          </div>
        </section>

        {/* Categories */}
        <section className="category-section shell" id="categories">
          <div className="section-heading">
            <div className="section-heading__copy">
              <span className="section-eyebrow">Shop by category</span>
              <h2>Everything you need to pack and ship</h2>
              <p>Browse packaging formats built for ecommerce, retail and fulfilment.</p>
            </div>
            <a href="#products" className="section-link">
              View all products <ArrowRight size={16} aria-hidden="true" />
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
            <div className="section-heading__copy">
              <span className="section-eyebrow">Popular products</span>
              <h2>Packaging supplies for everyday orders</h2>
              <p>Compare sizes, pack quantities and factory-direct prices.</p>
            </div>
            <p className="product-result-count" aria-live="polite">
              {selectedFilter?.label === "All products"
                ? `${visibleProducts.length} bestselling products`
                : `Showing ${visibleProducts.length} ${selectedFilter?.label.toLowerCase()} products`}
            </p>
          </div>

          <div className="filter-row" role="group" aria-label="Filter products">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={activeFilter === filter.key ? "active" : ""}
                aria-pressed={activeFilter === filter.key}
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

        {/* Custom packaging */}
        <section className="custom-section shell" id="custom">
          <div className="custom-visual">
            <img src="/custom-box.webp" alt="Custom kraft mailer box and labels" loading="lazy" />
          </div>
          <div className="custom-copy">
            <span className="section-eyebrow">Built around your product</span>
            <h2>Custom packaging for your business</h2>
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
              Start a custom project <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* Testimonial */}
        <section className="testimonial-section shell">
          <div className="testimonial-copy">
            <blockquote>“{TESTIMONIAL.quote}”</blockquote>
            <div className="quote-by">
              <strong>{TESTIMONIAL.name}</strong>
              <span>{TESTIMONIAL.role}</span>
            </div>
          </div>
          <div className="testimonial-proof">
            <span className="section-eyebrow">Why businesses choose Prem</span>
            {TESTIMONIAL_PROOF.map((proof) => (
              <div key={proof.title}>
                <strong>{proof.title}</strong>
                <p>{proof.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <div role="status" className={`hps-toast ${toast ? "visible" : ""}`}>
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
                <Plus size={17} strokeWidth={2} /> Add to cart
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
