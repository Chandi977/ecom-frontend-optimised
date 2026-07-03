"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Checkbox from "@mui/material/Checkbox";
import { useRouter } from "next/router";
import { postService } from "../../services/service";
import ListingCard from "./ListingCard";
import DesktopListingCard from "./DesktopLisingCard";
import InfiniteScrollSentinel from "./InfiniteScrollSentinel";
import CatalogFilterControls from "./CatalogFilterControls";
import {
  DEFAULT_INITIAL_LIMIT,
  useInfiniteProducts,
} from "../../hooks/useInfiniteProducts";
import {
  buildPackproRoute,
  getPackproSegmentConfig,
  normalizePackproSegment,
  PACKPRO_SEGMENT_OPTIONS,
} from "../../utils/packproCatalog";

export async function getPackproTapeCatalogServerSideProps(context) {
  const query = context.query;
  const activeSegment = normalizePackproSegment(query?.segment);
  const segmentConfig = getPackproSegmentConfig(activeSegment);
  const filterPayload = {
    category: segmentConfig.categoryIds,
    ...(query?.q && { q: query.q }),
    skip: 0,
    limit: DEFAULT_INITIAL_LIMIT,
    includeMeta: true,
  };

  const prod = await postService("product/filter", filterPayload);

  return {
    props: {
      product: prod?.data?.data ?? [],
      meta: prod?.data?.meta ?? null,
      q: query?.q ?? null,
      activeSegment,
    },
  };
}

