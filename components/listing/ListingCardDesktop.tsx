import React from "react";
import Image from "next/image";
import Skeleton from "@mui/material/Skeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  addToFav,
  getFav,
  removeFromFav,
  WISHLIST_UPDATED_EVENT,
} from "../../utils/favourites";
import { useEffect } from "react";
import { addToCart } from "../../utils/cart";
import { getProductDisplayName } from "./productDisplay";
import {
  formatCurrency,
  getProductImageSrc,
  getPrimaryPriceTier,
} from "../../utils/productCatalog";

type WishlistEntry = { product?: { _id?: string } };

function ListingCardDesktop({ item }: { item?: any }) {
  const [favourite, setFavourite] = useState<WishlistEntry[]>([]);
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [final, setFinal] = useState(0);
  const checkFav = (id) => {
    const temp = favourite?.map((x) => x?.product?._id).indexOf(id);
    if (temp === -1 || temp === undefined || temp === null) {
      return false;
    } else {
      return true;
    }
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
    return (
      <>
        <div className="col-4 d-flex flex-column align-items-center justify-content-center">
          <Skeleton variant="rectangular" width={180} height={120} />
        </div>
        <div className="col-8 py-4 px-0 d-flex flex-column align-items-start justify-content-start">
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="rectangular" height={36} width="70%" />
        </div>
      </>
    );
  }
  return (
    <>
      <div
        className="col-4 d-flex flex-column align-items-center justify-content-center"
        style={{ cursor: "pointer" }}
        onClick={handleViewProduct}
      >
        <div className="p-0 d-flex flex-column align-items-start justify-content-start">
          <Image
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
            {getProductDisplayName(item)}
            <br />
            {/* Box NC19 */}
          </p>
          {checkFav(item?._id) ? (
            <FontAwesomeIcon
              icon={faHeart}
              style={{
                color: "red",
                width: "15px",
                height: "15px",
                paddingRight: "15px",
                cursor: "pointer",
              }}
              onClick={(e) => handleFavourite(e, item)}
            />
          ) : (
            <FontAwesomeIcon
              icon={faHeart}
              style={{
                color: "grey",
                width: "15px",
                height: "15px",
                paddingRight: "15px",
                cursor: "pointer",
              }}
              onClick={(e) => handleFavourite(e, item)}
            />
          )}
        </div>

        <p className="listing-desk-pricetext">{formatCurrency(final)}</p>
        <button className="listing-desk-addtocart" onClick={handleViewProduct}>
          View Product
        </button>
        <style jsx>{`
          .listing-desk-pricetext {
            color: #249b3e;
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
