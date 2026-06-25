"use client"; // This is a client component ????
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Slider from "@mui/material/Slider";
import Checkbox from "@mui/material/Checkbox";
import Head from "next/head";
import { getService, postService } from "../../services/service";
import CarryBagBanner from "../../components/landing/CarryBagBanner";
import { useRouter } from "next/router";
import ListingCard from "../../components/listing/ListingCard";
import CatalogFilterControls from "../../components/listing/CatalogFilterControls";
import DesktopListingCard from "../../components/listing/DesktopLisingCard";
import InfiniteScrollSentinel from "../../components/listing/InfiniteScrollSentinel";
import {
  DEFAULT_INITIAL_LIMIT,
  useInfiniteProducts,
} from "../../hooks/useInfiniteProducts";

const CARRY_BAG_CATEGORY_IDS = [
  "6557df71301ec4f2f4266145",
  "689d73214687bb4e437542e0",
];
const DEFAULT_UNIT = "inches";
const SIZE_RANGE_BY_UNIT = {
  inches: { min: 0, max: 20 },
  mm: { min: 0, max: 600 },
};

export async function getServerSideProps(context) {
  const brandRes = await getService("brand/all");
  const query = context.query;

  let brandId = null;
  if (query?.brand) {
    const brands = brandRes?.data?.data ?? [];
    const brand = brands.filter((item) => item.name === query?.brand);
    brandId = brand[0]?._id;
  }

  let subCategoryId = null;
  if (query?.subcategory) {
    const subcategories = await getService("subcategory/all");
    const subcategory = subcategories?.data?.data?.filter(
      (item) => item.name === query?.subcategory,
    );
    subCategoryId = subcategory[0]?._id;
  }

  const filterPayload = {
    category: CARRY_BAG_CATEGORY_IDS,
    ...(brandId !== null && { brand: brandId }),
    ...(subCategoryId !== null && { subcategory: subCategoryId }),
    ...(query?.q && { q: query.q }),
    unit: DEFAULT_UNIT,
    skip: 0,
    limit: DEFAULT_INITIAL_LIMIT,
    includeMeta: true,
  };

  const prod = await postService("product/filter", filterPayload);

  return {
    props: {
      brands: brandRes?.data ? brandRes?.data?.data : [],
      product: prod?.data ? prod?.data?.data : [],
      meta: prod?.data?.meta ? prod?.data?.meta : null,
      brandId: brandId || null,
      subCategoryId: subCategoryId || null,
      q: query?.q || null,
    },
  };
}

