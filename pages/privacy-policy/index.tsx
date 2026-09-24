"use client"; // This is a client component 👈🏽
import React, { useEffect, useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import Slider from "@mui/material/Slider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import Pagination from "@mui/material/Pagination";
import Head from "next/head";
import Stack from "@mui/material/Stack";
import { getService, postService } from "../../services/service";
import { useRouter } from "next/router";
import ListingCard from "../../components/listing/ListingCard";
import ListingCardDesktop from "../../components/listing/ListingCardDesktop";
import JsonLd from "../../components/common/JsonLd";
import { canonicalUrl, contentPageSchema } from "../../utils/schema";

const PrivacyPolicy = () => {

  return (
    <>
      <Head>
        <title>
          Privacy Policy - Prem Industries India Limited - Innovation In Action
        </title>
        <link rel="canonical" href={canonicalUrl("/privacy-policy")} />
      </Head>

      <JsonLd
        id="page"
        data={contentPageSchema({
          path: "/privacy-policy",
          name: "Privacy Policy",
          type: "WebPage",
          description:
            "How Prem Industries India Limited collects, uses and protects the personal information you share with the Prem Packaging store.",
          breadcrumb: [{ name: "Privacy Policy", path: "/privacy-policy" }],
        })}
      />
      <div>
        <div className="row p-0 m-0">
          <div
            className="row policy-mainbody"
            style={{ backgroundColor: "white" }}
          >
            <div className="policy-maindiv">
              <h2 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[36px] tw-mb-[10px]">Privacy Policy</h2>
              <div className="tw-text-[18px] tw-leading-[30px]">
                At Prem Industries India Limited, we are committed to protecting
                your privacy and ensuring the security of your personal
                information. This Privacy Policy delineates the manner in which
                we collect, utilize, disclose, and protect your personal
                information when you engage with our product packaging services
                and visit our website, collectively referred to as
                &#34;Services.&#34; By using our Services, you agree to the
                practices described in this Privacy Policy. Please read this
                policy carefully to understand how we handle our information.
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">Acceptance of Terms</h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                By using our Services, you consent to the terms and conditions
                outlined in this Privacy Policy. If you do not agree with any
                part of this policy, please do not use our Services.
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">
                How We Obtain and Collect Your Personal Information
              </h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                We collect personal information from you when you interact with
                our Services, including when you:
                <ul>
                  <li>Place an order for our product packaging services.</li>
                  <li>Create an account on our website.</li>
                  <li>Contact us for customer support or inquiries.</li>
                  <li>
                    Subscribe to our newsletter or marketing communications.
                  </li>
                  <li>Participate in surveys, contests, or promotions.</li>
                  <li>
                    Browse our website (through cookies and similar
                    technologies)
                  </li>
                </ul>
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">Information We Collect</h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                We will not share, exchange, or lease your personal details to
                third parties unless we have obtained your consent, except as
                outlined in this Privacy Policy. The personal information we may
                collect includes but is not limited to:
                <ul>
                  <li>Your name, contact information, and shipping address.</li>
                  <li>Payment details (such as credit card details).</li>
                  <li>
                    Information related to your interactions with us (e.g.,
                    order history, customer support inquiries).
                  </li>
                  <li>Demographic information.</li>
                  <li>User-generated content and communications.</li>
                  <li>
                    Information about your device and internet connection.
                  </li>
                </ul>
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">Cookies</h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                &#34;Cookies&#34; refer to small identifiers transmitted by a
                web server and saved on your computer&#39;s hard drive, enabling
                us to identify you in case you revisit our website. We employ
                cookies and comparable technologies to improve your browsing
                experience, examine website traffic, and customize content for
                your benefit. In order to safeguard your privacy, we do not
                employ cookies to store or transmit any of your personal
                information via the internet. You can manage your cookie
                preferences via your browser settings.
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">Non-Personal Information</h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                We may also collect non-personal information that does not
                directly identify you. This information may include aggregated
                and anonymized data related to user interactions with our
                website and services, which we use for statistical analysis and
                improving our services.
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">Use of Personal Information</h4>

              <div className="tw-text-[18px] tw-leading-[30px]">
                We use your personal information for various purposes, including
                but not limited to:
                <li>Processing and satisfying your orders</li>
                <li>Providing customer assistance and addressing inquiries.</li>
                <li>
                  Sending you updates, promotions, and newsletters with your
                  consent.
                </li>
                <li>Personalizing your experience on our website.</li>
                <li>
                  Conducting research and analysis to improve our products and
                  services.
                </li>
                <li>Complying with legal obligations.</li>
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">
                Disclosure of Personal Information
              </h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                We do not share, exchange, or lease your personal information to
                third parties without your consent, unless it is in accordance
                with the terms outlined in this Privacy Policy. We might
                disclose your data to:
                <li>
                  Service providers and partners who assist us in providing our
                  services.
                </li>
                <li>
                  Legal authorities, either when compelled by law or to
                  safeguard our rights and interests.{" "}
                </li>
                <li>
                  Entities that take over in case of a merger, acquisition, or
                  other corporate reorganization.
                </li>
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">
                Retention of Your Personal Information
              </h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                We keep your personal information for as long as necessary to
                achieve the objectives stated in this Privacy Policy, unless
                legal obligations or permissions permit a longer retention
                period.
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">Data Transfers</h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                Your personal data might be moved to and held on servers
                situated in different nations. We implement appropriate measures
                to guarantee that your information is handled securely and in
                compliance with relevant data protection regulations.
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">Links to Other Websites</h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                Our website may contain links to third-party websites. We are
                not responsible for the privacy practices or content of these
                websites. We encourage you to review the privacy policies of
                these third-party entities when you visit their websites.
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">
                Changes to this Privacy Policy
              </h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                We reserve the right to periodically modify this Privacy Policy
                to account for shifts in our practices or other operational,
                legal, or regulatory requirements. We recommend that you
                regularly revisit this Privacy Policy for any updates.
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">Contact Us</h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                If you have any queries about this Privacy Policy or how we
                handle your personal information, please contact us at{" "}
                <b>
                  <a
                    style={{ textDecoration: "none", color: "black" }}
                    href="mailto:ecommerce@premindustries.com"
                  >
                    ecommerce@premindustries.com
                  </a>
                </b>
                .
              </div>
            </div>

            <div className="policy-subdiv1">
              Thank you for choosing Prem Industries India Limited for your
              product packaging needs. Your privacy and trust are important to
              us, and we are committed to protecting your personal information.
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
.policy-mainbody {
  margin-top: 17px !important;
  margin-left: 0px !important;
  margin-bottom: 0px !important;
  margin-right: 0px !important;
  padding-left: 110px !important;
  padding-right: 110px !important;
}
.policy-maindiv {
  margin-top: 30px;
  text-align: justify;
}
.policy-subdiv {
  margin-top: 20px;
  margin-inline: 10px;
}
.policy-subdiv1 {
  margin-top: 50px;
  font-size: 18px;
  margin-bottom: 60px;
  font-style: italic;
}
`}</style>
    </>
  );
};

export default PrivacyPolicy;

