import React from "react";
import { useRouter } from "next/router";
import { useState } from "react";
import ProductCardSkeleton from "./ProductCardSkeleton";
import { useEffect } from "react";
import { addToCart } from "../../utils/cart";
import { getProductDisplayName } from "./productDisplay";
import { useBrands } from "../../context/BrandContext";
import {
  formatCurrency,
  getProductImageSrc,
  getPrimaryPriceTier,
} from "../../utils/productCatalog";
import ProductImage from "../product/ProductImage";
import WishlistButton from "../common/WishlistButton";

function ListingCardDesktop({ item }: { item?: any }) {
  const { brandNameById } = useBrands();
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [final, setFinal] = useState(0);
  useEffect(() => {
    if (item) {
      const tier = getPrimaryPriceTier(item);
      const priceForOne = tier.sellingPrice / Math.max(1, tier.number);
      setPrice(priceForOne);
      setQuantity(tier.number);
      setFinal(tier.sellingPrice);
    }
  }, [item]);

  const handleCart = async (e) => {
    e.stopPropagation();
    const result = await addToCart(item, quantity, price);
  };
  const router = useRouter();
  const handleViewProduct = () => {
    const productId = item?.slug;
    if (!productId) {
      return;
    }

    const url = `/${productId}`;
    const newTab = window.open(url, "_blank");

    if (newTab) {
      newTab.focus();
    }
  };

  if (!item) {
    return <ProductCardSkeleton variant="list" />;
  }
  return (
    <>
      <div
        className="col-4 d-flex flex-column align-items-center justify-content-center"
        style={{ cursor: "pointer" }}
        onClick={handleViewProduct}
      >
        <div className="p-0 d-flex flex-column align-items-start justify-content-start">
          <ProductImage
            src={getProductImageSrc(item)}
            alt={item?.name || "Product image"}
            width={180}
            height={180}
            loading="lazy"
            decoding="async"
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>
      <div className="col-8 py-4 px-0 d-flex flex-column align-items-start justify-content-start">
        <div className="p-0 m-0 w-100 d-flex flex-row justify-content-between">
          <p style={{ fontSize: "17px" }}>
            {getProductDisplayName(item, { brandNameById })}
            <br />
            {/* Box NC19 */}
          </p>
          <WishlistButton product={item} variant="inline" size="sm" />
        </div>

        <p className="listing-desk-pricetext">{formatCurrency(final)}</p>
        <button className="listing-desk-addtocart" onClick={handleViewProduct}>
          View Product
        </button>
        <style jsx>{`
          .listing-desk-pricetext {
            color: #17803d;
            font-size: 27.119px;
            font-style: normal;
            font-weight: 600;
            line-height: 30.508px;
          }
          @media (max-width: 900px) {
            .listing-desk-pricetext {
              font-size: 11px;
              line-height: 10px;
            }
          }
          .listing-desk-addtocart {
            border: 0;
            color: #fff;
            text-align: center;
            font-size: 16px;
            font-style: normal;
            font-weight: 500;
            line-height: 24px;
            text-transform: uppercase;
            display: flex;
            width: 234px;
            height: 41px;
            padding: 14px 36px;
            align-items: center;
            justify-content: center;
            gap: 10px;
            flex-shrink: 0;
            background-color: #182c5a;
          }
          .listing-desk-addtocart:hover { background-color: #E92227; }
        `}</style>
      </div>
    </>
  );
}

export default ListingCardDesktop;