const CarryBagsPage = ({ brands, product, brandId, subCategoryId, q, meta }) => {
  const router = useRouter();
  const initialProducts = useMemo(() => (product ? product : []), [product]);
  const [length, setLength] = useState([
    SIZE_RANGE_BY_UNIT[DEFAULT_UNIT].min,
    SIZE_RANGE_BY_UNIT[DEFAULT_UNIT].max,
  ]);
  const [breadth, setBreadth] = useState([
    SIZE_RANGE_BY_UNIT[DEFAULT_UNIT].min,
    SIZE_RANGE_BY_UNIT[DEFAULT_UNIT].max,
  ]);
  const [gusset, setGusset] = useState([0, 20]);
  const [thickness, setThickness] = useState([0, 500]);
  const [unit, setUnit] = useState(DEFAULT_UNIT);
  const [sizeFilterActive, setSizeFilterActive] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState(brandId ? [brandId] : []);
  const sizeBounds = SIZE_RANGE_BY_UNIT[unit];
  const label = { inputProps: { "aria-label": "Checkbox demo" } };

  const baseFilter = useMemo(
    () => ({
      category: CARRY_BAG_CATEGORY_IDS,
      ...(subCategoryId !== null && { subcategory: subCategoryId }),
      ...(q ? { q } : {}),
      unit,
    }),
    [subCategoryId, q, unit],
  );

  const initialFilter = useMemo(
    () => ({
      category: CARRY_BAG_CATEGORY_IDS,
      ...(brandId !== null && { brand: brandId }),
      ...(subCategoryId !== null && { subcategory: subCategoryId }),
      ...(q ? { q } : {}),
      unit: DEFAULT_UNIT,
    }),
    [brandId, subCategoryId, q],
  );

  const buildFilterPayload = useCallback(
    ({ includeSize = sizeFilterActive, brands: brandSelection = selectedBrands } = {}) => {
      const payload: Record<string, any> = {
        ...baseFilter,
      };

      if (includeSize) {
        payload.breadth = {
          min: length?.[0],
          max: length?.[1],
        };
        payload.height = {
          min: breadth?.[0],
          max: breadth?.[1],
        };
        payload.gusset = {
          min: gusset?.[0],
          max: gusset?.[1],
        };
        payload.thickness = {
          min: thickness?.[0],
          max: thickness?.[1],
        };
      }

      if (brandSelection.length > 0) {
        payload.brand = brandSelection;
      }

      return payload;
    },
    [baseFilter, breadth, gusset, length, selectedBrands, sizeFilterActive, thickness],
  );

  const fetcher = useCallback((payload) => postService("product/filter", payload), []);

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

  const customSliderStyles = {
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

  const toggleSelection = (list, value) =>
    list.includes(value)
      ? list.filter((item) => item !== value)
      : [...list, value];

  const handleApply = async () => {
    setSizeFilterActive(true);
    const payload = buildFilterPayload({ includeSize: true });
    await applyFilter(payload);
  };

  const handleBrandChange = async (id) => {
    const nextBrands = toggleSelection(selectedBrands, id);
    setSelectedBrands(nextBrands);
    const payload = buildFilterPayload({ brands: nextBrands });
    await applyFilter(payload);
  };

  const handleQuery = useCallback(async () => {
    const payload = buildFilterPayload();
    await applyFilter(payload);
  }, [applyFilter, buildFilterPayload]);

  useEffect(() => {
    if (q && initialProducts.length === 0) {
      handleQuery();
    }
  }, [handleQuery, initialProducts.length, q]);

  useEffect(() => {
    setLength([sizeBounds.min, sizeBounds.max]);
    setBreadth([sizeBounds.min, sizeBounds.max]);
  }, [sizeBounds.max, sizeBounds.min, unit]);

  useEffect(() => {
    setSelectedBrands(brandId ? [brandId] : []);
  }, [brandId]);

  const renderSizeFilter = ({ className }) => (
    <div className={className}>
      <div className={"filterCard"}>
        <div className="row m-0" style={{ paddingLeft: 3, paddingRight: 3 }}>
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
                <p className="mb-0 mt-3" style={{ fontWeight: "bolder" }}>
                  Filter by Size
                </p>
              </div>
              <div
                className="mb-0 mt-2"
                style={{ display: "flex", flexDirection: "row", gap: "10px" }}
              >
                <label>
                  <input
                    type="radio"
                    name="carry-bag-unit"
                    value="inches"
                    checked={unit === "inches"}
                    onChange={() => setUnit("inches")}
                  />
                  inch
                </label>
                <label>
                  <input
                    type="radio"
                    name="carry-bag-unit"
                    value="mm"
                    checked={unit === "mm"}
                    onChange={() => setUnit("mm")}
                  />
                  mm
                </label>
              </div>
            </div>

            <p className="mb-0 mt-2">Breadth</p>
            <div className="mt-2 d-flex flex-row align-items-center justify-content-between">
              <p className="mb-0 px-2 bg-light" style={{ fontSize: "15px", borderRadius: "10px", fontWeight: 600, color: "#010101", lineHeight: "24px" }}>
                {sizeBounds.min}
              </p>
              <p className="mb-0 px-2 bg-light" style={{ fontSize: "15px", borderRadius: "10px", fontWeight: 600, color: "#010101", lineHeight: "24px" }}>
                {sizeBounds.max}
              </p>
            </div>
            <Slider
              sx={customSliderStyles}
              getAriaLabel={() => "Carry bag breadth range"}
              value={length}
              onChange={(event, newValue) => setLength(newValue as number[])}
              valueLabelDisplay="auto"
              getAriaValueText={(value) => `${value}`}
              min={sizeBounds.min}
              max={sizeBounds.max}
            />

            <p className="mb-0 mt-1">Height</p>
            <div className="mt-2 d-flex flex-row align-items-center justify-content-between">
              <p className="mb-0 px-2 bg-light" style={{ fontSize: "15px", borderRadius: "10px", fontWeight: 600, color: "#010101", lineHeight: "24px" }}>
                {sizeBounds.min}
              </p>
              <p className="mb-0 px-2 bg-light" style={{ fontSize: "15px", borderRadius: "10px", fontWeight: 600, color: "#010101", lineHeight: "24px" }}>
                {sizeBounds.max}
              </p>
            </div>
            <Slider
              sx={customSliderStyles}
              getAriaLabel={() => "Carry bag height range"}
              value={breadth}
              onChange={(event, newValue) => setBreadth(newValue as number[])}
              valueLabelDisplay="auto"
              getAriaValueText={(value) => `${value}`}
              min={sizeBounds.min}
              max={sizeBounds.max}
            />

            <p className="mb-0 mt-1">Gusset (inch)</p>
            <div className="mt-2 d-flex flex-row align-items-center justify-content-between">
              <p className="mb-0 px-2 bg-light" style={{ fontSize: "15px", borderRadius: "10px", fontWeight: 600, color: "#010101", lineHeight: "24px" }}>
                0
              </p>
              <p className="mb-0 px-2 bg-light" style={{ fontSize: "15px", borderRadius: "10px", fontWeight: 600, color: "#010101", lineHeight: "24px" }}>
                20
              </p>
            </div>
            <Slider
              sx={customSliderStyles}
              getAriaLabel={() => "Carry bag gusset range"}
              value={gusset}
              onChange={(event, newValue) => setGusset(newValue as number[])}
              valueLabelDisplay="auto"
              getAriaValueText={(value) => `${value}`}
              min={0}
              max={20}
            />

            <p className="mb-0 mt-1">Thickness (gsm)</p>
            <div className="mt-2 d-flex flex-row align-items-center justify-content-between">
              <p className="mb-0 px-2 bg-light" style={{ fontSize: "15px", borderRadius: "10px", fontWeight: 600, color: "#010101", lineHeight: "24px" }}>
                0
              </p>
              <p className="mb-0 px-2 bg-light" style={{ fontSize: "15px", borderRadius: "10px", fontWeight: 600, color: "#010101", lineHeight: "24px" }}>
                500
              </p>
            </div>
            <Slider
              sx={customSliderStyles}
              getAriaLabel={() => "Carry bag thickness range"}
              value={thickness}
              onChange={(event, newValue) => setThickness(newValue as number[])}
              valueLabelDisplay="auto"
              getAriaValueText={(value) => `${value}`}
              min={0}
              max={500}
            />

            <button className={"packagebtn"} onClick={handleApply}>
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBrandFilter = ({ className }) => (
    <div className={className}>
      <div className={"filterCard"}>
        <div className="row m-0" style={{ paddingLeft: 3, paddingRight: 3 }}>
          <div className="col">
            <p className="mb-0 mt-3" style={{ fontWeight: "bolder" }}>
              Filter by Brands
            </p>

            <div className="mt-3 d-flex flex-column align-items-start gap-3">
              {brands?.map((item) => (
                <div className="d-flex" key={item._id}>
                  <Checkbox
                    {...label}
                    onChange={() => handleBrandChange(item._id)}
                    checked={selectedBrands.includes(item._id)}
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
                    inputProps={{ "aria-label": `brand-${item?.name}` }}
                  />
                  <p className="mb-0" style={{ marginLeft: "9px", textTransform: "capitalize" }}>
                    {item?.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFilterContent = () => (
    <div className="d-flex flex-column gap-3 w-100">
      {renderSizeFilter({ className: "w-100" })}
      {renderBrandFilter({ className: "w-100" })}
    </div>
  );

  return (
    <>
      <Head>
        <title>Buy Best Carry Bags online | store.prempackaging </title>
        <meta name="title" content="Buy Best Carry Bags online" />
        <meta
          name="description"
          content="Prem Industries India Limited offers high-quality Carry Bags for secure packaging needs. Trust our reliable solutions. Order Carry Bags now!"
        />
      </Head>
      <div>
        <div className="row p-0 m-0">
          <CarryBagBanner />
          <div className={"row " + "mainbody"} style={{ backgroundColor: "white" }}>
            <div className="mt-2 d-flex flex-column">
              <p className={"catalogpath"}>
                <span onClick={() => router.push("/")}>Homepage</span> /{" "}
                <span className={"tw-no-underline"}>Carry Bags</span>
              </p>
              <div className="row mt-2 m-0" style={{ height: "1px", backgroundColor: "#D9D9D9" }}></div>
            </div>
            <CatalogFilterControls
              resultsText={
                <p className={"showresulttext"}>
                  Showing all {typeof totalCount === "number" ? totalCount : products?.length} results
                </p>
              }
              sortBy={sortBy}
              onSortChange={setSortBy}
              renderFilterContent={renderFilterContent}
            />
            <div className="row mt-4 d-flex" style={{ position: "relative" }}>
              <div className={"d-flex flex-column col-3 " + "desktopFilter"}>
                <div className={"col-12 p-0 m-0 " + "filterslayout"}>
                  {renderSizeFilter({ className: "w-100" })}
                </div>
                <div className={"col-12 p-0 m-0 mt-3 " + "filterslayout"}>
                  {renderBrandFilter({ className: "w-100" })}
                </div>
              </div>

              <div className={"col-9 " + "productslistdivwindow"}>
                {products && products.length > 0 ? (
                  products.map((item, index) => (
                    <div className="row w-40" style={{ height: "400px" }} key={index}>
                      <DesktopListingCard item={item} />
                    </div>
                  ))
                ) : isLoading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div className="row w-40" style={{ height: "400px" }} key={`skeleton-${index}`}>
                      <DesktopListingCard />
                    </div>
                  ))
                ) : (
                  <div style={{ position: "absolute", top: "10%", left: "50%" }}>
                    <p className={"noProducts"}>Sorry , No products found</p>
                  </div>
                )}
              </div>

              <div className={"col-12 p-0 w-100 " + "productslistdivmobile"}>
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
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
                    <p className={"noProductsMobile"}>Sorry , no products found</p>
                  </div>
                )}
              </div>
            </div>
            <div className="row" style={{ marginTop: "36px" }}>
              <div className="row mt-2 m-0" style={{ height: "1px", backgroundColor: "#D9D9D9" }}></div>
            </div>
            <InfiniteScrollSentinel loadMoreRef={loadMoreRef} isFetchingMore={isFetchingMore} />
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
      .filterCard {
        width: 100%;
        border: 1px solid #e6e6e6;
        background-color: #fff;
        padding: 0 0 20px;
        box-sizing: border-box;
      }
      .desktopFilter {
        display: block !important;
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

export default CarryBagsPage;
