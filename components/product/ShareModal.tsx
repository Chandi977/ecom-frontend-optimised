import React, { useEffect, useState } from "react";

import { toast } from "react-toastify";
import { AiFillCloseCircle } from "react-icons/ai";
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  EmailShareButton,
} from "react-share";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import {
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
  EmailIcon,
} from "react-share";

function ShareModal({ data, handleClose }) {
  const [shareUrl, setShareUrl] = useState("");
  const [title, setTitle] = useState("");

  const handleProduce = () => {
    const productSlug = data?.slug ? encodeURIComponent(data.slug) : "";
    const url = `https://store.prempackaging.com/${productSlug}`;
    setShareUrl(url);
    setTitle(data?.name);
  };

  useEffect(() => {
    handleProduce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleCopyUrl = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => toast.success("URL copied to clipboard"))
        .catch((error) => console.error("Failed to copy URL: ", error));
      return;
    }

    window.prompt("Copy this URL:", shareUrl);
  };

  return (
    <>
      <div className="tw-share-main">
      <div className="tw-share-modal-inner">
        <div className="tw-share-ineera">
          <span className="tw-share-heading">Share this product</span>
          <i onClick={handleClose}>
            <AiFillCloseCircle style={{ color: "#D9D9D9" }} />
          </i>
        </div>
        <div className="tw-share-linkisss">
          <FacebookShareButton url={shareUrl}>
            <FacebookIcon size={32} round />
          </FacebookShareButton>
          <TwitterShareButton url={shareUrl} title={title}>
            <TwitterIcon size={32} round />
          </TwitterShareButton>
          <LinkedinShareButton url={shareUrl} title={title}>
            <LinkedinIcon size={32} round />
          </LinkedinShareButton>
          <WhatsappShareButton url={shareUrl} title={title}>
            <WhatsappIcon size={32} round />
          </WhatsappShareButton>
          <EmailShareButton
            url={shareUrl}
            subject={title}
            body="Check out this product"
          >
            <EmailIcon size={32} round />
          </EmailShareButton>
          <div
            style={{
              border: "1px solid grey",
              borderRadius: "50%",
              padding: "5px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "grey",
              marginBottom: "2px",
              height: "32px",
              width: "32px",
            }}
          >
            <ContentCopyRoundedIcon
              sx={{ color: "white", fontSize: "17px" }}
              onClick={handleCopyUrl}
            />
          </div>
          {/* <button onClick={handleCopyUrl}>Copy URL</button> */}
        </div>
      </div>
      </div>
      <style jsx>{`
        .tw-share-main { width: 100%; height: 100px; display: flex; justify-content: center; align-items: flex-start; position: absolute; top: 35%; z-index: 20; margin-left: 260px; }
        @media (max-width: 768px) { .tw-share-main { width: 80%; height: 100px; display: flex; justify-content: center; align-items: flex-start; position: absolute; top: 85%; margin-left: 6%; z-index: 20; } }
        .tw-share-modal-inner { width: 35%; height: auto; padding: 20px; border-radius: 10px; background: white; border: 1px solid #D9D9D9; }
        @media (max-width: 768px) { .tw-share-modal-inner { width: 100%; height: auto; padding: 20px; border-radius: 10px; background: white; border: 1px solid #D9D9D9; } }
        .tw-share-ineera { display: flex; justify-content: space-between; padding-right: 8px; }
        .tw-share-heading { font-family: Montserrat; }
        .tw-share-linkisss { display: flex; flex-wrap: wrap; column-gap: 10px; margin-top: 20px; }
      `}</style>
    </>
  );
}

export default ShareModal;
