import React, { useState } from "react";
import Head from "next/head";

const galleryImages = [
  {
    thumb:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAtFGYkUqxJ53-wpV8I4oszFMyTFLgyp83bczixvuic_VFKUK3qZYHxw0QJNS4_xQJJ8EftxfltCwIcoRIFL6UXa_8KK4wTdpLzrs1xd4sMaiAWVeG4R_sDrfo8xcUj1-KP0Q5mKhBoAroapl_ectP1HFrSDC7CoGRV2JTF4NKp3W1n_2G6BLIUcn3Tu1hhzHBcYLQNEl1ty4ZHshd8bwWpilAti0m5KLr70v08VBmuHLkEVSi2The7MtOLmVcY6wK14WI",
    full:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCme5XAGuXJCjLJsENtHeYAR2gUDkZrQ8ylxScTrgnsIjHaFiTl9ZNU_1WjDU9cENQHJ75j0ml1QxwfuQNFp4M4fMLCTvOVy8wa2es8m5iJigq4deyHbydf0MMwxl0-uroeBep9kZUi-EiYLinS5ggRXbmdoS3z1hRyumbJ_br2KcnitXZfwIVHBscLSPW2Z7xA6Xt9xGodaN0si7oArB6RHIezuxAm0Ov-_ZssK81yQOjhiCzhWsZqsQ",
    alt: "Flipkart Corrugated Box D21 main view",
  },
  {
    thumb:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDFDkoDxxFloLI3halIDvJEYfht5rvMGu6hgXP3TvgZUIt_bTov81KOIVnvKJ2bipt3r-O5ARr81lRS3wUXgEf4JfSmMKuKJF7qaQe00sUm3KpR2edRRgGGJ-JYBQ6kCLM_newPz5I3dm2oCCOWNctWdcu5JOlrivySHUr6P4AaJsV7VjcRsX-rjL8zhH58tOmjFbrb90cjZ1xfU4JCv4y5bhb5Hvkwj6fec8c7kOGkv3HAsDp5RURSxA",
    full:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDFDkoDxxFloLI3halIDvJEYfht5rvMGu6hgXP3TvgZUIt_bTov81KOIVnvKJ2bipt3r-O5ARr81lRS3wUXgEf4JfSmMKuKJF7qaQe00sUm3KpR2edRRgGGJ-JYBQ6kCLM_newPz5I3dm2oCCOWNctWdcu5JOlrivySHUr6P4AaJsV7VjcRsX-rjL8zhH58tOmjFbrb90cjZ1xfU4JCv4y5bhb5Hvkwj6fec8c7kOGkv3HAsDp5RURSxA",
    alt: "Flipkart D21 box isometric warehouse view",
  },
  {
    thumb:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBZZycseKcP5GkgAzAX2J5-F9j7tGl0oAcfAHmbs8da6aApgAhjnD5L_Briop3xlOTbGKzVPhwrMAOMj04oqoi8-Hb4JCWS2whe3MunSVsVmYyeVK72ir4Yk2OAbYVcYEoIeYVJ5kFIQW7gqESx_caCM8usbakg0g7CcbZ12xKgskQIVfzgMIQlnNTKOofC3mfNE3EN1HSAs0w61d655Tvf-tvype_aNdAfXWnLDOnwVPVqEKOowBtZtQ",
    full:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBZZycseKcP5GkgAzAX2J5-F9j7tGl0oAcfAHmbs8da6aApgAhjnD5L_Briop3xlOTbGKzVPhwrMAOMj04oqoi8-Hb4JCWS2whe3MunSVsVmYyeVK72ir4Yk2OAbYVcYEoIeYVJ5kFIQW7gqESx_caCM8usbakg0g7CcbZ12xKgskQIVfzgMIQlnNTKOofC3mfNE3EN1HSAs0w61d655Tvf-tvype_aNdAfXWnLDOnwVPVqEKOowBtZtQ",
    alt: "Flipkart D21 3-ply material detail",
  },
];

