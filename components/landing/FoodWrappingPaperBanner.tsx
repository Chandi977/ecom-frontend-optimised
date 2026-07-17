import React from "react";

function FoodWrappingPaperBanner() {
  return (
    <div
      className="container-fluid p-0 m-0 tw-w-full tw-overflow-hidden"
      style={{
        position: "relative",
      }}
    >
      <div className="w-100 h-100">
        <img
          src="food-wrapping-paper-banner.jpg"
          alt="Food Wrapping Papers Banner"
          className="p-0 tw-block tw-w-full tw-h-auto tw-object-cover"
          style={{
            width: "100%",
            objectFit: "cover",
          }}
        />
      </div>
      <div className="banner-content">
        <div className="d-flex flex-column justify-content-start">
          <h1 className="banner-corrugated-header">FOOD WRAPPING PAPERS</h1>
          <p className="banner-corrugated-subtext">
            Buy food wrapping papers online for safe and fresh storage. Premium greaseproof, moisture-resistant wrapping sheets ideal for wrapping sandwiches, burgers, and baked items.
          </p>
        </div>
      </div>
      <style jsx>{`
        .banner-content { position: absolute; top: 35%; left: 15%; }
        @media (max-width: 700px) { .banner-content { top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; text-align: center; } }
        .banner-corrugated-header { color: #14254c; font-family: Montserrat; font-size: 42px; font-style: normal; font-weight: 700; line-height: 52px; margin-bottom: 8px; }
        @media (max-width: 700px) { .banner-corrugated-header { font-size: 24px; line-height: 32px; margin-bottom: 4px; } }
        .banner-corrugated-subtext { color: #2b3e6b; font-family: Montserrat; font-size: 14px; font-weight: 500; line-height: 22px; max-width: 450px; margin: 0; }
        @media (max-width: 700px) { .banner-corrugated-subtext { font-size: 11px; line-height: 16px; max-width: 100%; } }
      `}</style>
    </div>
  );
}

export default FoodWrappingPaperBanner;
