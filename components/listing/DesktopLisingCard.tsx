import React from "react";
import Image from "next/image";
import Skeleton from "@mui/material/Skeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useEffect } from "react";
import {
  addToFav,
  getFav,
  removeFromFav,
  WISHLIST_UPDATED_EVENT,
} from "../../utils/favourites";
import { addToCart } from "../../utils/cart";
import { useRouter } from "next/router";
import { getProductDisplayName } from "./productDisplay";
import {
  formatCurrency,
  getDiscountPercent,
  getProductImageSrc,
  getPrimaryPriceTier,
} from "../../utils/productCatalog";

type WishlistEntry = { product?: { _id?: string } };

function DesktopListingCard({ item }: { item?: any }) {
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

  const handleViewProduct = () => {
    const productId = item?.slug;
    const url = `/${productId}`;
    const newTab = window.open(url, "_blank");

    // Focus on the new tab if it was successfully opened
    if (newTab) {
      newTab.focus();
    }
  };

  const handleCart = async (e) => {
    e.stopPropagation();
    const result = await addToCart(item, quantity, price);
  };
  const router = useRouter();
  const tier = item ? getPrimaryPriceTier(item) : null;
  const discountPercent = tier
    ? getDiscountPercent(tier.sellingPrice, tier.mrp)
    : 0;
  if (!item) {
    return (
      <>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            className="d-flex justify-content-center align-items-center bg-light "
            style={{ position: "relative", height: "200px", width: "300px" }}
          >
            <Skeleton variant="rectangular" width={250} height={150} />
          </div>
          <div
            className="d-flex flex-column justify-content-evenly align-items-center bg-light"
            style={{ height: "120px", width: "300px", paddingTop: "20px" }}
          >
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
          <Skeleton variant="rectangular" height={50} width={300} />
        </div>
      </>
    );
  }
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          className="d-flex justify-content-center align-items-center bg-light tw-overflow-hidden"
          style={{
            position: "relative",
            height: "200px",
            width: "300px",
            cursor: "pointer",
          }}
          // onClick={() => window.open(`/product?id=${item?._id}`, '_blank')}
        >
          <div className="d-flex align-items-center justify-content-center" style={{ height: "100%", width: "100%", padding: "10px" }}>
            <Image
              src={getProductImageSrc(item)}
              alt={item?.name || "Product image"}
              width={250}
              height={180}
              loading="lazy"
              decoding="async"
              onClick={handleViewProduct}
              style={{ objectFit: "contain", maxHeight: "180px" }}
            />
          </div>
          <div
            className="d-flex flex-column justify-content-center align-items-center"
            style={{
              position: "absolute",
              left: "5%",
              top: "5%",
              borderRadius: "25px",
              width: "24px",
              height: "24px",
              backgroundColor: "white",
            }}
          >
            <div
              className="d-flex flex-column justify-content-center align-items-center"
              style={{
                width: "19px",
                height: "19px",
                borderRadius: "25px",
              }}
            >
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
          </div>

          {tier && tier.mrp > tier.sellingPrice && (
            <div
              className="d-flex flex-column justify-content-center align-items-center"
              style={{
                backgroundColor: "#E92227",
                position: "absolute",
                right: "0px",
                top: "0%",
                width: "41px",
                height: "43px",
                borderBottomLeftRadius: "9px",
              }}
            >
              {/* Discount Tag */}
              <div
                className="d-flex flex-column "
                style={{ width: "25px", height: "24px", textAlign: "center" }}
              >
                <p className="desk-offtext">
                  {discountPercent}
                  %
                  <br />
                  OFF
                </p>
              </div>
            </div>
          )}
        </div>

        <div
          className="d-flex flex-column justify-content-evenly align-items-center bg-light"
          style={{
            height: "120px",
            width: "300px",
            cursor: "pointer",
            paddingTop: "20px",
            paddingBottom: "20px",
          }}
        >
          <div className="row p-0 m-0" style={{ height: "70px" }}>
            <p
              className="px-3"
              style={{
                fontSize: "16px",
                fontWeight: 500,
                lineHeight: "25px",
                textTransform: "capitalize",
                textAlign: "center",
              }}
              onClick={handleViewProduct}
            >
              {getProductDisplayName(item, { includePack: true })}
            </p>
          </div>
          <div
            className="px-3 mb-3 d-flex flex-column align-items-start justify-content-center"
            style={{ height: "40px" }}
          >
            {/* <p className={styles.pricetext}>₹{final}</p> */}
            <div style={{ display: "flex", flexDirection: "row", gap: "12px" }}>
              <div className=" m-0 d-flex flex-row align-items-center justify-content-start">
                <s>
                  <p className="desk-pricetext1">
                    {formatCurrency(tier?.mrp)}
                  </p>
                </s>
              </div>

              <div className=" m-0 d-flex flex-row align-items-center justify-content-start">
                <p className="desk-pricetext" style={{ fontWeight: "600" }}>
                  {formatCurrency(final)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <button
          className="desk-packagebtn"
          style={{
            fontSize: "14px",
            height: "50px",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            width: "300px",
          }}
          onClick={handleViewProduct}
        >
          View Product
        </button>
        <style jsx>{`
          .desk-offtext {
            color: var(--white, #FFF);
            padding: 0px;
            margin: 0px;
            text-align: center;
            font-family: Montserrat;
            font-size: 10px;
            font-style: normal;
            font-weight: 600;
            line-height: 12px;
          }
          .desk-pricetext1 {
            color: #249b3e;
            font-size: 18px;
            font-style: normal;
            font-weight: 600;
            line-height: 30.508px;
          }
          @media (max-width: 900px) {
            .desk-pricetext1 { font-size: 9px; line-height: 10px; }
          }
          .desk-pricetext {
            color: #249b3e;
            font-size: 27.119px;
            font-style: normal;
            font-weight: 600;
            line-height: 30.508px;
          }
          @media (max-width: 900px) {
            .desk-pricetext { font-size: 11px; line-height: 10px; }
          }
          .desk-packagebtn {
            border: 0;
            color: #fff;
            text-align: center;
            font-family: Montserrat;
            font-size: 13px;
            font-style: normal;
            font-weight: 400;
            line-height: 20px;
            text-transform: uppercase;
            display: flex;
            width: 110px;
            height: 33px;
            padding: 14px 36px;
            align-items: center;
            justify-content: center;
            gap: 10px;
            flex-shrink: 0;
            background-color: #182c5a;
          }
          .desk-packagebtn:hover { background-color: #E92227; }
        `}</style>
      </div>
    </>
  );
}

export default DesktopListingCard;
