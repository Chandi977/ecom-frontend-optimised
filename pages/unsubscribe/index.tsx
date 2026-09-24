import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { postService } from "../../services/service";

type Status = "idle" | "loading" | "success" | "error";

export default function UnsubscribePage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  // Guard so we only fire the unsubscribe request once, even with router re-renders.
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!router.isReady || requestedRef.current) return;

    const email = String(router.query.e || "").trim();
    const token = String(router.query.t || "").trim();

    if (!email || !token) {
      setStatus("error");
      setMessage("This unsubscribe link is missing information. Please use the link from your email.");
      return;
    }

    requestedRef.current = true;
    setStatus("loading");
    (async () => {
      const res = await postService(
        "/newsletter/unsubscribe",
        { email, token },
        { silent: true },
      );
      if (res?.data?.success) {
        setStatus("success");
        setMessage(res.data.message || "You have been unsubscribed from promotional emails.");
      } else {
        setStatus("error");
        setMessage(
          res?.data?.message || "This unsubscribe link is invalid or has expired.",
        );
      }
    })();
  }, [router.isReady, router.query.e, router.query.t]);

  const isSuccess = status === "success";

  return (
    <>
      <Head>
        <title>Unsubscribe · Prem Packaging</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 16px",
          background: "#f3f6fb",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            background: "#fff",
            border: "1px solid #e7edf6",
            borderRadius: 18,
            boxShadow: "0 14px 36px rgba(16,32,80,.10)",
            padding: "40px 32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              background: isSuccess ? "#dcfce7" : status === "error" ? "#fee2e2" : "#e0e7ff",
            }}
            aria-hidden
          >
            {status === "loading" || status === "idle" ? "⏳" : isSuccess ? "✅" : "⚠️"}
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#102050", margin: "0 0 12px" }}>
            {status === "loading" || status === "idle"
              ? "Updating your preferences…"
              : isSuccess
                ? "You're unsubscribed"
                : "Something went wrong"}
          </h1>

          <p style={{ fontSize: 15.5, lineHeight: 1.6, color: "#506078", margin: "0 0 24px" }}>
            {status === "loading" || status === "idle"
              ? "Please wait a moment while we update your email preferences."
              : message}
          </p>

          {isSuccess && (
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px" }}>
              You will still receive important account and order emails. Changed your mind? You can
              re-subscribe anytime from the newsletter banner on our homepage.
            </p>
          )}

          <Link
            href="/"
            style={{
              display: "inline-block",
              background: "#F02020",
              color: "#fff",
              textDecoration: "none",
              padding: "13px 30px",
              fontSize: 15,
              fontWeight: 800,
              borderRadius: 999,
              boxShadow: "0 10px 18px rgba(240,32,32,.24)",
            }}
          >
            Back to Store
          </Link>
        </div>
      </main>
    </>
  );
}
