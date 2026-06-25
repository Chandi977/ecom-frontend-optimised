"use client"; // This is a client component 👈🏽
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import Slider from "@mui/material/Slider";
import Head from "next/head";
import { getService, postService } from "../../services/service";
import CorrugatedBanner from "../../components/landing/CorrugatedBanner";
import { useRouter } from "next/router";
import ListingCard from "../../components/listing/ListingCard";
import DesktopListingCard from "../../components/listing/DesktopLisingCard";
import InfiniteScrollSentinel from "../../components/listing/InfiniteScrollSentinel";
import CatalogFilterControls from "../../components/listing/CatalogFilterControls";
import {
  DEFAULT_INITIAL_LIMIT,
  useInfiniteProducts,
} from "../../hooks/useInfiniteProducts";


const BRAND_OPTIONS = [
  { id: "69268af9d53f3a772c6bccc2", label: "Amazon" },
  { id: "6926d6bad53f3a772c6e978c", label: "Flipkart" },
  { id: "6557dbcc301ec4f2f426610b", label: "Myntra" },
  { id: "6582c8580ab82549a084894f", label: "Ajio" },
];

export async function getServerSideProps(context) {
  const query = context.query;

  const [categoryRes, brandRes, subcategoryRes] = await Promise.all([
    getService("category/all"),
    query?.brand ? getService("brand/all") : Promise.resolve(null),
    query?.subcategory ? getService("subcategory/all") : Promise.resolve(null),
  ]);

  const categories = categoryRes?.data?.data ?? [];
  const corrugatedCategory =
    categories.find((item) =>
      item?.slug?.toLowerCase()?.includes("corrugated"),
    ) ||
    categories.find((item) =>
      item?.name?.toLowerCase()?.includes("corrugated"),
    );
  const corrugatedCategoryId = corrugatedCategory?._id ?? null;

  let brandId = null;
  if (query?.brand) {
    const brands = brandRes?.data?.data ?? [];
    const brand = brands.find((item) => item.name === query?.brand);
    brandId = brand?._id ?? null;
  }

  let subCategoryId = null;
  if (query?.subcategory) {
    const subcategories = subcategoryRes?.data?.data ?? [];
    const subcategory = subcategories.find(
      (item) => item.name === query?.subcategory,
    );
    subCategoryId = subcategory?._id ?? null;
  }

  const filterPayload = {
    ...(corrugatedCategoryId ? { category: [corrugatedCategoryId] } : {}),
    ...(brandId !== null && { brand: brandId }),
    ...(subCategoryId !== null && { subcategory: subCategoryId }),
    ...(query?.q && { q: query.q }),
    skip: 0,
    limit: DEFAULT_INITIAL_LIMIT,
    includeMeta: true,
  };
  const prod = await postService("product/filter", filterPayload);

  return {
    props: {
      brands: brandRes?.data?.data ?? [],
      categories: categories,
      product: prod?.data?.data ?? [],
      meta: prod?.data?.meta ?? null,
      brandId,
      subCategoryId,
      q: query?.q ?? null,
      corrugatedCategoryId,
    },
  };
}

const renderFilterCard = ({ title, children, minHeight }) => (
  <div
    className="w-100"
    style={{
      minHeight,
      border: "1px solid #E6E6E6",
      backgroundColor: "white",
    }}
  >
    <div className="row m-0" style={{ paddingLeft: 3, paddingRight: 3 }}>
      <div className="col">
        <p className="mb-0 mt-3" style={{ fontWeight: "bolder" }}>
          {title}
        </p>
        {children}
      </div>
    </div>
  </div>
);

