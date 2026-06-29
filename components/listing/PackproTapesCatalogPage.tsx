"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Slider from "@mui/material/Slider";
import Checkbox from "@mui/material/Checkbox";
import { useRouter } from "next/router";
import { getService, postService } from "../../services/service";
import ListingCard from "./ListingCard";
import CatalogFilterControls from "./CatalogFilterControls";
import DesktopListingCard from "./DesktopLisingCard";
import InfiniteScrollSentinel from "./InfiniteScrollSentinel";
import {
  DEFAULT_INITIAL_LIMIT,
  useInfiniteProducts,
} from "../../hooks/useInfiniteProducts";

const PACKPRO_TAPE_CATEGORY_ID = "6557df64301ec4f2f4266141";
const SIZE_RANGE = { min: 0, max: 100 };
const sliderStyles = {
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

const normalizeCategoryId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return value?._id ? String(value._id) : null;
  }

  return String(value);
};

const isTapeSubcategory = (item) => {
  const haystack = [item?.name, item?.slug].filter(Boolean).join(" ");
  return /\btape\b/i.test(haystack);
};

const getTapeTypeOptions = (subcategories: any[] = []) =>
  subcategories
    .filter(
      (item) =>
        normalizeCategoryId(item?.category) === PACKPRO_TAPE_CATEGORY_ID &&
        isTapeSubcategory(item),
    )
    .map((item) => ({
      id: item?._id,
      label: item?.name,
    }))
    .filter((item) => item.id && item.label);

export async function getPackproTapesCatalogServerSideProps(context) {
  const query = context.query;
  const subcategoryRes = await getService("subcategory/all");
  const availabilityRes = await postService("product/subcategory-availability", {
    category: PACKPRO_TAPE_CATEGORY_ID,
    ...(query?.q && { q: query.q }),
  });

  const allTapeTypeOptions = getTapeTypeOptions(subcategoryRes?.data?.data ?? []);
  const availabilityItems = availabilityRes?.data?.data ?? [];
  const availableSubcategoryIds = new Set(
    availabilityItems
      .filter((item) => Number(item?.productCount) > 0)
      .map((item) => item?.subcategory)
      .filter(Boolean),
  );

  const tapeTypeOptions =
    availabilityItems.length > 0
      ? allTapeTypeOptions.filter((item) => availableSubcategoryIds.has(item.id))
      : allTapeTypeOptions;

  const allTapeSubcategoryIds = tapeTypeOptions.map((item) => item.id);
  const filterPayload = {
    category: PACKPRO_TAPE_CATEGORY_ID,
    ...(allTapeSubcategoryIds.length > 0
      ? { subcategory: allTapeSubcategoryIds }
      : {}),
    ...(query?.q && { q: query.q }),
    skip: 0,
    limit: DEFAULT_INITIAL_LIMIT,
    includeMeta: true,
  };

  const prod = await postService("bopp/filter", filterPayload);

  return {
    props: {
      product: prod?.data?.data ?? [],
      meta: prod?.data?.meta ?? null,
      q: query?.q ?? null,
      tapeTypeOptions,
    },
  };
}

