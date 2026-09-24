import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { postService } from "../../../services/service";
import { backdrop, modalPanel, withoutMotion } from "../../../utils/motion";

// Same dual lead pipeline the contact and custom-packaging forms use: the
// self-hosted `lead/create` drives the UI and the branded auto-response, and the
// Netlify/Vercel app is kept in the loop on a best-effort basis.
const NETLIFY_CONTACT_ENDPOINT =
  "https://prem-industries-forms.vercel.app/api/email-store-contact.js";

interface RequestQuoteModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  sku: string;
  /** Pre-fills the quantity line so the sales team gets the buyer's intent. */
  defaultQuantity?: number;
}

const initialForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  quantity: "",
  message: "",
};

type FieldErrors = Partial<Record<keyof typeof initialForm, string>>;

const inputClass =
  "tw-w-full tw-px-3 tw-py-2 tw-bg-slate-50 tw-border tw-border-solid tw-border-slate-200 tw-rounded-lg tw-text-xs tw-text-slate-900 placeholder:tw-text-slate-400 focus:tw-border-slate-900 focus:tw-outline-none";

const labelClass =
  "tw-block tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-slate-600 tw-mb-1";

/** "Request custom quote" — files a lead against the product being viewed. */
export const RequestQuoteModal: React.FC<RequestQuoteModalProps> = ({
  open,
  onClose,
  productName,
  sku,
  defaultQuantity,
}) => {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return undefined;
    setFormData((prev) => ({
      ...prev,
      quantity: prev.quantity || (defaultQuantity ? String(defaultQuantity) : ""),
    }));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, defaultQuantity, onClose]);

  // No early `return null` here: the modal has to stay mounted for the length
  // of its exit animation, so the open check moves inside AnimatePresence.
  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    const next =
      name === "phone" || name === "quantity" ? value.replace(/[^0-9]/g, "") : value;
    setFormData((prev) => ({ ...prev, [name]: next }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!formData.name.trim()) next.name = "Please tell us your name.";
    if (!formData.email.trim()) {
      next.email = "We need an email to reply to.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      next.email = "That email address doesn't look right.";
    }
    if (!formData.phone.trim()) {
      next.phone = "Add a number we can call.";
    } else if (formData.phone.length !== 10) {
      next.phone = "Phone number should be 10 digits.";
    }
    if (!formData.quantity.trim()) next.quantity = "Approximate order quantity?";
    return next;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      company: formData.company.trim(),
      quantity: formData.quantity.trim(),
      productName,
      sku,
      message: formData.message.trim(),
      description: formData.message.trim() || `Quote for ${productName}`,
      pageUrl: typeof window !== "undefined" ? window.location.href : "",
    };

    setSubmitting(true);
    try {
      await postService("lead/create", payload, { silent: true });
      try {
        await axios.post(NETLIFY_CONTACT_ENDPOINT, payload, { timeout: 4000 });
      } catch (err) {
        // Fire-and-forget fallback — the backend lead/create is primary.
      }
      toast.success(
        "Quote request received. Our sales engineering team will reach out shortly.",
      );
      setFormData(initialForm);
      setErrors({});
      onClose();
    } catch (error) {
      toast.error("Could not send your request right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
    <motion.div
      className="tw-fixed tw-inset-0 tw-bg-slate-900/60 tw-backdrop-blur-sm tw-z-[1200] tw-flex tw-items-center tw-justify-center tw-p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Request a custom quote"
      onClick={onClose}
      variants={reduceMotion ? withoutMotion(backdrop) : backdrop}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* The panel inherits the backdrop's animation state, so scrim and card
          arrive together and leave together. */}
      <motion.div
        className="tw-bg-white tw-rounded-xl tw-max-w-md tw-w-full tw-p-6 tw-border tw-border-solid tw-border-slate-200 tw-shadow-2xl tw-max-h-[90vh] tw-overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
        variants={reduceMotion ? withoutMotion(modalPanel) : modalPanel}
      >
        <div className="tw-flex tw-justify-between tw-items-start tw-gap-4 tw-mb-1 tw-pb-2 tw-border-b tw-border-solid tw-border-slate-100">
          <h3 className="tw-font-bold tw-text-base tw-text-slate-900 tw-m-0">
            Request a custom quote
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quote form"
            className="tw-text-slate-400 hover:tw-text-slate-900 tw-text-lg tw-font-bold tw-bg-transparent tw-border-0 tw-cursor-pointer tw-leading-none"
          >
            ✕
          </button>
        </div>

        <p className="tw-text-[11px] tw-text-slate-500 tw-mt-3 tw-mb-4">
          {productName}
          {sku ? ` · SKU ${sku}` : ""}
        </p>

        <form onSubmit={handleSubmit} className="tw-space-y-3 tw-text-xs" noValidate>
          <div>
            <label htmlFor="quote-name" className={labelClass}>
              Your name *
            </label>
            <input
              id="quote-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full name"
              className={inputClass}
            />
            {errors.name && (
              <p className="tw-text-[10px] tw-text-red-600 tw-mt-1 tw-mb-0">
                {errors.name}
              </p>
            )}
          </div>

          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-3">
            <div>
              <label htmlFor="quote-email" className={labelClass}>
                Work email *
              </label>
              <input
                id="quote-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className={inputClass}
              />
              {errors.email && (
                <p className="tw-text-[10px] tw-text-red-600 tw-mt-1 tw-mb-0">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="quote-phone" className={labelClass}>
                Phone *
              </label>
              <input
                id="quote-phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit number"
                className={inputClass}
              />
              {errors.phone && (
                <p className="tw-text-[10px] tw-text-red-600 tw-mt-1 tw-mb-0">
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-3">
            <div>
              <label htmlFor="quote-company" className={labelClass}>
                Company
              </label>
              <input
                id="quote-company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleChange}
                placeholder="Organisation"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="quote-quantity" className={labelClass}>
                Approx. quantity *
              </label>
              <input
                id="quote-quantity"
                name="quantity"
                type="text"
                inputMode="numeric"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Units"
                className={inputClass}
              />
              {errors.quantity && (
                <p className="tw-text-[10px] tw-text-red-600 tw-mt-1 tw-mb-0">
                  {errors.quantity}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="quote-message" className={labelClass}>
              Requirement details
            </label>
            <textarea
              id="quote-message"
              name="message"
              rows={3}
              value={formData.message}
              onChange={handleChange}
              placeholder="Print, sizes, delivery location, timelines…"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`tw-w-full tw-py-2.5 tw-font-bold tw-uppercase tw-tracking-widest tw-rounded-lg tw-border-0 tw-transition-all tw-text-[11px] ${
              submitting
                ? "tw-bg-slate-200 tw-text-slate-400 tw-cursor-wait"
                : "tw-bg-slate-900 tw-text-white hover:tw-bg-slate-800 tw-cursor-pointer tw-shadow-sm"
            }`}
          >
            {submitting ? "Sending…" : "Send quote request"}
          </button>
        </form>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RequestQuoteModal;
