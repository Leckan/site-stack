import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sitestack/ts-types", "@sitestack/database"],
  reactStrictMode: true,
};

export default nextConfig;

