"use client";

import React, { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock3, ArrowRight } from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaWhatsapp,
  FaLinkedinIn,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { postService } from "../../services/service";

const footerGroups = [
  {
    title: "Shop Categories",
    links: [
      ["Corrugated boxes", "/corrugated-boxes"],
      ["Paper bags", "/paper-bags"],
      ["Poly mailers", "/poly-bags"],
      ["Tapes & labels", "/packpro-tapes"],
      ["Food packaging", "/packpro-food-wrapping-papers"],
      ["Best Deals", "/BestDeals"],
    ],
  },
  {
    title: "Customer Account",
    links: [
      ["My Account", "/profile"],
      ["My Orders", "/my-orders"],
      ["Sign In / Login", "/login"],
      ["Register Account", "/sign-up"],
      ["Shopping Cart", "/my-cart"],
      ["Monthly Subscription Order", "/subscription-order"],
      ["Custom Packaging", "/custom-packaging"],
    ],
  },
  {
    title: "Help & Policies",
    links: [
      ["About Us", "https://prempackaging.com/about-us"],
      ["Shipping Policy", "/shipping-policy"],
      ["Returns & Exchange", "/return-and-exchange-policy"],
      ["Terms of Sale", "/terms-of-sale"],
      ["Privacy Policy", "/privacy-policy"],
      ["Contact Us", "/contact-us"],
    ],
  },
];

const footerSocialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/PremIndustriesIndiaLimited/",
    Icon: FaFacebookF,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/prem_packaging/?hl=en",
    Icon: FaInstagram,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@premindustries9251/videos",
    Icon: FaYoutube,
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/8447247227",
    Icon: FaWhatsapp,
  },
  {
    label: "LinkedIn",
    href: "https://in.linkedin.com/company/prem-packaging",
    Icon: FaLinkedinIn,
  },
];

function FooterBrand() {
  return (
    <Link className="footerBrandLogo" href="/" aria-label="Prem Packaging home">
      <Image
        src="/footerlogo.png"
        alt="Prem Packaging"
        width={190}
        height={50}
        style={{ objectFit: "contain", height: "auto" }}
      />
    </Link>
  );
}

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);

  const handleNewsletter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = newsletterEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNewsletterMessage("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
      return;
    }

    setNewsletterSubmitting(true);
    try {
      const res = await postService(
        "/newsletter/subscribe",
        { email },
        { silent: true },
      );
      if (res?.data?.success) {
        setNewsletterMessage(
          res.data.message || "You're on the list. Welcome to Prem Packaging.",
        );
        toast.success("Subscribed to Prem Packaging newsletter!");
        setNewsletterEmail("");
      } else {
        const msg =
          res?.data?.message || "Could not subscribe right now. Please try again.";
        setNewsletterMessage(msg);
        toast.error(msg);
      }
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <footer className="globalStorefrontFooter">
      {/* Red Newsletter Banner */}
      <section className="newsletterSection">
        <div className="newsletterInner">
          <div>
            <p className="eyebrow redEyebrow">PACK SMARTER</p>
            <h2>Fresh products and useful offers, occasionally.</h2>
          </div>
          <form onSubmit={handleNewsletter} noValidate>
            <label htmlFor="global-newsletter-email">EMAIL ADDRESS</label>
            <div className="newsletterField">
              <input
                type="email"
                id="global-newsletter-email"
                placeholder="you@example.com"
                value={newsletterEmail}
                onChange={(e) => {
                  setNewsletterEmail(e.target.value);
                  setNewsletterMessage("");
                }}
                aria-describedby="global-newsletter-message"
              />
              <button type="submit" disabled={newsletterSubmitting}>
                {newsletterSubmitting ? "Joining…" : "Join the list"}{" "}
                <ArrowRight size={16} />
              </button>
            </div>
            <p id="global-newsletter-message" className="newsletterMessage">
              {newsletterMessage || "No spam. Just useful packaging updates."}
            </p>
          </form>
        </div>
      </section>

      {/* Main Dark Navy Site Footer */}
      <div className="siteFooter">
        <div className="container footerGrid">
          <div className="footerBrand">
            <FooterBrand />
            <p>
              Everyday packaging, made by experts and delivered directly to you.
            </p>
            <address className="footerContactDetails">
              <p>
                <MapPin size={16} aria-hidden="true" />
                <span>
                  C-209, Bulandshahar Road, Industrial Area, Ghaziabad, Uttar
                  Pradesh, India - 201009
                </span>
              </p>
              <p>
                <Clock3 size={16} aria-hidden="true" />
                <span>Monday - Saturday (9AM - 6PM)</span>
              </p>
            </address>
            <a href="tel:+918447247227" className="footerContactLink">
              <Phone size={16} />
              +91 84472 47227
            </a>
            <a href="mailto:ecommerce@premindustries.in" className="footerContactLink">
              <Mail size={16} />
              ecommerce@premindustries.in
            </a>
            <nav
              className="footerSocialLinks"
              aria-label="Follow Prem Packaging"
            >
              <span>Follow us</span>
              <div className="footerSocialIconsRow">
                {footerSocialLinks.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    title={label}
                    className="footerSocialIconButton"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </nav>
          </div>
          {footerGroups.map((group) => (
            <div className="footerGroup" key={group.title}>
              <h3>{group.title}</h3>
              {group.links.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noreferrer" : undefined}
                >
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="container footerBottom">
          <p>© 2026 Prem Industries India Limited</p>
          <p>Ghaziabad, Uttar Pradesh, India</p>
        </div>
      </div>
    </footer>
  );
}
