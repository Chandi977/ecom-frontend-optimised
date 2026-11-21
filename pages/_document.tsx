import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Google Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
            rel="stylesheet"
          />

          {/* Fallback styling when JS is disabled */}
          <noscript>
            <style
              dangerouslySetInnerHTML={{
                __html:
                  "[data-reveal]{opacity:1!important;transform:none!important;}",
              }}
            />
          </noscript>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
