"use client";
import React, { useState } from "react";
import axios from "axios";
import Head from "next/head";
import { toast } from "react-toastify";
import { postService } from "../../services/service";

// Existing Netlify/Vercel-hosted lead-handling app. Kept running in parallel so
// both lead pipelines receive every submission (see /lead/create for the
// self-hosted one that also fires the branded auto-response email).
const NETLIFY_CONTACT_ENDPOINT =
  "https://prem-industries-forms.vercel.app/api/email-store-contact.js";

const initialForm = {
  name: "",
  email: "",
  phone_no: "",
  message: "",
};

const ContactUs = () => {
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    setSubmitting(true);
    try {
      // App 1 (self-hosted): capture the lead + send the auto-generated reply.
      const selfHosted = postService("lead/create", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone_no,
        message: formData.message,
        source: "contact-us",
      });

      // App 2 (Netlify/Vercel): existing lead pipeline — keep it working too.
      const netlify = axios
        .post(NETLIFY_CONTACT_ENDPOINT, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone_no,
          message: formData.message,
        })
        .catch((err) => {
          // Never fail the whole submission if only the external app is down.
          console.error(
            "Netlify contact endpoint failed:",
            err instanceof Error ? err.message : err,
          );
          return null;
        });

      // Run both in parallel; the self-hosted response drives the UI.
      const [response] = await Promise.all([selfHosted, netlify]);

      if (!response) {
        // postService already surfaced the error toast.
        return;
      }

      const msg =
        response?.data?.message || "Message submitted successfully";
      toast.success(msg);
      setSuccessMessage(msg);
      setFormData(initialForm);
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : error,
      );
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Contact Us | store.prempackaging</title>
        <meta name="title" content="Contact Us" />
        <meta
          name="description"
          content="Get in touch with Prem Packaging. Send us your query and our team will get back to you within one business day."
        />
      </Head>

      <div className="tw-bg-white tw-py-[50px]">
        <div className="tw-flex tw-flex-col tw-justify-center tw-items-center tw-text-center tw-text-[32px] md:tw-text-[36px] tw-font-bold tw-text-[#182c5a]">
          <div>Contact Us</div>
          <div className="tw-h-[3px] tw-w-[220px] tw-bg-[#e92227] tw-mt-2"></div>
        </div>
        <p className="tw-text-center tw-text-[#5b6475] tw-mt-4 tw-max-w-[640px] tw-mx-auto tw-px-4">
          Have a question about bulk orders, custom packaging or an existing
          order? Send us a message and we&apos;ll get back to you within one
          business day.
        </p>

        <div className="contact-grid">
          {/* Left: business contact details */}
          <div className="contact-info">
            <h3 className="tw-text-[20px] tw-font-bold tw-text-[#182c5a] tw-mb-4">
              Get in touch
            </h3>
            <div className="contact-info-row">
              <span className="contact-info-label">Address</span>
              <span>
                C-209, Bulandshahar Road, Industrial Area, Ghaziabad, Uttar
                Pradesh, India - 201009
              </span>
            </div>
            <div className="contact-info-row">
              <span className="contact-info-label">Phone</span>
              <a href="tel:+918447247227">+91-844-724-7227</a>
            </div>
            <div className="contact-info-row">
              <span className="contact-info-label">Email</span>
              <a href="mailto:ecommerce@premindustries.in">
                ecommerce@premindustries.in
              </a>
            </div>
            <div className="contact-info-row">
              <span className="contact-info-label">Hours</span>
              <span>Monday - Saturday (9AM - 6PM)</span>
            </div>
          </div>

          {/* Right: lead form */}
          <div className="contact-form-wrap">
            {successMessage ? (
              <div className="contact-success">{successMessage}</div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="contact-input">
                  <label htmlFor="name" className="tw-font-bold">
                    Name <span className="tw-text-[#e92227]">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="Your Name"
                    className="tw-w-full tw-p-2 tw-border tw-border-[#ccc] tw-rounded"
                  />
                </div>

                <div className="contact-input">
                  <label htmlFor="email" className="tw-font-bold">
                    Email <span className="tw-text-[#e92227]">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="name@example.com"
                    className="tw-w-full tw-p-2 tw-border tw-border-[#ccc] tw-rounded"
                  />
                </div>

                <div className="contact-input">
                  <label htmlFor="phone_no" className="tw-font-bold">
                    Phone Number <span className="tw-text-[#e92227]">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    id="phone_no"
                    name="phone_no"
                    value={formData.phone_no}
                    onChange={handleChange}
                    maxLength={10}
                    minLength={10}
                    placeholder="Your Contact Number"
                    className="tw-w-full tw-p-2 tw-border tw-border-[#ccc] tw-rounded"
                  />
                </div>

                <div className="contact-input">
                  <label htmlFor="message" className="tw-font-bold">
                    Message <span className="tw-text-[#e92227]">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    maxLength={1000}
                    rows={5}
                    placeholder="How can we help you?"
                    className="tw-w-full tw-p-2 tw-border tw-border-[#ccc] tw-rounded"
                  />
                </div>

                <div className="contact-input" style={{ marginTop: "24px" }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="tw-bg-[#e92227] tw-text-white tw-px-6 tw-py-[10px] tw-border-0 tw-rounded tw-cursor-pointer hover:tw-bg-[#212529] disabled:tw-opacity-60 disabled:tw-cursor-not-allowed"
                  >
                    {submitting ? "Sending..." : "Submit"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 40px;
          max-width: 1080px;
          margin: 40px auto 0;
          padding-inline: 20px;
        }
        .contact-info {
          background: #f8fafc;
          border: 1px solid #e4eaf4;
          border-radius: 14px;
          padding: 28px;
        }
        .contact-info-row {
          display: flex;
          flex-direction: column;
          margin-bottom: 18px;
          color: #506078;
          font-size: 15px;
          line-height: 1.5;
        }
        .contact-info-row a {
          color: #182c5a;
          text-decoration: none;
        }
        .contact-info-row a:hover {
          color: #e92227;
        }
        .contact-info-label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #94a3b8;
          margin-bottom: 4px;
        }
        .contact-form-wrap {
          background: #fff;
          border: 1px solid #e4eaf4;
          border-radius: 14px;
          padding: 28px;
          box-shadow: 0 10px 26px rgba(16, 32, 80, 0.06);
        }
        .contact-input {
          margin-bottom: 18px;
          width: 100%;
        }
        .contact-success {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #86efac;
          border-radius: 10px;
          padding: 24px;
          text-align: center;
          font-weight: 600;
        }
        @media (max-width: 800px) {
          .contact-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      `}</style>
    </>
  );
};

export default ContactUs;