const BoppTape = ({
  brands,
  product,
  brandId,
  subCategoryId,
  q,
  meta,
  corrugatedCategoryId,
}) => {
  const router = useRouter();
  const initialProducts = useMemo(() => (product ? product : []), [product]);
  const categoryId = corrugatedCategoryId;
  const [length, setLength] = useState([0, 300]);
  const [breadth, setBreadth] = useState([0, 300]);
  const [height, setHeight] = useState([0, 300]);
  const [unit, setUnit] = useState("inches");
  const [flags, setFlags] = useState({
    size: false,
    category: false,
    sort: false,
  });

  const [seelctedCategories, setSelectedCategories] = useState([]);
  const [seelctedBrand, setSelectedBrand] = useState([]);
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
      ...(brandId !== null && { brand: brandId }),
      ...(subCategoryId !== null && { subcategory: subCategoryId }),
      ...(q ? { q } : {}),
    }),
    [brandId, subCategoryId, q],
  );

  const buildFilterPayload = useCallback(
    ({
      categories = seelctedCategories,
      brands = seelctedBrand,
      includeSize = flags.size,
    } = {}) => {
      const categoryFilter =
        categories.length > 0
          ? categories
          : categoryId
            ? [categoryId]
            : [];
      const payload: Record<string, any> = {
        ...baseFilter,
        category: categoryFilter,
      };

      if (includeSize) {
        payload.length = {
          min: length?.[0],
          max: length?.[1],
        };
        payload.breadth = {
          min: breadth?.[0],
          max: breadth?.[1],
        };
        payload.height = {
          min: height?.[0],
          max: height?.[1],
        };
        payload.unit = unit;
      }

      if (brands.length > 0 && brandId === null) {
        payload.brand = brands;
      }

      return payload;
    },
    [
      baseFilter,
      seelctedCategories,
      seelctedBrand,
      flags.size,
      length,
      breadth,
      height,
      unit,
      brandId,
      categoryId,
    ],
  );

  const fetcher = useCallback(
    ({ endpoint, ...payload }) =>
      postService(endpoint || "/product/filter", payload),
    [],
  );

  const initialFilter = useMemo(
    () => ({
      endpoint: "/product/filter",
      ...(categoryId ? { category: [categoryId] } : {}),
      ...baseFilter,
    }),
    [baseFilter, categoryId],
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

  const handleLength = (event, newValue) => {
    setLength(newValue);
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

  const handleUnit = (event) => {
    setUnit(event.target.value);
  };

  const handleApply = async () => {
    setFlags((prev) => ({
      ...prev,
      size: true,
    }));
    const payload = {
      ...buildFilterPayload({ includeSize: true }),
      endpoint: "/product/filter",
    };
    await applyFilter(payload);
  };

  const toggleSelection = (list, value) =>
    list.includes(value)
      ? list.filter((item) => item !== value)
      : [...list, value];

  const filterBrandProducts = async (cat) => {
    setFlags((prev) => ({
      ...prev,
      brand: true,
    }));
    const nextBrands = toggleSelection(seelctedBrand, cat);
    setSelectedBrand(nextBrands);
    const payload = {
      ...buildFilterPayload({ brands: nextBrands }),
      endpoint: "/product/filter",
    };
    await applyFilter(payload);
  };

  const handleQuery = async () => {
    const payload = {
      ...buildFilterPayload(),
      endpoint: "/product/filter",
    };
    await applyFilter(payload);
  };

  useEffect(() => {
    if (q && initialProducts.length === 0) {
      handleQuery();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, initialProducts.length]);

  const handlecat = async (id) => {
    try {
      await filterBrandProducts(id);
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

  const renderSizeFilter = ({ closeMobilePanel }: { closeMobilePanel?: any } = {}) =>
    renderFilterCard({
      title: "Filter by Size",
      minHeight: "420px",
      children: (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "end",
            }}
          >
            <div />

            <div
              className="mb-0 mt-2"
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "10px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  justifyContent: "end",
                  gap: "3px",
                }}
              >
                <input
                  type="radio"
                  name="unit"
                  value="inches"
                  checked={unit === "inches"}
                  onChange={handleUnit}
                  style={{ marginTop: "5px" }}
                />
                inch
              </label>
              <label
                style={{
                  display: "flex",
                  justifyContent: "end",
                  gap: "3px",
                }}
              >
                <input
                  type="radio"
                  name="unit"
                  value="mm"
                  checked={unit === "mm"}
                  onChange={handleUnit}
                  style={{ marginTop: "5px" }}
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
              {unit === "inches" ? 20 : 300}
            </p>
          </div>
          <Slider
            sx={CustomSliderStyles}
            getAriaLabel={() => "Temperature range"}
            value={length}
            onChange={handleLength}
            valueLabelDisplay="auto"
            getAriaValueText={valuetext}
            min={0}
            max={unit === "inches" ? 20 : 300}
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
              {unit === "inches" ? 20 : 300}
            </p>
          </div>
          <Slider
            sx={CustomSliderStyles}
            getAriaLabel={() => "Temperature range"}
            value={breadth}
            onChange={handleBradth}
            valueLabelDisplay="auto"
            getAriaValueText={valuetext}
            min={0}
            max={unit === "inches" ? 20 : 300}
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
              {unit === "inches" ? 20 : 300}
            </p>
          </div>
          <Slider
            sx={CustomSliderStyles}
            getAriaLabel={() => "Temperature range"}
            value={height}
            onChange={handleHeight}
            valueLabelDisplay="auto"
            getAriaValueText={valuetext}
            min={0}
            max={unit === "inches" ? 20 : 300}
          />
          <button
            className={"packagebtn"}
            onClick={async () => {
              await handleApply();
              if (typeof closeMobilePanel === "function") {
                closeMobilePanel();
              }
            }}
          >
            Apply
          </button>
        </>
      ),
    });

  const renderBrandFilter = () =>
    renderFilterCard({
      title: "Filter by Brands",
      minHeight: "230px",
      children: (
        <div className="mt-4 d-flex flex-column align-items-start gap-3">
          {BRAND_OPTIONS.map((brandOption) => (
            <div className="d-flex" key={brandOption.id}>
              <Checkbox
                {...label}
                onChange={() => handlecat(brandOption.id)}
                checked={seelctedBrand.includes(brandOption.id)}
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
                inputProps={{ "aria-label": `brand-${brandOption.label}` }}
              />

              <p
                className="mb-0"
                style={{
                  marginLeft: "9px",
                  textTransform: "capitalize",
                }}
              >
                {brandOption.label}
              </p>
            </div>
          ))}
        </div>
      ),
    });

  const renderFilterContent = ({ closeMobilePanel }: { closeMobilePanel?: any } = {}) => (
    <div className="d-flex flex-column gap-3 w-100">
      {renderSizeFilter({ closeMobilePanel })}
      {renderBrandFilter()}
    </div>
  );

  return (
    <>
      <Head>
        <title>Buy Corrugated Boxes Online | store.prempackaging </title>
        <meta name="title" content="Buy Corrugated Boxes Online" />
        <meta
          name="description"
          content="You Can Buy corrugated boxes online at Prem Industries India Limited. We are one of the best corrugated boxes manufacturers & supplier in India."
        />
      </Head>
      <div>
        <div className="row p-0 m-0">
          <CorrugatedBanner />
          <div
            className={"row " + "mainbody"}
            style={{ backgroundColor: "white" }}
          >
            <div className="mt-2 d-flex flex-column">
              <p className={"catalogpath"}>
                <span onClick={() => router.push("/")}>Homepage</span> /{" "}
                <span className={"tw-no-underline"}>Corrugated Boxes</span>
              </p>
              <div
                className="row mt-2 m-0"
                style={{ height: "1px", backgroundColor: "#D9D9D9" }}
              ></div>
            </div>
            <CatalogFilterControls
              resultsText={
                <p className={"showresulttext"}>
                  {typeof totalCount === "number"
                    ? `Showing ${products?.length} of ${totalCount} results`
                    : `Showing ${products?.length} results`}
                </p>
              }
              sortBy={sortBy}
              onSortChange={handleSort}
              renderFilterContent={renderFilterContent}
            />
            <div
              className={"row d-flex " + "productsSection"}
              style={{ position: "relative" }}
            >
              <div
                className={"d-flex flex-column col-3 " + "desktopFilterColumn"}
              >
                <div className={"col-12 " + "filterslayout"}>
                  {renderFilterContent()}
                </div>
              </div>

              {/* Products for Desktop view */}
              <div className={"col-9 p-2 " + "productslistdivwindow"}>
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

              {/* Products for Mobile view */}
              <div
                className={"col-12 p-0 w-100 " + "productslistdivmobile"}
              >
                {products && products.length > 0 ? (
                  // If there are products, display them
                  products?.map((item, index) => (
                    <div
                      className={"mobileProductCard"}
                      key={index}
                    >
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
                  // If there are no products, display "No products found"
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
            <InfiniteScrollSentinel
              loadMoreRef={loadMoreRef}
              isFetchingMore={isFetchingMore}
            />
            <div className="row" style={{ marginTop: "36px" }}>
              <div
                className="row mt-2 m-0"
                style={{ height: "1px", backgroundColor: "#D9D9D9" }}
              ></div>
            </div>
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
          line-height: 1.4;
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
      .productsSection {
        margin-top: 24px;
      }
      @media (max-width: 900px) {
        .productsSection {
          margin-top: 16px;
        }
      }
      .desktopFilterColumn {
        display: flex;
      }
      @media (max-width: 900px) {
        .desktopFilterColumn {
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
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: start;
          gap: 16px 12px;
          width: 100%;
          padding: 0 6px;
          box-sizing: border-box;
          margin-left: 0;
          margin-top: 0;
        }
      }
      .mobileProductCard {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: stretch;
        width: 100%;
        min-height: 205px;
        min-width: 0;
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