export default function FlipkartBoxD21Page() {
  const [activeTab, setActiveTab] = useState<"specs" | "usage" | "shipping">(
    "specs"
  );
  const [quantity, setQuantity] = useState<number>(100);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  return (
    <>
      <Head>
        <title>Flipkart Corrugated Box D21 | Prem Industries</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </Head>

      <style jsx global>{`
        :root {
          --on-secondary-container: #27308a;
          --primary-fixed-dim: #ffb3ac;
          --error: #ba1a1a;
          --secondary-container: #959efd;
          --primary: #af101a;
          --surface-bright: #f3faff;
          --primary-container: #d32f2f;
          --on-primary-fixed-variant: #930010;
          --on-error-container: #93000a;
          --surface-container-highest: #cfe6f2;
          --on-secondary: #ffffff;
          --secondary: #4c56af;
          --surface: #f3faff;
          --on-surface: #071e27;
          --tertiary-fixed: #a3f69c;
          --on-secondary-fixed-variant: #343d96;
          --on-primary-fixed: #410003;
          --on-surface-variant: #5b403d;
          --on-background: #071e27;
          --inverse-surface: #1e333c;
          --surface-container-high: #d5ecf8;
          --inverse-primary: #ffb3ac;
          --outline: #8f6f6c;
          --on-primary: #ffffff;
          --on-tertiary-container: #d8ffd0;
          --surface-container: #dbf1fe;
          --surface-variant: #cfe6f2;
          --secondary-fixed-dim: #bdc2ff;
          --tertiary-container: #307f34;
          --on-secondary-fixed: #000767;
          --tertiary-fixed-dim: #88d982;
          --on-tertiary-fixed-variant: #005312;
          --primary-fixed: #ffdad6;
          --secondary-fixed: #e0e0ff;
          --outline-variant: #e4beba;
          --on-primary-container: #fff2f0;
          --error-container: #ffdad6;
          --on-tertiary-fixed: #002204;
          --tertiary: #11651d;
          --surface-tint: #ba1a20;
          --surface-container-low: #e6f6ff;
          --surface-container-lowest: #ffffff;
          --on-error: #ffffff;
          --surface-dim: #c7dde9;
          --inverse-on-surface: #dff4ff;
          --on-tertiary: #ffffff;
          --background: #f3faff;
        }

        .material-symbols-outlined {
          font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
          vertical-align: middle;
        }
        .active-tab {
          border-bottom: 2px solid #af101a;
          color: #af101a;
          font-weight: 700;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #af101a;
        }
      `}</style>

      <div className="bg-[#f3faff] font-['Inter',sans-serif] text-[#071e27] min-h-screen">
        {/* TopNavBar */}
        <header className="bg-[#f3faff] dark:bg-[#071e27] border-b border-[#e4beba] dark:border-[#8f6f6c] sticky top-0 z-50">
          <div className="flex items-center justify-between px-6 w-full max-w-[1280px] mx-auto h-20">
            <div className="flex items-center gap-10">
              <a
                className="text-2xl font-bold text-[#27308a] dark:text-[#e0e0ff]"
                href="#"
              >
                Prem Industries
              </a>
              <nav className="hidden md:flex items-center gap-8">
                <a
                  className="text-[#af101a] dark:text-[#ffb3ac] border-b-2 border-[#af101a] font-bold pb-1 text-xs tracking-wider uppercase"
                  href="#"
                >
                  Products
                </a>
                <a
                  className="text-[#5b403d] dark:text-[#cfe6f2] font-medium hover:text-[#af101a] dark:hover:text-[#ffb3ac] transition-colors duration-200 text-xs tracking-wider uppercase"
                  href="#"
                >
                  Custom Solutions
                </a>
                <a
                  className="text-[#5b403d] dark:text-[#cfe6f2] font-medium hover:text-[#af101a] dark:hover:text-[#ffb3ac] transition-colors duration-200 text-xs tracking-wider uppercase"
                  href="#"
                >
                  Bulk Ordering
                </a>
                <a
                  className="text-[#5b403d] dark:text-[#cfe6f2] font-medium hover:text-[#af101a] dark:hover:text-[#ffb3ac] transition-colors duration-200 text-xs tracking-wider uppercase"
                  href="#"
                >
                  Resources
                </a>
                <a
                  className="text-[#5b403d] dark:text-[#cfe6f2] font-medium hover:text-[#af101a] dark:hover:text-[#ffb3ac] transition-colors duration-200 text-xs tracking-wider uppercase"
                  href="#"
                >
                  Certifications
                </a>
              </nav>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center bg-[#dbf1fe] px-4 py-2 rounded-lg border border-[#e4beba]">
                <span className="material-symbols-outlined text-[#5b403d] mr-2">
                  search
                </span>
                <input
                  className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm w-64"
                  placeholder="Search SKU or Product..."
                  type="text"
                />
              </div>
              <div className="flex items-center gap-4">
                <button className="material-symbols-outlined text-[#5b403d] hover:text-[#af101a]">
                  shopping_cart
                </button>
                <button className="material-symbols-outlined text-[#5b403d] hover:text-[#af101a]">
                  person
                </button>
                <button className="bg-[#af101a] text-white px-6 py-2 rounded text-xs font-semibold uppercase tracking-wider hover:bg-[#d32f2f] transition-all">
                  Request Quote
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="w-full max-w-[1280px] mx-auto px-6 py-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 mb-4 text-[#5b403d] text-xs">
            <a className="hover:underline" href="#">
              Industrial Packaging
            </a>
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
            <a className="hover:underline" href="#">
              Corrugated Boxes
            </a>
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
            <span className="text-[#071e27] font-bold">
              Flipkart Corrugated Box D21
            </span>
          </nav>

          {/* Product Hero Section */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Gallery */}
            <div className="lg:col-span-7 flex flex-col md:flex-row gap-4">
              {/* Thumbnails */}
              <div className="order-2 md:order-1 flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    onMouseEnter={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 border-2 overflow-hidden flex-shrink-0 transition-all ${
                      activeImageIndex === idx
                        ? "border-[#af101a]"
                        : "border-[#e4beba] hover:border-[#af101a]"
                    }`}
                  >
                    <img
                      className="w-full h-full object-cover"
                      src={img.thumb}
                      alt={img.alt}
                    />
                  </button>
                ))}
              </div>
              {/* Main Image */}
              <div className="order-1 md:order-2 flex-grow bg-white border border-[#e4beba] relative overflow-hidden group min-h-[400px]">
                <span className="absolute top-4 left-4 z-10 bg-[#11651d] text-white px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  IN STOCK
                </span>
                <img
                  className="w-full h-auto min-h-[400px] max-h-[500px] object-contain transform transition-transform duration-500 group-hover:scale-105"
                  src={galleryImages[activeImageIndex].full}
                  alt={galleryImages[activeImageIndex].alt}
                />
                <button className="absolute bottom-4 right-4 bg-white/80 p-2 rounded-full shadow-md material-symbols-outlined hover:bg-white transition-all">
                  zoom_in
                </button>
              </div>
            </div>

            {/* Right Column: Product Details & Bulk Pricing */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#27308a] text-xs font-semibold tracking-widest uppercase">
                    BRAND: FLIPKART
                  </span>
                  <span className="text-[#5b403d] text-xs">
                    SKU: IND-D21-7782
                  </span>
                </div>
                <h1 className="text-3xl font-bold leading-tight text-[#071e27] mb-2">
                  Flipkart Corrugated Box D21
                </h1>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex text-[#af101a]">
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="material-symbols-outlined text-sm">
                      star_half
                    </span>
                  </div>
                  <span className="text-[#5b403d] text-sm">
                    (4.8/5) 124 Reviews
                  </span>
                </div>
              </div>

              {/* Pricing Block */}
              <div className="bg-[#e6f6ff] p-6 border border-[#e4beba] rounded-lg">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-[#af101a] text-3xl font-bold">
                    ₹12.45
                  </span>
                  <span className="text-[#5b403d] text-sm">/ unit</span>
                  <span className="ml-auto text-[#ba1a1a] font-bold text-xs">
                    Save 15% on Bulk
                  </span>
                </div>
                <p className="text-[#5b403d] text-xs mb-3 font-bold uppercase tracking-wider">
                  BULK PRICING TIERS:
                </p>
                <div className="space-y-2 mb-6">
                  <div
                    className={`flex justify-between items-center py-2 border-b border-[#e4beba]/30 px-2 rounded ${
                      quantity < 100 ? "bg-[#af101a]/10 font-bold" : ""
                    }`}
                  >
                    <span className="text-sm">1 - 99 Units</span>
                    <span className="font-mono text-sm">₹14.65 / unit</span>
                  </div>
                  <div
                    className={`flex justify-between items-center py-2 border-b border-[#e4beba]/30 px-2 rounded ${
                      quantity >= 100 && quantity < 500
                        ? "bg-[#af101a]/10 font-bold"
                        : "bg-[#af101a]/5"
                    }`}
                  >
                    <span className="text-sm font-bold">100 - 499 Units</span>
                    <span className="font-mono text-sm font-bold text-[#af101a]">
                      ₹12.45 / unit
                    </span>
                  </div>
                  <div
                    className={`flex justify-between items-center py-2 px-2 rounded ${
                      quantity >= 500 ? "bg-[#11651d]/10 font-bold" : ""
                    }`}
                  >
                    <span className="text-sm">500+ Units</span>
                    <span className="font-mono text-sm text-[#11651d] font-bold">
                      ₹10.20 / unit
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-[#8f6f6c] rounded overflow-hidden h-12 bg-white">
                      <button
                        onClick={() => handleQuantityChange(-10)}
                        className="px-4 hover:bg-[#dbf1fe] active:bg-[#c7dde9] transition-colors material-symbols-outlined text-[#5b403d]"
                      >
                        remove
                      </button>
                      <input
                        className="w-20 text-center border-none focus:outline-none focus:ring-0 font-mono text-sm font-bold"
                        type="number"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                        }
                      />
                      <button
                        onClick={() => handleQuantityChange(10)}
                        className="px-4 hover:bg-[#dbf1fe] active:bg-[#c7dde9] transition-colors material-symbols-outlined text-[#5b403d]"
                      >
                        add
                      </button>
                    </div>
                    <button className="flex-grow bg-[#af101a] text-white h-12 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#d32f2f] transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined">
                        shopping_cart
                      </span>
                      Add to Bulk Order
                    </button>
                  </div>
                  <button className="w-full border-2 border-[#27308a] text-[#27308a] h-12 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#27308a] hover:text-white transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">
                      description
                    </span>
                    Request Custom Quote
                  </button>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center p-3 border border-[#e4beba] rounded bg-white text-center">
                  <span className="material-symbols-outlined text-[#af101a] mb-1">
                    verified
                  </span>
                  <span className="text-[10px] font-bold uppercase leading-tight text-[#5b403d]">
                    ISO 9001:2015
                    <br />
                    Certified
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 border border-[#e4beba] rounded bg-white text-center">
                  <span className="material-symbols-outlined text-[#af101a] mb-1">
                    local_shipping
                  </span>
                  <span className="text-[10px] font-bold uppercase leading-tight text-[#5b403d]">
                    Fast Industrial
                    <br />
                    Shipping
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 border border-[#e4beba] rounded bg-white text-center">
                  <span className="material-symbols-outlined text-[#af101a] mb-1">
                    payments
                  </span>
                  <span className="text-[10px] font-bold uppercase leading-tight text-[#5b403d]">
                    Bulk Credit
                    <br />
                    Available
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Technical Tabs Section */}
          <section className="mt-16">
            <div className="border-b border-[#e4beba] flex gap-8 mb-6">
              <button
                className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === "specs"
                    ? "active-tab"
                    : "text-[#5b403d] hover:text-[#af101a]"
                }`}
                onClick={() => setActiveTab("specs")}
              >
                Technical Specifications
              </button>
              <button
                className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === "usage"
                    ? "active-tab"
                    : "text-[#5b403d] hover:text-[#af101a]"
                }`}
                onClick={() => setActiveTab("usage")}
              >
                Usage & Care
              </button>
              <button
                className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === "shipping"
                    ? "active-tab"
                    : "text-[#5b403d] hover:text-[#af101a]"
                }`}
                onClick={() => setActiveTab("shipping")}
              >
                Shipping & Returns
              </button>
            </div>

            <div className="min-h-[250px]">
              {activeTab === "specs" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                  <div className="flex justify-between py-3 border-b border-[#e4beba]/30">
                    <span className="font-bold text-[#5b403d]">
                      Inner Dimensions (LxWxH)
                    </span>
                    <span className="font-mono">250 x 150 x 120 mm</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[#e4beba]/30">
                    <span className="font-bold text-[#5b403d]">Material</span>
                    <span className="font-mono">
                      Industrial Grade Kraft, 3 Ply
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[#e4beba]/30">
                    <span className="font-bold text-[#5b403d]">
                      Weight Capacity
                    </span>
                    <span className="font-mono">Up to 8.5 KG</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[#e4beba]/30">
                    <span className="font-bold text-[#5b403d]">HSN Code</span>
                    <span className="font-mono">48191010</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[#e4beba]/30">
                    <span className="font-bold text-[#5b403d]">
                      Compression Strength
                    </span>
                    <span className="font-mono">2.5 kN/m</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[#e4beba]/30">
                    <span className="font-bold text-[#5b403d]">Color</span>
                    <span className="font-mono">Brown / Kraft</span>
                  </div>
                </div>
              )}

              {activeTab === "usage" && (
                <div className="prose max-w-none text-[#5b403d]">
                  <h3 className="text-xl font-bold text-[#071e27] mb-4">
                    Recommended Usage
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed">
                    The Flipkart Corrugated Box D21 is specifically engineered
                    for high-volume e-commerce logistics. It is ideal for
                    shipping medium-weight electronics, apparel bundles, and
                    automotive parts.
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li>
                      Store in a dry, ventilated area away from direct
                      moisture.
                    </li>
                    <li>
                      Avoid stacking more than 10 units high when fully loaded.
                    </li>
                    <li>
                      Use standard 2-inch industrial packaging tape for optimal
                      seal integrity.
                    </li>
                  </ul>
                </div>
              )}

              {activeTab === "shipping" && (
                <div className="bg-[#dbf1fe] p-6 rounded-lg border border-[#e4beba]">
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-[#af101a] text-3xl">
                      local_shipping
                    </span>
                    <div>
                      <h4 className="font-bold text-lg mb-2">
                        Industrial Logistics Network
                      </h4>
                      <p className="text-[#5b403d] text-sm leading-relaxed">
                        Orders above 500 units qualify for palletized shipping.
                        Lead time is 3-5 business days across major industrial
                        hubs.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Ratings & Reviews */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6 text-[#071e27]">
              Ratings & Reviews
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4 flex flex-col gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#071e27]">4.8</span>
                  <span className="text-[#5b403d]">/ 5</span>
                </div>
                <div className="flex text-[#af101a] mb-2">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span className="material-symbols-outlined">star_half</span>
                </div>
                <p className="text-sm text-[#5b403d]">
                  Based on 124 verified industrial purchases
                </p>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold w-4">5</span>
                    <div className="flex-grow h-2 bg-[#dbf1fe] rounded-full overflow-hidden">
                      <div className="bg-[#af101a] h-full w-[85%]"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold w-4">4</span>
                    <div className="flex-grow h-2 bg-[#dbf1fe] rounded-full overflow-hidden">
                      <div className="bg-[#af101a] h-full w-[10%]"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold w-4">3</span>
                    <div className="flex-grow h-2 bg-[#dbf1fe] rounded-full overflow-hidden">
                      <div className="bg-[#af101a] h-full w-[3%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-8 space-y-6">
                <div className="border-b border-[#e4beba] pb-6">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold">Logistics Manager, TechHub</span>
                    <span className="text-[#5b403d] text-xs">Oct 12, 2023</span>
                  </div>
                  <div className="flex text-[#af101a] mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className="material-symbols-outlined text-sm"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <p className="text-[#5b403d] text-sm leading-relaxed">
                    Excellent structural integrity. We use these for shipping
                    heavy server components and haven't had a single failure in
                    500+ shipments.
                  </p>
                </div>

                <div className="border-b border-[#e4beba] pb-6">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold">
                      Operations Lead, RetailFlow
                    </span>
                    <span className="text-[#5b403d] text-xs">Sep 28, 2023</span>
                  </div>
                  <div className="flex text-[#af101a] mb-2">
                    {[1, 2, 3, 4].map((s) => (
                      <span
                        key={s}
                        className="material-symbols-outlined text-sm"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    ))}
                    <span className="material-symbols-outlined text-sm">
                      star
                    </span>
                  </div>
                  <p className="text-[#5b403d] text-sm leading-relaxed">
                    Consistent quality across bulk orders. The D21 size is
                    perfect for our standard apparel bundles.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Frequently Bought Together */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6 text-[#071e27]">
              Frequently Bought Together
            </h2>
            <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Card 1 */}
                  <div className="relative w-28 sm:w-36 p-3.5 bg-slate-100 ring-2 ring-slate-900 rounded-xl flex flex-col items-center text-center">
                    <span className="absolute top-2.5 left-2.5 w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                    <div className="w-16 h-16 flex items-center justify-center p-1 mb-2 bg-white rounded-lg shadow-xs overflow-hidden">
                      <img
                        className="w-full h-full object-contain"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuArfj7ELMJ71Mw2PaHYGYWuL1mECUk6k_3qd862RluZu9NAAJBZ035icRtiRsg7uAjGG91seW9yvtA4tQ6UHbVEPuJ0tC4zE9othXnop4Jq0-kMFuR7E3ZSj-0PsFbRp7LiRa7CCxMeM4b4n3ac_X3twMfbgsN3j4j6Z4sTh6IoCCkYp_ntQ1rTDz9sA4yET73czSvSigmppCacuYLr_82tVplrvP9a8UCnvtEBnTOXfDFWvul3pFz1ShO0rH9LiP4kpSA"
                        alt="Flipkart D21 box thumbnail"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 leading-tight break-words">
                      Flipkart Corrugated Box D21 (FLIP-D21)
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 mt-1">
                      ₹1,245.00
                    </span>
                  </div>

                  <span className="material-symbols-outlined text-slate-400 font-bold text-xl">
                    add
                  </span>

                  {/* Card 2 */}
                  <div className="relative w-28 sm:w-36 p-3.5 bg-slate-100 ring-2 ring-slate-900 rounded-xl flex flex-col items-center text-center">
                    <span className="absolute top-2.5 left-2.5 w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                    <div className="w-16 h-16 flex items-center justify-center p-1 mb-2 bg-white rounded-lg shadow-xs overflow-hidden">
                      <img
                        className="w-full h-full object-cover rounded"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgEVWZTEfBCo6N_i3qenrFvotYiuxrK2b0BwW3jTRj7YfIw6OrM732K0fNHShzNVWI5M40YEoyII0zMK_gUBfOX_2uxKhNJastjEjsx3URoin50GFxiVPYFIXtz9WTEgjJz-O56RtUDtXRWKPTSHM4P9UpqBHtA2k2NRzM-4nEGnGmCyRS1ukw4nRU7-KOj8tCO0jh55AOyI57RY4iV8jcROS80byLDjgNvQslS47t5wPiqGcGJVldnw"
                        alt="Industrial tape"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 leading-tight break-words">
                      Industrial Heavy Duty Tape (TAP-HD48)
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 mt-1">
                      ₹450.00
                    </span>
                  </div>

                  <span className="material-symbols-outlined text-slate-400 font-bold text-xl">
                    add
                  </span>

                  {/* Card 3 */}
                  <div className="relative w-28 sm:w-36 p-3.5 bg-slate-100 ring-2 ring-slate-900 rounded-xl flex flex-col items-center text-center">
                    <span className="absolute top-2.5 left-2.5 w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                    <div className="w-16 h-16 flex items-center justify-center p-1 mb-2 bg-white rounded-lg shadow-xs overflow-hidden">
                      <img
                        className="w-full h-full object-cover rounded"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpjmPMFyW5YsZkUbWQ5EE2GEzbGXWNxvQpwNu24DQlKwba7nvjUNvyPnoIQFI34CK4Z5AjVgDTPkUUpHL8UBDz3ddAT1fw8w2p8jSxxn_PePuk8qRiOmX7Qr31TriQpGAlfyAOhMQAmrHI5fHfuBpmKboYVfqyZlOhSMfyGWH-7hQWBTCN9_so4YO0al_vE9iIhgdwN5tMoyXaYfknUASbWAtXGxwYgq0CyX4m3QbhTpSw6n6_tXep7w"
                        alt="Bubble wrap"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 leading-tight break-words">
                      Protective Air Bubble Wrap Roll (BUB-W50)
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 mt-1">
                      ₹755.00
                    </span>
                  </div>
                </div>

                {/* Right Summary */}
                <div className="flex-grow lg:pl-8 pt-6 lg:pt-0 w-full lg:w-auto">
                  <div className="space-y-2 mb-4 text-xs sm:text-sm">
                    <div className="flex justify-between items-center gap-4 text-slate-900">
                      <span className="break-words">• Flipkart Corrugated Box D21 (FLIP-D21)</span>
                      <span className="whitespace-nowrap font-semibold text-slate-900">₹1,245.00</span>
                    </div>
                    <div className="flex justify-between items-center gap-4 text-slate-900">
                      <span className="break-words">• Industrial Heavy Duty Tape (TAP-HD48)</span>
                      <span className="whitespace-nowrap font-semibold text-slate-900">₹450.00</span>
                    </div>
                    <div className="flex justify-between items-center gap-4 text-slate-900">
                      <span className="break-words">• Protective Air Bubble Wrap Roll (BUB-W50)</span>
                      <span className="whitespace-nowrap font-semibold text-slate-900">₹755.00</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-500 mb-1 font-medium">
                    Total Bundle Price (3 items):
                  </p>
                  <div className="flex items-baseline gap-3 mb-5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      ₹2,082.50
                    </span>
                    <span className="text-sm text-slate-400 font-normal line-through">
                      ₹2,450.00
                    </span>
                  </div>

                  <button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer shadow-md transition-all border-0">
                    <span className="material-symbols-outlined text-lg">
                      shopping_cart
                    </span>
                    ADD 3 BUNDLE ITEMS TO ORDER
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Related Products Grid */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6 text-[#071e27]">
              Related Products
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "Corrugated Box D22",
                  dims: "300 x 200 x 150 mm",
                  price: "₹15.50 / unit",
                },
                {
                  title: "Corrugated Box D20",
                  dims: "200 x 100 x 100 mm",
                  price: "₹9.75 / unit",
                },
                {
                  title: "Heavy Duty 5-Ply Box",
                  dims: "400 x 300 x 300 mm",
                  price: "₹28.00 / unit",
                },
                {
                  title: "Small Parts Box S1",
                  dims: "100 x 100 x 50 mm",
                  price: "₹4.20 / unit",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white border border-[#e4beba] rounded-lg overflow-hidden flex flex-col hover:shadow-lg transition-shadow"
                >
                  <div className="h-48 bg-[#e6f6ff] p-4 flex items-center justify-center">
                    <img
                      alt={item.title}
                      className="h-full object-contain"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCme5XAGuXJCjLJsENtHeYAR2gUDkZrQ8ylxScTrgnsIjHaFiTl9ZNU_1WjDU9cENQHJ75j0ml1QxwfuQNFp4M4fMLCTvOVy8wa2es8m5iJigq4deyHbydf0MMwxl0-uroeBep9kZUi-EiYLinS5ggRXbmdoS3z1hRyumbJ_br2KcnitXZfwIVHBscLSPW2Z7xA6Xt9xGodaN0si7oArB6RHIezuxAm0Ov-_ZssK81yQOjhiCzhWsZqsQ"
                    />
                  </div>
                  <div className="p-4 flex-grow flex flex-col gap-2">
                    <h3 className="font-bold text-base">{item.title}</h3>
                    <p className="text-[#5b403d] text-xs">{item.dims}</p>
                    <p className="text-[#af101a] font-bold mt-auto text-sm">
                      {item.price}
                    </p>
                    <button className="w-full mt-2 bg-[#af101a] text-white py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#d32f2f] transition-colors">
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-[#cfe6f2] dark:bg-[#071e27] mt-16 border-t border-[#e4beba]/30">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-6 py-12 w-full max-w-[1280px] mx-auto">
            <div className="flex flex-col gap-4">
              <span className="text-xl font-bold text-[#27308a] dark:text-[#e0e0ff]">
                Prem Industries
              </span>
              <p className="text-[#5b403d] dark:text-[#cfe6f2] text-sm leading-relaxed">
                Providing high-performance industrial packaging solutions for
                the global B2B sector since 1995.
              </p>
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-[#5b403d] cursor-pointer hover:text-[#af101a]">
                  qr_code_2
                </span>
                <span className="material-symbols-outlined text-[#5b403d] cursor-pointer hover:text-[#af101a]">
                  language
                </span>
                <span className="material-symbols-outlined text-[#5b403d] cursor-pointer hover:text-[#af101a]">
                  mail
                </span>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 uppercase text-xs tracking-wider">
                Company
              </h4>
              <ul className="space-y-2 text-sm text-[#5b403d] dark:text-[#cfe6f2]">
                <li>
                  <a className="hover:text-[#af101a] transition-colors" href="#">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#af101a] transition-colors" href="#">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#af101a] transition-colors" href="#">
                    Compliance
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#af101a] transition-colors" href="#">
                    About Us
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 uppercase text-xs tracking-wider">
                Customer Support
              </h4>
              <ul className="space-y-2 text-sm text-[#5b403d] dark:text-[#cfe6f2]">
                <li>
                  <a className="hover:text-[#af101a] transition-colors" href="#">
                    Shipping Info
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#af101a] transition-colors" href="#">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#af101a] transition-colors" href="#">
                    Bulk Order Tracking
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#af101a] transition-colors" href="#">
                    Returns & Refunds
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 uppercase text-xs tracking-wider">
                Newsletter
              </h4>
              <p className="text-[#5b403d] dark:text-[#cfe6f2] text-sm mb-4">
                Get industrial insights and bulk offer updates.
              </p>
              <div className="flex">
                <input
                  className="bg-white border border-[#8f6f6c] p-2 text-sm flex-grow focus:outline-none focus:ring-1 focus:ring-[#af101a]"
                  placeholder="Email Address"
                  type="email"
                />
                <button className="bg-[#af101a] text-white px-4 font-bold text-xs uppercase tracking-wider">
                  JOIN
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-[#e4beba]/30 py-6 text-center">
            <p className="text-[#5b403d] dark:text-[#cfe6f2] text-xs">
              © 2024 Prem Industries. All Rights Reserved. ISO 9001:2015
              Certified.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
