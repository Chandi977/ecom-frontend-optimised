import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useState } from "react";
import { addToCart } from "../../utils/cart";
import { getProductDisplayName } from "../listing/productDisplay";

function DealsCardMobile({ item }) {
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

    // Optionally, navigate to the URL using router.push
    // router.push(url);
  };

  return (
    <>
    <div
      className="d-flex flex-column justify-content-start align-items-center "
      style={{
        width: "227px",
        height: "320px",
        border: "1px solid #EDEDED",
        cursor: "pointer",
        margin: "0 auto",
      }}
      onClick={handleViewProduct}
    >
      <div
        className="d-flex justify-content-center align-items-center bg-light"
        style={{
          position: "relative",
          height: "170px",
          width: "227px",
        }}
      >
        <img
          src={item?.images?.[0]?.image || "/pp_logo_1.png"}
          alt={item?.name || "Product image"}
          style={{ width: "150px", height: "150px" }}
        />
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
          <div
            className="d-flex flex-column "
            style={{ width: "25px", height: "24px", textAlign: "center" }}
          >
            <p className="landing-offtext">
              {Math.round(
                ((item?.priceList?.[0]?.MRP - item?.priceList?.[0]?.SP) /
                  item?.priceList?.[0]?.MRP) *
                  100,
              )}
              %
              <br />
              OFF
            </p>
          </div>
        </div>
      </div>
      <div
        className="d-flex flex-column justify-content-evenly align-items-between"
        style={{ height: "190px", width: "227px" }}
      >
        <div
          className="row p-0 m-0"
          style={{ height: "65px", textAlign: "center" }}
        >
          <p
            className="landing-toptext"
            style={{
              marginTop: "8px",
              paddingInline: "6px",
              textTransform: "capitalize",
              textAlign: "center",
            }}
          >
            {getProductDisplayName(item)}
          </p>
        </div>
        <div
          className="row mx-3"
          style={{ height: "1px", backgroundColor: "#EDEDED" }}
        ></div>
      </div>
      <div style={{ display: "flex", flexDirection: "row", gap: "12px" }}>
        <div className=" m-0 d-flex flex-row align-items-center justify-content-start">
          <s>
            <p className="landing-pricetext">₹{item?.priceList?.[0]?.MRP}</p>
          </s>
        </div>

        <div className=" m-0 d-flex flex-row align-items-center justify-content-start">
          <p className="landing-pricetext" style={{ fontWeight: "600" }}>
            ₹{Math.round(item?.priceList?.[0]?.SP)}
          </p>
        </div>
      </div>

      <button
        className="landing-packagebtn"
        style={{
          width: "227px",
          height: "41px",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => router.push(`/${item?.slug}`)}
      >
        View Product
      </button>
    </div>
      <style jsx>{`
        .landing-offtext { color: var(--white, #fff); padding: 0; margin: 0; text-align: center; font-family: Montserrat; font-size: 10px; font-style: normal; font-weight: 600; line-height: 12px; }
        .landing-toptext { color: var(--text, #666); text-align: center; font-family: "Montserrat", sans-serif; font-size: 15px; font-style: normal; font-weight: 700; line-height: 20px; }
        .landing-pricetext { color: #249b3e; font-family: Montserrat; font-size: 16px; font-style: normal; font-weight: 400; line-height: 18px; }
        .landing-packagebtn { border: 0; color: #fff; text-align: center; font-family: Montserrat; font-size: 18px; font-style: normal; font-weight: 400; line-height: 20px; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 10px; flex-shrink: 0; background-color: #182c5a; transition: background-color 0.2s ease-out; }
        .landing-packagebtn:hover { background-color: #e92227; }
      `}</style>
    </>
  );
}

export default DealsCardMobile;
