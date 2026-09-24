import React from "react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useEffect } from "react";
import { addToCart } from "../../utils/cart";
import { getProductDisplayName } from "../listing/productDisplay";
import { cdn } from "../../lib/cdn";
import WishlistButton from "../common/WishlistButton";

function LandingBrandCard({ item }) {
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [final, setFinal] = useState(0);

  useEffect(() => {
    if (item) {
      if (item?.priceList?.length > 0) {
        const price = item?.priceList?.[0]?.SP;
        const number = item?.priceList?.[0]?.number;
        const priceForOne = price / number;
        setPrice(priceForOne);
        setQuantity(item?.priceList[0]?.number);
        const ff = priceForOne * item?.priceList[0]?.number;
        setFinal(Number(ff.toFixed(0)));
      } else {
        setPrice(item?.price);
        setQuantity(1);
      }
    }
  }, [item]);

  const handleCart = async (e) => {
    e.stopPropagation();
    const result = await addToCart(item, quantity, price);
  };

  const router = useRouter();
  //console.log(item);
  return (
    <>
    <div
      className={
        "d-flex flex-column justify-content-start align-items-center mx-md-0 mx-3"
      }
      style={{ width: "288px", height: "357px", cursor: "pointer" }}
      onClick={() => router.push(`/${item?.slug}`)}
    >
      <div
        className="d-flex justify-content-center align-items-center bg-light"
        style={{
          position: "relative",
          height: "210px",
          width: "288px",
        }}
      >
        <img
          src={item?.images?.[0]?.image || cdn("/pp_logo_1.png")}
          alt={item?.name || "Product image"}
          className="pt-4"
          style={{ width: "170px", height: "136px" }}
        />
        <WishlistButton product={item} size="sm" />
      </div>
      <div
        className="d-flex flex-column justify-content-evenly align-items-between bg-light"
        style={{ height: "130px", width: "288px" }}
      >
        <div className="row p-0 m-0" style={{ height: "50px" }}>
          <p
            className="px-3"
            style={{
              fontSize: "16px",
              fontWeight: 500,
              lineHeight: "21px",
              fontFamily: "Montserrat",
            }}
          >
            {getProductDisplayName(item, { includeBrand: false })}
          </p>
        </div>
        <div
          className="px-3 m-0 d-flex flex-row align-items-center justify-content-start"
          style={{ height: "50px" }}
        >
          <p className="landing-pricetext">₹{final}</p>
        </div>
      </div>
      <button
        className="landing-packagebtn"
        style={{
          width: "288px",
          height: "41px",
          justifyContent: "center",
          alignItems: "center",
        }}
        onClick={() => router.push(`/${item?.slug}`)}
      >
        View Product
      </button>
    </div>
      <style jsx>{`
        .landing-pricetext { color: #17803d; font-family: Montserrat; font-size: 16px; font-style: normal; font-weight: 400; line-height: 18px; }
        .landing-packagebtn { border: 0; color: #fff; text-align: center; font-family: Montserrat; font-size: 18px; font-style: normal; font-weight: 400; line-height: 20px; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 10px; flex-shrink: 0; background-color: #182c5a; transition: background-color 0.2s ease-out; }
        .landing-packagebtn:hover { background-color: #e92227; }
      `}</style>
    </>
  );
}

export default LandingBrandCard;
