// VerifyOTP.js
import React, { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import axios from "axios";
import { postService } from "../../services/service";
import Head from "next/head";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import InfoIcon from "@mui/icons-material/Info";

const VerifyOTP = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const router = useRouter();

  const { email } = router.query;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await postService("reset/password/update", {
        confirm_password: confirmPassword,
        new_password: newPassword,
        email_address: email,
      });

      // Check if the request was successful
      if (response && response.status === 200) {
        toast.success("Password Updated successfully");

        router.push({
          pathname: "/login",
        });
      } else {
        toast.error("Please re-enter password.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Please re-enter password.");
    }
  };

  return (
    <>
      <Head>
        <title>
          Reset Password - Prem Industries India Limited - Innovation In Action
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
            Reset Password
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
            Please enter your new password{" "}
          </p>
          <form onSubmit={handleSubmit}>
            <label className="p-0 mt-2">New Password</label>
            <div
              className="row p-0 m-0"
              style={{ height: "48px", border: "1px solid #EBEBEB" }}
            >
              <div className="col-12 px-0 d-flex justify-content-start align-items-center">
                <input
                  className="px-1 w-100 h-100 bg-transparent border-0"
                  value={newPassword}
                  type={showPassword ? "text" : "password"}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <div style={{ cursor: "pointer" }}>
                  <i
                    style={{
                      position: "absolute",
                      marginLeft: "-30px",
                      marginTop: "-17px",
                      fontSize: "20px",
                    }}
                  >
                    {showPassword ? (
                      <AiFillEye
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    ) : (
                      <AiFillEyeInvisible
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    )}
                  </i>
                </div>
              </div>
            </div>

            <label className="p-0 mt-2">Confirm Password</label>
            <div
              className="row p-0 m-0"
              style={{ height: "48px", border: "1px solid #EBEBEB" }}
            >
              <div className="col-12 px-0 d-flex justify-content-start align-items-center">
                <input
                  className="px-1 w-100 h-100 bg-transparent border-0"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type={showRePassword ? "text" : "password"}
                />
                <div style={{ cursor: "pointer" }}>
                  <i
                    style={{
                      position: "absolute",
                      marginLeft: "-30px",
                      marginTop: "-17px",
                      fontSize: "20px",
                    }}
                  >
                    {showPassword ? (
                      <AiFillEye
                        onClick={() => setShowRePassword(!showRePassword)}
                      />
                    ) : (
                      <AiFillEyeInvisible
                        onClick={() => setShowRePassword(!showRePassword)}
                      />
                    )}
                  </i>
                </div>
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

export default VerifyOTP;
