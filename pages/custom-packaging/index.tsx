"use client"; // This is a client component 👈🏽
import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Head from "next/head";
import { toast } from "react-toastify";
import {
  PiRuler,
  PiCube,
  PiSparkle,
  PiTruck,
  PiCheckCircle,
  PiPaperPlaneTilt,
} from "react-icons/pi";
import { postService } from "../../services/service";
import JsonLd from "../../components/common/JsonLd";
import { canonicalUrl, contentPageSchema } from "../../utils/schema";

// Existing Netlify/Vercel-hosted lead app for custom packaging enquiries. Kept
// running in parallel with the self-hosted lead app (/lead/create) so both
// pipelines receive every submission.
const NETLIFY_CUSTOM_ENDPOINT =
  "https://prem-industries-forms.vercel.app/api/email-store-custom.js";

const initialForm = {
  company_name: "",
  product_category: "",
  moq: "",
  rich_text: "",
  contact_person_name: "",
  contact_person_email: "",
  contact_person_mobile_number: "",
};

type FieldErrors = Partial<Record<keyof typeof initialForm, string>>;

export async function getServerSideProps() {
  return { props: {} };
}

const CustomForm = () => {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next =
      name === "contact_person_mobile_number"
        ? value.replace(/[^0-9]/g, "")
        : value;
    setFormData((prev) => ({ ...prev, [name]: next }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!formData.company_name.trim())
      next.company_name = "Add your company name.";
    if (!formData.product_category.trim())
      next.product_category = "Which product do you need?";
    if (!formData.moq.trim())
      next.moq = "Add an approximate order quantity.";
    if (!formData.rich_text.trim())
      next.rich_text = "Tell us a little about the requirement.";
    if (!formData.contact_person_name.trim())
      next.contact_person_name = "Who should we get back to?";
    if (!formData.contact_person_email.trim()) {
      next.contact_person_email = "We need an email to reply to.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_person_email)
    ) {
      next.contact_person_email = "That email address doesn't look right.";
    }
    if (!formData.contact_person_mobile_number.trim()) {
      next.contact_person_mobile_number = "Add a number we can call.";
    } else if (formData.contact_person_mobile_number.length !== 10) {
      next.contact_person_mobile_number = "Phone number should be 10 digits.";
    }
    return next;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      // App 1 (self-hosted lead handling): capture the lead with its structured
      // details, verify the email and fire the auto-generated acknowledgement +
      // internal notification.
      const leadReq = postService(
        "lead/create",
        {
          name: formData.contact_person_name,
          email: formData.contact_person_email,
          phone: formData.contact_person_mobile_number,
          message: formData.rich_text,
          company: formData.company_name,
          productCategory: formData.product_category,
          moq: formData.moq,
          source: "custom-packaging",
        },
        { silent: true },
      );

      // Existing internal custom-packaging record.
      const customReq = postService("custom-packaging", formData, {
        silent: true,
      });

      const netlifyPayload = {
        ...formData,
        name: formData.contact_person_name,
        email: formData.contact_person_email,
        phone: formData.contact_person_mobile_number,
        description: formData.rich_text,
        message: formData.rich_text,
      };

      // App 2 (Netlify/Vercel): existing custom-packaging email pipeline — keep
      // it running too. Never fail the whole submission if only this is down.
      const netlifyReq = axios
        .post(NETLIFY_CUSTOM_ENDPOINT, netlifyPayload)
        .catch((err) => {
          console.error(
            "Netlify custom endpoint failed:",
            err instanceof Error ? err.message : err,
          );
          return null;
        });

      const [leadRes, customRes] = await Promise.all([
        leadReq,
        customReq,
        netlifyReq,
      ]);

      // The self-hosted lead app drives the confirmation; fall back gracefully.
      if (!leadRes && !customRes) {
        toast.error("Could not submit your enquiry right now. Please try again.");
        return;
      }

      const message =
        leadRes?.data?.message ||
        customRes?.data?.message ||
        "Your enquiry has been submitted successfully";
      setSuccessMessage(message);
      toast.success(message);
      setFormData(initialForm);
      setErrors({});

      setTimeout(() => {
        router.push("/");
      }, 2200);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: <PiRuler />,
      title: "Made to your specs",
      text: "Sizes, materials and print built around your product.",
    },
    {
      icon: <PiCube />,
      title: "Practical minimums",
      text: "Order quantities that work for growing brands.",
    },
    {
      icon: <PiSparkle />,
      title: "Brand-first finish",
      text: "Your logo, colours and artwork, cleanly reproduced.",
    },
    {
      icon: <PiTruck />,
      title: "Reliable delivery",
      text: "Manufactured in-house and shipped on schedule.",
    },
  ];

  const fields: {
    id: keyof typeof initialForm;
    label: string;
    type?: string;
    placeholder: string;
    full?: boolean;
    textarea?: boolean;
    inputMode?: "numeric";
    maxLength?: number;
  }[] = [
    {
      id: "company_name",
      label: "Company name",
      placeholder: "Registered business name",
    },
    {
      id: "product_category",
      label: "Product category",
      placeholder: "e.g. carry bags, tapes, corrugated boxes",
    },
    {
      id: "moq",
      label: "Order quantity",
      placeholder: "Approximate quantity you need",
    },
    {
      id: "contact_person_mobile_number",
      label: "Contact mobile number",
      placeholder: "10-digit mobile number",
      inputMode: "numeric",
      maxLength: 10,
    },
    {
      id: "rich_text",
      label: "Requirement details",
      placeholder:
        "Describe the product, dimensions, artwork, timeline and anything else that helps us quote…",
      full: true,
      textarea: true,
    },
    {
      id: "contact_person_name",
      label: "Contact person name",
      placeholder: "Who should we get back to?",
    },
    {
      id: "contact_person_email",
      label: "Contact person email",
      type: "email",
      placeholder: "name@company.com",
    },
  ];

  return (
    <>
      <Head>
        <title>Custom Packaging Form | store.prempackaging</title>
        <meta name="title" content="Custom Packaging" />
        <meta
          name="description"
          content="Design unique custom packaging tailored to your brand. Choose sizes, styles, and materials that perfectly reflect your business identity."
        />
        <link rel="canonical" href={canonicalUrl("/custom-packaging")} />
      </Head>

      <JsonLd
        id="page"
        data={contentPageSchema({
          path: "/custom-packaging",
          name: "Custom Packaging",
          type: "WebPage",
          description:
            "Design unique custom packaging tailored to your brand. Choose sizes, styles, and materials that perfectly reflect your business identity.",
          breadcrumb: [{ name: "Custom Packaging", path: "/custom-packaging" }],
        })}
      />

      <main className="cp">
        {/* ── Hero band ─────────────────────────────────────────────── */}
        <section className="cp-hero">
          <div className="cp-hero__glow" aria-hidden="true" />
          <div
            className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-grain tw-opacity-[0.07]"
            aria-hidden="true"
          />
          <div className="cp-hero__inner cp-rise">
            <span className="cp-eyebrow">Custom packaging</span>
            <h1 className="cp-hero__title">Packaging built around your brand</h1>
            <p className="cp-hero__sub">
              Tell us what you make and how you want it packed. Our team reviews
              every enquiry and comes back with options and pricing within one
              business day.
            </p>
          </div>
        </section>

        {/* ── Content: benefits panel + form ────────────────────────── */}
        <div className="cp-shell">
          <aside className="cp-info cp-rise cp-rise--1">
            <div
              className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-grain tw-opacity-[0.06]"
              aria-hidden="true"
            />
            <div className="cp-info__body">
              <h2 className="cp-info__title">Why go custom</h2>
              <p className="cp-info__lead">
                A quick enquiry is all it takes to start.
              </p>
              <ul className="cp-info__list">
                {benefits.map((b) => (
                  <li key={b.title} className="cp-info__row">
                    <span className="cp-info__icon" aria-hidden="true">
                      {b.icon}
                    </span>
                    <span className="cp-info__text">
                      <span className="cp-info__rowtitle">{b.title}</span>
                      <span className="cp-info__rowtext">{b.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="cp-card cp-rise cp-rise--2">
            {successMessage ? (
              <div className="cp-success" role="status">
                <span className="cp-success__icon" aria-hidden="true">
                  <PiCheckCircle />
                </span>
                <h2 className="cp-success__title">Enquiry received</h2>
                <p className="cp-success__text">{successMessage}</p>
                <p className="cp-success__note">
                  Redirecting you home — our team will be in touch shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitForm} noValidate>
                <h2 className="cp-card__title">Start your enquiry</h2>
                <p className="cp-card__sub">
                  All fields marked with <span className="cp-req">*</span> are
                  required.
                </p>

                <div className="cp-grid">
                  {fields.map((f) => (
                    <div
                      key={f.id}
                      className={`cp-field${f.full ? " cp-field--full" : ""}`}
                    >
                      <label htmlFor={f.id}>
                        {f.label} <span className="cp-req">*</span>
                      </label>
                      {f.textarea ? (
                        <textarea
                          id={f.id}
                          name={f.id}
                          rows={5}
                          value={formData[f.id]}
                          onChange={handleChange}
                          placeholder={f.placeholder}
                          aria-invalid={!!errors[f.id]}
                          className={errors[f.id] ? "is-error" : ""}
                        />
                      ) : (
                        <input
                          type={f.type || "text"}
                          id={f.id}
                          name={f.id}
                          value={formData[f.id]}
                          onChange={handleChange}
                          placeholder={f.placeholder}
                          inputMode={f.inputMode}
                          maxLength={f.maxLength}
                          aria-invalid={!!errors[f.id]}
                          className={errors[f.id] ? "is-error" : ""}
                        />
                      )}
                      {errors[f.id] && (
                        <p className="cp-error">{errors[f.id]}</p>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="cp-btn cp-btn--primary"
                >
                  {submitting ? (
                    <>
                      <span className="cp-spinner" aria-hidden="true" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <PiPaperPlaneTilt aria-hidden="true" />
                      Submit enquiry
                    </>
                  )}
                </button>
              </form>
            )}
          </section>
        </div>
      </main>

      <style jsx>{`
        .cp {
          background: #f7f8fa;
          font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
          color: #111827;
          padding-bottom: 72px;
        }

        /* ── Entrance (staggered rise) ────────────────────────────── */
        .cp-rise {
          animation: cp-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .cp-rise--1 {
          animation-delay: 0.08s;
        }
        .cp-rise--2 {
          animation-delay: 0.16s;
        }
        @keyframes cp-rise {
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
          .cp-rise {
            animation: none;
          }
        }

        /* ── Hero ─────────────────────────────────────────────────── */
        .cp-hero {
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
        .cp-hero__glow {
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
        .cp-hero__inner {
          position: relative;
          max-width: 720px;
          margin: 0 auto;
        }
        .cp-eyebrow {
          display: inline-block;
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #ff9a9d;
          margin-bottom: 18px;
        }
        .cp-hero__title {
          font-family: "Calistoga", Georgia, serif;
          font-weight: 400;
          color: #ffffff;
          font-size: clamp(38px, 6vw, 58px);
          line-height: 1.04;
          letter-spacing: -0.01em;
          margin: 0 0 18px;
          text-wrap: balance;
        }
        .cp-hero__sub {
          color: #c6d2e6;
          font-size: 17px;
          line-height: 1.62;
          margin: 0 auto;
          max-width: 38rem;
          text-wrap: pretty;
        }

        /* ── Shell / grid ─────────────────────────────────────────── */
        .cp-shell {
          position: relative;
          z-index: 2;
          max-width: 1180px;
          margin: -84px auto 0;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 0.8fr 1.2fr;
          gap: 24px;
          align-items: start;
        }

        /* ── Info panel ───────────────────────────────────────────── */
        .cp-info {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          background: linear-gradient(160deg, #182c5a 0%, #0f2747 100%);
          box-shadow: 0 28px 60px -30px rgba(15, 39, 71, 0.55);
        }
        .cp-info__body {
          position: relative;
          padding: 34px 30px;
        }
        .cp-info__title {
          font-family: "Calistoga", Georgia, serif;
          font-weight: 400;
          color: #ffffff;
          font-size: 24px;
          margin: 0 0 6px;
        }
        .cp-info__lead {
          color: #9fb0cd;
          font-size: 14.5px;
          line-height: 1.5;
          margin: 0 0 24px;
        }
        .cp-info__list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .cp-info__row {
          display: flex;
          gap: 14px;
          padding: 16px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.09);
        }
        .cp-info__row:first-child {
          border-top: none;
          padding-top: 0;
        }
        .cp-info__icon {
          flex: none;
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(233, 34, 39, 0.14);
          color: #ff8a8d;
          font-size: 21px;
        }
        .cp-info__text {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .cp-info__rowtitle {
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
        }
        .cp-info__rowtext {
          color: #9fb0cd;
          font-size: 13.5px;
          line-height: 1.5;
        }

        /* ── Form card ────────────────────────────────────────────── */
        .cp-card {
          background: #ffffff;
          border: 1px solid #e6e8ec;
          border-radius: 20px;
          padding: 36px 34px;
          box-shadow: 0 1px 2px rgba(15, 39, 71, 0.06),
            0 24px 50px -28px rgba(15, 39, 71, 0.22);
        }
        .cp-card__title {
          font-family: "Calistoga", Georgia, serif;
          font-weight: 400;
          color: #182c5a;
          font-size: 26px;
          margin: 0 0 4px;
        }
        .cp-card__sub {
          color: #667085;
          font-size: 14px;
          margin: 0 0 26px;
        }
        .cp-req {
          color: #e92227;
        }

        .cp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .cp-field {
          margin-bottom: 2px;
        }
        .cp-field--full {
          grid-column: 1 / -1;
        }
        .cp-field :global(label) {
          display: block;
          font-size: 13.5px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .cp-field :global(input),
        .cp-field :global(textarea) {
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
        .cp-field :global(textarea) {
          resize: vertical;
          min-height: 130px;
        }
        .cp-field :global(input::placeholder),
        .cp-field :global(textarea::placeholder) {
          color: #9aa4b5;
        }
        .cp-field :global(input:focus),
        .cp-field :global(textarea:focus) {
          border-color: #e92227;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(233, 34, 39, 0.12);
        }
        .cp-field :global(input.is-error),
        .cp-field :global(textarea.is-error) {
          border-color: #e53935;
          background: #fdecec;
        }
        .cp-error {
          margin: 7px 0 0;
          font-size: 13px;
          color: #d21f24;
        }

        /* ── Button ───────────────────────────────────────────────── */
        .cp-btn {
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
        .cp-btn :global(svg) {
          font-size: 18px;
        }
        .cp-btn--primary {
          width: 100%;
          margin-top: 24px;
          padding: 14px 22px;
          color: #ffffff;
          background: #e92227;
          box-shadow: 0 12px 26px -12px rgba(233, 34, 39, 0.6);
        }
        .cp-btn--primary:hover {
          background: #182c5a;
          box-shadow: 0 14px 30px -12px rgba(24, 44, 90, 0.55);
        }
        .cp-btn--primary:active {
          transform: scale(0.99);
        }
        .cp-btn--primary:focus-visible {
          box-shadow: 0 0 0 4px rgba(233, 34, 39, 0.28);
        }
        .cp-btn--primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .cp-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.45);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: cp-spin 0.7s linear infinite;
        }
        @keyframes cp-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ── Success ──────────────────────────────────────────────── */
        .cp-success {
          text-align: center;
          padding: 28px 8px;
        }
        .cp-success__icon {
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
        .cp-success__title {
          font-family: "Calistoga", Georgia, serif;
          font-weight: 400;
          color: #182c5a;
          font-size: 26px;
          margin: 0 0 8px;
        }
        .cp-success__text {
          color: #374151;
          font-size: 15.5px;
          line-height: 1.6;
          margin: 0 auto 6px;
          max-width: 28rem;
        }
        .cp-success__note {
          color: #667085;
          font-size: 14px;
          margin: 0;
        }

        /* ── Responsive ───────────────────────────────────────────── */
        @media (max-width: 900px) {
          .cp-shell {
            grid-template-columns: 1fr;
            margin-top: -72px;
          }
        }
        @media (max-width: 540px) {
          .cp-hero {
            padding: 64px 20px 116px;
          }
          .cp-card {
            padding: 28px 20px;
          }
          .cp-info__body {
            padding: 28px 22px;
          }
          .cp-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .cp-field {
            margin-bottom: 18px;
          }
        }
      `}</style>
    </>
  );
};

export default CustomForm;
