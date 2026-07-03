import React, { useEffect, useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import {
  addToFav,
  getFav,
  removeFromFav,
  WISHLIST_UPDATED_EVENT,
} from "../../utils/favourites";
import ProductCardSkeleton from "./ProductCardSkeleton";
import { getProductDisplayName } from "./productDisplay";
import { useBrands } from "../../context/BrandContext";
import {
  formatCurrency,
  getProductImageSrc,
  getPrimaryPriceTier,
} from "../../utils/productCatalog";

type WishlistEntry = { product?: { _id?: string } };

function ListingCard({ item }: { item?: any }) {
  const { brandNameById } = useBrands();
  const [favourite, setFavourite] = useState<WishlistEntry[]>([]);
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [final, setFinal] = useState(0);

  const checkFav = (id) => {
    const temp = favourite?.map((x) => x?.product?._id).indexOf(id);
    if (temp === -1 || temp === undefined || temp === null) {
      return false;
    }
    return true;
  };

  const getFavourite = async () => {
    const result = await getFav();
    setFavourite(Array.isArray(result) ? result : []);
  };

  useEffect(() => {
    getFavourite();
    if (item) {
      const tier = getPrimaryPriceTier(item);
      const priceForOne = tier.sellingPrice / Math.max(1, tier.number);
      setPrice(priceForOne);
      setQuantity(tier.number);
      setFinal(tier.sellingPrice);
    }
  }, [item]);

  useEffect(() => {
    const handleWishlistUpdate = () => {
      getFavourite();
    };

    window.addEventListener(WISHLIST_UPDATED_EVENT, handleWishlistUpdate);
    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, handleWishlistUpdate);
    };
  }, []);

  const handleFavourite = async (e, product) => {
    e.stopPropagation();
    const temp = favourite?.map((x) => x?.product?._id).indexOf(product?._id);
    if (temp === -1 || temp === undefined || temp === null) {
      await addToFav(product);
      getFavourite();
    } else {
      await removeFromFav(product?._id);
      getFavourite();
    }
  };

  const handleViewProduct = () => {
    const productId = item?.slug;
    const url = `/${productId}`;
    const newTab = window.open(url, "_blank");

    if (newTab) {
      newTab.focus();
    }
  };

  if (!item) {
    return <ProductCardSkeleton variant="mobile" />;
  }

  return (
    <div className="tw-flex tw-flex-col tw-w-full tw-min-h-[288px] tw-bg-[#f9f9f9]">
      <div className="tw-relative tw-flex tw-justify-center tw-items-center tw-w-full tw-bg-[#f9f9f9] tw-overflow-hidden" style={{ height: '150px' }}>
        <div style={{ paddingTop: '16px' }}>
          <Image
            src={getProductImageSrc(item)}
            alt={item?.name || "Product image"}
            className="tw-object-contain tw-cursor-pointer"
            width={110}
            height={103}
            loading="lazy"
            decoding="async"
            onClick={handleViewProduct}
            style={{ objectFit: "contain" }}
          />
        </div>
        <div className="tw-absolute tw-flex tw-justify-center tw-items-center tw-w-7 tw-h-7 tw-rounded-full tw-bg-white" style={{ top: '12px', right: '10px' }}>
          <div
            className="d-flex flex-column justify-content-center align-items-center"
            style={{ width: "19px", height: "19px", borderRadius: "25px" }}
          >
            <FontAwesomeIcon
              icon={faHeart}
              className="tw-w-[15px] tw-h-[15px] tw-cursor-pointer"
              style={{ color: checkFav(item?._id) ? "red" : "grey" }}
              onClick={(e) => handleFavourite(e, item)}
            />
          </div>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-w-full tw-bg-[#f9f9f9] tw-flex-1" style={{ justifyContent: 'space-between', gap: '10px', padding: '14px 12px 10px' }}>
        <div style={{ minHeight: '72px' }}>
          <p className="listing-title" onClick={handleViewProduct}>
            {getProductDisplayName(item, { brandNameById })}
          </p>
        </div>
        <div className="tw-flex tw-justify-center tw-items-center" style={{ minHeight: '28px' }}>
          <p className="listing-price">{formatCurrency(final)}</p>
        </div>
      </div>

      <button className="listing-view-btn" onClick={handleViewProduct}>
        View Product
      </button>
      <style jsx>{`
        .listing-title {
          display: -webkit-box;
          margin: 0;
          overflow: hidden;
          color: #1f2937;
          font-family: "Montserrat", sans-serif;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.2;
          text-align: center;
          text-transform: capitalize;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
          cursor: pointer;
        }
        .listing-price {
          margin: 0;
          color: #e92227;
          font-family: "Montserrat", sans-serif;
          font-size: 14px;
          font-weight: 600;
          line-height: 1;
          text-align: center;
        }
        .listing-view-btn {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          min-height: 38px;
          border: 0;
          padding: 10px 12px;
          background: #182c5a;
          color: #fff;
          font-family: "Montserrat", sans-serif;
          font-size: 11px;
          font-weight: 600;
          line-height: 1;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          white-space: nowrap;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

export default ListingCard;
