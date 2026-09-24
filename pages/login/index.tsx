import React from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKey, faUser } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useEffect } from "react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import Link from "next/link";
import { postService } from "../../services/service";
import { useRouter } from "next/router";
import Head from "next/head";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";
import { syncFavToServer } from "../../utils/favourites";
import { migrateGuestCartToServer } from "../../utils/cart";
import {
  getRefreshToken,
  getToken,
  setAuthState,
} from "../../services/token";
import { refreshAccessToken } from "../../services/auth";
import { cdn } from "../../lib/cdn";

const getSafeRedirectPath = (redirect: string | string[] | undefined) => {
  const path = Array.isArray(redirect) ? redirect[0] : redirect;
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }

  const pathname = path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return pathname === "/login" ? "/" : path;
};

const Loginpage = () => {
  const [widt, setWidt] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const breakpoint = 700;
  useEffect(() => {
    if (typeof window !== "undefined") {
      setWidt(window.innerWidth);
      const handleResizeWindow = () => setWidt(window.innerWidth);
      // subscribe to window resize event "onComponentDidMount"

      window.addEventListener("resize", handleResizeWindow);
      return () => {
        // unsubscribe "onComponentDestroy"
        window.removeEventListener("resize", handleResizeWindow);
      };
    }
  }, []);
  const router = useRouter();

  const getRedirectPath = () =>
    getSafeRedirectPath(router.query.redirect);

  useEffect(() => {
    if (!router.isReady) return;

    let isActive = true;

    const redirectAuthenticatedUser = async () => {
      try {
        let authenticated = Boolean(getToken());

        if (!authenticated && getRefreshToken()) {
          authenticated = Boolean(await refreshAccessToken());
        }

        if (!isActive) return;

        if (authenticated) {
          const navigated = await router.replace(getRedirectPath());
          if (navigated || !isActive) return;
        }
      } catch {
        // Keep the login form available if the session check cannot complete.
      }

      if (isActive) {
        setIsCheckingSession(false);
      }
    };

    void redirectAuthenticatedUser();

    return () => {
      isActive = false;
    };
    // The redirect query is stable once router.isReady becomes true.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  const [login, setLogin] = useState({
    email_address: "",
    password: "",
  });

  const handelSignin = async (e) => {
    e.preventDefault();
    const res = await postService("signin", login);
    if (res?.data?.success) {
      setAuthState(
        res.data.data?.Token,
        res.data.data?.RefreshToken,
        res?.data?.data?.user,
      );
      await migrateGuestCartToServer();
      await syncFavToServer();
      router.push(getRedirectPath());
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await postService("auth/google", {
        credential: credentialResponse.credential,
      });
      if (res?.data?.success) {
        setAuthState(
          res.data.data?.Token,
          res.data.data?.RefreshToken,
          res?.data?.data?.user,
        );
        await migrateGuestCartToServer();
        await syncFavToServer();
        toast.success("Login successful!");
        router.push(getRedirectPath());
      }
    } catch (error) {
      toast.error("Google login failed. Please try again.");
    }
  };

  const handleGoogleError = () => {
    toast.error("Google login failed. Please try again.");
  };

  if (isCheckingSession) {
    return null;
  }

  return (
    <>
      <Head>
        <title>
          Login - Prem Industries India Limited - Innovation In Action
        </title>
      </Head>
      <div
        className="container-fluid bg-white"
        style={{ backgroundColor: "white" }}
      >
        <div className="container" style={{ paddingTop: "200px" }}>
          <div className="row d-flex justify-content-center align-item-center">
            <div className="col-md-12 text-center mb-3 mt-2">
              <h1 style={{ fontSize: "40px", color: "#182C5A" }}>User Login</h1>
            </div>
            <div className="col-md-6">
              <form onSubmit={handelSignin}>
                <div className="mb-3">
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
                        value={login.email_address}
                        onChange={(e) =>
                          setLogin({ ...login, email_address: e.target.value })
                        }
                      />
                      <div className="row mt-2">
                        <Link
                          href="/re-verify-email"
                          style={{ color: "#182C5A" }}
                        >
                          <p
                            className="p-0"
                            style={{
                              // textAlign: "end",
                              color: "#1A1B22",
                              // textAlign: "right",
                              fontFamily: "Montserrat",
                              fontSize: "16px",
                              fontStyle: "italic",
                              fontWeight: "400",
                              lineHeight: "normal",
                              textDecoration: "none",
                            }}
                          >
                            Re-verify Email
                          </p>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label
                    htmlFor="exampleInputPassword1"
                    className="form-label"
                    style={{ fontSize: "20px", fontWeight: "bold" }}
                  >
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="row">
                    <div className="col-md-11">
                      <input
                        className="form-control"
                        required
                        id="exampleInputPassword1"
                        placeholder="Enter your password"
                        type={showPassword ? "text" : "password"}
                        value={login.password}
                        onChange={(e) =>
                          setLogin({ ...login, password: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-1">
                      <div
                        style={{
                          cursor: "pointer",
                          marginBottom: "25px",
                        }}
                      >
                        <i
                          style={{
                            position: "absolute",
                            // marginLeft: "-30px",
                            marginTop: "-5px",
                            fontSize: "25px",
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
                  <div className="row mt-2">
                    <Link href="/forget-password" style={{ color: "#182C5A" }}>
                      <p
                        className="p-0"
                        style={{
                          // textAlign: "end",
                          color: "#182C5A",
                          // textAlign: "right",
                          fontFamily: "Montserrat",
                          fontSize: "16px",
                          fontStyle: "italic",
                          fontWeight: "400",
                          lineHeight: "normal",
                          textDecoration: "none",
                        }}
                      >
                        Forgot Password?
                      </p>
                    </Link>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-md-12 d-flex justify-content-center">
                    <button
                      type="submit"
                      className="btn btn-lg w-50"
                      style={{ backgroundColor: "#182C5A", color: "white" }}
                    >
                      Login
                    </button>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <p
                      className="p-0 mt-3 text-center"
                      style={{
                        color: "#182C5A",
                        fontFamily: "Montserrat",
                        fontSize: "16px",
                        // fontStyle: "italic",
                        fontWeight: "400",
                        lineHeight: "normal",
                      }}
                    >
                      Not a member yet?&nbsp;
                      <Link
                        href={{
                          pathname: "/sign-up",
                          query:
                            getRedirectPath() !== "/"
                              ? { redirect: getRedirectPath() }
                              : {},
                        }}
                        style={{
                          color: "#182C5A",
                          fontFamily: "Montserrat",
                          fontSize: "16px",
                          fontStyle: "italic",
                          fontWeight: "400",
                          lineHeight: "normal",
                        }}
                      >
                        Sign up
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="row mb-3">
                  <div className="col-md-12 d-flex align-items-center">
                    <hr className="flex-grow-1" />
                    <span className="mx-3" style={{ color: "#182C5A" }}>
                      OR
                    </span>
                    <hr className="flex-grow-1" />
                  </div>
                </div>

                {/* Google Login Button */}
                <div className="row mb-4">
                  <div className="col-md-12 d-flex justify-content-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      useOneTap
                      theme="outline"
                      size="large"
                      text="signin_with"
                      shape="rectangular"
                      width="300"
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="col-md-6 text-center mb-3">
              <img src={cdn("/loginpageimg.png")} alt="..." height={350} width={350} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Loginpage;
