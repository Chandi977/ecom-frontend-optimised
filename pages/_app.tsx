import "../styles/globals.css";
import "../styles/globals.scss";
import "../public/homepage.css";
import "../public/homepage-mobile.css";
import "../public/homepage-store.css";
import React from "react";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "bootstrap/dist/css/bootstrap.css";
import Navbar from "../components/navbar/Navbar";
import Footer from "../components/footer/Footer";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import "../styles/footer.css";
import { ToastContainer } from "react-toastify";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "react-toastify/dist/ReactToastify.css";
import Script from "next/script";
import "antd/dist/reset.css";
import { ConfigProvider } from "antd";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useRouter } from "next/router";
import { BrandProvider } from "../context/BrandContext";
import { WishlistProvider } from "../context/WishlistContext";
import JsonLd from "../components/common/JsonLd";
import PageTransition from "../components/common/PageTransition";
import { siteSchema } from "../utils/schema";

config.autoAddCss = false;

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isCheckout = router.pathname === "/checkoutpage";
  const showGlobalShell = !isCheckout;
  const showGlobalFooter = showGlobalShell;

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
      {/* Google Tag Manager Script */}
      <Script id="gtm-inline" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-MSJXBZMT');
        `}
      </Script>

      {/* Site-wide Organization + WebSite nodes. Every page's own JSON-LD graph
          references these two by @id, so they are declared here exactly once. */}
      <JsonLd data={siteSchema()} id="site" />

      <BrandProvider>
        <WishlistProvider>
          <div
            className="container-fluid d-flex flex-column justify-content-between p-0"
            style={{ minHeight: "100vh" }}
          >
            <ToastContainer />
            {showGlobalShell && <Navbar />}
            <ConfigProvider>
              {/* Re-keyed on the path so each route plays its entrance. */}
              <PageTransition routeKey={router.asPath}>
                <Component {...pageProps} />
              </PageTransition>
            </ConfigProvider>
            {showGlobalFooter && <Footer />}
          </div>
        </WishlistProvider>
      </BrandProvider>
    </GoogleOAuthProvider>
  );
}
