"use client"; // This is a client component 👈🏽
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import Slider from "@mui/material/Slider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import Head from "next/head";
import { getService, postService } from "../../services/service";
import PolyBagBanner from "../../components/landing/PolyBagBanner";
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

const POLY_BAG_CATEGORY_ID = "6557df4f301ec4f2f426613d";

export async function getServerSideProps(context) {
  const query = context.query;
  const [brandRes, subcategoryRes] = await Promise.all([
    query?.brand ? getService("brand/all") : Promise.resolve(null),
    query?.subcategory ? getService("subcategory/all") : Promise.resolve(null),
  ]);

  let brandId = null;
  if (query?.brand) {
    const brands = brandRes?.data?.data ?? [];
    const brand = brands.find((item) => item.name === query?.brand);
    brandId = brand?._id ?? null;
  }

  let subCategoryId = null;
  if (query?.subcategory) {
    const subcategories = subcategoryRes?.data?.data ?? [];
    const subcategory = subcategories.find((item) => item.name === query?.subcategory);
    subCategoryId = subcategory?._id ?? null;
  }

  const filterPayload = {
    category: POLY_BAG_CATEGORY_ID,
    ...(brandId !== null && { brand: brandId }),
    ...(subCategoryId !== null && { subcategory: subCategoryId }),
    ...(query?.q && { q: query.q }),
    unit: "inches",
    skip: 0,
    limit: DEFAULT_INITIAL_LIMIT,
    includeMeta: true,
  };
  const prod = await postService("product/filter", filterPayload);

  return {
    props: {
      product: prod?.data?.data ?? [],
      meta: prod?.data?.meta ?? null,
      brandId,
      subCategoryId,
      q: query?.q ?? null,
    },
  };
}

