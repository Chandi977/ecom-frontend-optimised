// VerifyOTP.js
import React, { useState } from "react";
import { useRouter } from "next/router"; // Import useRouter from next/router
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Head from "next/head";
import { postService } from "../../services/service";
import { cdn } from "../../lib/cdn";

const VerifyOTP = () => {
  const [otp, setOTP] = useState(""); // State to store OTP input value
  const router = useRouter(); // Initialize useRouter

  const rawEmail = router.query.email;
  const email = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail;
  const normalizedEmail =
    typeof email === "string" ? decodeURIComponent(email).trim() : "";

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedOtp = otp.trim();

    if (!normalizedEmail) {
      toast.error("Email address is missing. Please request a new OTP.");
      return;
    }

    if (!/^\d{6}$/.test(normalizedOtp)) {
      toast.error("Please enter the 6-digit OTP.");
      return;
    }

    try {
      const response = await postService("reset/password/verify/otp", {
        otp: normalizedOtp,
        email: normalizedEmail,
      });

      // Check if the request was successful
      if (response && response.status === 200) {
        toast.success("OTP verified successfully");

        router.push({
          pathname: "/reset-password",
          query: { email: normalizedEmail },
        });
      } else if (response) {
        toast.error(response?.data?.message || "Please enter correct OTP.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Please enter correct OTP.");
    }
  };

  return (
    <>
      <body className="bg-white" style={{ backgroundColor: "white" }}></body>
      <Head>
        <title>
          Verify OTP - Prem Industries India Limited - Innovation In Action
        </title>
      </Head>
      <div
        className="container-fluid bg-white"
        style={{ backgroundColor: "white" }}
      >
        <div className="container mt-5 pt-5">
          <div className="row mt-5 pt-5">
            <h1 className="text-center" style={{ color: "#182C5A" }}>
              Verify OTP
            </h1>
            <p
              className="text-center"
              style={{ fontSize: "18px", color: "#E92227" }}
            >
              Enter the OTP sent to your registered Email Address.
            </p>
          </div>
          <div className="row">
            <div className="col-md-6 mt-5">
              <form onSubmit={handleSubmit}>
                <div className="mb-4 mt-2">
                  <label
                    htmlFor="exampleInputEmail1"
                    className="form-label"
                    style={{ fontSize: "20px", fontWeight: "bold" }}
                  >
                    OTP <span className="text-danger">*</span>
                  </label>
                  <div className="row">
                    <div className="col-md-12">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoComplete="one-time-code"
                        required
                        className="form-control"
                        id="exampleInputEmail1"
                        aria-describedby="emailHelp"
                        placeholder="Enter your OTP"
                        value={otp}
                        onChange={(e) =>
                          setOTP(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="row mt-3 mb-5">
                  <div className="col-md-12 d-flex justify-content-center">
                    <button
                      type="submit"
                      className="btn btn-lg w-50"
                      style={{ backgroundColor: "#182C5A", color: "white" }}
                    >
                      Verify OTP
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <div className="col-md-6 text-center m-0 pb-3">
              <img src={cdn("/verifyotpimg.png")} alt="..." height={300} width={300} />
            </div>
          </div>
        </div>
      </div>
      {/* <div
        className="container-fluid py-5 d-flex justify-content-center align-items-center p-0 m-0 bg-white mt-5"
        style={{ minHeight: "50vh" }}
      >
        <div
          className="row rounded-3 px-3 bg-white mt-5"
          style={{ width: "420px" }}
        >
          <p
            className="p-0 m-0"
            style={{
              color: "#000",
              fontFeatureSettings: "'liga' off",
              fontFamily: "Montserrat",
              fontSize: "40.944px",
              fontStyle: "normal",
              fontWeight: "700",
              lineHeight: "68.852px",
              letterSpacing: "0.819px",
            }}
          >
            Verify OTP
          </p>
          <p
            className="p-0"
            style={{
              color: "#000",
              fontFamily: "Montserrat",
              fontSize: "16.378px",
              fontStyle: "normal",
              fontWeight: "400",
              lineHeight: "normal",
            }}
          >
            Enter the OTP sent to your registered Email Address{" "}
          </p>
          <form onSubmit={handleSubmit}>
            <label className="p-0 mt-2">OTP</label>
            <div
              className="row p-0 m-0"
              style={{ height: "48px", border: "1px solid #EBEBEB" }}
            >
              <div className="col-12 px-0 d-flex justify-content-start align-items-center">
                <input
                  className="px-1 w-100 h-100 bg-transparent border-0"
                  value={otp}
                  onChange={(e) => setOTP(e.target.value)}
                />
              </div>
            </div>

            <div className="row p-0 mx-0 mt-4">
              <button type="submit" className={styles.loginbtn}>
                Verify OTP
              </button>
            </div>
          </form>
        </div>
      </div> */}
    </>
  );
};

export default VerifyOTP;