const PackproTapeCatalogPage = ({
  BannerComponent,
  product,
  meta,
  q,
  activeSegment,
}) => {
  const router = useRouter();
  const segmentConfig = useMemo(
    () => getPackproSegmentConfig(activeSegment),
    [activeSegment],
  );
  const initialProducts = useMemo(() => (product ? product : []), [product]);
  const label = { inputProps: { "aria-label": "packpro-product-category" } };

  const baseFilter = useMemo(
    () => ({
      category: segmentConfig.categoryIds,
      ...(q ? { q } : {}),
    }),
    [q, segmentConfig],
  );

  const fetcher = useCallback(
    (payload) => postService("product/filter", payload),
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

  const handleQuery = useCallback(async () => {
    await applyFilter(baseFilter);
  }, [applyFilter, baseFilter]);

  const handleSegmentChange = (nextSegment) => {
    router.push(buildPackproRoute(nextSegment, q ? { q } : {}));
  };

  useEffect(() => {
    if (q && initialProducts.length === 0) {
      handleQuery();
    }
  }, [handleQuery, initialProducts.length, q]);

  const renderSegmentFilter = ({ className }) => (
    <div className={className}>
      <div className="filter-card">
        <div className="row m-0" style={{ paddingLeft: 3, paddingRight: 3 }}>
          <div className="col">
            <p className="mb-0 mt-3" style={{ fontWeight: "bolder" }}>
              Filter by Product Category
            </p>
            <div className="mt-3 d-flex flex-column align-items-start gap-3">
              {PACKPRO_SEGMENT_OPTIONS.map((segment) => (
                <div className="d-flex" key={segment.id}>
                  <Checkbox
                    {...label}
                    checked={segment.id === segmentConfig.id}
                    onChange={() => handleSegmentChange(segment.id)}
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
                    inputProps={{ "aria-label": `packpro-${segment.id}` }}
                  />
                  <p
                    className="mb-0"
                    style={{ marginLeft: "9px", textTransform: "capitalize" }}
                  >
                    {segment.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFilterContent = () => renderSegmentFilter({ className: "w-100" });

  return (
    <>
      <Head>
        <title>Buy PackPro packaging products online | store.prempackaging</title>
        <meta
          name="title"
          content="Buy PackPro packaging products online"
        />
        <meta
          name="description"
          content="Browse PackPro carry bags, food wrapping papers, and tapes in one catalog, then filter by product group."
        />
      </Head>
      <div className="row p-0 m-0">
        <BannerComponent />
        <div
          className="row pc-mainbody"
          style={{ backgroundColor: "white" }}
        >
          <div className="mt-2 d-flex flex-column">
            <p className="pc-catalogpath">
              <span onClick={() => router.push("/")}>Homepage</span> /{" "}
              <span className="tw-no-underline">PackPro</span>
            </p>
            <div
              className="row mt-2 m-0"
              style={{ height: "1px", backgroundColor: "#D9D9D9" }}
            ></div>
          </div>
          <CatalogFilterControls
            resultsText={
              <p className="pc-showresulttext">
                Showing all{" "}
                {typeof totalCount === "number" ? totalCount : products?.length}{" "}
                results
              </p>
            }
            sortBy={sortBy}
            onSortChange={setSortBy}
            renderFilterContent={renderFilterContent}
          />
          <div className="row mt-4 d-flex" style={{ position: "relative" }}>
            <div className="d-flex flex-column col-3 pc-desktopFilter">
              <div className="col-12 p-0 m-0 pc-filterslayout">
                {renderFilterContent()}
              </div>
            </div>

            <div className="col-9 pc-productslistdivwindow">
              {products?.length > 0 ? (
                products.map((item, index) => (
                  <div
                    className="row w-40"
                    style={{ height: "400px" }}
                    key={item?._id || index}
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
                <div style={{ position: "absolute", top: "10%", left: "50%" }}>
                  <p className="pc-noProducts">No products found.</p>
                </div>
              )}
            </div>

            <div className="col-12 p-0 w-100 pc-productslistdivmobile">
              {products?.length > 0 ? (
                products.map((item, index) => (
                  <div
                    className="mt-4 d-flex flex-column justify-content-start align-items-center"
                    style={{ width: "180px", height: "212px" }}
                    key={item?._id || index}
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
                  <p className="pc-noProductsMobile">No products found.</p>
                </div>
              )}
            </div>
          </div>
          <InfiniteScrollSentinel
            loadMoreRef={loadMoreRef}
            isFetchingMore={isFetchingMore}
          />
        </div>
      </div>
      <style jsx>{`
        .filter-card {
          width: 100%;
          border: 1px solid #e6e6e6;
          background-color: #fff;
          padding: 0 0 20px;
          box-sizing: border-box;
        }
        .pc-mainbody {
          margin-top: 17px !important;
          margin-left: 0px !important;
          margin-bottom: 0px !important;
          margin-right: 0px !important;
          padding-left: 110px !important;
          padding-right: 110px !important;
        }
        @media (max-width: 900px) {
          .pc-mainbody {
            padding-left: 10px !important;
            padding-right: 10px !important;
          }
        }
        .pc-catalogpath {
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
        .pc-showresulttext {
          margin: 0px;
          color: #3a5ba2;
          font-size: 20.794px;
          font-style: normal;
          font-weight: 700;
          line-height: 36.389px;
        }
        @media (max-width: 900px) {
          .pc-showresulttext {
            font-size: 16px;
          }
        }
        .pc-filterslayout {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
        }
        @media (max-width: 900px) {
          .pc-filterslayout {
            display: none;
          }
        }
        .pc-productslistdivwindow {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        @media (min-width: 1600px) {
          .pc-productslistdivwindow {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @media (max-width: 1300px) {
          .pc-productslistdivwindow {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 900px) {
          .pc-productslistdivwindow {
            display: none !important;
          }
        }
        .pc-productslistdivmobile {
          display: none !important;
        }
        @media (max-width: 900px) {
          .pc-productslistdivmobile {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr);
            justify-content: center;
            align-items: center;
            gap: 10px;
            margin-left: 20px;
          }
        }
        .pc-desktopFilter {
          display: block !important;
        }
        @media (max-width: 900px) {
          .pc-desktopFilter {
            display: none !important;
          }
        }
        .pc-noProducts {
          font-size: 28px;
          font-family: Montserrat;
          font-weight: 700;
          color: #3a5ba2;
        }
        .pc-noProductsMobile {
          font-size: 28px;
          font-family: Montserrat;
          font-weight: 700;
          color: #3a5ba2;
        }
      `}</style>
    </>
  );
};

export default PackproTapeCatalogPage;
