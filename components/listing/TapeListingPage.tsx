"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Slider from "@mui/material/Slider";
import Checkbox from "@mui/material/Checkbox";
import { useRouter } from "next/router";
import { getService, postService } from "../../services/service";
import ListingCard from "./ListingCard";
import DesktopListingCard from "./DesktopLisingCard";
import InfiniteScrollSentinel from "./InfiniteScrollSentinel";
import CatalogFilterControls from "./CatalogFilterControls";
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

export async function getTapeListingServerSideProps(
  context,
  { defaultSubcategoryId },
) {
  const query = context.query;
  const [brandRes, subcategoryRes] = await Promise.all([
    getService("brand/all"),
    getService("subcategory/all"),
  ]);

  const brands = brandRes?.data?.data ?? [];
  const subcategories = subcategoryRes?.data?.data ?? [];

  let brandId = null;
  if (query?.brand) {
    const brand = brands.find((item) => item.name === query.brand);
    brandId = brand?._id ?? null;
  }

  let subCategoryId = defaultSubcategoryId;
  if (query?.subcategory) {
    const subcategory = subcategories.find((item) => item.name === query.subcategory);
    subCategoryId = subcategory?._id ?? defaultSubcategoryId;
  }

  const filterPayload = {
    category: PACKPRO_TAPE_CATEGORY_ID,
    subcategory: subCategoryId,
    ...(brandId !== null && { brand: brandId }),
    ...(query?.q && { q: query.q }),
    skip: 0,
    limit: DEFAULT_INITIAL_LIMIT,
    includeMeta: true,
  };

  const prod = await postService("bopp/filter", filterPayload);

  return {
    props: {
      brands,
      product: prod?.data?.data ?? [],
      meta: prod?.data?.meta ?? null,
      brandId,
      subCategoryId,
      q: query?.q ?? null,
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

const TapeListingPage = ({
  BannerComponent,
  pageTitle,
  metaTitle,
  metaDescription,
  breadcrumbLabel,
  thicknessLabel,
  defaultSubcategoryId,
  brands,
  product,
  brandId,
  subCategoryId,
  q,
  meta,
}) => {
  const router = useRouter();
  const initialProducts = useMemo(() => (product ? product : []), [product]);
  const [length, setLength] = useState([SIZE_RANGE.min, SIZE_RANGE.max]);
  const [width, setWidth] = useState([SIZE_RANGE.min, SIZE_RANGE.max]);
  const [thickness, setThickness] = useState([SIZE_RANGE.min, SIZE_RANGE.max]);
  const [selectedBrands, setSelectedBrands] = useState(brandId ? [brandId] : []);
  const [sizeFilterActive, setSizeFilterActive] = useState(false);
  const label = { inputProps: { "aria-label": "brand filter" } };

  const baseFilter = useMemo(
    () => ({
      category: PACKPRO_TAPE_CATEGORY_ID,
      subcategory: subCategoryId || defaultSubcategoryId,
      ...(q ? { q } : {}),
    }),
    [defaultSubcategoryId, q, subCategoryId],
  );

  const initialFilter = useMemo(
    () => ({
      ...baseFilter,
      ...(brandId !== null && { brand: brandId }),
    }),
    [baseFilter, brandId],
  );

  const buildFilterPayload = useCallback(
    ({
      includeSize = sizeFilterActive,
      brandSelection = selectedBrands,
    } = {}) => {
      const payload: Record<string, any> = {
        ...baseFilter,
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

      if (brandSelection.length > 0) {
        payload.brand = brandSelection;
      }

      return payload;
    },
    [baseFilter, length, selectedBrands, sizeFilterActive, thickness, width],
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
    initialFilter,
    fetcher,
    initialLimit: DEFAULT_INITIAL_LIMIT,
  });

  const visibleBrands = useMemo(() => {
    const relevantBrandIds = new Set(
      initialProducts
        .map((item) => item?.brand)
        .filter(Boolean)
        .map((item) => String(item)),
    );

    return (brands ?? []).filter(
      (item) =>
        relevantBrandIds.has(String(item._id)) ||
        selectedBrands.includes(item._id),
    );
  }, [brands, initialProducts, selectedBrands]);

  const handleApply = async () => {
    setSizeFilterActive(true);
    const payload = buildFilterPayload({ includeSize: true });
    await applyFilter(payload);
  };

  const toggleSelection = (list, value) =>
    list.includes(value)
      ? list.filter((item) => item !== value)
      : [...list, value];

  const handleBrandChange = async (id) => {
    const nextBrands = toggleSelection(selectedBrands, id);
    setSelectedBrands(nextBrands);
    const payload = buildFilterPayload({ brandSelection: nextBrands });
    await applyFilter(payload);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
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
    setSelectedBrands(brandId ? [brandId] : []);
  }, [brandId]);

  const renderSizeFilter = ({ className, closeMobilePanel }) => (
    <div className={className}>
      {renderFilterCard({
        title: "Filter by Size",
        children: (
          <>
            <p className="mb-0 mt-2">Length (m)</p>
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
                {SIZE_RANGE.min}
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
                {SIZE_RANGE.min}
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

            <p className="mb-0 mt-2">{thicknessLabel}</p>
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
                {SIZE_RANGE.min}
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

            <button
              className="packagebtn tw-bg-[#182c5a] tw-text-white tw-text-center tw-uppercase hover:tw-bg-[#e92227]"
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
      })}
    </div>
  );

  const renderBrandFilter = ({ className }) =>
    visibleBrands.length > 0 ? (
      <div className={className}>
        {renderFilterCard({
          title: "Filter by Brands",
          children: (
            <div className="mt-3 d-flex flex-column align-items-start gap-3 mb-3">
              {visibleBrands.map((item) => (
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
                  <p
                    className="mb-0"
                    style={{ marginLeft: "9px", textTransform: "capitalize" }}
                  >
                    {item?.name}
                  </p>
                </div>
              ))}
            </div>
          ),
        })}
      </div>
    ) : null;

  const renderFilterContent = ({ closeMobilePanel }: { closeMobilePanel?: any } = {}) => (
    <div className="d-flex flex-column gap-3 w-100">
      {renderSizeFilter({ className: "w-100", closeMobilePanel })}
      {visibleBrands.length > 0 && renderBrandFilter({ className: "w-100" })}
    </div>
  );

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="title" content={metaTitle} />
        <meta name="description" content={metaDescription} />
      </Head>
      <div className="row p-0 m-0">
        <BannerComponent />
        <div className="row tw-px-[110px] max-[900px]:tw-px-[10px]" style={{ backgroundColor: "white" }}>
          <div className="mt-2 d-flex flex-column">
            <p className="tw-text-[#222] tw-font-montserrat tw-underline tw-cursor-pointer">
              <span onClick={() => router.push("/")}>Homepage</span> /{" "}
              <span className="tw-no-underline">{breadcrumbLabel}</span>
            </p>
            <div
              className="row mt-2 m-0"
              style={{ height: "1px", backgroundColor: "#D9D9D9" }}
            ></div>
          </div>
          <CatalogFilterControls
            resultsText={
              <p className="showresulttext">
                Showing all {typeof totalCount === "number" ? totalCount : products?.length} results
              </p>
            }
            sortBy={sortBy}
            onSortChange={handleSortChange}
            renderFilterContent={renderFilterContent}
          />
          <div className="row mt-4 d-flex" style={{ position: "relative" }}>
            <div className="d-flex flex-column col-3 desktopFilter">
              <div className="col-12 p-0 m-0 tw-flex tw-flex-col tw-items-start max-[900px]:tw-hidden">
                {renderFilterContent()}
              </div>
            </div>

            <div className="col-9 productslistdivwindow">
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
                  <p className="noProducts">Sorry , No products found</p>
                </div>
              )}
            </div>

            <div className="col-12 p-0 w-100 productslistdivmobile">
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
                  <p className="noProductsMobile">Sorry , no products found</p>
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
.packagebtn {
  width: 100%;
  height: 40px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.showresulttext {
  font-size: 13px;
  color: #666;
  font-family: "Montserrat", sans-serif;
  margin: 0;
}
.desktopFilter {
  display: block;
}
@media (max-width: 900px) {
  .desktopFilter {
    display: none;
  }
}
.productslistdivwindow {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
@media (max-width: 900px) {
  .productslistdivwindow {
    display: none;
  }
}
.productslistdivmobile {
  display: none;
}
@media (max-width: 900px) {
  .productslistdivmobile {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
}
.noProducts {
  font-size: 16px;
  color: #333;
  font-family: "Montserrat", sans-serif;
  font-weight: 600;
  white-space: nowrap;
}
.noProductsMobile {
  font-size: 14px;
  color: #333;
  font-family: "Montserrat", sans-serif;
  font-weight: 600;
  margin: 0;
}
`}</style>
    </>
  );
};

export default TapeListingPage;
