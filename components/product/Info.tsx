import React, { useState } from "react";
import { getOverviewFields } from "../../utils/overviewFields";
import { isFieldVisible, FIELD_VISIBILITY_KEYS } from "../../utils/fieldVisibility";
import ProductSpecifications from "./ProductSpecifications";

function Info({ product, weight, packSize, mrp, sp, stock }) {
  const [activeTab, setActiveTab] = useState("overview");

  const toggleTab = (tab) => {
    setActiveTab((prev) => (prev === tab ? "" : tab));
  };

  const showQuickOverview = isFieldVisible(product, FIELD_VISIBILITY_KEYS.sectionQuickOverview);
  const showSpecifications = isFieldVisible(product, FIELD_VISIBILITY_KEYS.sectionSpecifications);
  const showProductDetails = isFieldVisible(product, FIELD_VISIBILITY_KEYS.sectionProductDetails);

  const overviewFields = getOverviewFields(product, packSize, weight);
  const descriptionText = product?.description
    ? product.description.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()
    : "";
  const hasDescription = Boolean(descriptionText);
  const hasAboutItem = Boolean(product?.aboutItem && String(product.aboutItem).trim());

  return (
    <>
      <div className="container-fluid my-5">
        <div className="row justify-content-center">
          <div
            className="col-12 col-md-11"
            style={{
              border: "1px solid #EBEBEB",
              backgroundColor: "white",
              padding: "40px 32px",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
              margin: "20px 0",
            }}
          >
            <div className="row">
              {/* Left Column: Quick Overview & Specifications */}
              <div className="col-12 col-md-6 overview-col">
                {showQuickOverview && (
                <>
                <h3
                  style={{
                    color: "#182C5A",
                    fontSize: "20px",
                    fontWeight: "700",
                    marginBottom: "16px",
                    borderBottom: "2px solid #182C5A",
                    paddingBottom: "8px",
                    display: "inline-block",
                  }}
                >
                  Quick Overview
                </h3>
                {overviewFields && overviewFields.length > 0 ? (
                  <ul className="overview-list">
                    {overviewFields.map((field) => (
                      <li
                        key={field.label}
                        style={{
                          padding: "10px 0",
                          borderBottom: "1px solid #F2F2F2",
                          display: "flex",
                          gap: 16,
                          alignItems: "flex-start",
                        }}
                      >
                        <strong style={{ color: "#182C5A", width: "45%", minWidth: "120px", flexShrink: 0 }}>
                          {field.label}
                        </strong>
                        <span
                          style={{
                            color: "#555555",
                            textTransform: "capitalize",
                            wordBreak: "break-word",
                            flexGrow: 1,
                          }}
                        >
                          {field.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "#555555" }}>Not Available</p>
                )}
                </>
                )}

                {showSpecifications && (
                <div className="mt-5">
                  <h3
                    style={{
                      color: "#182C5A",
                      fontSize: "20px",
                      fontWeight: "700",
                      marginBottom: "16px",
                      borderBottom: "2px solid #182C5A",
                      paddingBottom: "8px",
                      display: "inline-block",
                    }}
                  >
                    Specifications
                  </h3>
                  <ProductSpecifications product={product} />
                </div>
                )}
              </div>

              {/* Right Column: Product Details */}
              {showProductDetails && (
              <div className="col-12 col-md-6 details-col">
                <h3
                  style={{
                    color: "#182C5A",
                    fontSize: "20px",
                    fontWeight: "700",
                    marginBottom: "16px",
                    borderBottom: "2px solid #182C5A",
                    paddingBottom: "8px",
                    display: "inline-block",
                  }}
                >
                  Product Details
                </h3>
                {hasDescription ? (
                  <div
                    className="mt-2"
                    style={{ color: "#555555", lineHeight: "1.6" }}
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : hasAboutItem ? (
                  <p className="mt-2" style={{ color: "#555555", lineHeight: "1.6" }}>
                    {product.aboutItem}
                  </p>
                ) : (
                  <h5 className="mt-2" style={{ color: "#555555" }}>
                    Not Available
                  </h5>
                )}
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .overview-col {
          border-right: 1px solid #EBEBEB;
          padding-right: 32px;
        }
        .details-col {
          padding-left: 32px;
        }
        .overview-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          column-gap: 32px;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        @media (max-width: 767px) {
          .overview-col {
            border-right: none;
            padding-right: 0px;
            border-bottom: 1px solid #EBEBEB;
            padding-bottom: 24px;
            margin-bottom: 24px;
          }
          .details-col {
            padding-left: 0px;
          }
          .overview-list {
            grid-template-columns: 1fr;
            column-gap: 0px;
          }
        }
      `}</style>
    </>
  );
}

export default Info;
