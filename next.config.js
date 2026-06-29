/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
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
    domains: [
      "prem-industries-ecom-images.s3.ap-south-1.amazonaws.com",
      "d3dcdu6oc5g6yg.cloudfront.net",
    ],
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
