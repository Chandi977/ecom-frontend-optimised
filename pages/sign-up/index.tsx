import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKey, faUser } from "@fortawesome/free-solid-svg-icons";
import InfoIcon from "@mui/icons-material/Info";
import { useState } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { postService } from "../../services/service";
import { useRouter } from "next/router";
import Head from "next/head";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { GoogleLogin } from "@react-oauth/google";
import { syncFavToServer } from "../../utils/favourites";
import { migrateGuestCartToServer } from "../../utils/cart";
import { setAuthState } from "../../services/token";
//auth commit 4
const Signuppage = () => {
  const router = useRouter();

  const getRedirectPath = () => {
    const redirect = router.query.redirect;
    const path = Array.isArray(redirect) ? redirect[0] : redirect;
    return path && path.startsWith("/") && !path.startsWith("//") ? path : "/";
  };
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [widt, setWidt] = useState(0);
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

  const [signup, setsignup] = useState({
    first_name: "",
    last_name: "",
    email_address: "",
    password: "",
    mobile_number: "",
    rePassword: "",
  });

  const handleSignup = async (e) => {
    e.preventDefault();

    const {
      first_name,
      last_name,
      email_address,
      password,
      rePassword,
      mobile_number,
    } = signup;

    // Check if any field is empty
    if (
      !first_name ||
      !last_name ||
      !email_address ||
      !password ||
      !rePassword ||
      !mobile_number
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    // Check if password meets minimum length requirement and complexity
    if (password.length < 6) {
      toast.error("Password should be at least 6 characters long");
      return;
    }

    // Password complexity check - at least one uppercase, lowercase, and digit
    const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!complexityRegex.test(password)) {
      toast.error(
        "Password should contain at least one uppercase letter, one lowercase letter, and one digit",
      );
      return;
    }

    // Check if password and re-entered password match
    if (password !== rePassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Check if mobile number is 10 characters long
    if (mobile_number.length !== 10) {
      toast.error("Mobile number should be 10 characters long");
      return;
    }

    // If all checks pass, proceed with signup
    const data = {
      first_name,
      last_name,
      email_address,
      password,
      mobile_number,
    };

    const res = await postService("signup", data);
    if (res?.data?.success) {
      toast.success("Signup successful");
      router.push({
        pathname: "/email-verification",
        query: { email_address }, // Pass email as query parameter
      });
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
        toast.success("Sign up successful!");
        router.push(getRedirectPath());
      }
    } catch (error) {
      toast.error("Google sign up failed. Please try again.");
    }
  };

  const handleGoogleError = () => {
    toast.error("Google sign up failed. Please try again.");
  };

  // authorization comment 2
  return (
    <>
      <body style={{ backgroundColor: "white" }}></body>
      <Head>
        <title>
          Signup - Prem Industries India Limited - Innovation In Action
        </title>
      </Head>
      <div className="container bg-white" style={{ paddingTop: "200px" }}>
        <div className="row d-flex justify-content-center align-item-center">
          <div className="col-md-12 text-center mb-3 mt-2">
            <h1 style={{ fontSize: "40px", color: "#182C5A" }}>Sign Up</h1>
          </div>
          <div className="col-md-6">
            <form onSubmit={handleSignup}>
              <div className="mb-3">
                <label
                  htmlFor="exampleInputEmail1"
                  className="form-label"
                  style={{ fontSize: "20px", fontWeight: "bold" }}
                >
                  First Name <span className="text-danger">*</span>
                </label>
                <div className="row">
                  <div className="col-md-12">
                    <input
                      required
                      className="form-control"
                      id="exampleInputEmail1"
                      aria-describedby="emailHelp"
                      placeholder="Enter Your First Name"
                      value={signup?.first_name}
                      onChange={(e) =>
                        setsignup({
                          ...signup,
                          first_name: e.target.value.trim(),
                        })
                      }
                      type="text"
                    />
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <label
                  htmlFor="exampleInputEmail1"
                  className="form-label"
                  style={{ fontSize: "20px", fontWeight: "bold" }}
                >
                  Last Name <span className="text-danger">*</span>
                </label>
                <div className="row">
                  <div className="col-md-12">
                    <input
                      required
                      className="form-control"
                      id="exampleInputEmail1"
                      aria-describedby="emailHelp"
                      placeholder="Enter Your Last Name"
                      value={signup?.last_name}
                      onChange={(e) =>
                        setsignup({
                          ...signup,
                          last_name: e.target.value.trim(),
                        })
                      }
                      type="text"
                    />
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <label
                  htmlFor="exampleInputEmail1"
                  className="form-label"
                  style={{ fontSize: "20px", fontWeight: "bold" }}
                >
                  Phone Number <span className="text-danger">*</span>
                </label>
                <div className="row">
                  <div className="col-md-12">
                    <input
                      required
                      className="form-control"
                      id="exampleInputEmail1"
                      aria-describedby="emailHelp"
                      placeholder="Enter your Phone Number"
                      value={signup?.mobile_number}
                      onChange={(e) =>
                        setsignup({
                          ...signup,
                          mobile_number: e.target.value.trim(),
                        })
                      }
                      type="text" // Changed type to text
                      inputMode="numeric" // Specifies that only numeric input is allowed
                      pattern="[0-9]*" // Restricts input to only numeric characters
                    />
                  </div>
                </div>
              </div>
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
                      required
                      className="form-control"
                      id="exampleInputEmail1"
                      aria-describedby="emailHelp"
                      placeholder="Enter your email"
                      value={signup?.email_address}
                      onChange={(e) =>
                        setsignup({
                          ...signup,
                          email_address: e.target.value.trim(),
                        })
                      }
                      type="email"
                    />
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
                      value={signup?.password}
                      onChange={(e) =>
                        setsignup({
                          ...signup,
                          password: e.target.value.trim(),
                        })
                      }
                      type={showPassword ? "text" : "password"}
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
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  paddingLeft: "0px",
                  justifyContent: "start",
                  alignItems: "center",
                  marginTop: "15px",
                  gap: "3px",
                }}
              >
                <div>
                  <InfoIcon />
                </div>
                <div
                  style={{
                    fontWeight: "600",
                    fontStyle: "italic",
                    fontSize: "14px",
                  }}
                >
                  Passwords must be at least 6 characters.
                </div>
              </div>
              <div className="mb-3 mt-2">
                <label
                  htmlFor="exampleInputPassword1"
                  className="form-label"
                  style={{ fontSize: "20px", fontWeight: "bold" }}
                >
                  Re-enter Password <span className="text-danger">*</span>
                </label>
                <div className="row">
                  <div className="col-md-11">
                    <input
                      className="form-control"
                      required
                      id="exampleInputPassword1"
                      placeholder="Re-enter your password"
                      value={signup?.rePassword}
                      onChange={(e) =>
                        setsignup({
                          ...signup,
                          rePassword: e.target.value.trim(),
                        })
                      }
                      type={showRePassword ? "text" : "password"}
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
              </div>
              <div className="row mt-3">
                <div className="col-md-12 d-flex justify-content-center">
                  <button
                    type="submit"
                    className="btn btn-lg w-50"
                    style={{ backgroundColor: "#182C5A", color: "white" }}
                  >
                    Sign Up
                  </button>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12 mb-3 mt-3 text-center">
                  <p
                    className="p-0 m-0"
                    style={{
                      color: "#1A1B22",
                      fontFamily: "Montserrat",
                      fontSize: "15.559px",
                      fontStyle: "italic",
                      fontWeight: "400",
                      lineHeight: "normal",
                    }}
                  >
                    Already have an account?&nbsp;
                    <Link
                      href="/login"
                      style={{
                        fontFamily: "Montserrat",
                        fontSize: "15.559px",
                        fontStyle: "italic",
                        fontWeight: "400",
                        lineHeight: "normal",
                        textDecoration: "none",
                      }}
                    >
                      <span className="auth-login-link">Login</span>
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

              {/* Google Sign Up Button */}
              <div className="row mb-4">
                <div className="col-md-12 d-flex justify-content-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="signup_with"
                    shape="rectangular"
                    width="300"
                  />
                </div>
              </div>
            </form>
          </div>
          <div className="col-md-6 text-center mb-3 d-flex justify-content-center align-items-center">
            <img src="/signuppageimg.png" alt="..." height={400} width={400} />
          </div>
        </div>
      </div>
      <style jsx>{`
        .auth-login-link {
          color: #182C5A;
        }
        .auth-login-link:hover {
          color: #E92227;
        }
      `}</style>
    </>
  );
};

export default Signuppage;
