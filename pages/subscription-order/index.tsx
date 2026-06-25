"use client"; // This is a client component 👈🏽
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getService, postService } from "../../services/service";
import Banner from "../../components/landing/Banner";
import Head from "next/head";

const SubscriptionOrder = () => {

  const [formData, setFormData] = useState({
    product_name: "",
    product_category: "",
    moq: "",
    number_of_months: "",
    contact_person_name: "",
    contact_person_email: "",
    contact_person_mobile_number: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Display the form data in the console
    //console.log("Form Data:", formData);

    try {
      // Use centralized postService which reads base URL from env
      const response = await postService("subscription-order", formData);
      // response handling (optional)
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
    }
  };

  return (
    <>
      <Head>
        <title>
          Subscription Order - Prem Industries India Limited - Innovation In
          Action
        </title>
      </Head>
      <div>
        <div className="row p-0 m-0">
          <Banner />
        </div>
      </div>
      <div className="container mt-5 pt-5 pb-5 mb-5">
        <div className="row mt-5 pt-5 pb-5 mb-5">
          <div className="col-md-12 mt-5 pt-5 pb-5 mb-5">
            <h1
              className="text-center"
              style={{ fontSize: "40px", color: "#182C5A", fontWeight: "700" }}
            >
              Coming Soon...
            </h1>
          </div>
        </div>
      </div>
      {/* <div className="tw-bg-white tw-pt-[50px]">
        <div className="tw-flex tw-flex-col tw-justify-center tw-items-start tw-text-4xl tw-font-bold tw-text-[#182c5a] tw-pl-[50px]">
          <div>Subscription Order Form</div>
          <div className="tw-h-[3px] tw-w-[420px] tw-bg-[#e92227]"></div>
        </div>

        <div className="tw-mt-5">
          <form onSubmit={handleSubmit}>
            <div className="tw-flex tw-flex-col tw-justify-self-center tw-items-start tw-pl-[50px]">
              <label htmlFor="companyName" className="tw-text-xl tw-font-semibold tw-leading-9 tw-pt-[30px]">
                Product Name*
              </label>
              <input
                type="text"
                id="product_name"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                className="tw-w-1/2 tw-border-none tw-border-b tw-border-solid tw-border-b-[#182c5a] tw-p-1"
              />
            </div>
            <div className="tw-flex tw-flex-col tw-justify-self-center tw-items-start tw-pl-[50px]">
              <label htmlFor="productCategory" className="tw-text-xl tw-font-semibold tw-leading-9 tw-pt-[30px]">
                Product Category*
              </label>
              <input
                type="text"
                id="product_category"
                name="product_category"
                value={formData.product_category}
                onChange={handleChange}
                className="tw-w-1/2 tw-border-none tw-border-b tw-border-solid tw-border-b-[#182c5a] tw-p-1"
              />
            </div>
            <div className="tw-flex tw-flex-col tw-justify-self-center tw-items-start tw-pl-[50px]">
              <label htmlFor="moq" className="tw-text-xl tw-font-semibold tw-leading-9 tw-pt-[30px]">
                MOQ*
              </label>
              <input
                type="text"
                id="moq"
                name="moq"
                value={formData.moq}
                onChange={handleChange}
                className="tw-w-1/2 tw-border-none tw-border-b tw-border-solid tw-border-b-[#182c5a] tw-p-1"
              />
            </div>
            <div className="tw-flex tw-flex-col tw-justify-self-center tw-items-start tw-pl-[50px]">
              <label htmlFor="richText" className="tw-text-xl tw-font-semibold tw-leading-9 tw-pt-[30px]">
                Number of Months*
              </label>
              <textarea
                id="number_of_months"
                name="number_of_months"
                value={formData.number_of_months}
                onChange={handleChange}
                className="tw-w-1/2 tw-border-none tw-border-b tw-border-solid tw-border-b-[#182c5a] tw-p-1"
              />
            </div>
            <div className="tw-flex tw-flex-col tw-justify-self-center tw-items-start tw-pl-[50px]">
              <label htmlFor="contactDetails" className="tw-text-xl tw-font-semibold tw-leading-9 tw-pt-[30px]">
                Contact Person Name*
              </label>
              <input
                type="text"
                id="contact_person_name"
                name="contact_person_name"
                value={formData.contact_person_name}
                onChange={handleChange}
                className="tw-w-1/2 tw-border-none tw-border-b tw-border-solid tw-border-b-[#182c5a] tw-p-1"
              />
            </div>
            <div className="tw-flex tw-flex-col tw-justify-self-center tw-items-start tw-pl-[50px]">
              <label htmlFor="email" className="tw-text-xl tw-font-semibold tw-leading-9 tw-pt-[30px]">
                Contact Person Email*
              </label>
              <input
                type="email"
                id="contact_person_email"
                name="contact_person_email"
                value={formData.contact_person_email}
                onChange={handleChange}
                className="tw-w-1/2 tw-border-none tw-border-b tw-border-solid tw-border-b-[#182c5a] tw-p-1"
              />
            </div>
            <div className="tw-flex tw-flex-col tw-justify-self-center tw-items-start tw-pl-[50px]">
              <label htmlFor="contactPerson" className="tw-text-xl tw-font-semibold tw-leading-9 tw-pt-[30px]">
                Contact Person Mobile Number*
              </label>
              <input
                type="text"
                id="contact_person_mobile_number"
                name="contact_person_mobile_number"
                value={formData.contact_person_mobile_number}
                onChange={handleChange}
                className="tw-w-1/2 tw-border-none tw-border-b tw-border-solid tw-border-b-[#182c5a] tw-p-1"
              />
            </div>
            <div className="tw-flex tw-flex-col tw-justify-self-center tw-items-start tw-pl-[50px]" style={{ marginBlock: "30px" }}>
              <button className="tw-border-none tw-text-white tw-px-10 tw-py-1 tw-bg-[#e92227] hover:tw-bg-[#182c5a]" type="submit">
                Submit
              </button>
            </div>
          </form>
        </div>
      </div> */}
    </>
  );
};

export default SubscriptionOrder;

