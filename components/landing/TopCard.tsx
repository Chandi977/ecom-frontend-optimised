import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useState } from "react";
import { addToCart } from "../../utils/cart";
import { getProductDisplayName } from "../listing/productDisplay";
import { useBrands } from "../../context/BrandContext";

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
      className="d-flex flex-column justify-content-start align-items-center"
      style={{
        width: "160px",
        height: "280px",
        cursor: "pointer",
        marginLeft: "65px",
      }}
      onClick={handleViewProduct}
    >
      <div
        className="d-flex justify-content-center align-items-center bg-light"
        style={{
          border: "none",
          borderRadius: "100px",
          backgroundColor: "#808080",
          boxShadow: "2px 18px 18px #F5F5F9 ",
          cursor: "pointer",
          padding: "30px",
        }}
      >
        <img
          src={item?.images?.[0]?.image || "/pp_logo_1.png"}
          alt={item?.name || "Product image"}
          style={{ width: "120px", height: "120px" }}
        />
      </div>
      <div className="mt-4 d-flex justify-content-center align-items-center">
        <p className="landing-toptext" style={{ textTransform: "capitalize" }}>
          {getProductDisplayName(item, { brandNameById })}
        </p>
      </div>
    </div>
      <style jsx>{`
        .landing-toptext { color: var(--text, #666); text-align: center; font-family: "Montserrat", sans-serif; font-size: 15px; font-style: normal; font-weight: 700; line-height: 20px; }
      `}</style>
    </>
  );
}

export default TopCard;
