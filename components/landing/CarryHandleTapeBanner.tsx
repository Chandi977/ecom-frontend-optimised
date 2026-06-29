import React from "react";

function CarryHandleTapeBanner() {
  return (
    <div
      className="container-fluid p-0 m-0 tw-w-full tw-overflow-hidden"
      style={{
        position: "relative",
      }}
    >
      <div className="w-100 h-100">
        <img
          src="/bannercarryhandle.png"
          alt="Carry Handle Tapes Banner"
          className="p-0 tw-block tw-w-full tw-h-auto tw-object-cover"
          style={{
            width: "100%",
            objectFit: "cover",
          }}
        />
      </div>
      <div className="banner-content">
        <div className="d-flex flex-column justify-content-start">
          <h1 className="banner-corrugated-header">CARRY HANDLE TAPES</h1>
        </div>
      </div>
      <style jsx>{`
        .banner-content { position: absolute; top: 40%; left: 15%; }
        @media (max-width: 700px) { .banner-content { top: 50%; left: 50%; transform: translate(-50%, -50%); } }
        .banner-corrugated-header { color: #14254c; font-family: Montserrat; font-size: 42px; font-style: normal; font-weight: 700; line-height: 52px; }
        @media (max-width: 700px) { .banner-corrugated-header { font-size: 24px; line-height: 36px; } }
      `}</style>
    </div>
  );
}

export default CarryHandleTapeBanner;