const renderFilterCard = ({ title, children }) => (
  <div
    className="w-100"
    style={{ border: "1px solid #E6E6E6", backgroundColor: "white" }}
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

const PackproTapesCatalogPage = ({
  BannerComponent,
  product,
  meta,
  q,
  tapeTypeOptions,
}) => {
  const router = useRouter();
  const initialProducts = useMemo(() => (product ? product : []), [product]);
  const allTapeSubcategoryIds = useMemo(
    () => (tapeTypeOptions ?? []).map((item) => item.id),
    [tapeTypeOptions],
  );
  const [length, setLength] = useState([SIZE_RANGE.min, SIZE_RANGE.max]);
  const [width, setWidth] = useState([SIZE_RANGE.min, SIZE_RANGE.max]);
  const [thickness, setThickness] = useState([SIZE_RANGE.min, SIZE_RANGE.max]);
  const [selectedTypes, setSelectedTypes] = useState<any[]>([]);
  const [sizeFilterActive, setSizeFilterActive] = useState(false);
  const label = { inputProps: { "aria-label": "tape type filter" } };

  const baseFilter = useMemo(() => {
    const subcategoryIds =
      selectedTypes.length > 0 ? selectedTypes : allTapeSubcategoryIds;

    return {
      category: PACKPRO_TAPE_CATEGORY_ID,
      ...(subcategoryIds.length > 0 ? { subcategory: subcategoryIds } : {}),
      ...(q ? { q } : {}),
    };
  }, [allTapeSubcategoryIds, q, selectedTypes]);

  const buildFilterPayload = useCallback(
    ({ includeSize = sizeFilterActive, nextTypes = selectedTypes } = {}) => {
      const subcategoryIds =
        nextTypes.length > 0 ? nextTypes : allTapeSubcategoryIds;
      const payload: Record<string, any> = {
        category: PACKPRO_TAPE_CATEGORY_ID,
        ...(subcategoryIds.length > 0 ? { subcategory: subcategoryIds } : {}),
        ...(q ? { q } : {}),
      };

      if (includeSize) {
        payload.length = {
          min: length?.[0],
          max: length?.[1],
        };
        payload.width = {
          min: width?.[0],
          max: width?.[1],
        };
        payload.thickness = {
          min: thickness?.[0],
          max: thickness?.[1],
        };
      }

      return payload;
    },
    [allTapeSubcategoryIds, length, q, selectedTypes, sizeFilterActive, thickness, width],
  );

  const fetcher = useCallback(
    (payload) => postService("bopp/filter", payload),
    [],
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
    initialFilter: baseFilter,
    fetcher,
    initialLimit: DEFAULT_INITIAL_LIMIT,
  });

  const handleApply = async () => {
    setSizeFilterActive(true);
    const payload = buildFilterPayload({ includeSize: true });
    await applyFilter(payload);
  };

  const toggleSelection = (list, value) =>
    list.includes(value)
      ? list.filter((item) => item !== value)
      : [...list, value];

  const handleTypeChange = async (id) => {
    const nextTypes = toggleSelection(selectedTypes, id);
    setSelectedTypes(nextTypes);
    const payload = buildFilterPayload({ nextTypes });
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

  const renderSizeFilter = ({ className }) => (
    <div className={className}>
      {renderFilterCard({
        title: "Filter by Size",
        children: (
          <>
            <p className="mb-0 mt-2">Length (m)</p>
            <div className="mt-2 d-flex flex-row align-items-center justify-content-between">
              <p className="mb-0 px-2 bg-light" style={{ fontSize: "15px", borderRadius: "10px", fontWeight: 600, color: "#010101", lineHeight: "24px" }}>
                {SIZE_RANGE.min}
              </p>
              <p className="mb-0 px-2 bg-light" style={{ fontSize: "15px", borderRadius: "10px", fontWeight: 600, color: "#010101", lineHeight: "24px" }}>
                {SIZE_RANGE.max}
              </p>
            </div>
            <Slider
              sx={sliderStyles}
              getAriaLabel={() => "Tape length range"}
              value={length}
              onChange={(_, newValue) => setLength(newValue as number[])}
              valueLabelDisplay="auto"
              getAriaValueText={(value) => `${value}`}
              min={SIZE_RANGE.min}
              max={SIZE_RANGE.max}
            />

            <p className="mb-0 mt-2">Width (mm)</p>
            <div className="mt-2 d-flex flex-row align-items-center justify-content-between">
              <p className="mb-0 px-2 bg-light" style={{ fontSize: "15px", borderRadius: "10px", fontWeight: 600, color: "#010101", lineHeight: "24px" }}>
                {SIZE_RANGE.min}
              </p>
              <p className="mb-0 px-2 bg-light" style={{ fontSize: "15px", borderRadius: "10px", fontWeight: 600, color: "#010101", lineHeight: "24px" }}>
                {SIZE_RANGE.max}
              </p>
            </div>
            <Slider
              sx={sliderStyles}
              getAriaLabel={() => "Tape width range"}
              value={width}
              onChange={(_, newValue) => setWidth(newValue as number[])}
              valueLabelDisplay="auto"
              getAriaValueText={(value) => `${value}`}
              min={SIZE_RANGE.min}
              max={SIZE_RANGE.max}
            />

            <p className="mb-0 mt-2">Thickness</p>
            <div className="mt-2 d-flex flex-row align-items-center justify-content-between">
              <p className="mb-0 px-2 bg-light" style={{ fontSize: "15px", borderRadius: "10px", fontWeight: 600, color: "#010101", lineHeight: "24px" }}>
                {SIZE_RANGE.min}
              </p>
              <p className="mb-0 px-2 bg-light" style={{ fontSize: "15px", borderRadius: "10px", fontWeight: 600, color: "#010101", lineHeight: "24px" }}>
                {SIZE_RANGE.max}
              </p>
            </div>
            <Slider
              sx={sliderStyles}
              getAriaLabel={() => "Tape thickness range"}
              value={thickness}
              onChange={(_, newValue) => setThickness(newValue as number[])}
              valueLabelDisplay="auto"
              getAriaValueText={(value) => `${value}`}
              min={SIZE_RANGE.min}
              max={SIZE_RANGE.max}
            />

            <button className="package-btn" onClick={handleApply}>
              Apply
            </button>
          </>
        ),
      })}
    </div>
  );

  const renderTypeFilter = ({ className }) =>
    (tapeTypeOptions ?? []).length > 0 ? (
      <div className={className}>
        {renderFilterCard({
          title: "Filter by Tape Type",
          children: (
            <div className="mt-3 d-flex flex-column align-items-start gap-3 mb-3">
              {tapeTypeOptions.map((item) => (
                <div className="d-flex" key={item.id}>
                  <Checkbox
                    {...label}
                    onChange={() => handleTypeChange(item.id)}
                    checked={selectedTypes.includes(item.id)}
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
                    inputProps={{ "aria-label": item.label }}
                  />
                  <p
                    className="mb-0"
                    style={{ marginLeft: "9px", textTransform: "capitalize" }}
                  >
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          ),
        })}
      </div>
    ) : null;

  const renderFilterContent = () => (
    <div className="d-flex flex-column gap-3 w-100">
      {renderTypeFilter({ className: "w-100" })}
      {renderSizeFilter({ className: "w-100" })}
    </div>
  );

  return (
    <>
      <Head>
        <title>Buy packaging tapes online | store.prempackaging</title>
        <meta name="title" content="Buy packaging tapes online" />
        <meta
          name="description"
          content="Browse all PackPro tape types in one place. Compare BOPP, paper, void, and carry handle tapes, then filter by tape type and size."
        />
      </Head>
      <div className="row p-0 m-0">
        <BannerComponent />
        <div className="row main-body" style={{ backgroundColor: "white" }}>
          <div className="mt-2 d-flex flex-column">
            <p className="catalog-path">
              <span onClick={() => router.push("/")}>Homepage</span> /{" "}
              <span className="tw-no-underline">Tapes</span>
            </p>
            <div
              className="row mt-2 m-0"
              style={{ height: "1px", backgroundColor: "#D9D9D9" }}
            ></div>
          </div>
          <CatalogFilterControls
            resultsText={
              <p className="show-result-text">
                Showing all {typeof totalCount === "number" ? totalCount : products?.length} results
              </p>
            }
            sortBy={sortBy}
            onSortChange={setSortBy}
            renderFilterContent={renderFilterContent}
          />
          <div className="row mt-4 d-flex" style={{ position: "relative" }}>
            <div className="d-flex flex-column col-3 desktop-filter">
              <div className="col-12 p-0 m-0 filters-layout">
                {renderFilterContent()}
              </div>
            </div>

            <div className="col-9 products-list-div-window">
              {products && products.length > 0 ? (
                products.map((item, index) => (
                  <div className="row w-40" style={{ height: "400px" }} key={index}>
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
                <div style={{ position: "absolute", top: "10%", left: "50%" }}>
                  <p className="no-products">Sorry , No products found</p>
                </div>
              )}
            </div>

            <div className="col-12 p-0 w-100 products-list-div-mobile">
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
                  <p className="no-products-mobile">Sorry , no products found</p>
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
          <InfiniteScrollSentinel loadMoreRef={loadMoreRef} isFetchingMore={isFetchingMore} />
        </div>
      </div>
      <style jsx>{`
        .package-btn {
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

        .main-body {
          margin-top: 17px;
          margin-left: 0px;
          margin-bottom: 0px;
          margin-right: 0px;
          padding-left: 110px;
          padding-right: 110px;
        }

        @media (max-width: 900px) {
          .main-body {
            padding-left: 10px;
            padding-right: 10px;
          }
        }

        .catalog-path {
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

        .show-result-text {
          margin: 0px;
          color: #3a5ba2;
          font-size: 20.794px;
          font-style: normal;
          font-weight: 700;
          line-height: 36.389px;
        }

        @media (max-width: 900px) {
          .show-result-text {
            font-size: 16px;
          }
        }

        .desktop-filter {
          display: block !important;
        }

        @media (max-width: 900px) {
          .desktop-filter {
            display: none !important;
          }
        }

        .filters-layout {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
        }

        @media (max-width: 900px) {
          .filters-layout {
            display: none;
          }
        }

        .products-list-div-window {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        @media (min-width: 1600px) {
          .products-list-div-window {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (max-width: 1300px) {
          .products-list-div-window {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 900px) {
          .products-list-div-window {
            display: none !important;
          }
        }

        .no-products {
          font-size: 28px;
          font-family: Montserrat;
          font-weight: 700;
          color: #3a5ba2;
        }

        .products-list-div-mobile {
          display: none !important;
        }

        @media (max-width: 900px) {
          .products-list-div-mobile {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr);
            justify-content: center;
            align-items: center;
            gap: 10px;
            margin-left: 20px;
          }
        }

        .no-products-mobile {
          font-size: 28px;
          font-family: Montserrat;
          font-weight: 700;
          color: #3a5ba2;
        }
      `}</style>
    </>
  );
};

export default PackproTapesCatalogPage;
