"use client"; // This is a client component 👈🏽
import React, { useEffect, useState } from "react";
import Head from "next/head";
import JsonLd from "../../components/common/JsonLd";
import { canonicalUrl, contentPageSchema } from "../../utils/schema";

const PrivacyPolicy = () => {

  return (
    <>
      <Head>
        <title>Return and Exchange Policy | store.prempackaging</title>
        <meta name="title" content="Return and Exchange Policy" />
        <meta
          name="description"
          content="Our hassle-free return and exchange policy ensures your satisfaction. Shop with confidence knowing replacements and returns are easy and quick."
        />
        <link rel="canonical" href={canonicalUrl("/return-and-exchange-policy")} />
      </Head>

      <JsonLd
        id="page"
        data={contentPageSchema({
          path: "/return-and-exchange-policy",
          name: "Return and Exchange Policy",
          type: "WebPage",
          description:
            "Our hassle-free return and exchange policy ensures your satisfaction. Shop with confidence knowing replacements and returns are easy and quick.",
          breadcrumb: [{ name: "Return and Exchange Policy", path: "/return-and-exchange-policy" }],
        })}
      />
      <div>
        <div className="row p-0 m-0">
          <div
            className="row policy-mainbody"
            style={{ backgroundColor: "white" }}
          >
            <div className="policy-maindiv">
              <h2 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[36px] tw-mb-[10px]">Return Policy</h2>
              <div className="tw-text-[18px] tw-leading-[30px]">
                At Prem Industries India Limited, we are dedicated to delivering
                high-quality packaging solutions. To ensure clarity and
                transparency regarding your purchases, please read and
                understand our Return and Exchange Policy.
              </div>
            </div>

            <div className="policy-subdiv">
              <h3 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">1. No Return Policy</h3>

              <div className="policy-subcontent1">
                <span className="tw-text-[20px] tw-font-bold tw-text-[#3A5BA2]">1.1 No Return:</span> Prem
                Industries India Limited operates under a &#34;No Return&#34;
                policy for most of our products.
              </div>

              <div className="policy-subcontent1">
                <span className="tw-text-[20px] tw-font-bold tw-text-[#3A5BA2]">1.2 Exclusions: </span>{" "}
                Exceptions to our &#34;No Return&#34; policy are only applicable
                in cases of defective or damaged items. If you receive a product
                that is damaged or has a manufacturing defect, please refer to
                section 2 below for details on our &#34;7 Days Replacement&#34;
                option.
              </div>
            </div>

            <div className="policy-subdiv">
              <h3 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">2. 7 Days Replacement</h3>

              <div className="policy-subcontent1">
                <span className="tw-text-[20px] tw-font-bold tw-text-[#3A5BA2]">
                  2.1 Defective or Damaged Items:
                </span>{" "}
                In the rare event that you receive a product that is defective
                or damaged, you have the option to request a replacement within
                7 days of the delivery date.
              </div>

              <div className="policy-subcontent1">
                <span className="tw-text-[20px] tw-font-bold tw-text-[#3A5BA2]">
                  2.2 Initiating a Replacement:
                </span>{" "}
                To request a replacement, please follow these steps:
                <ul>
                  <li>
                    Contact our customer support team at
                    ecommerce@premindustries.in or call us at +91 8447247227
                    within 7 days of receiving the damaged or defective item.
                  </li>
                  <li>
                    Provide your order number, a description of the issue, and
                    clear photos or videos showing the defect or damage. This
                    information will help us assess the situation quickly.
                  </li>
                </ul>
              </div>

              <div className="policy-subcontent1">
                <span className="tw-text-[20px] tw-font-bold tw-text-[#3A5BA2]">2.3 Replacement Process:</span>
                <ul>
                  <li>
                    Once we receive your request and the required information,
                    we will review the case.
                  </li>
                  <li>
                    Once your request is approved, we will provide instructions
                    on returning the damaged or defective item.
                  </li>
                  <li>
                    Upon receiving the item and confirming the issue, we will
                    ship a replacement to you as soon as possible. If the exact
                    item is out of stock, we will offer a suitable replacement
                    or a refund, based on your preference.
                  </li>
                  <li>
                    We hereby clarify that any shipping costs related to
                    replacements shall not be borne by us. Such expenses shall
                    remain the responsibility of the customer.
                  </li>
                </ul>
              </div>
            </div>

            <div className="policy-subdiv">
              <h3 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">3. Privacy</h3>
              <div>
                <div className="policy-subcontent1">
                  <span className="tw-text-[20px] tw-font-bold tw-text-[#3A5BA2]">
                    3.1 Personal Information:
                  </span>{" "}
                  In the rare event that you receive a product that is defective
                  or damaged, you have the option to request a replacement
                  within 7 days of the delivery date.
                </div>
              </div>
            </div>

            <div className="policy-subdiv">
              <h3 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">4. Contact Information</h3>
              <div className="policy-subcontent">
                If you have any questions or need assistance with a replacement
                or warranty claim, please contact our customer support team at
                ecommerce@premindustries.in or call us at +91 8447247227.
              </div>
            </div>

            <div className="policy-subdiv" style={{ marginBottom: "60px" }}>
              <h3 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">5. Policy Changes</h3>
              <div className="policy-subcontent">
                Prem Industries India Limited reserves the right to modify or
                update this Return and Exchange Policy at any time. Any changes
                will be effective immediately upon posting on our website. You
                are responsible for periodically reviewing this policy. <br />
                <br />
                When you make a purchase from us, you acknowledge and agree to
                abide by the terms and conditions detailed in this policy. We
                appreciate your business and are dedicated to providing you with
                quality packaging solutions and excellent customer service
              </div>
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
}
.policy-subdiv {
  margin-top: 20px;
  text-align: justify;
}
.policy-subcontent1 {
  font-size: 18px;
  line-height: 30px;
  margin-top: 15px;
  margin-inline: 20px;
}
.policy-subcontent {
  font-size: 18px;
  line-height: 30px;
  margin-top: 15px;
}
`}</style>
    </>
  );
};

export default PrivacyPolicy;

