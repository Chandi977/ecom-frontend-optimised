"use client"; // This is a client component 👈🏽
import React, { useEffect, useRef, useState } from "react";
import { getService, putService } from "../../services/service";
import { format, addDays } from "date-fns";
import { Modal, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { getProductImageSrc } from "../../utils/productCatalog";
import { addToCart } from "../../utils/cart";

import {
  FiPhone,
  FiChevronDown,
  FiCheckCircle,
  FiTruck,
  FiLoader,
  FiXCircle,
  FiChevronRight,
  FiArrowLeft,
  FiInfo,
} from "react-icons/fi";

const getOrderCreatedTime = (order: any) => {
  const timestamp = new Date(order?.createdAt || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const sortOrdersRecentFirst = (orderList: any[]) =>
  [...orderList].sort(
    (currentOrder, nextOrder) =>
      getOrderCreatedTime(nextOrder) - getOrderCreatedTime(currentOrder),
  );

const isFinalOrderId = (value: any) =>
  typeof value === "string" && /^PI-\d+$/.test(value);

const PAID_STATUSES = ["Payment Processed", "Payment Verified", "Paid"];
const orderAwaitingNumber = (order: any) =>
  !isFinalOrderId(order?.orderId) && PAID_STATUSES.includes(order?.paymentStatus);

// Payment states from which the customer can still pay for this same order.
const PAYABLE_STATUSES = ["Not Paid", "Payment Failed"];
// Terminal states — the order can never be paid again (cancelled / expired /
// abandoned). Its stock is already released, so the only path forward is Reorder.
const DEAD_PAYMENT_STATUSES = ["Expired", "Cancelled", "Payment Abandoned"];

// Classifies an order into exactly one payment phase. Prevents the UI from
// mislabelling a non-paid order (e.g. Expired/Cancelled) as "Payment Completed".
const getPaymentPhase = (order: any): "paid" | "review" | "payable" | "dead" => {
  const status = order?.paymentStatus;
  if (["Payment Verified", "Paid"].includes(status)) return "paid";
  if (status === "Payment Processed") return "review";
  // A cancelled order is dead even if its payment status still looks payable —
  // never offer to pay a cancelled order.
  if (order?.status === "Cancelled" || DEAD_PAYMENT_STATUSES.includes(status)) return "dead";
  if (PAYABLE_STATUSES.includes(status)) return "payable";
  return "payable"; // unknown/unset → let them pay; never claim "completed"
};

const ORDER_ID_POLL_ATTEMPTS = 6;
const ORDER_ID_POLL_INTERVAL_MS = 1500;

const MyOrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [showUtrModal, setShowUtrModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderValue, setSelectedOrderValue] = useState<number | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const pollAttemptsRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Selected Order for View Details modal
  const [activeDetailsOrder, setActiveDetailsOrder] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");

  const handleModalShow = (orderId: string, orderValue: number) => {
    setSelectedOrderId(orderId);
    setSelectedOrderValue(orderValue);
    setShowUtrModal(true);
  };

  const handleModalClose = () => {
    setSelectedOrderId(null);
    setShowUtrModal(false);
  };

  const handleUtrNumberChange = (event: any) => {
    setUtrNumber(event.target.value);
  };

  const handleSubmitUtrNumber = async () => {
    if (utrNumber.trim() === "") {
      toast.error("Please enter a UTR Number.");
    } else {
      const requestData = {
        _id: selectedOrderId,
        utrNumber: utrNumber,
      };

      try {
        const res = await putService("order/update/utr", requestData);
        if (res?.data?.success) {
          toast.success("UTR Number submitted successfully");
          setShowUtrModal(false);
          if (activeDetailsOrder && activeDetailsOrder._id === selectedOrderId) {
            setActiveDetailsOrder({
              ...activeDetailsOrder,
              utrNumber: utrNumber,
            });
          }
          await getUser();
        } else {
          toast.error("Failed to submit UTR Number.");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (!userEmail) return undefined;

    const pending = orders.some(orderAwaitingNumber);
    if (!pending) {
      pollAttemptsRef.current = 0;
      return undefined;
    }
    if (pollAttemptsRef.current >= ORDER_ID_POLL_ATTEMPTS) return undefined;

    pollAttemptsRef.current += 1;
    pollTimerRef.current = setTimeout(() => {
      fetchOrdersByEmail(userEmail);
    }, ORDER_ID_POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [orders, userEmail]);

  const getUser = async () => {
    try {
      const userStr = localStorage.getItem("PIUser");
      if (!userStr) {
        setLoadingOrders(false);
        return;
      }
      const user = JSON.parse(userStr);
      const userResponse = await getService(`getuser/${user?._id}`);

      if (userResponse?.data?.success) {
        const email = userResponse?.data?.data?.email_address;
        setUserEmail(email);
        await fetchOrdersByEmail(email);
      } else {
        setLoadingOrders(false);
      }
    } catch (error) {
      setLoadingOrders(false);
    }
  };

  const fetchOrdersByEmail = async (email: string) => {
    try {
      const res = await getService(`my/orders/${email}`);
      const payload = res?.data;
      const data = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      setOrders(sortOrdersRecentFirst(data));
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadScript = (src: string) => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }

      const existingScript = window.document.querySelector(
        `script[src="${src}"]`,
      );
      if (existingScript) {
        const isLoaded = existingScript.getAttribute("data-loaded") === "true";
        const isLoading =
          existingScript.getAttribute("data-loading") === "true";
        if (isLoaded || !isLoading) {
          resolve(true);
        } else {
          existingScript.addEventListener("load", () => resolve(true), {
            once: true,
          });
          existingScript.addEventListener("error", () => resolve(false), {
            once: true,
          });
        }
        return;
      }

      const script = window.document.createElement("script");
      script.src = src;
      script.setAttribute("data-loading", "true");
      script.onload = () => {
        script.setAttribute("data-loaded", "true");
        script.removeAttribute("data-loading");
        resolve(true);
      };

      script.onerror = () => {
        script.removeAttribute("data-loading");
        resolve(false);
      };

      window.document.body.appendChild(script);
    });
  };

  const displayRazor = async (
    amount: number,
    name: string,
    number: string,
    email: string,
    address: string,
    orderId: string,
    guestToken: string,
  ) => {
    const res = await loadScript(
      "https://checkout.razorpay.com/v1/checkout.js",
    );
    const amountInt = Math.round(Number(amount));
    if (!res) {
      toast.error("You appear offline. Unable to load Razorpay.");
      return;
    }
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      amount: amountInt,
      currency: "INR",
      name: "Prem Packaging",
      description: "Order Payment",
      image: "/pp_logo_1.png",
      handler: async function (response: any) {
        const result = await putService("order/update/payment/status", {
          _id: orderId,
          paymentStatus: "Payment Verified",
          paymentProvider: "razorpay",
          razorpayPaymentId: response?.razorpay_payment_id,
          razorpayOrderId: response?.razorpay_order_id,
          razorpaySignature: response?.razorpay_signature,
          ...(guestToken ? { guestToken } : {}),
        });
        const resultData = result?.data || null;
        if (result?.status === 200 && resultData?.success) {
          toast.success("Payment verified successfully");
          await getUser();
          router.push("/my-orders");
        } else {
          toast.error("Unable to verify payment. Please retry.");
        }
      },
      modal: {
        ondismiss: async function () {
          await putService("order/mark-payment-failed", {
            _id: orderId,
            ...(guestToken ? { guestToken } : {}),
          }).catch(() => {});
          toast.warn("Payment window closed. You can retry from orders.");
          await getUser();
        },
      },
      prefill: {
        name: `${name}`,
        email: email,
        contact: number,
      },
      notes: {
        address: address,
      },
      theme: {
        color: "#0C4E9C",
      },
    };
    const paymentObject = new window.Razorpay(options);
    paymentObject.on("payment.failed", async function (response: any) {
      toast.error(
        "Payment failed. Please retry after confirming your details.",
      );
      await putService("order/mark-payment-failed", {
        _id: orderId,
        error: response?.error,
        ...(guestToken ? { guestToken } : {}),
      }).catch(() => {});
      await getUser();
    });
    paymentObject.open();
  };

  const isOrderOutOfStock = (order: any) => {
    let outOfStock = false;
    order?.items?.forEach((item: any) => {
      item?.product?.priceList?.forEach((inneritem: any) => {
        if (inneritem.number == item.packSize) {
          if (inneritem.stock_quantity <= item.quantity) {
            outOfStock = true;
            return;
          }
        }
      });
      if (outOfStock) return;
    });
    return outOfStock;
  };

  const handlePayment = async (order: any) => {
    await displayRazor(
      order?.totalOrderValue * 100,
      order?.name,
      order?.mobile,
      order?.email,
      order?.address,
      order?._id,
      order?.guestToken,
    );
  };

  const formatDate = (value: any) => {
    if (!value) return "NA";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "NA";
    return format(date, "dd MMM, yyyy");
  };

  const formatTime = (value: any) => {
    if (!value) return "NA";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "NA";
    return format(date, "hh:mm a");
  };

  const formatCurrency = (value: any) => {
    const num = Number(value ?? 0);
    if (Number.isNaN(num)) return "₹ 0.00";
    return `₹${Math.round(num).toLocaleString("en-IN")}`;
  };

  const displayOrderId = (order: any) => {
    if (isFinalOrderId(order?.orderId)) return order.orderId;
    if (orderAwaitingNumber(order)) return "Generating…";
    // Cancelled/expired orders never get a PI- number and are not pending, so
    // don't mislabel them as "Pending payment".
    if (getPaymentPhase(order) === "dead") return "No order number";
    return "Pending payment";
  };

  const handleReorder = async (order: any) => {
    try {
      let successCount = 0;
      for (const item of order?.items || []) {
        const productData = item?.product;
        if (productData && productData._id) {
          const success = await addToCart(
            productData._id,
            item.quantity,
            item.packSize,
            Number(item.price)
          );
          if (success) successCount++;
        }
      }
      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} item(s) to cart.`);
        router.push("/my-cart");
      } else {
        toast.error("Failed to reorder items. Products might be unavailable.");
      }
    } catch (err) {
      toast.error("An error occurred during reorder.");
    }
  };

  const getOrderStatus = (order: any) => {
    const status = String(order?.status || "Processing").toLowerCase();
    if (status.includes("deliver")) return "Delivered";
    if (status.includes("ship")) return "Shipped";
    if (status.includes("cancel")) return "Cancelled";
    return "Processing";
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === "All") return true;
    return getOrderStatus(order) === filterStatus;
  });

  return (
    <>
      <Head>
        <title>My Orders | store.prempackaging</title>
        <meta name="title" content="My Orders" />
        <meta
          name="description"
          content="Check the status of your packaging product orders anytime. Track shipping, manage purchases, and stay updated with order details conveniently."
        />
      </Head>

      <div className="orders-root">
        <div className="orders-wrap">
          {/* Breadcrumb */}
          <nav className="orders-breadcrumb" aria-label="Breadcrumb">
            <Link href="/" className="crumb-link">Home</Link>
            <FiChevronRight className="crumb-separator" />
            <span className="crumb-current">My Orders</span>
          </nav>

          {/* Page Header */}
          <header className="orders-header">
            <div className="header-left">
              <h1 className="orders-title">My Orders</h1>
              <p className="orders-subtitle">Track, manage and reorder your purchases</p>
            </div>
            
            <div className="header-right">
              {/* Filter */}
              <div className="filter-select-wrapper">
                <select
                  className="filter-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  aria-label="Filter orders by status"
                >
                  <option value="All">All Orders</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <FiChevronDown className="filter-chevron" />
              </div>

              {/* Expert Contact */}
              <div className="expert-badge">
                <FiPhone className="expert-icon" />
                <div className="expert-text">
                  <span className="expert-label">Talk to an expert</span>
                  <span className="expert-number">+91 84472 47227</span>
                </div>
              </div>
            </div>
          </header>

          {/* Orders Main Section */}
          {loadingOrders ? (
            <div className="orders-loading">
              <FiLoader className="loading-spinner" />
              <span>Loading your order history...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="orders-empty-state">
              <FiInfo className="empty-state-icon" />
              <h2>No orders found</h2>
              <p>You haven't placed any orders matching this status yet.</p>
              <Link href="/" className="browse-products-btn">Browse products</Link>
            </div>
          ) : (
            <div className="orders-table-card">
              <div className="orders-table-wrapper">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th scope="col">ORDER</th>
                      <th scope="col">DATE</th>
                      <th scope="col">ITEMS</th>
                      <th scope="col">AMOUNT</th>
                      <th scope="col">STATUS</th>
                      <th scope="col">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      const totalItemsCount = order?.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 0;
                      const displayId = displayOrderId(order);
                      const isDelivered = getOrderStatus(order) === "Delivered";
                      const isShipped = getOrderStatus(order) === "Shipped";
                      
                      const orderStatusVal = getOrderStatus(order);
                      const orderDateValue = order?.updatedAt || order?.createdAt;
                      const isPaymentVerified = order?.paymentStatus === "Payment Verified" || order?.paymentStatus === "Paid";
                      const isPaymentInReview = order?.paymentStatus === "Payment Processed";
                      const canPay = order?.paymentStatus && ["Not Paid", "Payment Failed"].includes(order.paymentStatus);
                      const outOfStock = isOrderOutOfStock(order);

                      return (
                        <tr key={order._id}>
                          {/* ORDER */}
                          <td>
                            <span className="order-id-txt">{displayId}</span>
                            <span className="order-placed-sub">Order Placed</span>
                          </td>

                          {/* DATE */}
                          <td>
                            <span className="order-date-txt">{formatDate(order?.createdAt)}</span>
                            <span className="order-time-txt">{formatTime(order?.createdAt)}</span>
                          </td>

                          {/* ITEMS */}
                          <td>
                            <div className="items-column-cell">
                              <div className="items-preview-thumbs">
                                {order?.items?.slice(0, 2).map((item: any, idx: number) => {
                                  const img = getProductImageSrc(item?.product) || item?.product?.images?.[0]?.image || "/pp_logo_1.png";
                                  return (
                                    <div className="item-thumbnail-box" key={idx}>
                                      <img src={img} alt="Product preview" />
                                    </div>
                                  );
                                })}
                              </div>
                              <span className="items-total-label">
                                {totalItemsCount} {totalItemsCount === 1 ? "Item" : "Items"}
                              </span>
                            </div>
                          </td>

                          {/* AMOUNT */}
                          <td>
                            <span className="order-amount-txt">{formatCurrency(order?.totalOrderValue)}</span>
                            {orderStatusVal === "Cancelled" ? (
                              <span className="order-payment-sub text-cancelled">Cancelled</span>
                            ) : isPaymentVerified ? (
                              <span className="order-payment-sub text-paid">Paid</span>
                            ) : isPaymentInReview ? (
                              <span className="order-payment-sub text-warning">Verifying</span>
                            ) : (
                              <span className="order-payment-sub text-pending">Pending</span>
                            )}
                          </td>

                          {/* STATUS */}
                          <td>
                            {orderStatusVal === "Delivered" && (
                              <div className="status-container">
                                <span className="status-badge delivered">Delivered</span>
                                <span className="status-subtext">Delivered on {formatDate(orderDateValue)}</span>
                              </div>
                            )}
                            {orderStatusVal === "Shipped" && (
                              <div className="status-container">
                                <span className="status-badge shipped">Shipped</span>
                                <span className="status-subtext">Expected by {formatDate(addDays(new Date(order?.createdAt || Date.now()), 7))}</span>
                              </div>
                            )}
                            {orderStatusVal === "Cancelled" && (
                              <div className="status-container">
                                <span className="status-badge cancelled">Cancelled</span>
                                <span className="status-subtext">Cancelled on {formatDate(orderDateValue)}</span>
                              </div>
                            )}
                            {orderStatusVal === "Processing" && (
                              <div className="status-container">
                                <span className="status-badge processing">Processing</span>
                                <span className="status-subtext">Your order is being processed</span>
                              </div>
                            )}
                          </td>

                          {/* ACTION */}
                          <td>
                            <div className="actions-cell">
                              <button
                                type="button"
                                className="view-details-btn"
                                onClick={() => setActiveDetailsOrder(order)}
                              >
                                View Details
                              </button>

                              {canPay && (
                                outOfStock ? (
                                  <span className="reorder-link-btn text-muted-grey">Out of Stock</span>
                                ) : (
                                  <button
                                    type="button"
                                    className="reorder-link-btn text-retry"
                                    onClick={() => handlePayment(order)}
                                  >
                                    Retry Payment
                                  </button>
                                )
                              )}
                              
                              {isDelivered && (
                                <button
                                  type="button"
                                  className="reorder-link-btn"
                                  onClick={() => handleReorder(order)}
                                >
                                  Reorder
                                </button>
                              )}

                              {isShipped && (
                                <Link
                                  href={`/my-orders?track=${order?._id}`}
                                  className="reorder-link-btn"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    toast.info("Order tracking status is Shipped. Standard transit is in progress.");
                                  }}
                                >
                                  Track Order
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <footer className="table-pagination-footer">
                <span className="footer-showing-label">
                  Showing 1 to {filteredOrders.length} of {filteredOrders.length} orders
                </span>
                <div className="pagination-controls">
                  <button type="button" className="pagination-arrow-btn" disabled>
                    &lt;
                  </button>
                  <span className="pagination-page-number active">1</span>
                  <button type="button" className="pagination-arrow-btn" disabled>
                    &gt;
                  </button>
                </div>
              </footer>
            </div>
          )}
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {activeDetailsOrder && (
        <Modal
          show={!!activeDetailsOrder}
          onHide={() => setActiveDetailsOrder(null)}
          size="lg"
          centered
          className="details-overlay-modal"
        >
          <Modal.Header closeButton className="details-modal-header">
            <Modal.Title className="details-modal-title">
              Order Details <span className="modal-title-id">({displayOrderId(activeDetailsOrder)})</span>
            </Modal.Title>
          </Modal.Header>
          
          <Modal.Body className="details-modal-body">
            {/* Header info */}
            <div className="details-info-grid">
              <div className="info-item">
                <span className="info-label">Order ID</span>
                <span className="info-val">{displayOrderId(activeDetailsOrder)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Total Payable</span>
                <span className="info-val val-highlight">{formatCurrency(activeDetailsOrder?.totalOrderValue)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Payment Status</span>
                <span className="info-val">{activeDetailsOrder?.paymentStatus}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Ordered By</span>
                <span className="info-val">{activeDetailsOrder?.name}</span>
              </div>
              <div className="info-item item-wide">
                <span className="info-label">Address</span>
                <span className="info-val">
                  {activeDetailsOrder?.address}, {activeDetailsOrder?.town}, {activeDetailsOrder?.state} - {activeDetailsOrder?.pincode}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Order Status</span>
                <span className="info-val font-semibold text-navy">{activeDetailsOrder?.status || "NA"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Order Initiated</span>
                <span className="info-val">{formatDate(activeDetailsOrder?.createdAt)} | {formatTime(activeDetailsOrder?.createdAt)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">GSTIN</span>
                <span className="info-val">{activeDetailsOrder?.gstin || "NA"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Coupon Code</span>
                <span className="info-val">{activeDetailsOrder?.couponCode || "NA"}</span>
              </div>
            </div>

            {/* Split row: Products & Prices */}
            <div className="details-split-row">
              {/* Products column */}
              <div className="split-column col-products">
                <h4 className="column-title">Products</h4>
                <ul className="details-products-list">
                  {activeDetailsOrder?.items?.map((item: any, idx: number) => {
                    const img = getProductImageSrc(item?.product) || item?.product?.images?.[0]?.image || "/pp_logo_1.png";
                    return (
                      <li key={idx} className="details-product-item">
                        <img src={img} alt="Product thumbnail" className="details-prod-thumb" />
                        <div className="details-prod-meta">
                          <span className="details-prod-name">
                            {item?.product?.model || item?.product?.name || "Product"}
                          </span>
                          <span className="details-prod-desc">
                            Pack size: {item?.packSize} · Qty: {item?.quantity}
                          </span>
                          <span className="details-prod-price">Price: {formatCurrency(item?.price)}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Cost column */}
              <div className="split-column col-pricing">
                <h4 className="column-title">Price Breakdown</h4>
                <dl className="details-pricing-list">
                  <div className="pricing-row">
                    <dt>Cart Value</dt>
                    <dd>{formatCurrency(activeDetailsOrder?.totalCartValue)}</dd>
                  </div>
                  <div className="pricing-row">
                    <dt>Freight</dt>
                    <dd>{formatCurrency(activeDetailsOrder?.shippingCost)}</dd>
                  </div>
                  <div className="pricing-row">
                    <dt>GST (Tax)</dt>
                    <dd>
                      {formatCurrency(
                        Math.max(
                          0,
                          (activeDetailsOrder?.totalOrderValue || 0) -
                            (activeDetailsOrder?.shippingCost || 0) -
                            (activeDetailsOrder?.totalCartValue || 0)
                        )
                      )}
                    </dd>
                  </div>
                  <div className="pricing-row total-row">
                    <dt>Total Payable</dt>
                    <dd>{formatCurrency(activeDetailsOrder?.totalOrderValue)}</dd>
                  </div>
                </dl>

                {/* UTR Submission and Actions */}
                <div className="details-column-actions">
                  {(() => {
                    const phase = getPaymentPhase(activeDetailsOrder);

                    if (phase === "paid") {
                      return <span className="badge-payment-completed">Payment Completed</span>;
                    }

                    if (phase === "review") {
                      return <span className="badge-payment-review">Payment in review</span>;
                    }

                    if (phase === "payable") {
                      return (
                        <div className="payment-pending-actions">
                          {isOrderOutOfStock(activeDetailsOrder) ? (
                            <span className="error-alert-label">One or more products are out of stock</span>
                          ) : (
                            <button
                              type="button"
                              className="complete-payment-btn"
                              onClick={() => handlePayment(activeDetailsOrder)}
                            >
                              Retry Payment
                            </button>
                          )}

                          <button
                            type="button"
                            className="utr-submit-trigger-btn"
                            onClick={() => handleModalShow(activeDetailsOrder?._id, activeDetailsOrder?.totalOrderValue)}
                          >
                            Submit UTR Number
                          </button>
                        </div>
                      );
                    }

                    // phase === "dead": Expired / Cancelled / Abandoned. Payment
                    // can't be resumed on this order (it's cancelled and its stock
                    // released), so offer a fresh Reorder instead of a dead retry.
                    return (
                      <div className="payment-pending-actions">
                        <span className="badge-payment-dead">
                          {activeDetailsOrder?.status === "Cancelled"
                            ? `Order cancelled · Payment ${activeDetailsOrder?.paymentStatus}`
                            : `Payment ${activeDetailsOrder?.paymentStatus}`}
                        </span>
                        <button
                          type="button"
                          className="complete-payment-btn"
                          onClick={() => handleReorder(activeDetailsOrder)}
                        >
                          Reorder
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Payment logs info footer */}
            <div className="details-payment-logs">
              <h4 className="column-title-secondary">Payment details</h4>
              <div className="payment-logs-grid">
                <div className="log-item">
                  <span className="log-label">UTR Number</span>
                  <span className="log-val">{activeDetailsOrder?.utrNumber || "NA"}</span>
                </div>
                <div className="log-item">
                  <span className="log-label">Payment Provider</span>
                  <span className="log-val">{activeDetailsOrder?.paymentProvider || "NA"}</span>
                </div>
                <div className="log-item">
                  <span className="log-label">Razorpay Order ID</span>
                  <span className="log-val">{activeDetailsOrder?.razorpayOrderId || "NA"}</span>
                </div>
                <div className="log-item">
                  <span className="log-label">Razorpay Payment ID</span>
                  <span className="log-val">{activeDetailsOrder?.razorpayPaymentId || "NA"}</span>
                </div>
              </div>
            </div>
          </Modal.Body>
          
          <Modal.Footer className="details-modal-footer">
            <Button variant="secondary" onClick={() => setActiveDetailsOrder(null)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* UTR MODAL */}
      <Modal show={showUtrModal} onHide={handleModalClose} centered className="utr-modal-container">
        <Modal.Header closeButton>
          <Modal.Title>Complete Payment & Submit UTR</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="utr-modal-body-content">
            <div className="utr-order-summary">
              <div className="summary-field">
                <span className="lbl">Order ID:</span>
                <span className="val">{selectedOrderId}</span>
              </div>
              <div className="summary-field">
                <span className="lbl">Total Order Value:</span>
                <span className="val highlight">{formatCurrency(selectedOrderValue)}</span>
              </div>
            </div>

            <div className="utr-input-wrapper">
              <label htmlFor="utr-number-input" className="utr-input-label">Enter UTR / Transaction Reference Number:</label>
              <input
                id="utr-number-input"
                type="text"
                className="utr-number-textbox"
                value={utrNumber}
                placeholder="Enter 12-digit UTR number"
                onChange={handleUtrNumberChange}
              />
              <button
                type="button"
                className="utr-submit-confirm-btn"
                onClick={handleSubmitUtrNumber}
              >
                Submit UTR Number
              </button>
            </div>

            <div className="payment-options-divider">
              <span className="line" />
              <span className="txt">OR PAY VIA</span>
              <span className="line" />
            </div>

            <div className="bank-payment-details">
              <span className="bank-details-title">Bank Transfer / UPI Options</span>
              <div className="bank-qr-container">
                <img src="/qr_code.png" alt="Payment QR Code" />
              </div>
              <div className="vpa-details">
                <span className="vpa-lbl">Pay via VPA (UPI ID):</span>
                <strong className="vpa-id">premindustriesecom@hsbc</strong>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        /* ============ PREMIUM MY ORDERS UI ============ */
        .orders-root {
          --font-family: "Inter", "Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          --color-ink: #0f172a;
          --color-navy: #1e293b;
          --color-slate-muted: #64748b;
          --color-green: #10b981;
          --color-green-dark: #059669;
          --color-green-bg: #f0fdf4;
          --color-green-border: #bbf7d0;
          --color-line: #e2e8f0;
          --color-bg-canvas: #f8fafc;
          --color-bg-card: #ffffff;
          
          font-family: var(--font-family);
          color: var(--color-ink);
          background-color: var(--color-bg-canvas);
          min-height: 100vh;
          padding: 40px 0 80px;
          -webkit-font-smoothing: antialiased;
        }

        .orders-wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Breadcrumb styling */
        .orders-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          margin-bottom: 24px;
        }
        .crumb-link {
          color: var(--color-slate-muted);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s ease;
        }
        .crumb-link:hover {
          color: var(--color-ink);
        }
        .crumb-separator {
          color: var(--color-slate-muted);
          font-size: 11px;
        }
        .crumb-current {
          color: var(--color-ink);
          font-weight: 600;
        }

        /* Header block */
        .orders-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          gap: 20px;
        }
        .orders-title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--color-ink);
          margin: 0;
        }
        .orders-subtitle {
          font-size: 14px;
          color: var(--color-slate-muted);
          margin: 6px 0 0;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        /* Filter Select Dropdown */
        .filter-select-wrapper {
          position: relative;
          width: 160px;
        }
        .filter-select {
          width: 100%;
          height: 40px;
          padding: 0 36px 0 16px;
          border: 1px solid var(--color-line);
          border-radius: 8px;
          background: #ffffff;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-ink);
          outline: none;
          cursor: pointer;
          appearance: none;
          transition: border-color 0.15s ease;
        }
        .filter-select:hover {
          border-color: #cbd5e1;
        }
        .filter-select-wrapper :global(.filter-chevron) {
          position: absolute;
          right: 14px;
          top: 13px;
          font-size: 14px;
          color: var(--color-slate-muted);
          pointer-events: none;
        }

        /* Expert Badge */
        .expert-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #182c5a;
          color: #ffffff;
          border-radius: 8px;
          padding: 10px 18px;
        }
        .expert-icon {
          font-size: 18px;
          flex-shrink: 0;
        }
        .expert-text {
          display: flex;
          flex-direction: column;
        }
        .expert-label {
          font-size: 11px;
          opacity: 0.8;
          font-weight: 500;
          letter-spacing: 0.02em;
        }
        .expert-number {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        /* Orders Loading State */
        .orders-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 80px 0;
          color: var(--color-slate-muted);
        }
        .loading-spinner {
          font-size: 32px;
          animation: spin 1.2s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Orders Empty State */
        .orders-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: #ffffff;
          border: 1px solid var(--color-line);
          border-radius: 12px;
          padding: 80px 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .empty-state-icon {
          font-size: 40px;
          color: var(--color-slate-muted);
          margin-bottom: 16px;
        }
        .orders-empty-state h2 {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-ink);
          margin: 0 0 8px;
        }
        .orders-empty-state p {
          font-size: 14px;
          color: var(--color-slate-muted);
          margin: 0 0 20px;
        }
        .browse-products-btn {
          height: 42px;
          background: var(--color-primary-btn);
          color: #ffffff;
          border: 0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          padding: 0 24px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          transition: background 0.15s ease;
        }
        .browse-products-btn:hover {
          background: var(--color-primary-btn-hover);
          color: #ffffff;
        }

        /* Orders Table block */
        .orders-table-card {
          background: #ffffff;
          border: 1px solid var(--color-line);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        .orders-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }
        .orders-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .orders-table th {
          background: #f8fafc;
          padding: 16px 24px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--color-slate-muted);
          border-bottom: 1px solid var(--color-line);
        }
        .orders-table td {
          padding: 20px 24px;
          vertical-align: middle;
          border-bottom: 1px solid var(--color-line);
        }
        .orders-table tbody tr:last-child td {
          border-bottom: 0;
        }

        /* ORDER Column styles */
        .order-id-txt {
          display: block;
          font-size: 14.5px;
          font-weight: 700;
          color: var(--color-ink);
        }
        .order-placed-sub {
          display: block;
          font-size: 12px;
          color: var(--color-slate-muted);
          margin-top: 2px;
        }

        /* DATE Column styles */
        .order-date-txt {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-ink);
        }
        .order-time-txt {
          display: block;
          font-size: 12px;
          color: var(--color-slate-muted);
          margin-top: 2px;
        }

        /* ITEMS Column styles */
        .items-column-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .items-preview-thumbs {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .item-thumbnail-box {
          width: 42px;
          height: 42px;
          border: 1px solid var(--color-line);
          border-radius: 6px;
          background: #ffffff;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .item-thumbnail-box img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .items-total-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-ink);
        }

        /* AMOUNT Column styles */
        .order-amount-txt {
          display: block;
          font-size: 14.5px;
          font-weight: 700;
          color: var(--color-ink);
        }
         .order-payment-sub {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--color-slate-muted);
          margin-top: 2px;
        }
        .order-payment-sub.text-paid {
          color: var(--color-green-dark);
          font-weight: 600;
        }
        .order-payment-sub.text-cancelled {
          color: #dc2626;
          font-weight: 600;
        }
        .order-payment-sub.text-pending {
          color: #d97706;
          font-weight: 600;
        }
        .order-payment-sub.text-warning {
          color: #2563eb;
          font-weight: 600;
        }

        /* STATUS Badge styles */
        .status-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .status-badge {
          display: inline-flex;
          align-self: flex-start;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.01em;
        }
        .status-badge.delivered {
          background: #f0fdf4;
          color: var(--color-green-dark);
        }
        .status-badge.shipped {
          background: #fffbeb;
          color: #d97706;
        }
        .status-badge.cancelled {
          background: #fef2f2;
          color: #dc2626;
        }
        .status-badge.processing {
          background: #eff6ff;
          color: #2563eb;
        }
        .status-subtext {
          font-size: 11.5px;
          color: var(--color-slate-muted);
        }

        /* ACTION Column styles */
        .actions-cell {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
        }
        .view-details-btn {
          height: 34px;
          padding: 0 16px;
          background: #ffffff;
          border: 1px solid var(--color-line);
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--color-ink);
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .view-details-btn:hover {
          border-color: var(--color-primary-btn);
          background: #f8fafc;
        }
        .reorder-link-btn {
          background: none;
          border: 0;
          font-size: 12.5px;
          font-weight: 700;
          color: #2563eb;
          cursor: pointer;
          padding: 0;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .reorder-link-btn.text-retry {
          color: #d97706;
        }
        .reorder-link-btn.text-retry:hover {
          color: #b45309;
        }
        .reorder-link-btn.text-muted-grey {
          color: #94a3b8;
          cursor: not-allowed;
        }
        .reorder-link-btn.text-muted-grey:hover {
          color: #94a3b8;
          text-decoration: none;
        }
        .reorder-link-btn:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        /* Table pagination footer */
        .table-pagination-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: #f8fafc;
          border-top: 1px solid var(--color-line);
        }
        .footer-showing-label {
          font-size: 13px;
          color: var(--color-slate-muted);
        }
        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pagination-arrow-btn {
          width: 32px;
          height: 32px;
          border: 1px solid var(--color-line);
          background: #ffffff;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          color: var(--color-slate-muted);
        }
        .pagination-arrow-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pagination-page-number {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
        }
        .pagination-page-number.active {
          background: #182c5a;
          color: #ffffff;
        }

        /* ============ VIEW DETAILS MODAL STYLES ============ */
        .details-modal-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--color-ink);
        }
        .modal-title-id {
          font-size: 16px;
          color: var(--color-slate-muted);
          font-weight: 600;
        }
        .details-info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          background: #f8fafc;
          border: 1px solid var(--color-line);
          border-radius: 8px;
          padding: 18px;
          margin-bottom: 24px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .info-item.item-wide {
          grid-column: span 3;
        }
        .info-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--color-slate-muted);
        }
        .info-val {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--color-ink);
        }
        .val-highlight {
          color: var(--color-green-dark);
          font-weight: 700;
        }

        .details-split-row {
          display: grid;
          grid-template-columns: 1.8fr 1.2fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        .split-column {
          display: flex;
          flex-direction: column;
        }
        .column-title {
          font-size: 15px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--color-ink);
          margin: 0 0 16px;
          border-bottom: 2px solid var(--color-line);
          padding-bottom: 8px;
        }
        .column-title-secondary {
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--color-ink);
          margin: 16px 0 12px;
          border-bottom: 1.5px solid var(--color-line);
          padding-bottom: 6px;
        }

        /* Products details in modal */
        .details-products-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .details-product-item {
          display: flex;
          align-items: center;
          gap: 14px;
          border-bottom: 1px solid var(--color-line);
          padding-bottom: 12px;
        }
        .details-product-item:last-child {
          border-bottom: 0;
        }
        .details-prod-thumb {
          width: 54px;
          height: 54px;
          border: 1px solid var(--color-line);
          border-radius: 6px;
          background: #ffffff;
          padding: 4px;
          object-fit: contain;
        }
        .details-prod-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .details-prod-name {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--color-ink);
        }
        .details-prod-desc {
          font-size: 12px;
          color: var(--color-slate-muted);
        }
        .details-prod-price {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-green-dark);
        }

        /* Price details list in modal */
        .details-pricing-list {
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pricing-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--color-slate-muted);
        }
        .pricing-row dd {
          margin: 0;
          font-weight: 600;
          color: var(--color-ink);
        }
        .total-row {
          font-size: 14px;
          border-top: 1px solid var(--color-line);
          padding-top: 10px;
          margin-top: 4px;
        }
        .total-row dt {
          font-weight: 700;
          color: var(--color-ink);
        }
        .total-row dd {
          font-size: 18px;
          font-weight: 800;
          color: var(--color-ink);
        }

        /* payment actions */
        .details-column-actions {
          margin-top: 16px;
        }
        .payment-pending-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .complete-payment-btn {
          height: 40px;
          background: var(--color-primary-btn);
          color: #ffffff;
          border: 0;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .complete-payment-btn:hover {
          background: var(--color-primary-btn-hover);
        }
        .utr-submit-trigger-btn {
          height: 40px;
          background: #ffffff;
          border: 1px solid var(--color-line);
          color: var(--color-ink);
          border-radius: 6px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .utr-submit-trigger-btn:hover {
          border-color: var(--color-primary-btn);
        }
        .badge-payment-completed {
          display: block;
          text-align: center;
          background: var(--color-green-bg);
          border: 1px solid var(--color-green-border);
          border-radius: 6px;
          color: var(--color-green-dark);
          font-size: 13px;
          font-weight: 700;
          padding: 8px 12px;
        }
        .badge-payment-review {
          display: block;
          text-align: center;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          color: #1d4ed8;
          font-size: 13px;
          font-weight: 700;
          padding: 8px 12px;
        }
        .badge-payment-dead {
          display: block;
          text-align: center;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #b91c1c;
          font-size: 13px;
          font-weight: 700;
          padding: 8px 12px;
        }

        /* Payment logs */
        .details-payment-logs {
          border-top: 1.5px solid var(--color-line);
          padding-top: 16px;
        }
        .payment-logs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 24px;
        }
        .log-item {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        .log-label {
          color: var(--color-slate-muted);
          font-weight: 500;
        }
        .log-val {
          font-weight: 600;
          color: var(--color-ink);
        }

        /* UTR input modal */
        .utr-modal-body-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .utr-order-summary {
          display: flex;
          justify-content: space-between;
          background: #f8fafc;
          border: 1px solid var(--color-line);
          border-radius: 8px;
          padding: 12px;
        }
        .summary-field {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }
        .summary-field .lbl {
          color: var(--color-slate-muted);
          font-weight: 500;
        }
        .summary-field .val {
          font-weight: 700;
          color: var(--color-ink);
        }
        .summary-field .val.highlight {
          color: var(--color-green-dark);
        }

        .utr-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .utr-input-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-ink);
        }
        .utr-number-textbox {
          height: 38px;
          padding: 0 12px;
          border: 1px solid var(--color-line);
          border-radius: 6px;
          font-size: 14px;
          outline: none;
        }
        .utr-number-textbox:focus {
          border-color: var(--color-primary-btn);
        }
        .utr-submit-confirm-btn {
          height: 38px;
          background: var(--color-primary-btn);
          color: #ffffff;
          border: 0;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .utr-submit-confirm-btn:hover {
          background: var(--color-primary-btn-hover);
        }

        .payment-options-divider {
          display: flex;
          align-items: center;
        }
        .payment-options-divider .line {
          flex: 1;
          height: 1px;
          background: var(--color-line);
        }
        .payment-options-divider .txt {
          padding: 0 12px;
          font-size: 11px;
          font-weight: 700;
          color: var(--color-slate-muted);
          letter-spacing: 0.05em;
        }

        .bank-payment-details {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .bank-details-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-ink);
        }
        .bank-qr-container {
          width: 120px;
          height: 120px;
          border: 1px solid var(--color-line);
          border-radius: 8px;
          padding: 6px;
          background: #ffffff;
        }
        .bank-qr-container img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .vpa-details {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .vpa-lbl {
          font-size: 12px;
          color: var(--color-slate-muted);
        }
        .vpa-id {
          font-size: 15px;
          font-weight: 700;
          color: #2563eb;
        }

        /* ============ RESPONSIVE LAYOUTS ============ */
        @media (max-width: 900px) {
          .orders-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .header-right {
            width: 100%;
            justify-content: space-between;
            border-top: 1px solid var(--color-line);
            padding-top: 16px;
          }
          .details-split-row {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .payment-logs-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }

        @media (max-width: 768px) {
          .orders-wrap {
            padding: 0 16px;
          }
          .orders-title {
            font-size: 24px;
          }
          
          /* Table responsive collapse */
          .orders-table thead {
            display: none;
          }
          .orders-table tbody tr {
            display: flex;
            flex-direction: column;
            border-bottom: 1.5px solid var(--color-line);
            padding: 16px;
          }
          .orders-table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 0;
          }
          .orders-table td::before {
            content: attr(data-label);
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.05em;
            color: var(--color-slate-muted);
            text-transform: uppercase;
          }
          
          /* Force order id, date, etc layout resets */
          .orders-table td:nth-child(1)::before { content: "Order ID"; }
          .orders-table td:nth-child(2)::before { content: "Date"; }
          .orders-table td:nth-child(3)::before { content: "Items"; }
          .orders-table td:nth-child(4)::before { content: "Amount"; }
          .orders-table td:nth-child(5)::before { content: "Status"; }
          .orders-table td:nth-child(6)::before { content: "Action"; }
          
          .order-id-txt, .order-date-txt, .order-amount-txt {
            text-align: right;
          }
          .order-placed-sub, .order-time-txt, .order-payment-sub {
            display: none;
          }
          .status-container {
            align-items: flex-end;
          }
          .actions-cell {
            align-items: flex-end;
          }
        }
      `}</style>
    </>
  );
};

export default MyOrdersPage;
