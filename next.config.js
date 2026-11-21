/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Allow production verification alongside a running development server.
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  transpilePackages: [
    "antd",
    "@rc-component/picker",
    "@rc-component/util",
    "@rc-component/pagination",
    "@ant-design/icons-svg",
    "@rc-component/table",
    "@rc-component/tree",
    "@fortawesome/fontawesome-svg-core",
    "@fortawesome/free-solid-svg-icons",
    "@fortawesome/react-fontawesome",
  ],
  experimental: {
    esmExternals: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "prem-industries-ecom-images.s3.ap-south-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "d3dcdu6oc5g6yg.cloudfront.net",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
