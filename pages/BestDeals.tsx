import { useEffect, useRef, useState } from "react";
import { getService } from "../services/service";
import dynamic from "next/dynamic";
import DealsCard from "../components/landing/DealsCard";
import DealsCardMobile from "../components/landing/DealsCardMobile";
import Image from "next/image";

const Slider: any = dynamic(() => import("react-slick"), { ssr: false });

export async function getServerSideProps(context) {
  const searchRes = await getService(`brand/all`);
  const prod = await getService("product/all");
  const deal = await getService("deal/all");
  return {
    props: {
      brand: searchRes?.data ? searchRes?.data?.data : [],
      product: prod?.data ? prod?.data?.data : [],
      deal: deal?.data ? deal?.data?.data : [],
    },
  };
}
export default function BestDeals({ brand, product, deal }) {
  const sliderRef4 = useRef(null);
  const [type, setType] = useState("desktop");
  const [deals, setDeals] = useState([]);

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1400,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
          dots: false,
        },
      },
      {
        breakpoint: 1150,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          dots: false,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          dots: true,
        },
      },
      {
        breakpoint: 767,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          dots: false,
          padding: 26,
        },
      },
    ],
  };

  useEffect(() => {
    const normalise = (value) =>
      typeof value === "string" ? value.trim().toLowerCase() : "";

    const getCategoryKey = (item) =>
      normalise(
        item?.category?.slug || item?.category?.name || item?.category,
      );

    const setDeviceType = () => {
      if (typeof window !== "undefined") {
        setType(window.innerWidth < 768 ? "mobile" : "desktop");
      }
    };

    if (Array.isArray(product) && product.length) {
      const ecomScoped = product.filter((item) => {
        const key = getCategoryKey(item);
        if (!key) return false;
        return key.includes("e-com") || key.includes("ecom");
      });

      const source = ecomScoped.length ? ecomScoped : product;
      setDeals(source.filter((item) => Boolean(item?.deal_product)));
    } else {
      setDeals([]);
    }

    setDeviceType();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", setDeviceType);
      return () => window.removeEventListener("resize", setDeviceType);
    }

    return undefined;
  }, [product]);
  return (
    <>
      <div className="row" style={{ marginTop: "76px" }}>
        <div className="col">
          <div className="text-center">
            <p className="tw-text-[#182c5a] heading-first">
              BEST DEALS ON FEATURED PRODUCTS
            </p>
          </div>
          <div
            style={{
              height: "3px",
              width: "378px",
            }}
            className=" d-flex justify-content-right align-item-right"
          ></div>
          {type === "desktop" && deals?.length > 5 && (
            <>
              <div
                className="slider-arrow-prev"
                style={{}}
                onClick={() => sliderRef4.current?.slickPrev?.()}
              >
                <Image
                  src="https://res.cloudinary.com/dwxqg9so3/image/upload/v1690811676/Arrow_-_Right_3_ssrdw2.svg"
                  alt="Previous slide"
                  className="arrow-image"
                  width={32}
                  height={32}
                  loading="lazy"
                />
              </div>
              <div
                className="slider-arrow-next"
                onClick={() => sliderRef4.current?.slickNext?.()}
              >
                <Image
                  src="https://res.cloudinary.com/dwxqg9so3/image/upload/v1690811676/Arrow_-_Right_3_1_irtfa7.svg"
                  alt="Next slide"
                  className="arrow-image"
                  width={32}
                  height={32}
                  loading="lazy"
                />
              </div>
            </>
          )}

          <div
            className="mt-5 mb-2 ml-2 d-flex flex-row justify-content-end"
            style={{ columnGap: "35px" }}
          >
            {deals?.length <= 5 &&
              type === "desktop" &&
              deals?.map((item, index) => {
                return (
                  <div key={index}>
                    <DealsCard item={item} />
                  </div>
                );
              })}
          </div>

          {type === "desktop" && deals?.length > 5 && (
            <Slider
              {...settings}
              ref={sliderRef4}
              style={{ marginLeft: "20px" }}
            >
              {deals?.map((item, index) => {
                return (
                  <div style={{ marginLeft: "20px" }} key={index}>
                    <DealsCard item={item} />
                  </div>
                );
              })}
            </Slider>
          )}

          {type === "mobile" && deals?.length > 5 && (
            <>
              <div
                className="slider-arrow-prev-mobile"
                style={{}}
                onClick={() => sliderRef4.current?.slickPrev?.()}
              >
                <Image
                  src="https://res.cloudinary.com/dwxqg9so3/image/upload/v1690811676/Arrow_-_Right_3_ssrdw2.svg"
                  alt="Previous slide"
                  className="arrow-image"
                  width={32}
                  height={32}
                  loading="lazy"
                />
              </div>
              <div
                className="slider-arrow-next-mobile"
                onClick={() => sliderRef4.current?.slickNext?.()}
              >
                <Image
                  src="https://res.cloudinary.com/dwxqg9so3/image/upload/v1690811676/Arrow_-_Right_3_1_irtfa7.svg"
                  alt="Next slide"
                  className="arrow-image"
                  width={32}
                  height={32}
                  loading="lazy"
                />
              </div>
            </>
          )}

          <div>
            {type === "mobile" && (
              <Slider {...settings} ref={sliderRef4}>
                {deals?.map((item, index) => {
                  return (
                    <div key={index}>
                      <DealsCardMobile item={item} />
                    </div>
                  );
                })}
              </Slider>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
.heading-first {
  font-size: 40px;
  font-style: normal;
  font-weight: 700;
  line-height: 40px;
  font-family: "Montserrat", sans-serif;
}
@media (max-width: 900px) {
  .heading-first {
    max-width: 15ch;
  }
}
.slider-arrow-prev {
  position: absolute;
  margin-top: 170px !important;
  z-index: 2;
  margin-left: -60px;
  font-size: 10px;
  background-color: #f5f5f5;
  padding: 17px 22px;
  cursor: pointer;
  border-radius: 50%;
}
.slider-arrow-prev-mobile {
  position: absolute;
  margin-top: 120px !important;
  z-index: 2;
  margin-left: -10px;
  font-size: 10px;
  background-color: #f5f5f5;
  padding: 17px 22px;
  cursor: pointer;
  border-radius: 50%;
}
.slider-arrow-next {
  position: absolute;
  margin-top: 170px;
  z-index: 2;
  right: 30px;
  background-color: #f5f5f5;
  padding: 17px 22px;
  cursor: pointer;
  border-radius: 50%;
}
.slider-arrow-next-mobile {
  position: absolute;
  margin-top: 120px;
  z-index: 2;
  right: 30px;
  background-color: #f5f5f5;
  padding: 17px 22px;
  cursor: pointer;
  border-radius: 50%;
}
.arrow-image {
  width: 20px;
  height: 30px;
}
      `}</style>
    </>
  );
}
