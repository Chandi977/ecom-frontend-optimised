import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { addToCart } from "../../utils/cart";
import AddToCartContent from "../common/AddToCartContent";
import CartQuantityControl from "../common/CartQuantityControl";
import useAddToCart from "../../hooks/useAddToCart";
import useCartLine from "../../hooks/useCartLine";
import {
  formatCurrency,
  getProductImageSrc,
  getPrimaryPriceTier,
  getAvailableStock,
} from "../../utils/productCatalog";
import ProductImage from "./ProductImage";
import WishlistButton from "../common/WishlistButton";

function RelatedCard({ product }) {
  const [cartQty, setCartQty] = useState(1);
  const [total, setTotal] = useState(0);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const handleData = () => {
    const tier = getPrimaryPriceTier(product);
    setTotal(tier.sellingPrice);
  };

  useEffect(() => {
    handleData();
  }, [product]);

  const handleCartAction = async () => {
    const tier = getPrimaryPriceTier(product);
    const packSize = Math.max(1, tier.number);
    const price = tier.sellingPrice;
    const packWeight = Number(tier.packWeight) || 0;
    const stock = getAvailableStock(product);
    const brandId = (product?.brand as any)?._id || product?.brand;
    const categoryId = product?.category;

    return addToCart(
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

  const {
    state: cartState,
    isBusy: isAdding,
    buttonProps: cartButtonProps,
  } = useAddToCart({
    onAdd: handleCartAction,
    flySource: imageRef,
  });
  const cartLine = useCartLine(product?._id);
  // Hold the button until the confirmation has played out, then hand over.
  const showQuantityControl = Boolean(cartLine) && !isAdding;

  return (
    <div className="related-card tw-relative tw-w-full tw-h-full tw-flex tw-flex-col tw-bg-white">
      <WishlistButton product={product} size="sm" />

      {/* Image container */}
      <div
        ref={imageRef}
        className="tw-flex tw-justify-center tw-items-center tw-bg-white tw-w-full tw-p-1 tw-overflow-hidden"
        style={{ height: "300px" }}
      >
        <ProductImage
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
            <span className="tw-text-black tw-text-[13px] tw-line-through">
              {formatCurrency(getPrimaryPriceTier(product).mrp)}
            </span>
            <span className="tw-text-[#17803d] tw-text-[16px] tw-font-bold">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Quantity selector and ADD TO CART action row — once the product is
            in the cart the whole row becomes the cart-bound stepper. */}
        {showQuantityControl ? (
          <div className="tw-flex tw-w-full tw-mt-auto">
            <CartQuantityControl
              productId={String(product._id)}
              quantity={cartLine?.quantity || 1}
              packSize={
                cartLine?.packSize ||
                Math.max(1, getPrimaryPriceTier(product).number)
              }
              size="md"
            />
          </div>
        ) : (
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
            {...cartButtonProps}
            className="tw-flex-1 tw-border-0 tw-text-white tw-text-center tw-text-[12px] tw-font-semibold tw-flex tw-h-[36px] tw-items-center tw-justify-center tw-gap-[6px] tw-bg-[#182c5a] tw-rounded-lg hover:tw-bg-[#e92227] tw-transition-colors tw-cursor-pointer"
          >
            <AddToCartContent
              state={cartState}
              idleLabel="ADD TO CART"
              addingLabel="ADDING..."
              addedLabel="ADDED"
              iconSize={14}
              icon={
                <svg className="tw-w-3.5 tw-h-3.5 tw-flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              }
            />
          </button>
        </div>
        )}
      </div>
    </div>
  );
}

export default RelatedCard;
