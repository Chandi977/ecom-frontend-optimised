"use client";
import React, { useState } from "react";
import axios from "axios";
import Head from "next/head";
import { toast } from "react-toastify";
import {
  PiMapPinLine,
  PiPhone,
  PiEnvelopeSimple,
  PiClock,
  PiCheckCircle,
  PiPaperPlaneTilt,
} from "react-icons/pi";
import { postService } from "../../services/service";
import JsonLd from "../../components/common/JsonLd";
import { canonicalUrl, contentPageSchema } from "../../utils/schema";

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

type FieldErrors = Partial<Record<keyof typeof initialForm, string>>;

const ContactUs = () => {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Keep the phone field numeric-only so validation is predictable.
    const next = name === "phone_no" ? value.replace(/[^0-9]/g, "") : value;
    setFormData((prev) => ({ ...prev, [name]: next }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!formData.name.trim()) next.name = "Please tell us your name.";
    if (!formData.email.trim()) {
      next.email = "We need an email to reply to.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      next.email = "That email address doesn't look right.";
    }
    if (!formData.phone_no.trim()) {
      next.phone_no = "Add a phone number so we can reach you.";
    } else if (formData.phone_no.length !== 10) {
      next.phone_no = "Phone number should be 10 digits.";
    }
    if (!formData.message.trim()) next.message = "Let us know how we can help.";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone_no.trim(),
        message: formData.message.trim(),
        description: formData.message.trim(),
        source: "contact-us",
      };

      // App 1 (self-hosted): capture the lead + send the auto-generated reply.
      const selfHosted = postService("lead/create", payload, { silent: true });

      // App 2 (Netlify/Vercel): existing lead pipeline — keep it working too.
      const netlify = axios
        .post(NETLIFY_CONTACT_ENDPOINT, payload)
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
        toast.error("Could not send your message right now. Please try again.");
        return;
      }

      const msg = response?.data?.message || "Message submitted successfully";
      toast.success(msg);
      setSuccessMessage(msg);
      setFormData(initialForm);
      setErrors({});
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const contactDetails = [
    {
      icon: <PiMapPinLine />,
      label: "Address",
      value: (
        <>
          C-209, Bulandshahar Road, Industrial Area, Ghaziabad, Uttar Pradesh,
          India - 201009
        </>
      ),
    },
    {
      icon: <PiPhone />,
      label: "Phone",
      value: <a href="tel:+918447247227">+91-844-724-7227</a>,
    },
    {
      icon: <PiEnvelopeSimple />,
      label: "Email",
      value: (
        <a href="mailto:ecommerce@premindustries.in">
          ecommerce@premindustries.in
        </a>
      ),
    },
    {
      icon: <PiClock />,
      label: "Working hours",
      value: <>Monday – Saturday, 9:00 AM – 6:00 PM IST</>,
    },
  ];

  return (
    <>
      <Head>
        <title>Contact Us | store.prempackaging</title>
        <meta name="title" content="Contact Us" />
        <meta
          name="description"
          content="Get in touch with Prem Packaging. Send us your query and our team will get back to you within one business day."
        />
        <link rel="canonical" href={canonicalUrl("/contact-us")} />
      </Head>

      <JsonLd
        id="page"
        data={contentPageSchema({
          path: "/contact-us",
          name: "Contact Us",
          type: "ContactPage",
          description:
            "Get in touch with Prem Packaging. Send us your query and our team will get back to you within one business day.",
          breadcrumb: [{ name: "Contact Us", path: "/contact-us" }],
        })}
      />

      <main className="cu">
        {/* ── Hero band ─────────────────────────────────────────────── */}
        <section className="cu-hero">
          <div className="cu-hero__glow" aria-hidden="true" />
          <div
            className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-grain tw-opacity-[0.07]"
            aria-hidden="true"
          />
          <div className="cu-hero__inner cu-rise">
            <span className="cu-eyebrow">Get in touch</span>
            <h1 className="cu-hero__title">Let&apos;s talk packaging</h1>
            <p className="cu-hero__sub">
              Bulk orders, custom packaging, or a question about an existing
              order — send us a message and our team replies within one business
              day.
            </p>
          </div>
        </section>

        {/* ── Content: info panel + form ────────────────────────────── */}
        <div className="cu-shell">
          <aside className="cu-info cu-rise cu-rise--1">
            <div
              className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-grain tw-opacity-[0.06]"
              aria-hidden="true"
            />
            <div className="cu-info__body">
              <h2 className="cu-info__title">Reach us directly</h2>
              <p className="cu-info__lead">
                Prefer to talk first? Here&apos;s where to find us.
              </p>
              <ul className="cu-info__list">
                {contactDetails.map((row) => (
                  <li key={row.label} className="cu-info__row">
                    <span className="cu-info__icon" aria-hidden="true">
                      {row.icon}
                    </span>
                    <span className="cu-info__text">
                      <span className="cu-info__label">{row.label}</span>
                      <span className="cu-info__value">{row.value}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="cu-card cu-rise cu-rise--2">
            {successMessage ? (
              <div className="cu-success" role="status">
                <span className="cu-success__icon" aria-hidden="true">
                  <PiCheckCircle />
                </span>
                <h2 className="cu-success__title">Message sent</h2>
                <p className="cu-success__text">{successMessage}</p>
                <p className="cu-success__note">
                  We&apos;ll get back to you within one business day.
                </p>
                <button
                  type="button"
                  className="cu-btn cu-btn--ghost"
                  onClick={() => setSuccessMessage(null)}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <h2 className="cu-card__title">Send us a message</h2>
                <p className="cu-card__sub">
                  Fields marked with <span className="cu-req">*</span> are
                  required.
                </p>

                <div className="cu-field">
                  <label htmlFor="name">
                    Name <span className="cu-req">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="Your full name"
                    aria-invalid={!!errors.name}
                    className={errors.name ? "is-error" : ""}
                  />
                  {errors.name && <p className="cu-error">{errors.name}</p>}
                </div>

                <div className="cu-grid-2">
                  <div className="cu-field">
                    <label htmlFor="email">
                      Email <span className="cu-req">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      maxLength={100}
                      placeholder="name@example.com"
                      aria-invalid={!!errors.email}
                      className={errors.email ? "is-error" : ""}
                    />
                    {errors.email && (
                      <p className="cu-error">{errors.email}</p>
                    )}
                  </div>

                  <div className="cu-field">
                    <label htmlFor="phone_no">
                      Phone number <span className="cu-req">*</span>
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
                      placeholder="10-digit mobile number"
                      aria-invalid={!!errors.phone_no}
                      className={errors.phone_no ? "is-error" : ""}
                    />
                    {errors.phone_no && (
                      <p className="cu-error">{errors.phone_no}</p>
                    )}
                  </div>
                </div>

                <div className="cu-field">
                  <label htmlFor="message">
                    Message <span className="cu-req">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    maxLength={1000}
                    rows={5}
                    placeholder="Tell us what you need — product, quantity, timeline…"
                    aria-invalid={!!errors.message}
                    className={errors.message ? "is-error" : ""}
                  />
                  {errors.message && (
                    <p className="cu-error">{errors.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="cu-btn cu-btn--primary"
                >
                  {submitting ? (
                    <>
                      <span className="cu-spinner" aria-hidden="true" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <PiPaperPlaneTilt aria-hidden="true" />
                      Send message
                    </>
                  )}
                </button>
              </form>
            )}
          </section>
        </div>
      </main>

      <style jsx>{`
        .cu {
          background: #f7f8fa;
          font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
          color: #111827;
          padding-bottom: 72px;
        }

        /* ── Entrance (staggered rise) ────────────────────────────── */
        .cu-rise {
          animation: cu-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .cu-rise--1 {
          animation-delay: 0.08s;
        }
        .cu-rise--2 {
          animation-delay: 0.16s;
        }
        @keyframes cu-rise {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .cu-rise {
            animation: none;
          }
        }

        /* ── Hero ─────────────────────────────────────────────────── */
        .cu-hero {
          position: relative;
          overflow: hidden;
          background: radial-gradient(
              120% 140% at 15% 0%,
              #1f3a6e 0%,
              #182c5a 42%,
              #0f2747 100%
            );
          padding: 84px 24px 132px;
          text-align: center;
        }
        .cu-hero__glow {
          position: absolute;
          top: -40%;
          right: -10%;
          width: 640px;
          height: 640px;
          background: radial-gradient(
            circle,
            rgba(233, 34, 39, 0.28) 0%,
            transparent 62%
          );
          filter: blur(8px);
          pointer-events: none;
        }
        .cu-hero__inner {
          position: relative;
          max-width: 680px;
          margin: 0 auto;
        }
        .cu-eyebrow {
          display: inline-block;
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #ff9a9d;
          margin-bottom: 18px;
        }
        .cu-hero__title {
          font-family: "Calistoga", Georgia, serif;
          font-weight: 400;
          color: #ffffff;
          font-size: clamp(38px, 6vw, 60px);
          line-height: 1.02;
          letter-spacing: -0.01em;
          margin: 0 0 18px;
          text-wrap: balance;
        }
        .cu-hero__sub {
          color: #c6d2e6;
          font-size: 17px;
          line-height: 1.62;
          margin: 0 auto;
          max-width: 34rem;
          text-wrap: pretty;
        }

        /* ── Shell / grid ─────────────────────────────────────────── */
        .cu-shell {
          position: relative;
          z-index: 2;
          max-width: 1120px;
          margin: -84px auto 0;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 0.82fr 1.18fr;
          gap: 24px;
          align-items: start;
        }

        /* ── Info panel ───────────────────────────────────────────── */
        .cu-info {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          background: linear-gradient(160deg, #182c5a 0%, #0f2747 100%);
          box-shadow: 0 28px 60px -30px rgba(15, 39, 71, 0.55);
        }
        .cu-info__body {
          position: relative;
          padding: 34px 30px;
        }
        .cu-info__title {
          font-family: "Calistoga", Georgia, serif;
          font-weight: 400;
          color: #ffffff;
          font-size: 24px;
          margin: 0 0 6px;
        }
        .cu-info__lead {
          color: #9fb0cd;
          font-size: 14.5px;
          line-height: 1.5;
          margin: 0 0 26px;
        }
        .cu-info__list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .cu-info__row {
          display: flex;
          gap: 14px;
          padding: 16px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.09);
        }
        .cu-info__row:first-child {
          border-top: none;
          padding-top: 0;
        }
        .cu-info__icon {
          flex: none;
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(233, 34, 39, 0.14);
          color: #ff8a8d;
          font-size: 20px;
        }
        .cu-info__text {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .cu-info__label {
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #7f92b3;
        }
        .cu-info__value {
          color: #e7ecf5;
          font-size: 14.5px;
          line-height: 1.5;
        }
        .cu-info :global(a) {
          color: #e7ecf5;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .cu-info :global(a:hover) {
          color: #ffffff;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        /* ── Form card ────────────────────────────────────────────── */
        .cu-card {
          background: #ffffff;
          border: 1px solid #e6e8ec;
          border-radius: 20px;
          padding: 36px 34px;
          box-shadow: 0 1px 2px rgba(15, 39, 71, 0.06),
            0 24px 50px -28px rgba(15, 39, 71, 0.22);
        }
        .cu-card__title {
          font-family: "Calistoga", Georgia, serif;
          font-weight: 400;
          color: #182c5a;
          font-size: 26px;
          margin: 0 0 4px;
        }
        .cu-card__sub {
          color: #667085;
          font-size: 14px;
          margin: 0 0 26px;
        }
        .cu-req {
          color: #e92227;
        }

        .cu-field {
          margin-bottom: 20px;
        }
        .cu-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .cu-field :global(label) {
          display: block;
          font-size: 13.5px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .cu-field :global(input),
        .cu-field :global(textarea) {
          width: 100%;
          font-family: inherit;
          font-size: 15px;
          color: #111827;
          background: #f9fafb;
          border: 1.5px solid #e6e8ec;
          border-radius: 12px;
          padding: 12px 14px;
          transition: border-color 0.18s ease, box-shadow 0.18s ease,
            background 0.18s ease;
          outline: none;
        }
        .cu-field :global(textarea) {
          resize: vertical;
          min-height: 130px;
        }
        .cu-field :global(input::placeholder),
        .cu-field :global(textarea::placeholder) {
          color: #9aa4b5;
        }
        .cu-field :global(input:focus),
        .cu-field :global(textarea:focus) {
          border-color: #e92227;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(233, 34, 39, 0.12);
        }
        .cu-field :global(input.is-error),
        .cu-field :global(textarea.is-error) {
          border-color: #e53935;
          background: #fdecec;
        }
        .cu-error {
          margin: 7px 0 0;
          font-size: 13px;
          color: #d21f24;
        }

        /* ── Buttons ──────────────────────────────────────────────── */
        .cu-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          font-family: inherit;
          font-size: 15px;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.2s ease,
            box-shadow 0.2s ease, color 0.2s ease;
        }
        .cu-btn :global(svg) {
          font-size: 18px;
        }
        .cu-btn--primary {
          width: 100%;
          margin-top: 6px;
          padding: 14px 22px;
          color: #ffffff;
          background: #e92227;
          box-shadow: 0 12px 26px -12px rgba(233, 34, 39, 0.6);
        }
        .cu-btn--primary:hover {
          background: #182c5a;
          box-shadow: 0 14px 30px -12px rgba(24, 44, 90, 0.55);
        }
        .cu-btn--primary:active {
          transform: scale(0.985);
        }
        .cu-btn--primary:focus-visible {
          box-shadow: 0 0 0 4px rgba(233, 34, 39, 0.28);
        }
        .cu-btn--primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .cu-btn--ghost {
          padding: 11px 20px;
          color: #182c5a;
          background: transparent;
          border: 1.5px solid #d4dced;
        }
        .cu-btn--ghost:hover {
          background: #f2f5fb;
          border-color: #182c5a;
        }
        .cu-btn--ghost:active {
          transform: scale(0.985);
        }

        .cu-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.45);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: cu-spin 0.7s linear infinite;
        }
        @keyframes cu-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ── Success ──────────────────────────────────────────────── */
        .cu-success {
          text-align: center;
          padding: 22px 8px 12px;
        }
        .cu-success__icon {
          display: inline-grid;
          place-items: center;
          width: 66px;
          height: 66px;
          border-radius: 50%;
          background: #e8f7ee;
          color: #1f9d55;
          font-size: 38px;
          margin-bottom: 18px;
        }
        .cu-success__title {
          font-family: "Calistoga", Georgia, serif;
          font-weight: 400;
          color: #182c5a;
          font-size: 26px;
          margin: 0 0 8px;
        }
        .cu-success__text {
          color: #374151;
          font-size: 15.5px;
          line-height: 1.6;
          margin: 0 auto 4px;
          max-width: 26rem;
        }
        .cu-success__note {
          color: #667085;
          font-size: 14px;
          margin: 0 0 22px;
        }

        /* ── Responsive ───────────────────────────────────────────── */
        @media (max-width: 880px) {
          .cu-shell {
            grid-template-columns: 1fr;
            margin-top: -72px;
          }
        }
        @media (max-width: 540px) {
          .cu-hero {
            padding: 64px 20px 116px;
          }
          .cu-card {
            padding: 28px 20px;
          }
          .cu-info__body {
            padding: 28px 22px;
          }
          .cu-grid-2 {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }
      `}</style>
    </>
  );
};

export default ContactUs;
