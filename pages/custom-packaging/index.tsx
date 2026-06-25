"use client"; // This is a client component 👈🏽
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Head from "next/head";
import { postService } from "../../services/service";
import Banner from "../../components/landing/Banner";

export async function getServerSideProps() {
  return { props: {} };
}

const CustomForm = () => {

  const [formData, setFormData] = useState({
    company_name: "",
    product_category: "",
    moq: "",
    rich_text: "",
    contact_person_name: "",
    contact_person_email: "",
    contact_person_mobile_number: "",
  });

  const [successMessage, setSuccessMessage] = useState(null);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    try {
      // Use centralized postService which reads base URL from env
      const response = await postService("custom-packaging", formData);

      // Send same data to email API (external)
      await axios.post(
        "https://prem-industries-forms.vercel.app/api/email-store-custom.js",
        formData,
      );

      setSuccessMessage(response?.data?.message);

      setFormData({
        company_name: "",
        product_category: "",
        moq: "",
        rich_text: "",
        contact_person_name: "",
        contact_person_email: "",
        contact_person_mobile_number: "",
      });

      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
    }
  };

  return (
    <>
      <Head>
        <title>Custom Packaging Form | store.prempackaging</title>
        <meta name="title" content="Custom Packaging" />
        <meta
          name="description"
          content="Design unique custom packaging tailored to your brand. Choose sizes, styles, and materials that perfectly reflect your business identity."
        />
      </Head>
      <div>
        <div className="row p-0 m-0">
          <Banner />
        </div>
      </div>
      <div className="tw-bg-white tw-pt-[50px]">
        <div className="tw-flex tw-flex-col tw-justify-center tw-items-center tw-text-[36px] tw-font-bold tw-text-[#182c5a]">
          <div>Custom Packaging Form</div>
          <div className="tw-h-[3px] tw-w-[420px] tw-bg-[#e92227]"></div>
        </div>

        <div className="pack-form">
          {successMessage ? (
            <div className="pack-success">{successMessage}</div>
          ) : (
            <form>
              <div className="pack-input">
                <label htmlFor="companyName" className="tw-font-bold">
                  Company Name*
                </label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="tw-w-full tw-p-2 tw-border tw-border-[#ccc] tw-rounded"
                />
              </div>

              <div className="pack-input">
                <label
                  htmlFor="productCategory"
                  className="tw-font-bold"
                >
                  Product Category*
                </label>
                <input
                  type="text"
                  id="product_category"
                  name="product_category"
                  value={formData.product_category}
                  onChange={handleChange}
                  className="tw-w-full tw-p-2 tw-border tw-border-[#ccc] tw-rounded"
                />
              </div>

              <div className="pack-input">
                <label htmlFor="moq" className="tw-font-bold">
                  MOQ*
                </label>
                <input
                  type="text"
                  id="moq"
                  name="moq"
                  value={formData.moq}
                  onChange={handleChange}
                  className="tw-w-full tw-p-2 tw-border tw-border-[#ccc] tw-rounded"
                />
              </div>
              <div className="pack-input">
                <label htmlFor="richText" className="tw-font-bold">
                  Query Details*
                </label>
                <textarea
                  id="rich_text"
                  name="rich_text"
                  value={formData.rich_text}
                  onChange={handleChange}
                  className="tw-w-full tw-p-2 tw-border tw-border-[#ccc] tw-rounded"
                />
              </div>

              <div className="pack-input">
                <label htmlFor="contactDetails" className="tw-font-bold">
                  Contact Person Name*
                </label>
                <input
                  type="text"
                  id="contact_person_name"
                  name="contact_person_name"
                  value={formData.contact_person_name}
                  onChange={handleChange}
                  className="tw-w-full tw-p-2 tw-border tw-border-[#ccc] tw-rounded"
                />
              </div>
              <div className="pack-input">
                <label htmlFor="email" className="tw-font-bold">
                  Contact Person Email*
                </label>
                <input
                  type="email"
                  id="contact_person_email"
                  name="contact_person_email"
                  value={formData.contact_person_email}
                  onChange={handleChange}
                  className="tw-w-full tw-p-2 tw-border tw-border-[#ccc] tw-rounded"
                />
              </div>
              <div className="pack-input">
                <label htmlFor="contactPerson" className="tw-font-bold">
                  Contact Person Mobile Number*
                </label>
                <input
                  type="text"
                  id="contact_person_mobile_number"
                  name="contact_person_mobile_number"
                  value={formData.contact_person_mobile_number}
                  onChange={handleChange}
                  className="tw-w-full tw-p-2 tw-border tw-border-[#ccc] tw-rounded"
                />
              </div>
              <div className="pack-input" style={{ marginBlock: "30px" }}>
                <button
                  className="tw-bg-[#e92227] tw-text-white tw-px-5 tw-py-[10px] tw-border-0 tw-rounded tw-cursor-pointer hover:tw-bg-[#212529]"
                  type="submit"
                  onClick={handleSubmitForm}
                >
                  Submit
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <style jsx>{`
.pack-form {
  padding-inline: 20%;
}
.pack-input {
  margin-bottom: 20px;
  width: 100%;
}
`}</style>
    </>
  );
};
export default CustomForm;

