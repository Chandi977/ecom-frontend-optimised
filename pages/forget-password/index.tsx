import React, { useState } from "react";
import { useRouter } from "next/router";
// import styles from "./page.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Head from "next/head";
import Loader from "../../components/loader"; // Import your loader component
import { postService } from "../../services/service";
import Link from "next/link";

const Forgetpage = () => {
  const [showPassword, setShowPassword] = useState(false);
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
      const response = await postService("reset/password/otp", { email });

      if (response && response.status === 200) {
        toast.success("Password change mail has been sent successfully");
        router.push({
          pathname: "/verify-otp",
          query: { email },
        });
      } else if (response && (response as any).message === "User not found") {
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
      <body className="bg-white" style={{ backgroundColor: "white" }}></body>
      <Head>
        <title>
          Forget Password - Prem Industries India Limited - Innovation In Action
        </title>
      </Head>
      {loading && <Loader variant="spinner" />}{" "}
      {/* Render loader if loading is true */}
      <div
        className="container-fluid bg-white"
        style={{ backgroundColor: "white" }}
      >
        <div className="container mt-5 pt-5">
          <div className="row mt-5 pt-5">
            <h1 className="text-center" style={{ color: "#182C5A" }}>
              Reset Your Password
            </h1>
            {/* <p
              className="text-center"
              style={{ fontSize: "18px", color: "#E92227" }}
            >
              Enter your email and we’ll send a mail regarding your password
              change
            </p> */}
          </div>
          <div className="row">
            <div className="col-md-6 mt-5">
              <form onSubmit={handleSubmit}>
                <div className="mb-3 mt-4">
                  <label
                    htmlFor="exampleInputEmail1"
                    className="form-label"
                    style={{ fontSize: "20px", fontWeight: "bold" }}
                  >
                    Email <span className="text-danger">*</span>
                  </label>
                  <div className="row">
                    <div className="col-md-12">
                      <input
                        type="email"
                        required
                        className="form-control"
                        id="exampleInputEmail1"
                        aria-describedby="emailHelp"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                      Send OTP
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <div className="col-md-6 text-center">
              <img
                src="/forgotpasswordimg.png"
                alt="..."
                height={300}
                width={300}
              />
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
            className="p-0 mt-5"
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
            Forget Password
          </p>
          <p
            className="p-0 text-danger"
            style={{
              color: "#000",
              fontFamily: "Montserrat",
              fontSize: "16px",
              fontStyle: "normal",
              fontWeight: "400",
              lineHeight: "normal",
            }}
          >
            Enter your email and we’ll send a mail regarding your password
            change
          </p>
          <form onSubmit={handleSubmit}>
            <label className="mt-2">
              <h5>
                Email <span className="text-danger">*</span>
              </h5>
            </label>
            <div
              className="row"
              style={{ height: "48px", border: "1px solid #EBEBEB" }}
            >
              <div className="col-12 d-flex justify-content-start align-items-center">
                <input
                  className="w-100 h-100 bg-transparent border-0"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="row mt-1">
              <button type="submit" className={styles.loginbtn}>
                Send OTP
              </button>
            </div>
          </form>
        </div>
      </div> */}
    </>
  );
};

export default Forgetpage;
