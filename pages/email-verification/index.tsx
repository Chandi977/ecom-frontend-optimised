// VerifyOTP.js
import React, { useState } from "react";
import { useRouter } from "next/router"; // Import useRouter from next/router
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Head from "next/head";
import { postService } from "../../services/service";

const EmailVerification = () => {
  const [otp, setOTP] = useState("");
  const router = useRouter();

  const rawEmail = router.query.email_address || router.query.email;
  const email_address = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail;
  const normalizedEmail =
    typeof email_address === "string"
      ? decodeURIComponent(email_address).trim()
      : "";

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedOtp = otp.trim();

    if (!normalizedEmail) {
      toast.error("Email address is missing. Please try again.");
      return;
    }

    if (!normalizedOtp) {
      toast.error("Please enter a valid token.");
      return;
    }

    try {
      console.log("Sending Data:", {
        otp: normalizedOtp,
        email_address: normalizedEmail,
      });

      const response = await postService("verify/email", {
        otp: normalizedOtp,
        email_address: normalizedEmail,
      });

      if (response?.status === 200) {
        toast.success(response?.data?.message || "OTP verified successfully");

        router.push({
          pathname: "/login",
        });
      } else {
        toast.error("Please enter correct Token.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Please enter correct Token.");
    }
  };

  return (
    <>
      <Head>
        <title>
          Email Verification - Prem Industries India Limited - Innovation In
          Action
        </title>
      </Head>
      <div
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
            Verify Email
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
            Enter the verification token sent to your registered Email Address{" "}
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
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="row p-0 mx-0 mt-4">
              <button type="submit" className="tw-w-full tw-flex tw-justify-center tw-items-center auth-login-btn">
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
      <style jsx>{`
        .auth-login-btn {
          border: 0;
          height: 48px;
          padding: 14px 36px;
          gap: 10px;
          flex-shrink: 0;
          color: #FFF;
          text-align: center;
          font-size: 13px;
          font-style: normal;
          font-weight: 400;
          line-height: 20px;
          text-transform: uppercase;
          background-color: #182C5A;
        }
        .auth-login-btn:hover {
          background-color: #E92227;
        }
      `}</style>
    </>
  );
};

export default EmailVerification;
