"use client"; // This is a client component 👈🏽
import React, { useEffect, useState } from "react";
import Banner from "../../components/landing/Banner";
import Head from "next/head";

const PrivacyPolicy = () => {

  return (
    <>
      <Head>
        <title>Terms Of Sale | store.prempackaging</title>
        <meta name="title" content="Terms Of Sale" />
        <meta
          name="description"
          content="Read our Terms of Sale to understand pricing, orders, and conditions. We ensure transparency and trust in every packaging product purchase."
        />
      </Head>
      <div>
        <div className="row p-0 m-0">
          <Banner />
          <div
            className="row policy-mainbody"
            style={{ backgroundColor: "white" }}
          >
            <div className="policy-maindiv">
              <h2 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[36px] tw-mb-[10px]">Terms of Sale</h2>
              <div className="tw-text-[18px] tw-leading-[30px]">
                Thank you for choosing Prem Industries India Limited for your
                packaging needs. These Terms of Sale govern your purchase of our
                products and outline the rights and responsibilities of both
                parties involved in the transaction. By placing an order with
                us, you agree to these terms. Please read them carefully before
                making a purchase.
              </div>
            </div>

            <div className="policy-subdiv">
              <h3 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">1. Ordering Process</h3>

              <div className="policy-subcontent1">
                <span className="tw-text-[20px] tw-font-bold tw-text-[#3A5BA2]">1.1 Order Placement:</span> You
                may place orders for our products through our website or other
                authorized sales channels. By doing so, you confirm that you are
                of legal age to enter into a binding contract.
              </div>

              <div className="policy-subcontent1">
                <span className="tw-text-[20px] tw-font-bold tw-text-[#3A5BA2]">1.2 Order Confirmation: </span>{" "}
                Upon placing an order, you will receive an order confirmation
                email. This email serves as acknowledgment that we have received
                your order. Please review it for accuracy and notify us
                immediately of any discrepancies.
              </div>

              <div className="policy-subcontent1">
                <span className="tw-text-[20px] tw-font-bold tw-text-[#3A5BA2]">1.3 Payment: </span> Payment for
                orders can be made via the payment methods provided on our
                website. We use secure payment processing to protect your
                financial information.
              </div>
            </div>

            <div className="policy-subdiv">
              <h3 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">2. Product Information</h3>

              <div className="policy-subcontent1">
                <span className="tw-text-[20px] tw-font-bold tw-text-[#3A5BA2]">2.1 Product Descriptions:</span>{" "}
                Our aim is to offer precise and comprehensive product
                descriptions on our website. Nevertheless, we cannot guarantee
                that product descriptions or other content on our site are
                devoid of errors.
              </div>

              <div className="policy-subcontent1">
                <span className="tw-text-[20px] tw-font-bold tw-text-[#3A5BA2]">2.2 Pricing</span> All prices for
                our products are listed in Indian Rupees (INR) and are subject
                to change without notice. The price you see at the time of your
                order placement will be the final price, excluding any
                applicable taxes or shipping charges.
              </div>
            </div>

            <div className="policy-subdiv">
              <h3 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">3. Shipping and Delivery</h3>
              <div>
                <div className="policy-subcontent1">
                  <span className="tw-text-[20px] tw-font-bold tw-text-[#3A5BA2]">3.1 Shipping Times:</span> We
                  make every effort to process and ship orders promptly.
                  Estimated delivery times are provided for your reference, but
                  we do not guarantee specific delivery dates. Delays due to
                  factors beyond our control, such as carrier issues or force
                  majeure events, may occur.
                </div>

                <div className="policy-subcontent1">
                  <span className="tw-text-[20px] tw-font-bold tw-text-[#3A5BA2]">3.2 Shipping Costs:</span>{" "}
                  Shipping costs are calculated based on factors such as order
                  weight, dimensions, and destination. You will see the shipping
                  cost during the checkout process.
                </div>

                <div className="policy-subcontent1">
                  <span className="tw-text-[20px] tw-font-bold tw-text-[#3A5BA2]">3.3 Risk of Loss:</span> The
                  risk of loss or damage to products passes to you upon
                  delivery. If you believe your order is lost or damaged during
                  transit, please refer to our Shipping Policy for further
                  instructions.
                </div>
              </div>
            </div>

            <div className="policy-subdiv">
              <h3 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">4. Returns and Exchanges</h3>
              <div className="policy-subcontent1">
                <span className="tw-text-[20px] tw-font-bold tw-text-[#3A5BA2]">4.1 Return Eligibility:</span> We
                generally do not accept returns. Instead, we offer replacements
                in exceptional cases where an issue is substantiated with valid
                evidence.
              </div>

              <div className="policy-subcontent1">
                <span className="tw-text-[20px] tw-font-bold tw-text-[#3A5BA2]">4.2 Return Process: </span> To
                initiate a return, contact our customer support team for a
                Return Merchandise Authorization (RMA) number. You are
                responsible for return shipping costs unless the return is due
                to our error.
              </div>
            </div>

            <div className="policy-subdiv">
              <h3 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">5. Privacy Policy</h3>
              <div className="policy-subcontent1">
                <span className="tw-text-[20px] tw-font-bold tw-text-[#3A5BA2]">5.1 Privacy Protection: </span>
                Your privacy is important to us. Please review our Privacy
                Policy to understand how we collect, use, and protect your
                personal information.
              </div>
            </div>

            <div className="policy-subdiv">
              <h3 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">6. Contact Information</h3>
              <div className="policy-subcontent">
                If you have questions or concerns about these Terms of Sale or
                any aspect of your order, please contact our customer support
                team at ecommerce@premindustries .in or call us at +91-
                8447247227.
              </div>
            </div>

            <div className="policy-subdiv">
              <h3 className="tw-text-[#3A5BA2] tw-font-bold tw-text-[24px] tw-mb-[10px]">7. Changes to Terms</h3>
              <div className="policy-subcontent">
                We reserve the right to modify these Terms of Sale at any time.
                Any changes will be effective immediately upon posting on our
                website. It is your responsibility to review these terms
                periodically.
              </div>
            </div>

            <div className="policy-subdiv1">
              By completing a purchase with Prem Industries India Limited, you
              agree to these Terms of Sale. We appreciate your business and are
              committed to providing you with high-quality packaging solutions
              and excellent customer service.
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

