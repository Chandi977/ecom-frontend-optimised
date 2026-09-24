"use client"; // This is a client component 👈🏽
import React, { useEffect, useState } from "react";
import Head from "next/head";
import JsonLd from "../../components/common/JsonLd";
import { canonicalUrl, contentPageSchema } from "../../utils/schema";

const PrivacyPolicy = () => {

  return (
    <>
      <Head>
        <title>Shipping Policy | store.prempackaging</title>
        <meta name="title" content="Shipping Policy" />
        <meta
          name="description"
          content="Get fast, reliable, and secure delivery with our shipping policy. Track your orders and enjoy timely packaging product deliveries nationwide."
        />
        <link rel="canonical" href={canonicalUrl("/shipping-policy")} />
      </Head>

      <JsonLd
        id="page"
        data={contentPageSchema({
          path: "/shipping-policy",
          name: "Shipping Policy",
          type: "WebPage",
          description:
            "Get fast, reliable, and secure delivery with our shipping policy. Track your orders and enjoy timely packaging product deliveries nationwide.",
          breadcrumb: [{ name: "Shipping Policy", path: "/shipping-policy" }],
        })}
      />
      <div>
        <div className="row p-0 m-0">
          <div
            className="row policy-mainbody"
            style={{ backgroundColor: "white" }}
          >
            <div className="policy-maindiv">
              <h2 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[36px] tw-mb-[10px]">Shipping Policy</h2>
              <div className="tw-text-[18px] tw-leading-[30px]">
                Thank you for choosing Prem Industries India Limited for your
                packaging needs. We&#39;re committed to providing you with a
                seamless shipping experience. Please take a moment to review our
                shipping policy:
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">1. Shipping Methods</h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                <div>
                  Standard Shipping: Estimated delivery within 5-7 business
                  days.
                </div>
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">2. Order Processing </h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                Orders are typically processed within 1-2 business days.
                <br />
                You will receive an email confirmation with tracking information
                once your order is shipped.
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">3. Shipping Rates</h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                Shipping costs are determined by the weight, size, and delivery
                location of your order, and you&#39;ll be able to view the
                shipping charges at the checkout stage.
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">4. Shipping Damage or Loss</h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                If your order arrives damaged or is lost in transit, please
                contact our customer support team within 3 business days of
                receiving your order. We will work to resolve the issue
                promptly.
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">5. Address Accuracy</h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                It is crucial to provide accurate shipping information during
                checkout. We are not responsible for delays or additional
                charges caused by incorrect address details.
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">6. Tracking Your Order</h4>

              <div className="tw-text-[18px] tw-leading-[30px]">
                You can track your order using the provided tracking number. If
                you have any queries about your shipment&#39;s status, reach out
                to our customer support team.
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">7. Returns and Exchanges</h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                For information on returns and exchanges, please refer to our
                Returns Policy.
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">8. Holiday Shipping</h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                During peak holiday seasons, shipping times may be longer than
                usual due to increased demand. Please plan your orders
                accordingly.
              </div>
            </div>

            <div className="policy-subdiv">
              <h4 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">9. Contact Us</h4>
              <div className="tw-text-[18px] tw-leading-[30px]">
                If you have any inquiries or doubts about our shipping
                guidelines or your purchase, don&#39;t hesitate to reach out to
                our customer support team via email at
                ecommerce@premindustries.in or call us at +91 8447247227. <br />
                By placing an order with Prem Industries India Limited, you
                agree to abide by this shipping policy. We appreciate your trust
                in our products and services and are dedicated to delivering
                your packaging solutions with care and efficiency.
              </div>
            </div>

            <div className="policy-subdiv1">
              Note: This shipping policy is subject to change. Please check our
              website for the most up-to-date information
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

