import { getService } from "../services/service";
import { useEffect, useRef, useState } from "react";
import LandingBrandCard from "../components/landing/landingBrandCard";
import DealsCard from "../components/landing/DealsCard";
import TopCard from "../components/landing/TopCard";
import TopCardMobile from "../components/landing/TopCardMobile";
import DealsCardMobile from "../components/landing/DealsCardMobile";
import dynamic from "next/dynamic";
import Feedback from "../components/landing/feedback";
import { useRouter } from "next/router";
import Banner from "../components/landing/Banner";
import Brand from "../components/landing/Brand";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import Script from "next/script";
import CustomPackaging from "./CustomPackaging";


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

export default function Home({ brand, product, deal }) {
  const router = useRouter();
  const [amazon, setAmazon] = useState([]);
  const [flipkart, setFlipkart] = useState([]);
  const [myntra, setMyntra] = useState([]);
  const [ajio, setAjio] = useState([]);
  const [deals, setDeals] = useState([]);
  const [top, setTop] = useState([]);
  const [type, setType] = useState("desktop");
  const sliderRef1 = useRef(null);
  const sliderRef4 = useRef(null);

  var settings = {
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
    // Normalise strings so filters work regardless of casing/slug format.
    const normalise = (value) =>
      typeof value === "string" ? value.trim().toLowerCase() : "";

    const getCategoryKey = (item) =>
      normalise(
        item?.category?.slug || item?.category?.name || item?.category,
      );

    const getBrandKey = (item) =>
      normalise(item?.brand?.slug || item?.brand?.name || item?.brand);

    const setDeviceType = () => {
      if (typeof window !== "undefined") {
        setType(window.innerWidth < 768 ? "mobile" : "desktop");
      }
    };

    if (Array.isArray(product) && product.length) {
      // Prefer e-com category when present; otherwise fall back to all products so users still see items.
      const ecomScoped = product.filter((item) => {
        const key = getCategoryKey(item);
        if (!key) return false;
        return key.includes("e-com") || key.includes("ecom");
      });

      const ecomProducts = ecomScoped.length ? ecomScoped : product;

      const byBrand = (name) =>
        ecomProducts.filter((item) => getBrandKey(item) === name);

      setAmazon(byBrand("amazon"));
      setFlipkart(byBrand("flipkart"));
      setMyntra(byBrand("myntra"));
      setAjio(byBrand("ajio"));
      let dealsList = product.filter((item) => Boolean(item?.deal_product));
      if (dealsList.length < 5 && product.length > dealsList.length) {
        const remaining = product.filter(
          (p) => !dealsList.some((d) => d.slug === p.slug)
        );
        const shuffled = [...remaining].sort(() => 0.5 - Math.random());
        dealsList = [...dealsList, ...shuffled.slice(0, 5 - dealsList.length)];
      }
      setDeals(dealsList);

      let topList = product.filter((item) => Boolean(item?.top_product));
      if (topList.length < 5 && product.length > topList.length) {
        const remaining = product.filter(
          (p) => !topList.some((t) => t.slug === p.slug)
        );
        const shuffled = [...remaining].sort(() => 0.5 - Math.random());
        topList = [...topList, ...shuffled.slice(0, 5 - topList.length)];
      }
      setTop(topList);
    } else {
      setAmazon([]);
      setFlipkart([]);
      setMyntra([]);
      setAjio([]);
      setDeals([]);
      setTop([]);
    }

    setDeviceType();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", setDeviceType);
      return () => window.removeEventListener("resize", setDeviceType);
    }

    return undefined;
  }, [product]);

  const handleClickAmazon = () => {
    router.push("/amazon");
  };

  const handleClickFlipkart = () => {
    router.push("/flipkart");
  };

  const handleClickAjio = () => {
    router.push("/ajio");
  };

  const handleClickCustom = () => {
    router.push("/custom-packaging");
  };

  return (
    <>
      <Head>
        <title>Buy Packaging Product Online India | store.prempackaging</title>
        <meta name="title" content="Buy Packaging Product Online India" />
        <meta
          name="description"
          content="Buy packaging product online in India from our custom packaging store online. Visit our online ecommerce packaging store and Shop packaging product online."
        />

        <meta
          name="google-site-verification"
          content="google6b57cc2c5c60b7ce"
        />

        <style>{`
          iframe {
            width: 100%;
            height: 100%;
          }

          @media (min-width: 900px) {
            iframe {
              width: 700px;
              height: 450px;
            }
          }

          @media (min-width: 1200px) {
            iframe {
              width: 900px;
              height: 506px;
            }
          }

          .video-container {
            position: relative;
            padding-bottom: 50%;
            height: 0;
            overflow: hidden;
            max-width: 80%;
            background: white;
          }

          .video-container iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 80%;
            height: 80%;
            display: flex;
            justify-content: center;
            align-self: center;
          }
        `}</style>
      </Head>
      <Script
        id="home-structured-data"
        strategy="afterInteractive"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                url: "https://www.store.prempackaging.com/",
                name: "Prem Packaging Store",
                description:
                  "Prem Packaging Store — Shop premium packaging products including boxes, tapes, bags, and labels online.",
                potentialAction: {
                  "@type": "SearchAction",
                  target:
                    "https://www.store.prempackaging.com/search?q={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Prem Packaging Store",
                url: "https://www.store.prempackaging.com/",
                logo: "https://www.store.prempackaging.com/Logohead.png",
                contactPoint: {
                  "@type": "ContactPoint",
                  telephone: "+91-84472-47227",
                  contactType: "Customer Service",
                },
                sameAs: [
                  "https://www.facebook.com/PremIndustriesIndiaLimited/",
                  "https://www.instagram.com/prem_packaging/",
                  "https://www.linkedin.com/company/prem-packaging",
                ],
              },
            ]),
        }}
      />
      <Script
        id="google-analytics-src"
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-B5QF0YVXG5"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-B5QF0YVXG5');
        `}
      </Script>
      <div
        className="row m-0"
        style={{
          height: "fit-content",
          backgroundColor: "white",
        }}
      >
        {/* Main body */}
        <div className="row p-0 m-0">
          <Banner />
          <div className="page-mainbody">            {/* E-COMMERCE BRANDS */}
            <div className="row p-0">
              <div className="col my-4 p-0 text-center">
                <h1
                  className="landing-title-main tw-text-[#3a5ba2]"
                  style={{
                    color: "#182C5A",
                    textTransform: "uppercase",
                  }}
                >
                  we are authorised vendor for
                </h1>
                <div
                  style={{
                    marginTop: "16px",
                    height: "3px",
                    width: "234px",
                  }}
                ></div>
                <div>
                  <div>
                    <div className="container-fluid">
                      <div className="row mt-5 d-flex justify-content-center align-items-center g-3 px-3">
                        <div className="col-12 col-md-4 d-flex justify-content-center pt-3">
                          <Link href="/amazon" onClick={handleClickAmazon}>
                            <Image
                              src="/amazon.jpg"
                              alt="Amazon packaging products"
                              width={160}
                              height={88}
                              style={{ objectFit: "contain" }}
                            ></Image>
                          </Link>
                        </div>
                        <div className="col-12 col-md-4 d-flex justify-content-center pt-3">
                          <Link href="/flipkart" onClick={handleClickFlipkart}>
                            <Image
                              src="/flipkart.jpg"
                              alt="Flipkart packaging products"
                              width={160}
                              height={88}
                              style={{ objectFit: "contain" }}
                            ></Image>
                          </Link>
                        </div>
                        <div className="col-12 col-md-4 d-flex justify-content-center pt-3">
                          <Link href="/ajio" onClick={handleClickAjio}>
                            <Image
                              src="/Ajio.png"
                              alt="Ajio packaging products"
                              width={160}
                              height={88}
                              style={{ objectFit: "contain" }}
                            ></Image>
                          </Link>
                        </div>
                        <div className="col-12 d-flex justify-content-center align-items-center mt-5">
                          <Link
                            href="/custom-packaging"
                            onClick={handleClickCustom}
                            style={{
                              textDecoration: "none",
                              textAlign: "center",
                            }}
                          >
                            <button className="package-btn-action">
                              Custom Packaging
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* shop from top products */}
            <div className="container">
              <div className="row" style={{ marginTop: "50px" }}>
                <div className="col">
                  <div className="">
                    <div className="text-center">
                      <h2 className="tw-text-[#182c5a] heading-first">
                        SHOP FROM TOP PRODUCTS
                      </h2>
                    </div>
                  </div>
                  <div
                    className="d-flex align-items-right justify-content-right"
                    style={{
                      height: "3px",
                      width: "378px",
                    }}
                  ></div>
                  {type === "desktop" && top?.length > 5 && (
                    <>
                      <br />
                      <div
                        className="slider-arrow-prev"
                        style={{}}
                        onClick={() => sliderRef1.current?.slickPrev?.()}
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
                        onClick={() => sliderRef1.current?.slickNext?.()}
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
                    className="mt-5 mb-2 ml-2 d-flex flex-row justify-content-start"
                    style={{ columnGap: "35px" }}
                  >
                    {top?.length <= 5 &&
                      type === "desktop" &&
                      top?.map((item, index) => {
                        return (
                          <div key={index}>
                            <TopCard item={item} />
                          </div>
                        );
                      })}
                  </div>

                  {type === "desktop" && top?.length > 5 && (
                    <Slider
                      {...settings}
                      ref={sliderRef1}
                      style={{ marginLeft: "20px" }}
                    >
                      {top?.map((item, index) => {
                        return (
                          <div style={{ marginLeft: "20px" }} key={index}>
                            <TopCard item={item} />
                          </div>
                        );
                      })}
                    </Slider>
                  )}

                  {type === "mobile" && top?.length > 5 && (
                    <>
                      <div
                        className="slider-arrow-prev-mobile"
                        style={{ marginLeft: "1px" }}
                        onClick={() => sliderRef1.current?.slickPrev?.()}
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
                        onClick={() => sliderRef1.current?.slickNext?.()}
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
                      <Slider {...settings} ref={sliderRef1}>
                        {top?.map((item, index) => {
                          return (
                            <div key={index}>
                              <TopCardMobile item={item} />
                            </div>
                          );
                        })}
                      </Slider>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* BEST DEALS ON FEATURED PRODUCTS */}
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
                      <img
                        src="https://res.cloudinary.com/dwxqg9so3/image/upload/v1690811676/Arrow_-_Right_3_ssrdw2.svg"
                        alt="Previous slide"
                        className="arrow-image"
                      ></img>
                    </div>
                    <div
                      className="slider-arrow-next"
                      onClick={() => sliderRef4.current?.slickNext?.()}
                    >
                      <img
                        src="https://res.cloudinary.com/dwxqg9so3/image/upload/v1690811676/Arrow_-_Right_3_1_irtfa7.svg"
                        alt="Next slide"
                        className="arrow-image"
                      ></img>
                    </div>
                  </>
                )}

                <div
                  className="mt-5 mb-2 ml-2 d-flex flex-row justify-content-center"
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
                      <img
                        src="https://res.cloudinary.com/dwxqg9so3/image/upload/v1690811676/Arrow_-_Right_3_ssrdw2.svg"
                        alt="Previous slide"
                        className="arrow-image"
                      ></img>
                    </div>
                    <div
                      className="slider-arrow-next-mobile"
                      onClick={() => sliderRef4.current?.slickNext?.()}
                    >
                      <img
                        src="https://res.cloudinary.com/dwxqg9so3/image/upload/v1690811676/Arrow_-_Right_3_1_irtfa7.svg"
                        alt="Next slide"
                        className="arrow-image"
                      ></img>
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
            {/* E-COMMERCE PACKAGING */}
            <div className="container">
              <CustomPackaging />
            </div>
            {/* E-com video */}
            <section className=" mb-3">
              <div className="container mt-5">
                <div className="row">
                  <div className="col-md-12">
                    <h1
                      className="text-center"
                      style={{
                        fontSize: "40px",
                        color: "#182c5a",
                        fontWeight: "700",
                      }}
                    >
                      E-COMMERCE VIDEO
                    </h1>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-1"></div>
                  <div className="col-md-10 text-center mt-5">
                    <iframe src="https://www.youtube.com/embed/7hIsUYzLc7U"></iframe>
                  </div>
                </div>
              </div>
            </section>
            {/* TESTIMONIALS */}
            <div className="row" style={{ marginTop: "72px" }}>
              <div className="col">
                <p className="tw-text-[#182c5a] tw-text-center heading-second">TESTIMONIALS</p>
                <div
                  style={{
                    width: "234px",
                  }}
                ></div>
              </div>
            </div>
            <Feedback />
          </div>
        </div>
      </div>
      <style jsx>{`
