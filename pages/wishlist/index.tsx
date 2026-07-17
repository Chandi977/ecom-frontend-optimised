"use client";
import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
  FiHeart,
  FiTrash2,
  FiShoppingCart,
  FiEye,
  FiLoader,
  FiChevronRight,
  FiLogIn,
} from "react-icons/fi";
import {
  getFav,
  removeFromFav,
  WISHLIST_UPDATED_EVENT,
} from "../../utils/favourites";
import { addToCart } from "../../utils/cart";
import AccountLayout from "../../components/account/AccountLayout";

const WishlistContent = () => {
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);
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

  const formatAddedDate = (favProduct) => {
    const raw = favProduct?.updatedAt || favProduct?.product?.updatedAt;
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="wl-state-card">
        <FiLoader className="wl-spinner" />
        <span>Loading your wishlist...</span>
      </div>
    );
  }

  if (favoriteProducts.length === 0) {
    return (
      <div className="wl-state-card">
        <FiHeart className="wl-empty-icon" />
        <h2 className="wl-empty-title">Your wishlist is empty</h2>
        <p className="wl-empty-desc">
          Save your favourite packaging products here for quick access anytime.
        </p>
        <Link href="/" className="wl-browse-btn">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="wl-card">
      <header className="wl-card-header">
        <h2 className="wl-card-title">
          Saved Items{" "}
          <span className="wl-count">({favoriteProducts.length})</span>
        </h2>
      </header>

      <ul className="wl-list">
        {favoriteProducts.map((favProduct) => {
          const product = favProduct?.product;
          const { price } = getWishlistPriceData(product);
          const addedOn = formatAddedDate(favProduct);
          const productName = [
            typeof product?.brand === "object" ? product?.brand?.name : "",
            product?.name,
            product?.model,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <li className="wl-item" key={product?._id}>
              <button
                type="button"
                className="wl-item-image"
                onClick={() => product?.slug && router.push(`/${product.slug}`)}
                aria-label={`View ${productName || "product"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product?.images?.[0]?.image || "/pp_logo_1.png"}
                  alt={productName || "Wishlist product"}
                />
              </button>

              <div className="wl-item-info">
                <button
                  type="button"
                  className="wl-item-name"
                  onClick={() =>
                    product?.slug && router.push(`/${product.slug}`)
                  }
                >
                  {productName || "Product"}
                </button>
                <span className="wl-item-price">
                  ₹{Math.round(price).toLocaleString("en-IN")}
                </span>
                {addedOn && (
                  <span className="wl-item-added">Added on {addedOn}</span>
                )}
              </div>

              <div className="wl-item-actions">
                <button
                  type="button"
                  className="wl-action-btn primary"
                  onClick={(e) => handleCart(e, product)}
                >
                  <FiShoppingCart /> Add to Cart
                </button>
                <button
                  type="button"
                  className="wl-action-btn"
                  onClick={() =>
                    product?.slug && router.push(`/${product.slug}`)
                  }
                >
                  <FiEye /> View Product
                </button>
                <button
                  type="button"
                  className="wl-action-btn danger"
                  onClick={() => handleRemoveFavorite(product)}
                >
                  <FiTrash2 /> Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <style jsx global>{`
        .wl-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .wl-card-header {
          margin-bottom: 18px;
        }
        .wl-card-title {
          font-size: 18px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #0f172a;
          margin: 0;
        }
        .wl-count {
          color: #64748b;
          font-weight: 600;
        }

        .wl-state-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 10px;
          padding: 80px 24px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          color: #64748b;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .wl-spinner {
          font-size: 32px;
          animation: wl-spin 1.2s linear infinite;
        }
        @keyframes wl-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .wl-empty-icon {
          font-size: 42px;
          color: #94a3b8;
          margin-bottom: 6px;
        }
        .wl-empty-title {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .wl-empty-desc {
          font-size: 15px;
          color: #64748b;
          margin: 0 0 16px;
        }
        .wl-browse-btn {
          height: 44px;
          display: inline-flex;
          align-items: center;
          padding: 0 26px;
          background: #182c5a;
          color: #ffffff;
          border-radius: 8px;
          font-size: 14.5px;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.15s ease;
        }
        .wl-browse-btn:hover {
          background: #e92227;
          color: #ffffff;
        }

        .wl-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }
        .wl-item {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .wl-item:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }
        .wl-item:first-child {
          padding-top: 0;
        }

        .wl-item-image {
          width: 110px;
          height: 96px;
          flex-shrink: 0;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff;
          padding: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.15s ease;
        }
        .wl-item-image:hover {
          border-color: #182c5a;
        }
        .wl-item-image img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .wl-item-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }
        .wl-item-name {
          background: none;
          border: 0;
          padding: 0;
          text-align: left;
          font-size: 16.5px;
          font-weight: 700;
          color: #0f172a;
          text-transform: capitalize;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .wl-item-name:hover {
          color: #182c5a;
          text-decoration: underline;
        }
        .wl-item-price {
          font-size: 18px;
          font-weight: 800;
          color: #059669;
        }
        .wl-item-added {
          font-size: 13.5px;
          color: #64748b;
        }

        .wl-item-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }
        .wl-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 40px;
          min-width: 170px;
          padding: 0 16px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #182c5a;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease,
            color 0.15s ease;
        }
        .wl-action-btn:hover {
          border-color: #182c5a;
          background: #f8fafc;
        }
        .wl-action-btn.primary {
          background: #182c5a;
          border-color: #182c5a;
          color: #ffffff;
        }
        .wl-action-btn.primary:hover {
          background: #e92227;
          border-color: #e92227;
        }
        .wl-action-btn.danger {
          color: #dc2626;
        }
        .wl-action-btn.danger:hover {
          border-color: #dc2626;
          background: #fef2f2;
        }

        @media (max-width: 700px) {
          .wl-item {
            flex-direction: column;
            align-items: stretch;
          }
          .wl-item-image {
            width: 100%;
            height: 160px;
          }
          .wl-item-actions {
            flex-direction: row;
            flex-wrap: wrap;
          }
          .wl-action-btn {
            flex: 1;
            min-width: 130px;
          }
        }
      `}</style>
    </div>
  );
};

const WishlistPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem("PIToken")));
  }, []);

  const head = (
    <Head>
      <title>My Wishlist | store.prempackaging</title>
      <meta name="title" content="My Wishlist" />
      <meta
        name="description"
        content="Save your favourite packaging products to your Wishlist for quick access. Easily compare, track, and purchase your preferred items anytime."
      />
    </Head>
  );

  // Wait for the client auth check to avoid a hydration flash between layouts.
  if (isLoggedIn === null) {
    return (
      <>
        {head}
        <div style={{ minHeight: "60vh", background: "#f8fafc" }} />
      </>
    );
  }

  if (isLoggedIn) {
    return (
      <>
        {head}
        <AccountLayout
          title="My Wishlist"
          subtitle="Products you have saved for later"
          activeNav="wishlist"
        >
          {() => <WishlistContent />}
        </AccountLayout>
      </>
    );
  }

  // Guest view: same design without the account sidebar, plus a sign-in nudge.
  return (
    <>
      {head}
      <div className="wl-guest-root">
        <div className="wl-guest-wrap">
          <nav className="wl-guest-breadcrumb" aria-label="Breadcrumb">
            <Link href="/" className="wl-crumb-link">
              Home
            </Link>
            <FiChevronRight className="wl-crumb-separator" />
            <span className="wl-crumb-current">My Wishlist</span>
          </nav>

          <header className="wl-guest-header">
            <h1 className="wl-guest-title">My Wishlist</h1>
            <p className="wl-guest-subtitle">
              Products you have saved for later
            </p>
          </header>

          <div className="wl-signin-banner">
            <FiLogIn className="wl-signin-icon" />
            <div className="wl-signin-text">
              <strong>You are browsing as a guest.</strong> Sign in to sync
              your wishlist across all your devices.
            </div>
            <Link href="/login" className="wl-signin-btn">
              Sign In
            </Link>
          </div>

          <WishlistContent />
        </div>
      </div>

      <style jsx>{`
        .wl-guest-root {
          font-family: "Inter", "Montserrat", -apple-system, BlinkMacSystemFont,
            "Segoe UI", Roboto, sans-serif;
          color: #0f172a;
          background-color: #f8fafc;
          min-height: 100vh;
          padding: 40px 0 80px;
          -webkit-font-smoothing: antialiased;
        }
        .wl-guest-wrap {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .wl-guest-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14.5px;
        }
        .wl-guest-breadcrumb :global(.wl-crumb-link) {
          color: #64748b;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s ease;
        }
        .wl-guest-breadcrumb :global(.wl-crumb-link:hover) {
          color: #0f172a;
        }
        .wl-guest-breadcrumb :global(.wl-crumb-separator) {
          color: #64748b;
          font-size: 11px;
        }
        .wl-crumb-current {
          color: #0f172a;
          font-weight: 600;
        }
        .wl-guest-header {
          margin-bottom: 4px;
        }
        .wl-guest-title {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .wl-guest-subtitle {
          font-size: 16px;
          color: #64748b;
          margin: 6px 0 0;
        }

        .wl-signin-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          padding: 14px 18px;
        }
        .wl-signin-banner :global(.wl-signin-icon) {
          font-size: 22px;
          color: #1d4ed8;
          flex-shrink: 0;
        }
        .wl-signin-text {
          font-size: 15px;
          color: #1e3a8a;
          flex: 1;
        }
        .wl-signin-banner :global(.wl-signin-btn) {
          height: 40px;
          display: inline-flex;
          align-items: center;
          padding: 0 20px;
          background: #182c5a;
          color: #ffffff;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s ease;
        }
        .wl-signin-banner :global(.wl-signin-btn:hover) {
          background: #e92227;
          color: #ffffff;
        }

        @media (max-width: 700px) {
          .wl-guest-wrap {
            padding: 0 16px;
          }
          .wl-guest-title {
            font-size: 24px;
          }
          .wl-signin-banner {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
};

export default WishlistPage;
