"use client";

import React, { useState, FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  Mail,
  PackageCheck,
  Percent,
  Sparkles,
  Truck,
} from "lucide-react";

interface ComingSoonPageProps {
  title?: string;
  badge?: string;
  subtitle?: string;
  expectedDate?: string;
}

export default function ComingSoonPage({
  title = "Monthly Subscription Order",
  badge = "FEATURE IN DEVELOPMENT",
  subtitle = "We're building an automated, recurring packaging subscription system so your business never runs out of stock.",
  expectedDate = "Q3 2026",
}: ComingSoonPageProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email && email.includes("@")) {
      setSubmitted(true);
    }
  };

  return (
    <>
      <Head>
        <title>{title} | Prem Packaging</title>
      </Head>

      <main className="comingSoonWrapper">
        <section className="comingSoonHero">
          <div className="container">
            <div className="heroBadgeRow">
              <span className="eyebrowBadge">{badge}</span>
              <span className="launchTag">
                <Clock3 size={14} /> Expected: {expectedDate}
              </span>
            </div>

            <h1 className="comingSoonTitle">{title}</h1>
            <p className="comingSoonSubtitle">{subtitle}</p>

            {/* Email Early Access Form */}
            <div className="earlyAccessCard">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="accessForm">
                  <div className="inputField">
                    <Mail size={18} className="fieldIcon" />
                    <input
                      type="email"
                      placeholder="Enter your business email for priority access..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="notifyBtn">
                    Get Early Access <ArrowRight size={16} />
                  </button>
                </form>
              ) : (
                <div className="successBanner">
                  <CheckCircle2 size={24} className="successIcon" />
                  <div>
                    <strong>You're on the priority waitlist!</strong>
                    <p>We'll notify {email} as soon as subscriptions go live.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Key Feature Preview Cards */}
            <div className="featuresGrid">
              <div className="featureCard">
                <div className="featureIconWrap">
                  <Boxes size={22} />
                </div>
                <h3>Automated Restocking</h3>
                <p>
                  Set your monthly box, bag, and tape requirements once. Receive shipments on schedule without reordering.
                </p>
              </div>

              <div className="featureCard">
                <div className="featureIconWrap">
                  <Truck size={22} />
                </div>
                <h3>Priority Dispatch</h3>
                <p>
                  Reserved factory queue slots for active subscribers ensuring guaranteed 24-hour dispatch every month.
                </p>
              </div>

              <div className="featureCard">
                <div className="featureIconWrap">
                  <Percent size={22} />
                </div>
                <h3>Subscriber Savings</h3>
                <p>
                  Enjoy up to 15% recurring discounts on all bulk packaging formats for active monthly subscribers.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="actionsRow">
              <Link href="/BestDeals" className="primaryBtn">
                <PackageCheck size={18} /> Browse Available Bestsellers
              </Link>
              <Link href="/contact-us" className="secondaryBtn">
                Need Immediate Bulk Order? Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .comingSoonWrapper {
          background: #fbfbfa;
          min-height: calc(100vh - 120px);
          padding-top: 40px;
          padding-bottom: 80px;
        }

        .comingSoonHero {
          text-align: center;
          max-width: 960px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .heroBadgeRow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .eyebrowBadge {
          background: #fdecec;
          color: #e4232c;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 6px 14px;
          border-radius: 999px;
          text-transform: uppercase;
        }

        .launchTag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #4b5563;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          padding: 5px 12px;
          border-radius: 999px;
        }

        .comingSoonTitle {
          font-size: clamp(36px, 5vw, 54px);
          font-weight: 800;
          color: #0b1d3e;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 16px;
        }

        .comingSoonSubtitle {
          font-size: 17px;
          color: #4b5563;
          max-width: 680px;
          margin: 0 auto 36px;
          line-height: 1.6;
        }

        .earlyAccessCard {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 12px;
          max-width: 620px;
          margin: 0 auto 60px;
          box-shadow: 0 12px 32px rgba(11, 29, 62, 0.06);
        }

        .accessForm {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .inputField {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .inputField :global(.fieldIcon) {
          position: absolute;
          left: 14px;
          color: #9ca3af;
          pointer-events: none;
        }

        .inputField input {
          width: 100%;
          height: 48px;
          padding: 0 16px 0 44px !important;
          border: 1px solid #d1d5db !important;
          border-radius: 12px !important;
          font-size: 14px !important;
          color: #111827 !important;
          background: #ffffff !important;
          outline: none !important;
        }

        .inputField input:focus {
          border-color: #0b1d3e !important;
        }

        .notifyBtn {
          height: 48px;
          padding: 0 24px;
          background: #0b1d3e;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          transition: background 0.2s ease;
        }

        .notifyBtn:hover {
          background: #e4232c;
        }

        .successBanner {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          text-align: left;
        }

        .successBanner :global(.successIcon) {
          color: #16a34a;
          flex-shrink: 0;
        }

        .successBanner strong {
          color: #0b1d3e;
          font-size: 15px;
          display: block;
        }

        .successBanner p {
          color: #6b7280;
          font-size: 13px;
          margin: 2px 0 0;
        }

        .featuresGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 50px;
          text-align: left;
        }

        .featureCard {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 28px 24px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .featureCard:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(11, 29, 62, 0.08);
        }

        .featureIconWrap {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: #f4f5f5;
          color: #0b1d3e;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .featureCard h3 {
          font-size: 17px;
          font-weight: 700;
          color: #0b1d3e;
          margin: 0 0 8px;
        }

        .featureCard p {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }

        .actionsRow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .primaryBtn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #e4232c;
          color: #ffffff !important;
          font-size: 14px;
          font-weight: 700;
          padding: 14px 28px;
          border-radius: 12px;
          text-decoration: none !important;
          transition: background 0.2s ease;
        }

        .primaryBtn:hover {
          background: #0b1d3e;
        }

        .secondaryBtn {
          display: inline-flex;
          align-items: center;
          background: #ffffff;
          color: #0b1d3e !important;
          border: 1px solid #d1d5db;
          font-size: 14px;
          font-weight: 600;
          padding: 14px 24px;
          border-radius: 12px;
          text-decoration: none !important;
          transition: all 0.2s ease;
        }

        .secondaryBtn:hover {
          border-color: #0b1d3e;
          background: #f9fafb;
        }

        @media (max-width: 768px) {
          .featuresGrid {
            grid-template-columns: 1fr;
          }

          .accessForm {
            flex-direction: column;
          }

          .notifyBtn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}
