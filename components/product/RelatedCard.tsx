import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { addToCart } from "../../utils/cart";
import {
  formatCurrency,
  getProductImageSrc,
  getPrimaryPriceTier,
} from "../../utils/productCatalog";

function RelatedCard({ product }) {
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [total, setTotal] = useState(0);

  const handleData = () => {
    const tier = getPrimaryPriceTier(product);
    const packSize = Math.max(1, tier.number);
    setTotal(tier.sellingPrice);
    setPrice(tier.sellingPrice / packSize);
    setQuantity(packSize);
  };

  useEffect(() => {
    handleData();
  }, [product]);

  const handleCart = async (e) => {
    e.stopPropagation();
    await addToCart(product, quantity, price);
  };

  const handleViewProduct = () => {
    const productId = product?.slug;
    const url = `/${productId}`;
    const newTab = window.open(url, "_blank");
    if (newTab) {
      newTab.focus();
    }
  };

  const router = useRouter();

  return (
    <>
      <div
        className="d-flex justify-content-center align-items-center bg-light tw-overflow-hidden"
        style={{
          position: "relative",
          height: "170px",
          width: "100%",
          padding: "10px",
        }}
      >
        <Image
          src={getProductImageSrc(product)}
          alt={product?.name || "Product image"}
          width={180}
          height={150}
          loading="lazy"
          style={{ objectFit: "contain", maxHeight: "150px" }}
        />
      </div>
      <div
        className="d-flex flex-column justify-content-between align-items-center bg-light"
        style={{ height: "150px", width: "100%", padding: "15px 10px 10px 10px" }}
      >
        <div className="w-100" style={{ height: "65px", overflow: "hidden" }}>
          <p
            className="px-2"
            style={{
              fontSize: "15px",
              fontWeight: 500,
              lineHeight: "20px",
              textTransform: "capitalize",
              textAlign: "center",
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {product?.brand?.name} {product?.name} {product?.model}
          </p>
        </div>
        <div
          className="w-100 d-flex flex-row align-items-center justify-content-center"
          style={{ height: "40px", gap: "10px" }}
        >
          <span
            style={{
              fontSize: "14px",
              textDecoration: "line-through",
              color: "#7f7f7f",
              fontWeight: 500,
            }}
          >
            {formatCurrency(getPrimaryPriceTier(product).mrp)}
          </span>
          <span
            className="tw-prod-pricesecondtext"
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#249b3e",
            }}
          >
            {formatCurrency(total)}
          </span>
        </div>
      </div>
      <button
        className="tw-prod-packagebtn"
        style={{
          width: "100%",
          height: "45px",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={handleViewProduct}
      >
        View Product
      </button>
      <style jsx>{`
        .tw-prod-pricesecondtext {
          color: #249b3e;
          font-family: Montserrat;
          font-size: 16px;
          font-style: normal;
          font-weight: 400;
          line-height: 18px;
        }
        .tw-prod-packagebtn {
          border: 0;
          color: #fff;
          text-align: center;
          font-size: 14px;
          font-style: normal;
          font-weight: 600;
          line-height: 20px;
          text-transform: uppercase;
          display: flex;
          padding: 12px 24px;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          background-color: #182c5a;
          transition: background-color 0.2s ease;
        }
        .tw-prod-packagebtn:hover {
          background-color: #e92227;
        }
      `}</style>
    </>
  );
}

export default RelatedCard;
