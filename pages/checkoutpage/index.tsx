"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/router";

const CheckoutpageRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/my-cart?step=shipping");
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "sans-serif",
      color: "#64748b",
      background: "#f8fafc"
    }}>
      Redirecting to secure checkout…
    </div>
  );
};

export default CheckoutpageRedirect;
