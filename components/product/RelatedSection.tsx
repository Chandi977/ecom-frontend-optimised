import React from "react";


import { useState } from "react";
import { useEffect, useRef } from "react";
import { postService, getService } from "../../services/service";
import RelatedCard from "./RelatedCard";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { toBrandRouteSlug } from "../../utils/brands";

const Slider = dynamic(() => import("react-slick"), { ssr: false }) as any;
type RelatedProduct = { _id?: string; slug?: string; [key: string]: unknown };
type SliderHandle = { slickPrev?: () => void; slickNext?: () => void };

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return value?._id || value?.id || "";
  }
  return String(value);
};

function RelatedSection({ product }) {
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [type, setType] = useState("desktop");
  const router = useRouter();
  const sliderRef1 = useRef<SliderHandle | null>(null);

  const handleViewAll = async () => {
    const brand = product?.brand;
    if (!brand) {
      router.push("/BestDeals");
      return;
    }

    // Prefer the slug already populated on the brand object (brand routes are
    // named after `slugify(brand.name)`, e.g. "flipkart", "pack-secure").
    let brandSlug =
      typeof brand === "object" ? toBrandRouteSlug(brand as any) : undefined;

    // Fall back to resolving the slug from the brand id via the API when the
    // brand arrives as a bare id (e.g. from the category/brand fallback list).
    if (!brandSlug) {
      const brandId = normalizeId(brand);
      if (brandId) {
        try {
          const res = await getService("brand/all");
          const brands = res?.data?.data || [];
          const found = brands.find(
            (b) => normalizeId(b?._id) === brandId
          );
          brandSlug = found ? toBrandRouteSlug(found) : undefined;
        } catch {
          brandSlug = undefined;
        }
      }
    }

    router.push(brandSlug ? `/${brandSlug}` : "/BestDeals");
  };

  const getData = async () => {
    const productIds = (product?.relatedProducts || [])
      .map((item) => (typeof item === "string" ? item : item?._id))
      .filter((id) => Boolean(id) && id !== "undefined");

    if (productIds?.length > 0) {
      const related: RelatedProduct[] = [];
      for (const productId of productIds) {
        const res = await getService(`product/image/single/${productId}`);
        if (res?.data?.message === "Product found" && res?.data?.data) {
          related.push(res.data.data);
        }
      }
      if (related.length) {
        setProducts(related.slice(0, 5));
        return;
      }
    }

    // Fallback: similar products by category/brand excluding current product
    const categoryId = normalizeId(product?.category);
    const brandId = normalizeId(product?.brand);
    const filterPayload = {
      ...(categoryId && { category: [categoryId] }),
      ...(brandId && { brand: brandId }),
      skip: 0,
      limit: 6,
    };
    const fallbackRes = await postService("/product/filter", filterPayload);
    const fallbackList = fallbackRes?.data?.data || [];
    const cleaned = fallbackList
      .filter((p) => p?._id && p._id !== product?._id)
      .slice(0, 5);
    setProducts(cleaned);
  };

  useEffect(() => {
    getData();
    if (typeof window !== "undefined") {
      if (window.innerWidth < 768) {
        setType("mobile");
      } else {
        setType("desktop");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  var settings = {
    dots: false,
    infinite: products.length > 4,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: products.length > 2,
          dots: true,
        },
      },
      {
        breakpoint: 767,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: products.length > 1,
          dots: true,
          padding: 26,
          arrows: false,
        },
      },
    ],
  };

  return (
    <>
      <div className="row mt-5 m-0" style={{ position: "relative" }}>
        <div className="col mb-4">
          <div className="tw-pb-2.5 tw-w-full tw-mb-4">
            <h2 className="tw-text-[#182c5a] tw-text-[24px] tw-font-bold tw-uppercase tw-m-0">
              Related Products
            </h2>
          </div>

          {products.length > 0 ? (
            <div style={{ position: "relative", padding: "0 10px" }}>
              {products.length > 4 && (
                <>
                  <button
                    className="tw-prod-arrow-prev"
                    onClick={() => sliderRef1.current?.slickPrev?.()}
                    aria-label="Previous slide"
                  >
                    <svg className="tw-w-5 tw-h-5 tw-text-gray-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    className="tw-prod-arrow-next"
                    onClick={() => sliderRef1.current?.slickNext?.()}
                    aria-label="Next slide"
                  >
                    <svg className="tw-w-5 tw-h-5 tw-text-gray-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5 15.75 12 8.25 19.5" />
                    </svg>
                  </button>
                </>
              )}

              <Slider {...settings} ref={sliderRef1}>
                {products.map((x, i) => (
                  <div key={i} className="px-2">
                    <div
                      className="related-card-wrapper d-flex flex-column justify-content-start align-items-center"
                      style={{
                        width: "100%",
                        height: "420px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        overflow: "hidden",
                        backgroundColor: "#fff",
                        cursor: "pointer",
                        marginTop: "10px",
                      }}
                      onClick={() => router.push(`/${x?.slug}`)}
                    >
                      <RelatedCard product={x} />
                    </div>
                  </div>
                ))}
              </Slider>

              {/* Explore All Products Centered Button */}
              <div className="tw-w-full tw-flex tw-justify-center tw-mt-8 tw-mb-4">
                <button
                  onClick={handleViewAll}
                  className="tw-border tw-border-solid tw-border-[#182c5a] tw-text-[#182c5a] tw-bg-white hover:tw-bg-[#182c5a] hover:tw-text-white tw-transition-colors tw-rounded-lg tw-px-6 tw-py-2.5 tw-text-[14px] tw-font-bold tw-flex tw-items-center tw-gap-2 tw-cursor-pointer"
                  style={{ border: "1px solid #182c5a" }}
                >
                  Explore All Products
                  <svg className="tw-w-4 tw-h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div>No products found</div>
          )}
        </div>
      </div>
      <style jsx>{`
        .related-card-wrapper {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .related-card-wrapper:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
        }
         .tw-prod-arrow-prev {
           position: absolute;
           top: 50%;
           transform: translateY(-50%);
           z-index: 2;
           left: -20px;
           background-color: #ffffff;
           width: 40px;
           height: 40px;
           display: flex;
           align-items: center;
           justify-content: center;
           cursor: pointer;
           border-radius: 50%;
           border: 1px solid #e5e7eb;
           box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
           transition: background-color 0.2s, transform 0.2s;
         }
         .tw-prod-arrow-prev:hover {
           background-color: #f9fafb;
           transform: translateY(-50%) scale(1.05);
         }
         .tw-prod-arrow-next {
           position: absolute;
           top: 50%;
           transform: translateY(-50%);
           z-index: 2;
           right: -20px;
           background-color: #ffffff;
           width: 40px;
           height: 40px;
           display: flex;
           align-items: center;
           justify-content: center;
           cursor: pointer;
           border-radius: 50%;
           border: 1px solid #e5e7eb;
           box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
           transition: background-color 0.2s, transform 0.2s;
         }
         .tw-prod-arrow-next:hover {
           background-color: #f9fafb;
           transform: translateY(-50%) scale(1.05);
         }
        .tw-prod-imageee {
          width: 20px;
          height: 20px;
          object-fit: contain;
        }
        .tw-prod-related-grid {
          margin-bottom: 140px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: flex-start;
          gap: 20px 32px;
          width: 100%;
        }
        @media (max-width: 700px) {
          .tw-prod-related-grid {
            margin-bottom: 80px;
            gap: 16px;
          }
        }
        @media (max-width: 767px) {
          .tw-prod-arrow-prev,
          .tw-prod-arrow-next {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}

export default RelatedSection;
