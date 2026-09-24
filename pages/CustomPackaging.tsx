import React from "react";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

export default function CustomPackaging() {
  return (
    <section className="cp-section" aria-labelledby="cp-heading">
      {/* CTA banner → custom packaging enquiry form */}
      <div className="cp-cta">
        <div className="cp-cta-copy">
          <h3 id="cp-heading" className="cp-cta-title">Ready to put your brand on the box?</h3>
          <p className="cp-cta-text">
            Tell us your sizes, materials and print requirements — our team
            will get back with a tailored quote.
          </p>
        </div>
        <Link href="/custom-packaging" className="cp-cta-btn">
          Start Custom Enquiry
          <FiArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>

      {/* SEO copy + original outbound links preserved */}
      <div className="cp-seo">
        <p>
          At Prem Industries India Limited we offer an extensive selection of
          packaging product online, including{" "}
          <a
            href="https://prempackaging.com/corrugated-boxes"
            target="_blank"
            rel="noopener noreferrer"
          >
            corrugated boxes
          </a>
          ,{" "}
          <a
            href="https://prempackaging.com/flexible-laminates-pouches"
            target="_blank"
            rel="noopener noreferrer"
          >
            flexible laminates
          </a>
          ,{" "}
          <a
            href="https://prempackaging.com/rollabel-labels"
            target="_blank"
            rel="noopener noreferrer"
          >
            labels
          </a>
          ,{" "}
          <a
            href="https://prempackaging.com/packpro-tapes"
            target="_blank"
            rel="noopener noreferrer"
          >
            tapes
          </a>
          ,{" "}
          <a
            href="https://prempackaging.com/luxury-rigid-boxes"
            target="_blank"
            rel="noopener noreferrer"
          >
            rigid boxes
          </a>
          ,{" "}
          <a
            href="https://prempackaging.com/paper-mailer-bags"
            target="_blank"
            rel="noopener noreferrer"
          >
            ecommerce paper bags
          </a>
          ,{" "}
          <a
            href="https://prempackaging.com/packpro-honeycomb-food-wrapping-paper"
            target="_blank"
            rel="noopener noreferrer"
          >
            food wrapping paper
          </a>{" "}
          and{" "}
          <a
            href="https://prempackaging.com/packpro-carry-handle-tape"
            target="_blank"
            rel="noopener noreferrer"
          >
            carry handle tape
          </a>
          . Our commitment to quality ensures every product meets the highest
          industry standards, providing durability and protection for your
          valuable goods. Shop packaging product online with confidence and
          order today to experience the difference quality packaging can make.
        </p>
      </div>

      <style jsx>{`
        .cp-section {
          padding: 20px 0 10px;
          font-family: "Montserrat", sans-serif;
        }

        /* ---------- CTA banner ---------- */
        .cp-cta {
          margin-top: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
          background: linear-gradient(120deg, #182c5a 0%, #223a72 100%);
          border-radius: 20px;
          padding: 40px 48px;
          box-shadow: 0 14px 34px rgba(24, 44, 90, 0.22);
        }
        .cp-cta-copy {
          max-width: 640px;
        }
        .cp-cta-title {
          font-size: 26px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 8px;
          line-height: 1.25;
        }
        .cp-cta-text {
          font-size: 15px;
          line-height: 1.6;
          color: #cbd5e1;
          margin: 0;
        }
        .cp-cta :global(.cp-cta-btn) {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          background-color: #e92227;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          text-decoration: none;
          padding: 15px 28px;
          border-radius: 10px;
          cursor: pointer;
          transition: background-color 0.25s ease, transform 0.25s ease;
        }
        .cp-cta :global(.cp-cta-btn:hover) {
          background-color: #ffffff;
          color: #182c5a;
          transform: translateY(-2px);
        }
        .cp-cta :global(.cp-cta-btn svg) {
          transition: transform 0.25s ease;
        }
        .cp-cta :global(.cp-cta-btn:hover svg) {
          transform: translateX(4px);
        }

        /* ---------- SEO copy ---------- */
        .cp-seo {
          max-width: 100%;
          margin: 40px 0 0;
        }
        .cp-seo p {
          font-size: 15px;
          line-height: 1.8;
          color: #64748b;
          text-align: left;
          margin: 0;
        }
        .cp-seo :global(a) {
          color: #182c5a;
          font-weight: 600;
          text-decoration: none;
          border-bottom: 1px solid rgba(24, 44, 90, 0.25);
          transition: color 0.2s ease, border-color 0.2s ease;
        }
        .cp-seo :global(a:hover) {
          color: #e92227;
          border-color: #e92227;
        }

        /* ---------- Responsive ---------- */
        @media (max-width: 900px) {
          .cp-cta {
            flex-direction: column;
            align-items: flex-start;
            padding: 32px 28px;
          }
        }
        @media (max-width: 767px) {
          .cp-cta-title {
            font-size: 21px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cp-cta :global(.cp-cta-btn),
          .cp-cta :global(.cp-cta-btn svg) {
            transition: none;
          }
          .cp-cta :global(.cp-cta-btn:hover) {
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}
