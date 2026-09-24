import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useState } from "react";
import { addToCart } from "../../utils/cart";
import { getProductDisplayName } from "../listing/productDisplay";
import { useBrands } from "../../context/BrandContext";
import { cdn } from "../../lib/cdn";
import WishlistButton from "../common/WishlistButton";

function TopCard({ item }) {
  const { brandNameById } = useBrands();
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();

  useEffect(() => {
    //console.log(item);
  });

  const handleCart = async (e) => {
    e.stopPropagation();
    const result = await addToCart(item?.product, quantity, item?.newPrice);
    if (result) {
      router.push("/my-cart");
    }
  };

  const handleViewProduct = () => {
    const productId = item?.slug;
    const url = `/${productId}`;
    const newTab = window.open(url, "_blank");

    // Focus on the new tab if it was successfully opened
    if (newTab) {
      newTab.focus();
    }
  };

  return (
    <>
    <div
      className="top-card d-flex flex-column justify-content-start align-items-center"
      style={{
        width: "160px",
        height: "280px",
        cursor: "pointer",
        marginLeft: "65px",
      }}
      onClick={handleViewProduct}
    >
      <div
        className="top-card-media d-flex justify-content-center align-items-center bg-light"
        style={{
          border: "none",
          borderRadius: "100px",
          backgroundColor: "#808080",
          boxShadow: "2px 18px 18px #F5F5F9 ",
          cursor: "pointer",
          padding: "30px",
          position: "relative",
        }}
      >
        <img
          src={item?.images?.[0]?.image || cdn("/pp_logo_1.png")}
          alt={item?.name || "Product image"}
          style={{ width: "120px", height: "120px" }}
        />
        <WishlistButton product={item} size="sm" />
      </div>
      <div className="mt-4 d-flex justify-content-center align-items-center">
        <p className="landing-toptext" style={{ textTransform: "capitalize" }}>
          {getProductDisplayName(item, { brandNameById })}
        </p>
      </div>
    </div>
      <style jsx>{`
        .landing-toptext { color: var(--text, #666); text-align: center; font-family: "Montserrat", sans-serif; font-size: 15px; font-style: normal; font-weight: 700; line-height: 20px; transition: color 0.25s ease; }

        /* Hover lift — same easing as the category cards on the home page. */
        .top-card-media { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease; }
        .top-card:hover .top-card-media { transform: translateY(-8px); box-shadow: 2px 22px 26px #e8e8f2; }
        .top-card-media img { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .top-card:hover .top-card-media img { transform: scale(1.06); }
        .top-card:hover .landing-toptext { color: #182c5a; }

        @media (prefers-reduced-motion: reduce) {
          .top-card-media, .top-card-media img, .landing-toptext { transition: none; }
          .top-card:hover .top-card-media, .top-card:hover .top-card-media img { transform: none; }
        }
      `}</style>
    </>
  );
}

export default TopCard;
