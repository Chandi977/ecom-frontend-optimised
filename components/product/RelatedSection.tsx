import React from "react";
import Image from "next/image";


import { useState } from "react";
import { useEffect, useRef } from "react";
import { postService, getService } from "../../services/service";
import RelatedCard from "./RelatedCard";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

const Slider = dynamic(() => import("react-slick"), { ssr: false });
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

  const getData = async () => {
    const productIds = (product?.relatedProducts || [])
      .map((item) => (typeof item === "string" ? item : item?._id))
      .filter((id) => Boolean(id) && id !== "undefined");

    if (productIds?.length > 0) {
      const related = [];
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
          <div className="d-flex flex-row align-items-center justify-content-between">
            <p
              style={{
                color: "#3A5BA2",
                fontSize: "24px",
                fontStyle: "normal",
                fontWeight: "700",
                lineHeight: "30px",
                textTransform: "uppercase",
              }}
            >
              RELATED PRODUCTS
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#3A5BA2",
              height: "3px",
              width: "265px",
            }}
          ></div>
          <div
            className="row m-0 mb-3"
            style={{ height: "1px", backgroundColor: "#EDEDED" }}
          ></div>

          {products.length > 0 ? (
            <div style={{ position: "relative", padding: "0 10px" }}>
              {products.length > 4 && (
                <>
                  <div
                    className="tw-prod-arrow-prev"
                    onClick={() => sliderRef1.current?.slickPrev?.()}
                  >
                    <Image
                      src="https://res.cloudinary.com/dwxqg9so3/image/upload/v1690811676/Arrow_-_Right_3_ssrdw2.svg"
                      alt="Previous slide"
                      className="tw-prod-imageee"
                      width={20}
                      height={20}
                      loading="lazy"
                    />
                  </div>
                  <div
                    className="tw-prod-arrow-next"
                    onClick={() => sliderRef1.current?.slickNext?.()}
                  >
                    <Image
                      src="https://res.cloudinary.com/dwxqg9so3/image/upload/v1690811676/Arrow_-_Right_3_1_irtfa7.svg"
                      alt="Next slide"
                      className="tw-prod-imageee"
                      width={20}
                      height={20}
                      loading="lazy"
                    />
                  </div>
                </>
              )}

              <Slider {...settings} ref={sliderRef1}>
                {products.map((x, i) => (
                  <div key={i} className="px-2">
                    <div
                      className="d-flex flex-column justify-content-start align-items-center"
                      style={{
                        width: "100%",
                        height: "367px",
                        border: "1px solid #EDEDED",
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
            </div>
          ) : (
            <div>No products found</div>
          )}
        </div>
      </div>
      <style jsx>{`
        .tw-prod-arrow-prev {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          left: -50px;
          background-color: #f5f5f5;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
          transition: background-color 0.2s, transform 0.2s;
        }
        .tw-prod-arrow-prev:hover {
          background-color: #e0e0e0;
          transform: translateY(-50%) scale(1.05);
        }
        .tw-prod-imageee {
          width: 20px;
          height: 20px;
          object-fit: contain;
        }
        .tw-prod-arrow-next {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          right: -50px;
          background-color: #f5f5f5;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
          transition: background-color 0.2s, transform 0.2s;
        }
        .tw-prod-arrow-next:hover {
          background-color: #e0e0e0;
          transform: translateY(-50%) scale(1.05);
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
