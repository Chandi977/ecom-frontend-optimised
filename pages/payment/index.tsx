import React, { useEffect, useRef, useState } from "react";
import { indianStates } from "../../assets/data";
import Banner from "../../components/landing/Banner";
import { getService, putService } from "../../services/service";
import Image from "next/image";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import Head from "next/head";

// The sequential "PI-<n>" number is only minted by the backend once payment is
// confirmed (asynchronously). Until then an order carries a temporary "TMP-..." id.
const isFinalOrderId = (value) =>
  typeof value === "string" && /^PI-\d+$/.test(value);

const PAID_STATUSES = ["Payment Processed", "Payment Verified", "Paid"];
const orderAwaitingNumber = (order) =>
  !isFinalOrderId(order?.orderId) && PAID_STATUSES.includes(order?.paymentStatus);

// Show the real PI- number when available; never expose the temporary id.
const displayOrderId = (order) => {
  if (isFinalOrderId(order?.orderId)) return order.orderId;
  if (orderAwaitingNumber(order)) return "Generating…";
  return "Pending payment";
};

const ORDER_ID_POLL_ATTEMPTS = 6;
const ORDER_ID_POLL_INTERVAL_MS = 1500;

const Checkoutpage = () => {
  const [emailAddress, setEmailAddress] = useState("");
  const [orders, setOrders] = useState<any>(null); // Initialize orders as an object with a data array
  const [loadingOrders, setLoadingOrders] = useState(true);  const [utrNumber, setUtrNumber] = useState("");  const router = useRouter();
  const pollAttemptsRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After a payment is confirmed the PI- number is minted asynchronously, so the
  // latest order may still show its temporary id. Re-fetch a few times until the
  // real number appears.
  useEffect(() => {
    if (!emailAddress) return undefined;
    if (!orderAwaitingNumber(orders)) {
      pollAttemptsRef.current = 0;
      return undefined;
    }
    if (pollAttemptsRef.current >= ORDER_ID_POLL_ATTEMPTS) return undefined;

    pollAttemptsRef.current += 1;
    pollTimerRef.current = setTimeout(() => {
      fetchOrdersByEmail(emailAddress);
    }, ORDER_ID_POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, emailAddress]);

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
        setEmailAddress(email);
        await fetchOrdersByEmail(email);
      } else {
        setLoadingOrders(false);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setLoadingOrders(false);
    }
  };

  const fetchOrdersByEmail = async (email) => {
    //console.log(email);
    try {
      const res = await getService(`order/latest?email=${email}`);
      const result = res?.data;
      const orderresult = result?.data || result;
      setOrders(orderresult);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUtrNumberChange = (event) => {
    setUtrNumber(event.target.value);
  };

  const handleSubmitUtrNumber = async () => {
    if (utrNumber.trim() === "") {
      toast.error("Please enter a UTR Number.");
    } else {
      const requestData = {
        _id: orders._id,
        utrNumber: utrNumber,
        paymentStatus: "Paid",
        status: "Payment Done",
      };
      // console.log(requestData)

      const token =
        typeof window !== "undefined" ? localStorage.getItem("PIToken") : null;
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
      const requestOptions = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify(requestData),
      };

      try {
        const res = await putService("order/update/utr", requestData);
        if (res?.data?.success) {
          toast.success("UTR Number submitted successfully");
          router.push("/");
        } else {
          toast.error("Failed to submit UTR Number.");
        }
      } catch (err) {
        console.error("Error while submitting UTR Number:", err);
      }
    }
  };

  return (
    <>
      <Head>
        <title>
          Payment Process - Prem Industries India Limited - Innovation In Action
        </title>
      </Head>
      <div>
        <div className="row p-0 m-0">
          <Banner />
          <div
            className="row page-mainbody"
            style={{ backgroundColor: "white" }}
          >
            <div className="payment-mainDiv" style={{ marginBlock: "20px" }}>
              <h2
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "30px",
                  color: "#3A5BA2",
                  fontWeight: "700",
                  fontSize: "36px",
                }}
              >
                Payment Process
              </h2>
              {loadingOrders ? (
                <p>Loading orders...</p>
              ) : (
                <>
                  <div className="payment-mainPage">
                    <div className="payment-orderID">
                      <div
                        style={{ paddingLeft: "10px", marginBottom: "20px" }}
                      >
                        <div
                          style={{
                            fontSize: "20px",
                            fontWeight: "600",
                            color: "#3a5ba2",
                          }}
                        >
                          Order Id :
                        </div>
                        <div
                          style={{
                            border: "1px solid #1A202E",
                            width: "250px",
                            textAlign: "center",
                            backgroundColor: "white",
                            borderRadius: "2px",
                            marginTop: "5px",
                            fontWeight: "500",
                            color: "#333333",
                            paddingBlock: "5px",
                            cursor: "default",
                          }}
                        >
                          {displayOrderId(orders)}
                        </div>
                      </div>

                      <div
                        style={{ paddingLeft: "10px", marginBottom: "20px" }}
                      >
                        <div style={{ fontSize: "20px", fontWeight: "600" }}>
                          Product(s) Name :
                        </div>
                        <div
                          style={{
                            border: "1px solid #1A202E",
                            width: "250px",
                            textAlign: "center",
                            backgroundColor: "white",
                            borderRadius: "2px",
                            marginTop: "5px",
                            color: "#333333",
                            fontWeight: "500",
                            paddingBlock: "5px",
                            cursor: "default",
                            textTransform: "capitalize",
                          }}
                        >
                          {orders?.items?.[0]?.product?.name}{" "}
                          {orders?.items?.[0]?.product?.model}
                        </div>
                      </div>

                      <div
                        style={{ paddingLeft: "10px", marginBottom: "20px" }}
                      >
                        <div style={{ fontSize: "20px", fontWeight: "600" }}>
                          Shipping City :
                        </div>
                        <div
                          style={{
                            border: "1px solid #1A202E",
                            width: "250px",
                            textAlign: "center",
                            backgroundColor: "white",
                            borderRadius: "2px",
                            marginTop: "5px",
                            color: "#333333",
                            fontWeight: "500",
                            paddingBlock: "5px",
                            cursor: "default",
                          }}
                        >
                          {orders?.town} , {orders?.state}
                        </div>
                      </div>

                      <div
                        style={{ paddingLeft: "10px", marginBottom: "20px" }}
                      >
                        <div style={{ fontSize: "20px", fontWeight: "600" }}>
                          Total Order Value :
                        </div>
                        <div
                          style={{
                            border: "1px solid #1A202E",
                            width: "250px",
                            textAlign: "center",
                            backgroundColor: "white",
                            borderRadius: "2px",
                            marginTop: "5px",
                            color: "#333333",
                            paddingBlock: "5px",
                            fontWeight: "700",
                            fontSize: "18px",
                            cursor: "default",
                          }}
                        >
                          ₹ {Math.round(orders.totalOrderValue)}
                        </div>
                      </div>

                      <div
                        style={{ paddingLeft: "10px", marginBottom: "20px" }}
                      >
                        <div style={{ fontSize: "20px", fontWeight: "600" }}>
                          Enter UTR Number :
                        </div>
                        <div
                          style={
                            {
                              // border: "1px solid grey",
                              // width: "250px",
                            }
                          }
                        >
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
                        </div>
                      </div>
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
                          marginTop: "20px",
                          textAlign: "center",
                        }}
                      >
                        Scan the QR Code
                      </div>

                      <div
                        style={{ display: "flex", justifyContent: "center" }}
                      >
                        <img
                          src="/qr_code.png"
                          alt="Payment QR Code"
                          style={{ width: "200px", height: "200px" }}
                        ></img>
                      </div>

                      <div
                        style={{
                          fontWeight: "700",
                          fontSize: "24px",
                          color: "#3A5BA2",
                          marginTop: "16px",
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
                          marginTop: "20px",
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
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: "20px",
                    }}
                  >
                    <button
                      className="payment-submit-btn"
                      onClick={handleSubmitUtrNumber}
                      style={{
                        paddingBlock: "10px",
                        paddingInline: "30px",
                        color: "white",
                        border: "none",
                      }}
                    >
                      Submit UTR Number
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .page-mainbody {
          margin-top: 17px !important;
          margin-left: 0px !important;
          margin-bottom: 0px !important;
          margin-right: 0px !important;
          padding-left: 110px !important;
          padding-right: 110px !important;
        }
        @media (max-width: 900px) {
          .page-mainbody {
            padding-left: 10px !important;
            padding-right: 10px !important;
          }
        }
        .payment-mainDiv {
          margin-top: 30px;
        }
        .payment-mainPage {
          display: flex;
          justify-content: space-around;
        }
        @media (max-width: 900px) {
          .payment-mainPage {
            flex-direction: column;
          }
        }
        .payment-orderID {
          display: flex;
          flex-direction: column;
          color: #3a5ba2;
        }
        @media (max-width: 900px) {
          .payment-orderID {
            justify-content: center;
            align-items: center;
          }
        }
        .payment-submit-btn {
          background-color: #182C5A;
        }
        .payment-submit-btn:hover {
          background-color: #E92227;
        }
      `}</style>
    </>
  );
};

export default Checkoutpage;


