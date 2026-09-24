import React from "react";
import { cdn } from "../../lib/cdn";

function CorrugatedBanner() {
  return (
    <div
      className="container-fluid p-0 m-0 tw-w-full tw-overflow-hidden"
      style={{
        position: "relative",
      }}
    >
      <div className="w-100 h-100">
        <img
          src={cdn("/BannerCorugatedBox.jpg")}
          alt="Corrugated Boxes Banner"
          className="p-0 tw-block tw-w-full tw-h-auto tw-object-cover"
          style={{
            width: "100%",
            objectFit: "cover",
          }}
        />
      </div>
      <div className="banner-content">
        <div className="d-flex flex-column justify-content-start">
          <h1 className="banner-corrugated-header">
            Buy Corrugated Boxes <br />
            Online for Packaging
          </h1>
          <p className="banner-corrugated-subtext">
            Buy corrugated boxes online for maximum shipping protection. Premium multi-layer cardboard shipping boxes designed to secure items against crushing and transit damage.
          </p>
        </div>
      </div>
      <style jsx>{`
        .banner-content {
          position: absolute;
          top: 30%;
          left: 10%;
          max-width: 520px;
        }
        @media (max-width: 1200px) {
          .banner-content {
            top: 25%;
            left: 6%;
            max-width: 440px;
          }
        }
        @media (max-width: 700px) {
          .banner-content {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 100%;
            text-align: center;
          }
        }
        .banner-corrugated-header {
          color: #14254c;
          font-family: Montserrat;
          font-size: 38px;
          font-style: normal;
          font-weight: 700;
          line-height: 46px;
          margin-bottom: 12px;
          max-width: 100%;
        }
        @media (max-width: 1200px) {
          .banner-corrugated-header {
            font-size: 28px;
            line-height: 36px;
            margin-bottom: 8px;
          }
        }
        @media (max-width: 700px) {
          .banner-corrugated-header {
            font-size: 20px;
            line-height: 28px;
            margin-bottom: 6px;
          }
        }
        .banner-corrugated-subtext {
          color: #2b3e6b;
          font-family: Montserrat;
          font-size: 14px;
          font-weight: 500;
          line-height: 22px;
          max-width: 420px;
          margin: 0;
        }
        @media (max-width: 700px) {
          .banner-corrugated-subtext {
            font-size: 11px;
            line-height: 16px;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default CorrugatedBanner;