const BoppTape = ({
  product,
  brandId,
  subCategoryId,
  q,
  meta,
}) => {
  const router = useRouter();
  const initialProducts = useMemo(() => (product ? product : []), [product]);
  const [width, setWidth] = useState([0, 600]);
  const [breadth, setBreadth] = useState([0, 600]);
  const [flap, setFlap] = useState([0, 300]);
  const [height, setHeight] = useState([100, 1000]);
  const [unit, setUnit] = useState("inches");
  const [flags, setFlags] = useState({
    size: false,
    category: false,
    sort: false,
  });

  const [seelctedCategories, setSelectedCategories] = useState([]);
  const [seelctedBrand, setSelectedBrand] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const label = { inputProps: { "aria-label": "Checkbox demo" } };

  const baseFilter = useMemo(
    () => ({
      category: POLY_BAG_CATEGORY_ID,
      ...(brandId !== null && { brand: brandId }),
      ...(subCategoryId !== null && { subcategory: subCategoryId }),
      ...(q ? { q } : {}),
      unit,
    }),
    [brandId, subCategoryId, q, unit],
  );

  const buildFilterPayload = useCallback(
    ({ categories = seelctedCategories, includeSize = flags.size } = {}) => {
      const payload: Record<string, any> = {
        ...baseFilter,
      };

      if (categories.length > 0) {
        payload.category = categories;
      }

      if (includeSize) {
        payload.length = {
          min: width?.[0],
          max: width?.[1],
        };
        payload.breadth = {
          min: breadth?.[0],
          max: breadth?.[1],
        };
        payload.flap = {
          min: flap?.[0],
          max: flap?.[1],
        };
      }

      return payload;
    },
    [baseFilter, breadth, flags.size, flap, seelctedCategories, width],
  );

  const fetcher = useCallback(
    (payload) => postService("product/filter", payload),
    [],
  );

  const initialFilter = useMemo(() => baseFilter, [baseFilter]);

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
    return `${value}°C`;
  }

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

  const handleFlap = (event, newValue) => {
    setFlap(newValue);
  };

  const handleUnit = (event) => {
    setUnit(event.target.value);
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

  const handlecat = async (id) => {
    try {
      await filterBrandProducts(id);
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };

  const filterBrandProducts = async (cat) => {
    setFlags((prev) => ({
      ...prev,
      brand: true,
    }));
    const nextBrands = toggleSelection(seelctedBrand, cat);
    setSelectedBrand(nextBrands);
    const payload = buildFilterPayload();
    if (nextBrands.length > 0) {
      payload.brand = nextBrands;
    }
    await applyFilter(payload);
  };



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

  const handleSort = (type) => {
    if (!type) {
      return;
    }
    setSortBy(type);
  };

  return (
    <>
      <Head>
        <title>Buy custom Poly Bags online | store.prempackaging </title>
        <meta name="title" content="Buy custom Poly Bags online" />
        <meta
          name="description"
          content="If you want to buy poly bags online, browse our website store.prempackaging.com. Our ecommerce printed poly bags ensure protection and reliability. Order your custom poly bags online."
        />
      </Head>
      <div>
        <div className="row p-0 m-0">
          <PolyBagBanner />
          <div
            className={"row " + "mainbody"}
            style={{ backgroundColor: "white" }}
          >
            <div className="mt-2 d-flex flex-column">
              <p className={"catalogpath"}>
                <span onClick={() => router.push("/")}>Homepage</span> /{" "}
                <span className={"tw-no-underline"}> Poly Bags</span>
              </p>
              <div
                className="row mt-2 m-0"
                style={{ height: "1px", backgroundColor: "#D9D9D9" }}
              ></div>
            </div>
            <CatalogFilterControls
              resultsText={
                <p className={"showresulttext"}>
                  Showing all{" "}
                  {typeof totalCount === "number"
                    ? totalCount
                    : products?.length}{" "}
                  results
                </p>
              }
              sortBy={sortBy}
              onSortChange={handleSort}
              showFilterButton
              externalFilterOpen={showMobileFilters}
              onExternalFilterToggle={() => setShowMobileFilters((current) => !current)}
            />
            <div className="row mt-4" style={{ position: "relative" }}>
              {/* Desktop Filter */}
              <div
                className={"d-flex flex-column col-3 " + "desktopFilter"}
              >
                <div className={"col-12 p-0 m-0" + "filterslayout"}>
                  <div
                    className="w-100"
                    style={{ height: "430px", border: "1px solid #E6E6E6" }}
                  >
                    <div
                      className="row m-0"
                      style={{ paddingLeft: 3, paddingRight: 3 }}
                    >
                      <div className="col">
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <p
                              className="mb-0 mt-3"
                              style={{ fontWeight: "bolder" }}
                            >
                              Filter by Size
                            </p>
                          </div>

                          <div
                            className="mb-0 mt-2"
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              gap: "10px",
                            }}
                          >
                            <label>
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
                            0
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
                            {unit === "inches" ? 20 : 600}
                          </p>
                        </div>
                        <Slider
                          sx={CustomSliderStyles}
                          getAriaLabel={() => "Temperature range"}
                          value={width}
                          onChange={handleWidth}
                          valueLabelDisplay="auto"
                          getAriaValueText={valuetext}
                          min={unit === "inches" ? 0 : 0} // Set min value based on the selected unit
                          max={unit === "inches" ? 20 : 600}
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
                            0
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
                            {unit === "inches" ? 20 : 600}
                          </p>
                        </div>
                        <Slider
                          sx={CustomSliderStyles}
                          getAriaLabel={() => "Temperature range"}
                          value={breadth}
                          onChange={handleBradth}
                          valueLabelDisplay="auto"
                          getAriaValueText={valuetext}
                          min={unit === "inches" ? 0 : 0}
                          max={unit === "inches" ? 20 : 600}
                        />
                        <p className="mb-0 mt-1">Flap (mm)</p>
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
                            0
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
                            300
                          </p>
                        </div>
                        <Slider
                          sx={CustomSliderStyles}
                          getAriaLabel={() => "Temperature range"}
                          value={flap}
                          onChange={handleFlap}
                          valueLabelDisplay="auto"
                          getAriaValueText={valuetext}
                          min={0}
                          max={300}
                        />
                        {/* <p className="mb-0 mt-1">Height</p>
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
                    /> */}
                        <button
                          className={"packagebtn"}
                          onClick={handleApply}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={"mt-2 col-12 p-0 m-0" + "filterslayout"}>
                  <div
                    className="w-100"
                    style={{ height: "200px", border: "1px solid #E6E6E6" }}
                  >
                    <div
                      className="row m-0"
                      style={{ paddingLeft: 3, paddingRight: 3 }}
                    >
                      <div className="col">
                        <p
                          className="mb-0 mt-3"
                          style={{ fontWeight: "bolder" }}
                        >
                          Filter by Brands
                        </p>

                        <div
                          className="mt-4 d-flex flex-column align-items-start gap-3"
                          // key={index}
                        >
                          <div className="d-flex ">
                            <Checkbox
                              {...label}
                              onChange={() =>
                                handlecat("69268af9d53f3a772c6bccc2")
                              }
                              // checked={checked[index] === true ? true : false}
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

                            <p
                              className="mb-0"
                              style={{
                                marginLeft: "9px",
                                textTransform: "capitalize",
                              }}
                            >
                              {/* {item?.name} */} Amazon
                            </p>
                          </div>

                          <div className="d-flex ">
                            <Checkbox
                              {...label}
                              onChange={() =>
                                handlecat("6926d6bad53f3a772c6e978c")
                              }
                              // checked={checked[index] === true ? true : false}
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

                            <p
                              className="mb-0"
                              style={{
                                marginLeft: "9px",
                                textTransform: "capitalize",
                              }}
                            >
                              Flipkart
                            </p>
                          </div>

                          <div className="d-flex ">
                            <Checkbox
                              {...label}
                              onChange={() =>
                                handlecat("66a206274e2b1ddf543d9df2")
                              }
                              // checked={checked[index] === true ? true : false}
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

                            <p
                              className="mb-0"
                              style={{
                                marginLeft: "9px",
                                textTransform: "capitalize",
                              }}
                            >
                              {/* {item?.name} */} Plain
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* this column is for windows view */}
              <div className={"col-9 " + "productslistdivwindow"}>
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
                    <p className={"noProducts"}>
                      Sorry , No products found
                    </p>
                  </div>
                )}
              </div>

              {/* Mobile Filter */}
              {showMobileFilters && (
                <div
                  className={"d-flex flex-column col-12 " + "mobileFilter"}
                >
                <div className={"col-12 p-0 m-0" + "filterslayout1"}>
                  <div
                    className="w-100"
                    style={{
                      minHeight: "430px",
                      border: "1px solid #E6E6E6",
                      width: "100%",
                    }}
                  >
                    <div
                      className="row m-0"
                      style={{ paddingLeft: 3, paddingRight: 3 }}
                    >
                      <div className="col">
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <p
                              className="mb-0 mt-3"
                              style={{ fontWeight: "bolder" }}
                            >
                              Filter by Size
                            </p>
                          </div>

                          <div
                            className="mb-0 mt-2"
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              gap: "10px",
                            }}
                          >
                            <label>
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
                            0
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
                            {unit === "inches" ? 20 : 600}
                          </p>
                        </div>
                        <Slider
                          sx={CustomSliderStyles}
                          getAriaLabel={() => "Temperature range"}
                          value={width}
                          onChange={handleWidth}
                          valueLabelDisplay="auto"
                          getAriaValueText={valuetext}
                          min={unit === "inches" ? 0 : 0} // Set min value based on the selected unit
                          max={unit === "inches" ? 20 : 600}
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
                            0
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
                            {unit === "inches" ? 20 : 600}
                          </p>
                        </div>
                        <Slider
                          sx={CustomSliderStyles}
                          getAriaLabel={() => "Temperature range"}
                          value={breadth}
                          onChange={handleBradth}
                          valueLabelDisplay="auto"
                          getAriaValueText={valuetext}
                          min={unit === "inches" ? 0 : 0}
                          max={unit === "inches" ? 20 : 600}
                        />
                        <p className="mb-0 mt-1">Flap (mm)</p>
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
                            0
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
                            300
                          </p>
                        </div>
                        <Slider
                          sx={CustomSliderStyles}
                          getAriaLabel={() => "Temperature range"}
                          value={flap}
                          onChange={handleFlap}
                          valueLabelDisplay="auto"
                          getAriaValueText={valuetext}
                          min={0}
                          max={300}
                        />
                        {/* <p className="mb-0 mt-1">Height</p>
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
                    /> */}
                        <button
                          className={"packagebtn"}
                          onClick={handleApply}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={"mt-2 col-12 p-0 m-0" + "filterslayout1"}>
                  <div
                    className="w-100"
                    style={{
                      minHeight: "230px",
                      border: "1px solid #E6E6E6",
                      width: "100%",
                    }}
                  >
                    <div
                      className="row m-0"
                      style={{ paddingLeft: 3, paddingRight: 3 }}
                    >
                      <div className="col">
                        <p
                          className="mb-0 mt-3"
                          style={{ fontWeight: "bolder" }}
                        >
                          Filter by Brands
                        </p>

                        <div
                          className="mt-4 d-flex flex-column align-items-start gap-3"
                          // key={index}
                        >
                          <div className="d-flex ">
                            <Checkbox
                              {...label}
                              onChange={() =>
                                handlecat("69268af9d53f3a772c6bccc2")
                              }
                              // checked={checked[index] === true ? true : false}
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

                            <p
                              className="mb-0"
                              style={{
                                marginLeft: "9px",
                                textTransform: "capitalize",
                              }}
                            >
                              {/* {item?.name} */} Amazon
                            </p>
                          </div>

                          <div className="d-flex ">
                            <Checkbox
                              {...label}
                              onChange={() =>
                                handlecat("6926d6bad53f3a772c6e978c")
                              }
                              // checked={checked[index] === true ? true : false}
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

                            <p
                              className="mb-0"
                              style={{
                                marginLeft: "9px",
                                textTransform: "capitalize",
                              }}
                            >
                              {/* {item?.name} */} Flipkart
                            </p>
                          </div>

                          <div className="d-flex ">
                            <Checkbox
                              {...label}
                              onChange={() =>
                                handlecat("6557dbcc301ec4f2f426610b")
                              }
                              // checked={checked[index] === true ? true : false}
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

                            <p
                              className="mb-0"
                              style={{
                                marginLeft: "9px",
                                textTransform: "capitalize",
                              }}
                            >
                              Myntra
                            </p>
                          </div>

                          <div className="d-flex ">
                            <Checkbox
                              {...label}
                              onChange={() =>
                                handlecat("6582c8580ab82549a084894f")
                              }
                              // checked={checked[index] === true ? true : false}
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

                            <p
                              className="mb-0"
                              style={{
                                marginLeft: "9px",
                                textTransform: "capitalize",
                              }}
                            >
                              {/* {item?.name} */} Ajio
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              )}

              {/* this column is for mobile view */}
              <div
                className={"col-12 p-0 w-100 " + "productslistdivmobile"}
              >
                {products && products.length > 0 ? (
                  products.map((item, index) => (
                    <div className={"mobileProductCard"} key={index}>
                      <ListingCard item={item} />
                    </div>
                  ))
                ) : isLoading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div
                      className={"mobileProductCard"}
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
                    <p className={"noProductsMobile"}>
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
      .mainbody {
        margin-top: 17px !important;
        margin-left: 0px !important;
        margin-bottom: 0px !important;
        margin-right: 0px !important;
        padding-left: 110px !important;
        padding-right: 110px !important;
      }
      @media (max-width: 900px) {
        .mainbody {
          margin-top: 10px !important;
          padding-left: 10px !important;
          padding-right: 10px !important;
        }
      }
      .catalogpath {
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
      .showresulttext {
        margin: 0px;
        color: #3a5ba2;
        font-size: 20.794px;
        font-style: normal;
        font-weight: 700;
        line-height: 36.389px;
      }
      @media (max-width: 900px) {
        .showresulttext {
          font-size: 16px;
        }
      }
      .packagebtn {
        border: 0;
        color: #fff;
        text-align: center;
        font-family: "Montserrat";
        font-size: 13px;
        font-style: normal;
        font-weight: 400;
        line-height: 20px;
        text-transform: uppercase;
        display: flex;
        width: 110px;
        height: 33px;
        padding: 14px 36px;
        align-items: center;
        justify-content: center;
        gap: 10px;
        flex-shrink: 0;
        background-color: #182c5a;
      }
      .desktopFilter {
        display: block;
      }
      @media (max-width: 900px) {
        .desktopFilter {
          display: none !important;
        }
      }
      .filterslayout {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
      }
      @media (max-width: 900px) {
        .filterslayout {
          display: none;
        }
      }
      .filterslayout1 {
        display: none !important;
      }
      @media (max-width: 900px) {
        .filterslayout1 {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
        }
      }
      .productslistdivwindow {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
      @media (min-width: 1600px) {
        .productslistdivwindow {
          grid-template-columns: repeat(4, 1fr);
        }
      }
      @media (max-width: 1300px) {
        .productslistdivwindow {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 900px) {
        .productslistdivwindow {
          display: none !important;
        }
      }
      .productslistdivmobile {
        display: none !important;
      }
      @media (max-width: 900px) {
        .productslistdivmobile {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 148px));
          justify-content: center;
          align-items: start;
          gap: 16px 12px;
          width: 100%;
          padding: 0;
          box-sizing: border-box;
          margin: 0 auto;
        }
      }
      .mobileProductCard {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: stretch;
        width: min(148px, 100%);
        min-width: 0;
        justify-self: center;
      }
      .mobileFilter {
        display: none !important;
      }
      @media (max-width: 900px) {
        .mobileFilter {
          display: block !important;
        }
      }
      @media (max-width: 900px) {
        .mobileFilter {
          display: flex !important;
          flex-direction: column;
          gap: 16px;
          width: 100%;
          margin-top: 12px;
        }
        .filterslayout1 {
          display: flex !important;
          flex-direction: column;
          align-items: stretch;
          width: 100%;
        }
      }
      .noProducts {
        font-size: 28px;
        font-family: Montserrat;
        font-weight: 700;
        color: #3A5BA2;
      }
      .noProductsMobile {
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


