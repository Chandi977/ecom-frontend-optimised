import React, { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Head from "next/head";
import Loader from "../../components/loader"; // Import your loader component
import { postService } from "../../services/service";

const ReVerifyEmail = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true); // Set loading to true when submitting
      const response = await postService("re/verify/email", { email });

      if (response.status === 200) {
        const email_address = email;
        toast.success("Password change mail has been sent successfully");
        router.push({
          pathname: "/email-verification",
          query: { email_address },
        });
      } else if ((response as any).message === "User not found") {
        toast.error("Email not registered.");
      } else {
        toast.error("Failed to send password change mail");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to send password change mail");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>
          Re Verify Email - Prem Industries India Limited - Innovation In Action
        </title>
      </Head>
      {loading && <Loader variant="spinner" />}{" "}
      {/* Render loader if loading is true */}
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
            Re Verify Email
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
            Enter your email and we’ll send a mail regarding your email
            verification.
          </p>
          <form onSubmit={handleSubmit}>
            <label className="p-0 mt-2">Email</label>
            <div
              className="row p-0 m-0"
              style={{ height: "48px", border: "1px solid #EBEBEB" }}
            >
              <div className="col-12 px-0 d-flex justify-content-start align-items-center">
                <input
                  className="px-1 w-100 h-100 bg-transparent border-0"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

export default ReVerifyEmail;