.page-mainbody {
  margin-top: 35px !important;
  margin-left: 0px !important;
  margin-bottom: 0px !important;
  margin-right: 0px !important;
  padding-left: 110px !important;
  padding-right: 110px !important;
}
@media (max-width: 900px) {
  .page-mainbody {
    padding-left: 30px !important;
    padding-right: 30px !important;
  }
}
.package-btn-action {
  border: 0;
  color: #fff;
  text-align: center;
  font-family: Montserrat;
  font-size: 18px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px;
  text-transform: uppercase;
  display: flex;
  width: 230px;
  height: 48px;
  padding-top: 25px;
  padding-bottom: 25px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-shrink: 0;
  background-color: #182c5a;
  transition: background-color 0.2s ease-out;
}
.package-btn-action:hover {
  background-color: #e92227;
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
.heading-first {
  font-size: 40px;
  font-style: normal;
  font-weight: 700;
  line-height: 1.2;
  font-family: "Montserrat", sans-serif;
  color: #182c5a;
}
.heading-second {
  font-size: 40px;
  font-style: normal;
  font-weight: 700;
  line-height: 1.2;
  font-family: "Montserrat", sans-serif;
  color: #182c5a;
}
.landing-title-main {
  font-size: 40px;
  font-weight: 700;
  color: #182c5a;
  text-transform: uppercase;
  line-height: 1.2;
}
@media (max-width: 767px) {
  .heading-first, .heading-second, .landing-title-main {
    font-size: 22px !important;
    line-height: 1.3 !important;
    max-width: 100% !important;
    text-align: center !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }
}
      `}</style>
    </>
  );
}
