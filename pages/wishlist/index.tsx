import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getFav,
  removeFromFav,
  WISHLIST_UPDATED_EVENT,
} from "../../utils/favourites";
import { addToCart } from "../../utils/cart";
import Head from "next/head";
import { useRouter } from "next/router";

const FavoritesPage = () => {
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getWishlistPriceData = (product) => {
    const defaultPrice = Array.isArray(product?.priceList)
      ? product.priceList[0]
      : null;

    return {
      price: Number(defaultPrice?.SP ?? product?.price ?? 0),
      packSize: Number(defaultPrice?.number ?? 1),
      packWeight: Number(defaultPrice?.pack_weight ?? 0),
      stock: Number(defaultPrice?.stock_quantity ?? 0),
    };
  };

  const fetchFavorites = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const favProducts = await getFav({ forceRefresh });
      setFavoriteProducts(Array.isArray(favProducts) ? favProducts : []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setFavoriteProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites(true);

    const handleWishlistUpdate = () => {
      fetchFavorites(false);
    };

    window.addEventListener(WISHLIST_UPDATED_EVENT, handleWishlistUpdate);
    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, handleWishlistUpdate);
    };
  }, []);

  const handleRemoveFavorite = async (product) => {
    try {
      const removed = await removeFromFav(product._id);
      if (removed) {
        setFavoriteProducts((prevProducts) =>
          prevProducts.filter(
            (favProduct) => favProduct.product._id !== product._id,
          ),
        );
        toast.success("Item removed from favorites.");
      } else {
        toast.error("Failed to remove item from favorites.");
      }
    } catch (error) {
      console.error("Error removing from favorites:", error);
    }
  };

  const handleCart = async (e, product) => {
    e.stopPropagation();

    const { price, packSize, packWeight, stock } = getWishlistPriceData(product);
    const brand =
      typeof product?.brand === "object" ? product?.brand?._id : product?.brand;
    const category =
      typeof product?.category === "object"
        ? product?.category?._id
        : product?.category;

    const result = await addToCart(
      product,
      1,
      price,
      packWeight,
      packSize,
      packSize,
      brand,
      category,
      stock,
    );

    if (result) {
      handleRemoveFavorite(product);
    }
  };

  return (
    <>
      <Head>
        <title>My Wishlist | store.prempackaging</title>
        <meta name="title" content="My Wishlist" />
        <meta
          name="description"
          content="Save your favourite packaging products to your Wishlist for quick access. Easily compare, track, and purchase your preferred items anytime."
        />
      </Head>
      <div style={{ marginTop: "0px", backgroundColor: "white" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "200px",
            flexDirection: "column",
          }}
        >
          <h1 style={{ color: "#182C5A" }}>Your Wishlist</h1>
          <div
            style={{
              width: "18%",
              height: "3px",
              backgroundColor: "rgb(233, 34, 39)",
            }}
          ></div>
        </div>
        {loading ? (
          <p
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "100px",
              paddingTop: "50px",
              fontSize: "24px",
              fontWeight: "600",
            }}
          >
            Loading wishlist...
          </p>
        ) : favoriteProducts.length === 0 ? (
          <p
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "100px",
              paddingTop: "50px",
              fontSize: "24px",
              fontWeight: "600",
            }}
          >
            No products have been wishlisted yet.
          </p>
        ) : (
          <div style={{ padding: "30px" }}>
            {favoriteProducts.map((favProduct) => {
              const product = favProduct?.product;
              const { price } = getWishlistPriceData(product);

              return (
                <div key={product?._id} style={{ paddingBlock: "20px" }}>
                  <div
                    className="row px-2 m-0 d-flex flex-row justify-content-between align-items-center"
                    style={{ border: "1px solid", gap: "10px" }}
                  >
                    <div className="col-6 d-flex flex-row justify-content-start align-items-center">
                      <div className="col-4 py-4">
                        <img
                          src={product?.images?.[0]?.image || "/pp_logo_1.png"}
                          alt={product?.name || "Wishlist product"}
                          width={164}
                          height={130}
                        />
                      </div>
                      <div className="col-8">
                        <p
                          style={{
                            fontSize: "17px",
                            textTransform: "capitalize",
                          }}
                        >
                          {product?.brand?.name || ""} {product?.name}{" "}
                          {product?.model}
                        </p>
                        <p className="tw-text-[#249b3e] pricetext-wl">₹{price}</p>
                      </div>
                    </div>
                    <div
                      className="col-6 d-flex flex-column justify-content-start align-items-center"
                      style={{ width: "fit-content" }}
                    >
                      <p style={{ width: "fit-content", fontSize: "16px" }}>
                        Item added on{" "}
                        {new Date(
                          favProduct?.updatedAt || product?.updatedAt,
                        ).toLocaleDateString()}
                      </p>

                      <div className="d-flex flex-row justify-content-start align-items-center">
                        <button
                          className=""
                          onClick={() =>
                            product?.slug && router.push(`/${product.slug}`)
                          }
                          style={{
                            width: "180px",
                            height: "41px",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#182C5A",
                            border: "none",
                            color: "white",
                          }}
                        >
                          View Product
                        </button>
                        <button
                          className=""
                          onClick={(e) => handleCart(e, product)}
                          style={{
                            width: "180px",
                            height: "41px",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#182C5A",
                            border: "none",
                            color: "white",
                            marginLeft: "12px",
                          }}
                        >
                          Add To Cart
                        </button>
                        <button
                          className="m-0 mx-3"
                          style={{
                            fontFeatureSettings: "'liga' off",
                            fontFamily: "Montserrat",
                            fontSize: "13px",
                            fontStyle: "normal",
                            fontWeight: "600",
                            lineHeight: "13.512px",
                            letterSpacing: "0.214px",
                            width: "180px",
                            height: "41px",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "rgb(233, 34, 39)",
                            color: "white",
                            border: "none",
                          }}
                          onClick={() => handleRemoveFavorite(product)}
                        >
                          Remove from Favorites
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style jsx>{`
.pricetext-wl {
  font-family: Montserrat;
  font-size: 28px;
  font-style: normal;
  font-weight: 600;
  line-height: 30px;
}
      `}</style>
    </>
  );
};

export default FavoritesPage;
