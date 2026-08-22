import React from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

const PROCESS_STEPS = [
  {
    num: "01",
    title: "Find your format",
    text: "Browse 250+ standard box dimensions, mailers, and sealing solutions with practical pack sizes for any order volume.",
    features: ["Over 250+ stock sizes", "Corrugated boxes, mailers & tapes"],
    linkText: "Explore catalog",
    linkHref: "/corrugated-boxes",
  },
  {
    num: "02",
    title: "Order in a few clicks",
    text: "See transparent wholesale pricing upfront with automatic volume tier discounts, instant GST invoicing, and zero hidden fees.",
    features: ["Direct wholesale rates", "GST invoice included on every order"],
    linkText: "View pricing & deals",
    linkHref: "/BestDeals",
  },
  {
    num: "03",
    title: "Get ready to ship",
    text: "Receive dependable, drop-tested packaging directly at your door with fast 24–48 hour direct factory dispatch across India.",
    features: ["24–48h fast dispatch", "Pan-India doorstep delivery"],
    linkText: "Shop bestsellers",
    linkHref: "#products",
  },
];

export default function ProcessJourneySection() {
  return (
    <section className="process-section" id="why-prem">
      <div className="shell">
        <div className="process-header">
          <p className="eyebrow">Packaging without the guesswork</p>
          <h2 className="process-headline">
            <span>Choose it.</span> <span>Pack it.</span> <span>Send it.</span>
          </h2>
          <p className="process-sub">
            Everything is made to help home sellers, creators and growing brands
            ship with more confidence.
          </p>
        </div>

        <div className="process-steps-row">
          {PROCESS_STEPS.map((step) => (
            <div key={step.num} className="process-step-col">
              <div className="process-step-top">
                <span className="process-step-number">{step.num}</span>
                <span className="process-step-dash" />
              </div>
              <h3 className="process-step-title">{step.title}</h3>
              <p className="process-step-text">{step.text}</p>
              <ul className="process-step-features">
                {step.features.map((feat, i) => (
                  <li key={i}>
                    <Check size={15} strokeWidth={2.2} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link href={step.linkHref} className="process-step-link">
                <span>{step.linkText}</span>
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
