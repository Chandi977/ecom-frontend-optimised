import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMailBulk, faPhone } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-toastify";
import { postService } from "../../services/service";

import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import YouTubeIcon from "@mui/icons-material/YouTube";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LocalPhoneOutlinedIcon from "@mui/icons-material/LocalPhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

const Footer = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_no: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.values(formData).some((value) => value === "")) {
      toast.error("All fields are required");
      return;
    }

    if (formData.phone_no.length !== 10) {
      toast.error("Phone number should be only 10 digits");
      return;
    }

    try {
      // Send to existing API via centralized service
      const response1 = await postService("customer/create", formData);

      // Send to new email-store-contact API
      await axios.post(
        "https://prem-industries-forms.vercel.app/api/email-store-contact.js",
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone_no,
          message: formData.message,
        },
      );

      toast.success("Message submitted successfully");

      setFormData({
        name: "",
        email: "",
        phone_no: "",
        message: "",
      });
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
    }
  };

  return (
    <div className="row d-flex flex-column m-0 rootdiv">
      <div className="tw-w-[90%] tw-mx-auto">
        <div className="container-fluid">
          <div className="row text-white">
            <div className="col-md-9">
              <div className="row">
                <div className="col-md-4">
                  <div>
                    <div className="row m-0">
                      <p
                        className="footertext mt-4 ml-3"
                        style={{ fontSize: "18px", fontWeight: "bold" }}
                      >
                        MORE INFORMATION
                      </p>
                    </div>
                    <div>
                      <ul
                        style={{
                          fontSize: "16px",
                          fontWeight: "400",
                          color: "white",
                          lineHeight: "30px",
                          listStyleType: "none",
                        }}
                      >
                        <Link
                          className="bullets"
                          href="https://prempackaging.com/about-us"
                          style={{ textDecoration: "none" }}
                        >
                          <li style={{ color: "#FFFFFF9E" }}>About Us</li>
                        </Link>
                        <Link
                          className="bullets"
                          href="/privacy-policy"
                          style={{ textDecoration: "none" }}
                        >
                          <li style={{ color: "#FFFFFF9E" }}>Privacy Policy</li>
                        </Link>
                        <Link
                          className="bullets"
                          href="/shipping-policy"
                          style={{ textDecoration: "none" }}
                        >
                          <li style={{ color: "#FFFFFF9E" }}>
                            Shipping Policy
                          </li>
                        </Link>
                        <Link
                          className="bullets"
                          href="/terms-of-sale"
                          style={{ textDecoration: "none" }}
                        >
                          <li style={{ color: "#FFFFFF9E" }}>Terms Of Sale</li>
                        </Link>
                        <Link
                          className="bullets"
                          href="/return-and-exchange-policy"
                          style={{ textDecoration: "none" }}
                        >
                          <li style={{ color: "#FFFFFF9E" }}>
                            Return and Exchange Policy
                          </li>
                        </Link>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div>
                    <div className="row m-0">
                      <p
                        className="footertext mt-4 ml-3"
                        style={{ fontSize: "18px", fontWeight: "bold" }}
                      >
                        MY ACCOUNT
                      </p>
                    </div>
                    <div>
                      <ul
                        style={{
                          fontSize: "16px",
                          fontWeight: "400",
                          color: "white",
                          lineHeight: "30px",
                          listStyleType: "none",
                        }}
                      >
                        <Link
                          className="bullets"
                          href="/my-cart"
                          style={{ textDecoration: "none" }}
                        >
                          <li style={{ color: "#FFFFFF9E" }}>My Cart</li>
                        </Link>
                        <Link
                          className="bullets"
                          href="/my-orders"
                          style={{ textDecoration: "none" }}
                        >
                          <li style={{ color: "#FFFFFF9E" }}>My Orders</li>
                        </Link>
                        <Link
                          className="bullets"
                          href="/wishlist"
                          style={{ textDecoration: "none" }}
                        >
                          <li style={{ color: "#FFFFFF9E" }}>My Wishlist</li>
                        </Link>
                        <Link
                          className="bullets"
                          href="/subscription-order"
                          style={{ textDecoration: "none" }}
                        >
                          <li style={{ color: "#FFFFFF9E" }}>
                            Monthly Subscription Order
                          </li>
                        </Link>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div>
                    <div
                      className="row"
                      style={{ marginLeft: "0px", marginBottom: "10px" }}
                    >
                      <p
                        className="footertext mt-4 ml-3"
                        style={{ fontSize: "18px", fontWeight: "bold" }}
                      >
                        CONTACT US
                      </p>
                      <div className="container-fluid d-flex flex-row align-items-start">
                        <p
                          className="footertext ml-3"
                          style={{ fontSize: "16px", color: "#FFFFFF9E" }}
                        >
                          C-209, Bulandshahar Road, Industrial Area, Ghaziabad,
                          Uttar Pradesh, India - 201009
                        </p>
                      </div>
                      <div className="container-fluid d-flex flex-row align-items-start">
                        <p
                          className="footertext ml-3"
                          style={{ fontSize: "16px", color: "#FFFFFF9E" }}
                        >
                          Monday - Saturday (9AM - 6PM)
                        </p>
                      </div>
                      <div className="container-fluid d-flex flex-row align-items-start">
                        <p
                          className="footertext ml-3"
                          style={{ fontSize: "16px", color: "#FFFFFF9E" }}
                        >
                          +91-844-724-7227
                        </p>
                      </div>
                      <div className="container-fluid d-flex flex-row align-items-start">
                        <p
                          className="footertext ml-3"
                          style={{ fontSize: "16px", color: "#FFFFFF9E" }}
                        >
                          ecommerce@premindustries.in
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <form onSubmit={handleSubmit} className="mt-3">
                <div>
                  <label>
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    maxLength={100}
                    required
                    className="form-control"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label>
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    maxLength={100}
                    required
                    className="form-control"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label>
                    Phone Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    name="phone_no"
                    value={formData.phone_no}
                    onChange={handleChange}
                    maxLength={10}
                    minLength={10}
                    required
                    className="form-control"
                    placeholder="Your Contact Number"
                  />
                </div>
                <div>
                  <label>
                    Message <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Your message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    maxLength={1000}
                    required
                  />
                </div>
                <div className="row">
                  <div className="col-md-12 text-center">
                    <button
                      type="submit"
                      className="btn bg-white text-dark mt-2"
                    >
                      submit
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="row text-white">
            <div className="col-md-12 d-flex flex-column">
              <div
                className="d-flex justif-content-start align-items-center gap-4"
                style={{ marginTop: "14px", marginBottom: "10px" }}
              >
                <span style={{ fontWeight: "bold" }}>FOLLOW US</span>
                <Link
                  href="https://www.facebook.com/PremIndustriesIndiaLimited/"
                  target="_blank"
                >
                  <FacebookIcon fontSize="large" sx={{ color: "white" }} />
                </Link>
                <Link
                  href="https://www.instagram.com/prem_packaging/?hl=en"
                  target="_blank"
                >
                  <InstagramIcon fontSize="large" sx={{ color: "white" }} />
                </Link>
                <Link
                  href="https://www.youtube.com/@premindustries9251/videos"
                  target="_blank"
                >
                  <YouTubeIcon
                    sx={{ color: "white", fontSize: 43, marginTop: 0 }}
                  />
                </Link>
                <Link href="https://wa.me/8447247227" target="_blank">
                  <WhatsAppIcon fontSize="large" sx={{ color: "white" }} />
                </Link>
                <Link
                  href="https://in.linkedin.com/company/prem-packaging"
                  target="_blank"
                >
                  <LinkedInIcon fontSize="large" sx={{ color: "white" }} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @media (max-width: 800px) {
          .formFields { flex-direction: column; }
          .formInput { margin-top: 20px; }
          .list { flex-direction: column; gap: 30px; justify-content: center; align-items: center; }
          .sections { width: 100% !important; }
          .formButton { margin-top: 20px; }
        }
        .bullets { color: white; }
        .bullets:hover { color: #e92227; }
      `}</style>
    </div>
  );
};

export default Footer;
