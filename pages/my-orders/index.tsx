import React, { useEffect, useRef, useState } from "react";
import Banner from "../../components/orders/OrdersBanner";
import { getService, putService } from "../../services/service";
import { format } from "date-fns";
import { Modal, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

const getOrderCreatedTime = (order) => {
  const timestamp = new Date(order?.createdAt || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const sortOrdersRecentFirst = (orderList) =>
  [...orderList].sort(
    (currentOrder, nextOrder) =>
      getOrderCreatedTime(nextOrder) - getOrderCreatedTime(currentOrder),
  );

// The sequential "PI-<n>" number is only minted by the backend once payment is
// confirmed (asynchronously). Until then an order carries a temporary "TMP-..." id.
const isFinalOrderId = (value) =>
  typeof value === "string" && /^PI-\d+$/.test(value);

// An order whose payment is in/through verification but whose PI- number has not
// been minted yet — poll until it appears instead of showing the temporary id.
const PAID_STATUSES = ["Payment Processed", "Payment Verified", "Paid"];
const orderAwaitingNumber = (order) =>
  !isFinalOrderId(order?.orderId) && PAID_STATUSES.includes(order?.paymentStatus);

const ORDER_ID_POLL_ATTEMPTS = 6;
const ORDER_ID_POLL_INTERVAL_MS = 1500;

const Checkoutpage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOderValue, setSelectedOrderValue] = useState<number | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const pollAttemptsRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const handleModalShow = (orderId, orderValue) => {
    setSelectedOrderId(orderId);
    setSelectedOrderValue(orderValue);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setSelectedOrderId(null);
    setShowModal(false);
  };

  const handleUtrNumberChange = (event) => {
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
          setShowModal(false);
          await getUser();
        } else {
          toast.error("Failed to submit UTR Number.");
        }
      } catch (err) {
        // console.error("Error while submitting UTR Number:", err);
      }
    }
  };

  useEffect(() => {
    // Fetch the user's email address and orders on component mount
    getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After a payment is confirmed the PI- number is minted asynchronously, so a
  // freshly-paid order may still show its temporary id. Re-fetch a few times until
  // every paid order has its real number.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Fetch orders based on the email address
        await fetchOrdersByEmail(email);
      } else {
        setLoadingOrders(false);
      }
    } catch (error) {
      // console.error("Error fetching user:", error);
      setLoadingOrders(false);
    }
  };

  const fetchOrdersByEmail = async (email) => {
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

  const loadScript = (src) => {
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
    amount,
    name,
    number,
    email,
    address,
    orderId,
    guestToken,
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
      handler: async function (response) {
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
    paymentObject.on("payment.failed", async function (response) {
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

  // Return true when out of stock condition is true, else false
  const isOrderOutOfStock = (order) => {
    let outOfStock = false;
    order?.items?.forEach((item) => {
      item?.product?.priceList?.forEach((inneritem) => {
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

  const handlePayment = async (order) => {
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

  // Safely format date/time values
  const formatDateTime = (value) => {
    if (!value) return "NA";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "NA";
    return format(date, "yyyy-MM-dd | hh:mm a");
  };

  const formatCurrency = (value) => {
    const num = Number(value ?? 0);
    if (Number.isNaN(num)) return "₹ 0.00";
    return `₹ ${num.toFixed(2)}`;
  };

  // Show the real PI- number when available; never expose the temporary id.
  const displayOrderId = (order) => {
    if (isFinalOrderId(order?.orderId)) return order.orderId;
    if (orderAwaitingNumber(order)) return "Generating…";
    return "Pending payment";
  };

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
      <div>
        <div className="row p-0 m-0">
          <Banner />
          <div
            className={"row " + "row tw-mt-[17px] tw-px-[110px] max-[900px]:tw-px-[10px]"}
            style={{ backgroundColor: "white" }}
          >
            <div className={"tw-mt-[30px]"}>
              {loadingOrders ? (
                <p>Loading your order history...</p>
              ) : (
                <div
                  style={
                    {
                      // display: "flex",
                      // flexDirection: "column",
                      // gap: "30px",
                      // marginBottom: "50px",
                    }
                  }
                >
                  <div className="container">
                    <div className="row">
                      {orders?.length > 0 ? (
                        orders
                          ?.slice()
                          .map((order, index) => {
                            const outOfStock = isOrderOutOfStock(order);
                            const canPay =
                              order?.paymentStatus &&
                              ["Not Paid", "Payment Failed"].includes(
                                order.paymentStatus,
                              );
                            const isVerified =
                              order?.paymentStatus === "Payment Verified";
                            const paymentInReview =
                              order?.paymentStatus === "Payment Processed";

                            return (
                              <React.Fragment key={order._id}>
                                <div className="col-12 mb-4">
                                  <div className={"orderCard"}>
                                    <div className={"cardHeader"}>
                                      <h3>Order Details</h3>
                                      <div
                                        className={`chip ${
                                          isVerified
                                            ? "chipSuccess"
                                            : paymentInReview
                                              ? "chipWarning"
                                              : canPay
                                                ? "chipDanger"
                                                : "chipNeutral"
                                        }`}
                                      >
                                        {canPay && outOfStock
                                          ? "Out of Stock"
                                          : canPay
                                            ? "Payment Pending"
                                            : isVerified
                                              ? "Payment Completed"
                                              : paymentInReview
                                                ? "Payment Pending Verification"
                                                : order?.paymentStatus || "Status"}
                                      </div>
                                    </div>

                                    <div className={"infoGrid"}>
                                      <div className={"kv"}>
                                        <span className={"label_"}>Order ID</span>
                                        <span className={"value_"}>{displayOrderId(order)}</span>
                                      </div>
                                      <div className={"kv"}>
                                        <span className={"label_"}>Total Order Value</span>
                                        <span className={"value_"}>
                                          {formatCurrency(order?.totalOrderValue)}
                                        </span>
                                      </div>
                                      <div className={"kv"}>
                                        <span className={"label_"}>Payment Status</span>
                                        <span className={"value_"}>{order?.paymentStatus}</span>
                                      </div>
                                      <div className={"kv"}>
                                        <span className={"label_"}>Ordered by</span>
                                        <span className={"value_"}>{order?.name}</span>
                                      </div>
                                      <div className={"kv"}>
                                        <span className={"label_"}>Address</span>
                                        <span className={"value_"}>
                                          {order?.address}, {order?.town}, {order?.state}
                                        </span>
                                      </div>
                                      <div className={"kv"}>
                                        <span className={"label_"}>Order Status</span>
                                        <span className={"value_"}>{order?.status || "NA"}</span>
                                      </div>
                                      <div className={"kv"}>
                                        <span className={"label_"}>Order Initiated</span>
                                        <span className={"value_"}>
                                          {formatDateTime(order?.createdAt)}
                                        </span>
                                      </div>
                                      <div className={"kv"}>
                                        <span className={"label_"}>Pincode</span>
                                        <span className={"value_"}>{order?.pincode}</span>
                                      </div>
                                      <div className={"kv"}>
                                        <span className={"label_"}>Coupon Code</span>
                                        <span className={"value_"}>{order?.couponCode || "NA"}</span>
                                      </div>
                                      <div className={"kv"}>
                                        <span className={"label_"}>GSTIN</span>
                                        <span className={"value_"}>{order?.gstin || "NA"}</span>
                                      </div>
                                    </div>

                                    <div className={"sectionRow"}>
                                      <div className={"section_"}>
                                        <div className="sectionTitle">Product Details</div>
                                        <ul className={"bulletList"}>
                                          {order?.items?.map((item, idx) => (
                                            <li key={idx}>
                                              <div className="valueBold">
                                                {item?.product?.model || item?.product?.name || "Product"} (Packsize: {item?.packSize}) (Qty: {item?.quantity})
                                              </div>
                                              <div className={"metaLine"}>
                                                Product ID: {item?.product?._id || item?.product || "NA"}
                                              </div>
                                              <div className={"metaLine"}>
                                                Price: {formatCurrency(item?.price)}
                                              </div>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div className={"section_"}>
                                        <div className="sectionTitle">Price Breakdown</div>
                                        <ul className={"bulletList"}>
                                          <li>
                                            <span className={"label_"}>Cart Value:</span> {formatCurrency(Math.abs(order?.totalCartValue))}
                                          </li>
                                          <li>
                                            <span className={"label_"}>Freight:</span> {formatCurrency(Math.abs(order?.shippingCost))}
                                          </li>
                                          <li>
                                            <span className={"label_"}>GST:</span> {formatCurrency(Math.abs((order?.totalOrderValue || 0) - (order?.shippingCost || 0) - (order?.totalCartValue || 0)))}
                                          </li>
                                          <li className="valueBold">
                                            <span>Total Payable:</span> {formatCurrency(order?.totalOrderValue)}
                                          </li>
                                        </ul>
                                        <div className={"ctaArea"}>
                                          {canPay && outOfStock ? (
                                            <p className="text-danger m-0">One or more products are out of stock</p>
                                          ) : canPay ? (
                                            <button className={"payBtn"} onClick={() => handlePayment(order)}>
                                              Complete Payment
                                            </button>
                                          ) : (
                                            <span className="chip chipNeutral">
                                              {isVerified
                                                ? "Payment Completed"
                                                : paymentInReview
                                                  ? "Payment Pending Verification"
                                                  : "Payment In Progress"}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className={"infoGridSecondary"}>
                                      <div className={"kv"}>
                                        <span className={"label_"}>UTR Number</span>
                                        <span className={"value_"}>{order?.utrNumber || "NA"}</span>
                                      </div>
                                      <div className={"kv"}>
                                        <span className={"label_"}>Payment Provider</span>
                                        <span className={"value_"}>{order?.paymentProvider || "NA"}</span>
                                      </div>
                                      <div className={"kv"}>
                                        <span className={"label_"}>Razorpay Payment ID</span>
                                        <span className={"value_"}>{order?.razorpayPaymentId || "NA"}</span>
                                      </div>
                                      <div className={"kv"}>
                                        <span className={"label_"}>Razorpay Order ID</span>
                                        <span className={"value_"}>{order?.razorpayOrderId || "NA"}</span>
                                      </div>
                                      <div className={"kv"}>
                                        <span className={"label_"}>Razorpay Signature</span>
                                        <span className={"value_"}>{order?.razorpaySignature || "NA"}</span>
                                      </div>
                                      {!isVerified && (
                                        <>
                                          <div className={"kv"}>
                                            <span className={"label_"}>Payment Failure Reason</span>
                                            <span className={"value_"}>{order?.paymentFailureReason || "NA"}</span>
                                          </div>
                                          <div className={"kv"}>
                                            <span className={"label_"}>Payment Failed At</span>
                                            <span className={"value_"}>{formatDateTime(order?.paymentFailedAt)}</span>
                                          </div>
                                        </>
                                      )}
                                      <div className={"kv"}>
                                        <span className={"label_"}>Last Updated</span>
                                        <span className={"value_"}>{formatDateTime(order?.updatedAt)}</span>
                                      </div>
                                      <div className={"kv"}>
                                        <span className={"label_"}>Shipping Cost</span>
                                        <span className={"value_"}>{formatCurrency(order?.shippingCost)}</span>
                                      </div>
                                      <div className={"kv"}>
                                        <span className={"label_"}>Total Cart Value</span>
                                        <span className={"value_"}>{formatCurrency(order?.totalCartValue)}</span>
                                      </div>
                                      <div className={"kv"}>
                                        <span className={"label_"}>Total Order Value</span>
                                        <span className={"value_"}>{formatCurrency(order?.totalOrderValue)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <Modal show={showModal} onHide={handleModalClose}>
                                  <Modal.Header closeButton>
                                    <Modal.Title>Complete Payment</Modal.Title>
                                  </Modal.Header>
                                  <Modal.Body>
                                    <p>
                                      <strong>Order ID:</strong> {selectedOrderId}
                                    </p>
                                    <p>
                                      <strong>Total Order Value:</strong> {formatCurrency(selectedOderValue)}
                                    </p>
                                    <p>
                                      <strong>Enter UTR Number:</strong>{" "}
                                      <input
                                        type="text"
                                        value={utrNumber}
                                        style={{
                                          width: "250px",
                                          marginTop: "5px",
                                          paddingBlock: "5px",
                                          textAlign: "center",
                                        }}
                                        onChange={handleUtrNumberChange}
                                      />
                                    </p>

                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        marginTop: "20px",
                                      }}
                                    >
                                      <button
                                        onClick={handleSubmitUtrNumber}
                                        style={{
                                          paddingBlock: "10px",
                                          paddingInline: "30px",
                                          backgroundColor: "#1A202E",
                                          color: "white",
                                          border: "none",
                                        }}
                                      >
                                        Submit UTR Number
                                      </button>
                                    </div>

                                    <div>
                                      <div
                                        style={{
                                          fontWeight: "700",
                                          fontSize: "24px",
                                          color: "#3A5BA2",
                                          textAlign: "center",
                                        }}
                                      >
                                        For Payment , you can either
                                      </div>

                                      <div
                                        style={{
                                          fontWeight: "500",
                                          fontSize: "20px",
                                          color: "#3A5BA2",
                                          marginTop: "5px",
                                          textAlign: "center",
                                        }}
                                      >
                                        Scan the QR Code
                                      </div>

                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <img
                                          src="/qr_code.png"
                                          style={{
                                            width: "100px",
                                            height: "100px",
                                          }}
                                        ></img>
                                      </div>

                                      <div
                                        style={{
                                          fontWeight: "700",
                                          fontSize: "24px",
                                          color: "#3A5BA2",
                                          marginTop: "5px",
                                          textAlign: "center",
                                        }}
                                      >
                                        OR
                                      </div>

                                      <div
                                        style={{
                                          fontWeight: "500",
                                          fontSize: "20px",
                                          color: "#3A5BA2",
                                          marginTop: "5px",
                                          textAlign: "center",
                                        }}
                                      >
                                        Pay via VPA
                                      </div>

                                      <div
                                        style={{
                                          fontWeight: "700",
                                          fontSize: "24px",
                                          color: "#333333",
                                          marginTop: "0px",
                                          textAlign: "center",
                                        }}
                                      >
                                        premindustriesecom@hsbc
                                      </div>
                                    </div>
                                  </Modal.Body>
                                  <Modal.Footer>
                                    <Button
                                      variant="secondary"
                                      onClick={handleModalClose}
                                    >
                                      Close
                                    </Button>
                                  </Modal.Footer>
                                </Modal>
                              </React.Fragment>
                            );
                          })
                      ) : (
                        <div className="col-md-12 mb-2 mt-2 mb-5 text-center">
                          <h2 style={{ color: "#132348" }}>
                            No Orders Placed Yet
                          </h2>
                          <div className="row">
                            <div className="col-md-4 mt-5">
                              <h5>
                                <Link
                                  href="/corrugated-boxes"
                                  style={{
                                    textDecoration: "none",
                                    color: "#132348",
                                  }}
                                >
                                  Corrugated Box &rarr;
                                </Link>
                              </h5>
                            </div>
                            <div className="col-md-4 mt-5">
                              <h5>
                                <Link
                                  href="/label"
                                  style={{
                                    textDecoration: "none",
                                    color: "#132348",
                                  }}
                                >
                                  Label &rarr;
                                </Link>
                              </h5>
                            </div>
                            <div className="col-md-4 mt-5">
                              <h5>
                                <Link
                                  href="/paper-bag"
                                  style={{
                                    textDecoration: "none",
                                    color: "#132348",
                                  }}
                                >
                                  Paper Bag &rarr;
                                </Link>
                              </h5>
                            </div>
                            <div className="col-md-4 mt-5">
                              <h5>
                                <Link
                                  href="/poly-bags"
                                  style={{
                                    textDecoration: "none",
                                    color: "#132348",
                                  }}
                                >
                                  Poly Bag &rarr;
                                </Link>
                              </h5>
                            </div>
                            <div className="col-md-4 mt-5">
                              <h5>
                                <Link
                                  href="/tape"
                                  style={{
                                    textDecoration: "none",
                                    color: "#132348",
                                  }}
                                >
                                  Tape &rarr;
                                </Link>
                              </h5>
                            </div>
                            <div className="col-md-4 mt-5">
                              <h5>
                                <Link
                                  href="/"
                                  style={{
                                    textDecoration: "none",
                                    color: "#132348",
                                  }}
                                >
                                  Back to Home &rarr;
                                </Link>
                              </h5>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .orderCard {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
          background: #fff;
        }
        .cardHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #eef0f4;
        }
        .infoGrid,
        .infoGridSecondary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px 18px;
          margin-top: 16px;
        }
        .infoGridSecondary {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          border-top: 1px solid #eef0f4;
          padding-top: 16px;
        }
        .kv {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .label_ {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #6b7280;
        }
        .value_ {
          font-weight: 600;
          color: #1f2937;
        }
        .valueBold {
          font-weight: 700;
          color: #111827;
        }
        .metaLine {
          color: #4b5563;
          font-size: 14px;
        }
        .sectionRow {
          display: grid;
          grid-template-columns: 2fr 1.2fr;
          gap: 24px;
          margin-top: 18px;
          padding: 18px 0;
          border-top: 1px solid #eef0f4;
          border-bottom: 1px solid #eef0f4;
        }
        .section_ {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sectionTitle {
          font-weight: 700;
          font-size: 16px;
          color: #111827;
          letter-spacing: 0.01em;
        }
        .bulletList {
          margin: 0;
          padding-left: 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ctaArea {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .payBtn {
          background: linear-gradient(135deg, #0c4e9c, #103e7a);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
          font-weight: 600;
          cursor: pointer;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 999px;
          font-weight: 600;
          font-size: 13px;
          border: 1px solid transparent;
        }
        .chipSuccess {
          background: #e8f7ef;
          color: #0f8a4b;
          border-color: #b9e4c8;
        }
        .chipWarning {
          background: #fff6e6;
          color: #b46b00;
          border-color: #ffd699;
        }
        .chipDanger {
          background: #feecec;
          color: #c81e1e;
          border-color: #f7c3c3;
        }
        .chipNeutral {
          background: #eef2f7;
          color: #1f2937;
          border-color: #d6deeb;
        }
        @media (max-width: 900px) {
          .infoGrid,
          .infoGridSecondary {
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }
          .sectionRow {
            grid-template-columns: 1fr;
          }
          .cardHeader {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
};

export default Checkoutpage;


