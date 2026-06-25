import React from "react";
import Image from "next/image";

function Banner() {
  return (
    <div
      className={"container-fluid p-0 m-0 orders-displayimage"}
      style={{
        position: "relative",
        minHeight: "450px",
        backgroundColor: "black",
      }}
    >
      <div className="w-100 h-100">
        <Image
          src="/backgroundslider.png"
          alt="My Orders Banner"
          fill
          priority
          sizes="100vw"
          className="p-0"
          style={{
            objectFit: "cover",
            background: "#2E436F",
            opacity: "0.76000001430511475",
          }}
        />
      </div>
      <div className="orders-content">
        <div>
          <h1 className="orders-sliderheader">MY ORDERS</h1>
          <p className="orders-slidertext">
            Stay updated with your recent purchases.
          </p>
        </div>
      </div>
      <style jsx>{`
        .orders-displayimage { width: 100%; overflow: hidden; }

        .orders-content { position: absolute; top: 20%; left: 10%; }
        @media (max-width: 700px) { .orders-content { top: 6%; left: 5%; } }

        .orders-sliderheader { color: #fff; font-family: Montserrat; font-size: 72px; font-style: normal; font-weight: 700; line-height: 71px; margin-top: 85px; }
        @media (max-width: 700px) { .orders-sliderheader { font-size: 52px; } }

        .orders-slidertext { color: #fff; font-family: Montserrat; font-size: 20px; font-style: normal; font-weight: 400; line-height: 25.669px; padding-left: 4px; margin-top: 10px; margin-bottom: 20px; }
      `}</style>
    </div>
  );
}

export default Banner;
