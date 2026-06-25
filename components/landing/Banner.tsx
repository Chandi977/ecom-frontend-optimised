import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

function Banner() {
  return (
    <div
      className="container-fluid p-0 m-0 tw-relative tw-h-[800px] tw-min-h-[450px]"
    >
      <div className="w-100 h-100">
        <img
          src="/backgroundslider.png"
          alt="Premium Packaging Banner"
          className="p-0 h-100"
          style={{
            width: "100%",
            objectFit: "cover",
          }}
        />
      </div>
      <motion.div
        className="tw-absolute tw-top-[20%] tw-left-[10%] max-[700px]:tw-top-[6%] max-[700px]:tw-left-[5%]"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div>
          <motion.h1
            className="tw-text-white tw-font-bold tw-text-[72px] tw-leading-[71px] tw-mt-[30px] max-[700px]:tw-text-[36px] max-[700px]:tw-leading-[40px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            IT’S ALL IN THE
            <br /> PACKAGING
          </motion.h1>
          <motion.p
            className="tw-text-white tw-text-[20px] tw-font-normal tw-leading-[25.669px] tw-pl-[4px] tw-mt-[10px] tw-mb-[20px] max-[700px]:tw-text-[16px] max-[700px]:tw-leading-[22px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Your product deserves the best packaging that we offer at <br /> our
            world-class infrastructure.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Link
              href="https://prempackaging.com/innovation"
              style={{ textDecoration: "none" }}
              target="_blank"
              className="p-0"
            >
              <motion.button
                className="tw-p-[12px] tw-text-white tw-rounded tw-border-0 max-[700px]:tw-text-[12px] max-[700px]:tw-p-[10px]"
                style={{
                  fontFamily: "Montserrat",
                  backgroundColor: "#182c5a",
                  color: "#ffffff",
                  cursor: "pointer",
                }}
                whileHover={{ scale: 1.05, backgroundColor: "#e92227" }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                ABOUT OUR INNOVATIVE PACKAGING
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default Banner;
