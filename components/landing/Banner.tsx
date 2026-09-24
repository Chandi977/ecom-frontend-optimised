import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cdn } from "../../lib/cdn";
import { DURATION, EASE_OUT, STAGGER_STEP } from "../../utils/motion";

/**
 * Copy block sequence. Was three hand-written delays (0.2 / 0.4 / 0.6) with
 * their own durations; now it inherits the site's stagger step and entrance
 * curve so this hero moves like every other section.
 */
const copyVariants = {
  hidden: {},
  shown: { transition: { staggerChildren: STAGGER_STEP, delayChildren: 0.1 } },
};

const copyItemVariants = {
  hidden: { opacity: 0, y: 20 },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.entrance, ease: EASE_OUT },
  },
};

function Banner() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="container-fluid p-0 m-0 tw-relative tw-h-[800px] tw-min-h-[450px] tw-overflow-hidden"
    >
      <div className="w-100 h-100">
        {/* Slow Ken Burns push-in behind the headline. overflow-hidden on the
            parent keeps the oversized frames from bleeding past the banner. */}
        <motion.img
          src={cdn("/backgroundslider.png")}
          alt="Premium Packaging Banner"
          className="p-0 h-100"
          style={{
            width: "100%",
            objectFit: "cover",
          }}
          initial={{ scale: reduceMotion ? 1 : 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 2.4, ease: "easeOut" }}
        />
      </div>
      <motion.div
        className="tw-absolute tw-top-[20%] tw-left-[10%] max-[700px]:tw-top-[6%] max-[700px]:tw-left-[5%]"
        variants={copyVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="shown"
      >
        <div>
          {/* data-reveal on every element that server-renders hidden: without
              it these would stay at opacity 0 for good if JS never runs. */}
          <motion.h1
            className="tw-text-white tw-font-bold tw-text-[72px] tw-leading-[71px] tw-mt-[30px] max-[700px]:tw-text-[36px] max-[700px]:tw-leading-[40px]"
            data-reveal="hidden"
            variants={copyItemVariants}
          >
            IT’S ALL IN THE
            <br /> PACKAGING
          </motion.h1>
          <motion.p
            className="tw-text-white tw-text-[20px] tw-font-normal tw-leading-[25.669px] tw-pl-[4px] tw-mt-[10px] tw-mb-[20px] max-[700px]:tw-text-[16px] max-[700px]:tw-leading-[22px]"
            data-reveal="hidden"
            variants={copyItemVariants}
          >
            Your product deserves the best packaging that we offer at <br /> our
            world-class infrastructure.
          </motion.p>
          <motion.div data-reveal="hidden" variants={copyItemVariants}>
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
                transition={{ duration: DURATION.fast }}
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
