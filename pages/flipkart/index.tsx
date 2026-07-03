"use client"; // This is a client component 👈🏽
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import Slider from "@mui/material/Slider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Head from "next/head";
import {
  faArrowLeft,
  faArrowRight,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import { getService, postService } from "../../services/service";
import Banner from "../../components/landing/Banner";
import { useRouter } from "next/router";
import ListingCard from "../../components/listing/ListingCard";
import ListingCardDesktop from "../../components/listing/ListingCardDesktop";
import CatalogFilterControls from "../../components/listing/CatalogFilterControls";
import DesktopListingCard from "../../components/listing/DesktopLisingCard";
import InfiniteScrollSentinel from "../../components/listing/InfiniteScrollSentinel";
import {
  DEFAULT_INITIAL_LIMIT,
  useInfiniteProducts,
} from "../../hooks/useInfiniteProducts";
import { findBrandIdByName, findBrandIdBySlug } from "../../utils/brands";

// Route slug for this brand landing page; the id is resolved from /brand/all.
const BRAND_SLUG = "flipkart";

export async function getServerSideProps(context) {
  const query = context.query;
  const [categoryRes, brandRes, subcategoryRes] = await Promise.all([
    getService("category/all"),
    getService("brand/all"),
    query?.subcategory ? getService("subcategory/all") : Promise.resolve(null),
  ]);

  const brands = brandRes?.data?.data ?? [];
  let brandId = findBrandIdBySlug(brands, BRAND_SLUG) ?? null;
  if (query?.brand) {
    brandId = findBrandIdByName(brands, query.brand) ?? brandId;
  }

  let subCategoryId = null;
  if (query?.subcategory) {
    const subcategories = subcategoryRes?.data?.data ?? [];
    const subcategory = subcategories.find((item) => item.name === query?.subcategory);
    subCategoryId = subcategory?._id ?? null;
  }

  const filterPayload = {
    ...(brandId && { brand: brandId }),
    ...(subCategoryId !== null && { subcategory: subCategoryId }),
    ...(query?.q && { q: query.q }),
    skip: 0,
    limit: DEFAULT_INITIAL_LIMIT,
    includeMeta: true,
  };
  const prod = await postService("product/filter", filterPayload);

  return {
    props: {
      categories: categoryRes?.data?.data ?? [],
      product: prod?.data?.data ?? [],
      meta: prod?.data?.meta ?? null,
      brandId,
      subCategoryId,
      q: query?.q ?? null,
    },
  };
}

const BoppTape = ({
  categories,
  product,
  brandId,
  subCategoryId,
  q,
  meta,
}) => {
  const router = useRouter();
  const initialProducts = useMemo(() => (product ? product : []), [product]);
  const [width, setWidth] = useState([100, 1000]);
  const [breadth, setBreadth] = useState([100, 1000]);
  const [height, setHeight] = useState([100, 1000]);
  const [checked, setChecked] = useState<any[]>([]);
  const [unit, setUnit] = useState("inches");
  const [flags, setFlags] = useState({
    size: false,
    category: false,
    sort: false,
  });

  const [seelctedCategories, setSelectedCategories] = useState<any[]>([]);
  const label = { inputProps: { "aria-label": "Checkbox demo" } };
  const CustomSliderStyles = {
    "& .MuiSlider-thumb": {
      color: "white",
    },
    "& .MuiSlider-track": {
      color: "#E92227",
    },
    "& .MuiSlider-rail": {
      color: "#E0E0E0",
    },
    "& .MuiSlider-active": {
      color: "#E92227",
    },
  };

  function valuetext(value) {
    return `${value}`;
  }

  const baseFilter = useMemo(
    () => ({
      ...(subCategoryId !== null && { subcategory: subCategoryId }),
      ...(q ? { q } : {}),
    }),
    [subCategoryId, q],
  );

  const buildFilterPayload = useCallback(
    ({ categories = seelctedCategories, includeSize = flags.size } = {}) => {
      const payload: Record<string, any> = {
        ...baseFilter,
        brand: brandId,
      };

      if (categories.length > 0) {
        payload.category = categories;
      }

      if (includeSize) {
        payload.width = {
          min: width?.[0],
          max: width?.[1],
        };
        payload.breadth = {
          min: breadth?.[0],
          max: breadth?.[1],
        };
        payload.height = {
          min: height?.[0],
          max: height?.[1],
        };
      }

      return payload;
    },
    [
      baseFilter,
      brandId,
      breadth,
      height,
      flags.size,
      seelctedCategories,
      width,
    ],
  );

  const fetcher = useCallback(
    (payload) => postService("/product/filter", payload),
    [],
  );

  const initialFilter = useMemo(
    () => ({
      brand: brandId,
      ...baseFilter,
    }),
    [brandId, baseFilter],
  );

  const {
    products,
    sortBy,
    setSortBy,
    totalCount,
    isFetchingMore,
    isLoading,
    applyFilter,
    loadMoreRef,
  } = useInfiniteProducts({
    initialProducts,
    initialMeta: meta,
    initialFilter,
    fetcher,
    initialLimit: DEFAULT_INITIAL_LIMIT,
  });

  const handleWidth = (event, newValue) => {
    setWidth(newValue);
    //console.log(setWidth);
  };

  const handleBradth = (event, newValue) => {
    setBreadth(newValue);
    //console.log(setBreadth);
  };

  const handleHeight = (event, newValue) => {
    setHeight(newValue);
    //console.log(setHeight);
  };

  const handleApply = async () => {
    setFlags((prev) => ({
      ...prev,
      size: true,
    }));
    const payload = buildFilterPayload({ includeSize: true });
    await applyFilter(payload);
  };

  const toggleSelection = (list, value) =>
    list.includes(value)
      ? list.filter((item) => item !== value)
      : [...list, value];

  const filterProducts = async (cat) => {
    setFlags((prev) => ({
      ...prev,
      category: true,
    }));
    const nextCategories = toggleSelection(seelctedCategories, cat);
    setSelectedCategories(nextCategories);
    const payload = buildFilterPayload({ categories: nextCategories });
    await applyFilter(payload);
  };

  useEffect(() => {
    if (categories) {
      const data = categories?.map((item) => {
        item.checked = false;
      });
      setChecked(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const handleQuery = async () => {
    const payload = buildFilterPayload();
    await applyFilter(payload);
  };

  useEffect(() => {
    if (q && initialProducts.length === 0) {
      handleQuery();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, initialProducts.length]);

  const handlecat = async (index, id) => {
    try {
      await filterProducts(id);
      const data = checked;
      data[index] = !data[index];
      setChecked(data);
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };

  const handleSort = (type) => {
    if (!type) {
      return;
    }
    setSortBy(type);
  };

  const renderCategoryFilter = () => (
    <div
      className="mt-0 w-100"
      style={{ height: "220px", border: "1px solid #E6E6E6" }}
    >
      <div className="row m-0" style={{ paddingLeft: 3, paddingRight: 3 }}>
        <div className="col">
          <p className="mb-0 mt-3" style={{ fontWeight: "bolder" }}>
            Filter by Catagory
          </p>
          {categories?.map((item, index) =>
            item?.name === "Paper Bag" ||
            item?.name === "Corrugated Box" ||
            item?.name === "Poly Bag " ? (
              <div
                className="mt-4 d-flex flex-row align-items-center justify-content-start"
                key={index}
              >
                <Checkbox
                  {...label}
                  onChange={() => handlecat(index, item?._id)}
                  checked={checked[index] === true ? true : false}
                  sx={{
                    padding: "0px",
                    color: "gray",
                    "&.Mui-checked": {
                      color: "gray",
                    },
                    "&.Mui-unchecked": {
                      color: "gray",
                    },
                  }}
                  inputProps={{ "aria-label": "controlled" }}
                />

                <p className="mb-0" style={{ marginLeft: "9px" }}>
                  {item?.name}
                </p>
              </div>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );

  const renderFilterContent = () => renderCategoryFilter();

  return (
    <>
      <Head>
        <title>
          Shop Flipkart Corrugated Boxes Online, Paper Bags, Polybags Online |
          store.prempackaging
        </title>
        <meta
          name="title"
          content="Shop Flipkart Corrugated Boxes Online, Paper Bags, Polybags Online"
        />
        <meta
          name="description"
          content="Buy Flipkart corrugated boxes online, Flipkart paper bags, and polybags online at store.prempackaging.com. Get durable packaging solutions delivered fast."
        />
      </Head>
      <div>
        <div className="row p-0 m-0">
          <Banner />
          <div
            className="row page-mainbody"
            style={{ backgroundColor: "white" }}
          >
            <div className="mt-2 d-flex flex-column">
              <p className="page-catalogpath">
                <span onClick={() => router.push("/")}>Homepage</span> /{" "}
                <span className="tw-no-underline">Flipkart</span>
              </p>
              <div
                className="row mt-2 m-0"
                style={{ height: "1px", backgroundColor: "#D9D9D9" }}
              ></div>
            </div>
            <CatalogFilterControls
              resultsText={
                <p className="page-showresulttext">
                  Showing all{" "}
                  {typeof totalCount === "number"
                    ? totalCount
                    : products?.length}{" "}
                  results
                </p>
              }
              sortBy={sortBy}
              onSortChange={handleSort}
              renderFilterContent={renderFilterContent}
            />
            <div className="row mt-4" style={{ position: "relative" }}>
              <div className="col-3 page-filterslayout">
                {/* <div
                className="w-100"
                style={{ height: "420px", border: "1px solid #E6E6E6" }}
              >
                <div
                  className="row m-0"
                  style={{ paddingLeft: 3, paddingRight: 3 }}
                >
                  <div className="col">
                    <div style={{display:"flex" , flexDirection:"row" , justifyContent:"space-between" , alignItems:"center"  }}>
                      <div>
                        <p
                          className="mb-0 mt-3"
                          style={{ fontWeight: "bolder" }}
                        >
                          Filter by Size
                        </p>
                      </div>

                      <div className="mb-0 mt-2" style={{display:"flex" , flexDirection:"row" , gap:"10px"}}>
                        <label >
                          <input
                            type="radio"
                            name="unit"
                            value="inches"
                            checked={unit === "inches"}
                            onChange={() => setUnit("inches")}
                          />
                          inch
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="unit"
                            value="mm"
                            checked={unit === "mm"}
                            onChange={() => setUnit("mm")}
                          />
                          mm
                        </label>
                      </div>
                    </div>

                    <p className="mb-0 mt-2">Length</p>
                    <div className="mt-2 d-flex flex-row align-items-center justify-content-between">
                      <p
                        className="mb-0 px-2 bg-light"
                        style={{
                          fontSize: "15px",
                          borderRadius: "10px",
                          fontWeight: 600,
                          color: "#010101",
                          lineHeight: "24px",
                        }}
                      >
                        100
                      </p>
                      <p
                        className="mb-0 px-2 bg-light"
                        style={{
                          fontSize: "15px",
                          borderRadius: "10px",
                          fontWeight: 600,
                          color: "#010101",
                          lineHeight: "24px",
                        }}
                      >
                        1000
                      </p>
                    </div>
                    <Slider
                      sx={CustomSliderStyles}
                      getAriaLabel={() => "Temperature range"}
                      value={width}
                      onChange={handleWidth}
                      valueLabelDisplay="auto"
                      getAriaValueText={valuetext}
                      min={100}
                      max={1000}
                    />
                    <p className="mb-0 mt-1">Breadth</p>
                    <div className="mt-2 d-flex flex-row align-items-center justify-content-between">
                      <p
                        className="mb-0 px-2 bg-light"
                        style={{
                          fontSize: "15px",
                          borderRadius: "10px",
                          fontWeight: 600,
                          color: "#010101",
                          lineHeight: "24px",
                        }}
                      >
                        100
                      </p>
                      <p
                        className="mb-0 px-2 bg-light"
                        style={{
                          fontSize: "15px",
                          borderRadius: "10px",
                          fontWeight: 600,
                          color: "#010101",
                          lineHeight: "24px",
                        }}
                      >
                        1000
                      </p>
                    </div>
                    <Slider
                      sx={CustomSliderStyles}
                      getAriaLabel={() => "Temperature range"}
                      value={breadth}
                      onChange={handleBradth}
                      valueLabelDisplay="auto"
                      getAriaValueText={valuetext}
                      min={100}
                      max={1000}
                    />
                    <p className="mb-0 mt-1">Height</p>
                    <div className="mt-2 d-flex flex-row align-items-center justify-content-between">
                      <p
                        className="mb-0 px-2 bg-light"
                        style={{
                          fontSize: "15px",
                          borderRadius: "10px",
                          fontWeight: 600,
                          color: "#010101",
                          lineHeight: "24px",
                        }}
                      >
                        100
                      </p>
                      <p
                        className="mb-0 px-2 bg-light"
                        style={{
                          fontSize: "15px",
                          borderRadius: "10px",
                          fontWeight: 600,
                          color: "#010101",
                          lineHeight: "24px",
                        }}
                      >
                        1000
                      </p>
                    </div>
                    <Slider
                      sx={CustomSliderStyles}
                      getAriaLabel={() => "Temperature range"}
                      value={height}
                      onChange={handleHeight}
                      valueLabelDisplay="auto"
                      getAriaValueText={valuetext}
                      min={100}
                      max={1000}
                    />
                    <button className={styles.packagebtn} onClick={handleApply}>
                      Apply
                    </button>
                  </div>
                </div>
              </div> */}
                {renderCategoryFilter()}
              </div>
              {/* this column is for windows view */}
              <div className="col-9 p-2 page-productslistdivwindow">
                {products && products.length > 0 ? (
                  products.map((item, index) => (
                    <div
                      className="row w-40"
                      style={{ height: "400px" }}
                      key={index}
                    >
                      <DesktopListingCard item={item} />
                    </div>
                  ))
                ) : isLoading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div
                      className="row w-40"
                      style={{ height: "400px" }}
                      key={`skeleton-${index}`}
                    >
                      <DesktopListingCard />
                    </div>
                  ))
                ) : (
                  <div
                    style={{ position: "absolute", top: "10%", left: "50%" }}
                  >
                    <p className="page-noProducts">
                      Sorry , No products found
                    </p>
                  </div>
                )}
              </div>

              {/* this column is for mobile view */}

              <div
                className="col-9 p-0 w-100 page-productslistdivmobile"
              >
                {products && products.length > 0 ? (
                  products.map((item, index) => (
                    <div
                      className="mt-4 d-flex flex-column justify-content-start align-items-center"
                      style={{ width: "180px", height: "212px" }}
                      key={index}
                    >
                      <ListingCard item={item} />
                    </div>
                  ))
                ) : isLoading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div
                      className="mt-4 d-flex flex-column justify-content-start align-items-center"
                      style={{ width: "180px", height: "212px" }}
                      key={`skeleton-mobile-${index}`}
                    >
                      <ListingCard />
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <p className="page-noProductsMobile">
                      Sorry , no products found
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="row" style={{ marginTop: "36px" }}>
              <div
                className="row mt-2 m-0"
                style={{ height: "1px", backgroundColor: "#D9D9D9" }}
              ></div>
            </div>
            <InfiniteScrollSentinel
              loadMoreRef={loadMoreRef}
              isFetchingMore={isFetchingMore}
            />
          </div>
        </div>
      </div>
      <style jsx>{`
        .page-mainbody {
          margin-top: 17px !important;
          margin-left: 0px !important;
          margin-bottom: 0px !important;
          margin-right: 0px !important;
          padding-left: 110px !important;
          padding-right: 110px !important;
        }
        @media (max-width: 900px) {
          .page-mainbody {
            padding-left: 10px !important;
            padding-right: 10px !important;
          }
        }
        .page-catalogpath {
          color: #222;
          font-family: "Montserrat", sans-serif;
          font-size: 15px;
          font-style: normal;
          font-weight: 500;
          line-height: 21px;
          text-decoration-line: underline;
          padding: 0px;
          margin: 0px;
          cursor: pointer;
        }
        .page-showresulttext {
          margin: 0px;
          color: #3a5ba2;
          font-size: 20.794px;
          font-style: normal;
          font-weight: 700;
          line-height: 36.389px;
        }
        @media (max-width: 900px) {
          .page-showresulttext {
            font-size: 16px;
          }
        }
        .page-filterslayout {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
        }
        @media (max-width: 900px) {
          .page-filterslayout {
            display: none;
          }
        }
        .page-productslistdivwindow {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        @media (min-width: 1600px) {
          .page-productslistdivwindow {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @media (max-width: 1300px) {
          .page-productslistdivwindow {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 900px) {
          .page-productslistdivwindow {
            display: none !important;
          }
        }
        .page-productslistdivmobile {
          display: none !important;
        }
        @media (max-width: 900px) {
          .page-productslistdivmobile {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr);
            justify-content: center;
            align-items: center;
            gap: 10px;
            margin-left: 20px;
          }
        }
        .page-noProducts {
          font-size: 28px;
          font-family: Montserrat;
          font-weight: 700;
          color: #3A5BA2;
        }
        .page-noProductsMobile {
          font-size: 28px;
          font-family: Montserrat;
          font-weight: 700;
          color: #3A5BA2;
        }
      `}</style>
    </>
  );
};

export default BoppTape;

