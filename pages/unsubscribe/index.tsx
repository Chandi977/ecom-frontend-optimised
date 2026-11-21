import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { postService } from "../../services/service";

type Status = "idle" | "loading" | "success" | "error" | "resubscribed";

export default function UnsubscribePage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [resubscribing, setResubscribing] = useState(false);
  // Guard so we only fire the unsubscribe request once, even with router re-renders.
  const requestedRef = useRef(false);

  const email = String(router.query.e || "").trim();
  const token = String(router.query.t || "").trim();

  useEffect(() => {
    if (!router.isReady || requestedRef.current) return;

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
  }, [router.isReady, email, token]);

  const handleResubscribe = async () => {
    if (!email || resubscribing) return;
    setResubscribing(true);
    try {
      const res = await postService(
        "/newsletter/subscribe",
        { email },
        { silent: true },
      );
      if (res?.data?.success) {
        setStatus("resubscribed");
        setMessage(res.data.message || "You're subscribed again. Welcome back!");
      } else {
        setMessage(res?.data?.message || "Could not resubscribe right now. Please try again.");
      }
    } finally {
      setResubscribing(false);
    }
  };

  const isSuccess = status === "success";
  const isResubscribed = status === "resubscribed";

  return (
    <>
      <Head>
        <title>{isResubscribed ? "Subscribed" : "Unsubscribe"} · Prem Packaging</title>
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
              background: isSuccess || isResubscribed ? "#dcfce7" : status === "error" ? "#fee2e2" : "#e0e7ff",
            }}
            aria-hidden
          >
            {status === "loading" || status === "idle" ? "⏳" : isSuccess || isResubscribed ? "✅" : "⚠️"}
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#102050", margin: "0 0 12px" }}>
            {status === "loading" || status === "idle"
              ? "Updating your preferences…"
              : isResubscribed
                ? "You're subscribed"
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
            <>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px" }}>
                You will still receive important account and order emails. Changed your mind?
              </p>
              <button
                type="button"
                onClick={handleResubscribe}
                disabled={resubscribing}
                style={{
                  display: "inline-block",
                  background: "#fff",
                  color: "#102050",
                  border: "1px solid #cbd5e1",
                  padding: "13px 30px",
                  fontSize: 15,
                  fontWeight: 700,
                  borderRadius: 999,
                  cursor: resubscribing ? "not-allowed" : "pointer",
                  marginBottom: 12,
                }}
              >
                {resubscribing ? "Subscribing…" : "Resubscribe"}
              </button>
              <div />
            </>
          )}

          {isResubscribed && (
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px" }}>
              You will receive promotional emails and offers from Prem Packaging.
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
