import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { addToCart } from "../../utils/cart";
import {
  addToFav,
  getFav,
  removeFromFav,
  WISHLIST_UPDATED_EVENT,
} from "../../utils/favourites";
import {
  formatCurrency,
  getProductImageSrc,
  getPrimaryPriceTier,
  getAvailableStock,
} from "../../utils/productCatalog";

type WishlistEntry = { product?: { _id?: string } };

function RelatedCard({ product }) {
  const [favourite, setFavourite] = useState<WishlistEntry[]>([]);
  const [cartQty, setCartQty] = useState(1);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  const getFavourite = async () => {
    const result = await getFav();
    setFavourite(Array.isArray(result) ? result : []);
  };

  const handleData = () => {
    const tier = getPrimaryPriceTier(product);
    setTotal(tier.sellingPrice);
  };

  useEffect(() => {
    handleData();
    getFavourite();
  }, [product]);

  useEffect(() => {
    const handleWishlistUpdate = () => {
      getFavourite();
    };
    window.addEventListener(WISHLIST_UPDATED_EVENT, handleWishlistUpdate);
    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, handleWishlistUpdate);
    };
  }, []);

  const checkFav = (id) => {
    const temp = favourite?.map((x) => x?.product?._id).indexOf(id);
    return temp !== -1 && temp !== undefined && temp !== null;
  };

  const handleFavourite = async (e, prod) => {
    e.stopPropagation();
    const temp = favourite?.map((x) => x?.product?._id).indexOf(prod?._id);
    if (temp === -1 || temp === undefined || temp === null) {
      await addToFav(prod);
      getFavourite();
    } else {
      await removeFromFav(prod?._id);
      getFavourite();
    }
  };

  const handleCartAction = async (e) => {
    e.stopPropagation();
    const tier = getPrimaryPriceTier(product);
    const packSize = Math.max(1, tier.number);
    const price = tier.sellingPrice;
    const packWeight = Number(tier.packWeight) || 0;
    const stock = getAvailableStock(product);
    const brandId = (product?.brand as any)?._id || product?.brand;
    const categoryId = product?.category;

    await addToCart(
      product,
      cartQty,
      price,
      packWeight,
      packSize,
      packSize,
      brandId,
      categoryId,
      stock
    );
  };

  return (
    <div className="related-card tw-relative tw-w-full tw-h-full tw-flex tw-flex-col tw-bg-white">
      {/* Favorite heart overlay */}
      <button
        onClick={(e) => handleFavourite(e, product)}
        className="tw-absolute tw-top-3 tw-right-3 tw-z-10 tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-bg-white tw-border tw-border-solid tw-border-gray-200 tw-rounded-full tw-shadow-sm hover:tw-scale-105 active:tw-scale-95 tw-transition-all tw-cursor-pointer"
        style={{ border: "1px solid #ebebeb" }}
      >
        {checkFav(product?._id) ? (
          <FontAwesomeIcon icon={faHeart} style={{ color: "red", fontSize: "14px" }} />
        ) : (
          <svg className="tw-w-4 tw-h-4 tw-text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        )}
      </button>

      {/* Image container */}
      <div
        className="tw-flex tw-justify-center tw-items-center tw-bg-white tw-w-full tw-p-1 tw-overflow-hidden"
        style={{ height: "300px" }}
      >
        <Image
          src={getProductImageSrc(product)}
          alt={product?.name || "Product image"}
          width={300}
          height={285}
          loading="lazy"
          style={{ objectFit: "contain", maxHeight: "285px", maxWidth: "100%", width: "auto" }}
        />
      </div>

      {/* Card Info */}
      <div className="tw-p-3 tw-pt-1.5 tw-flex tw-flex-col tw-items-center tw-flex-1 tw-justify-between tw-bg-white tw-w-full">
        <div className="tw-flex tw-flex-col tw-items-center tw-w-full tw-gap-1.5">
          <p className="tw-text-gray-800 tw-text-[14px] tw-font-semibold tw-text-center tw-mb-0 tw-line-clamp-2 tw-h-[40px] tw-leading-tight">
            {product?.brand?.name} {product?.name}
          </p>
          {product?.model && (
            <span className="tw-text-[10px] tw-text-gray-500 tw-bg-gray-100 tw-px-2 tw-py-0.5 tw-rounded tw-border tw-border-solid tw-border-gray-200 tw-mb-0 tw-max-w-full tw-truncate">
              {product.model}
            </span>
          )}
          <div className="tw-flex tw-flex-row tw-items-center tw-gap-3 tw-mb-0">
            <span className="tw-text-gray-400 tw-text-[13px] tw-line-through">
              {formatCurrency(getPrimaryPriceTier(product).mrp)}
            </span>
            <span className="tw-text-[#e92227] tw-text-[16px] tw-font-bold">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Quantity selector and ADD TO CART action row */}
        <div className="tw-flex tw-flex-row tw-w-full tw-gap-2 tw-items-center tw-mt-auto">
          {/* Quantity selector */}
          <div className="tw-flex tw-flex-row tw-items-center tw-border tw-border-solid tw-border-gray-200 tw-rounded-lg tw-overflow-hidden tw-h-[36px]" style={{ border: "1px solid #d1d5db" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCartQty(Math.max(1, cartQty - 1));
              }}
              className="tw-w-[28px] tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-gray-50 tw-border-0 tw-text-gray-600 tw-font-bold tw-text-sm hover:tw-bg-gray-100 tw-cursor-pointer"
            >
              -
            </button>
            <div className="tw-w-[32px] tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-white tw-border-x tw-border-solid tw-border-gray-200" style={{ borderInline: "1px solid #d1d5db" }}>
              <span className="tw-text-gray-800 tw-font-semibold tw-text-sm">{cartQty}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCartQty(cartQty + 1);
              }}
              className="tw-w-[28px] tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-gray-50 tw-border-0 tw-text-gray-600 tw-font-bold tw-text-sm hover:tw-bg-gray-100 tw-cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Add to Cart button */}
          <button
            onClick={handleCartAction}
            className="tw-flex-1 tw-border-0 tw-text-white tw-text-center tw-text-[12px] tw-font-semibold tw-flex tw-h-[36px] tw-items-center tw-justify-center tw-gap-[6px] tw-bg-[#182c5a] tw-rounded-lg hover:tw-bg-[#e92227] tw-transition-colors tw-cursor-pointer"
          >
            <svg className="tw-w-3.5 tw-h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            ADD TO CART
          </button>
        </div>
      </div>
    </div>
  );
}

export default RelatedCard;
