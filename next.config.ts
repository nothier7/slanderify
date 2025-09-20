import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      // Force Next to use the userland punycode package instead of the deprecated Node builtin.
      punycode: require.resolve("punycode/"),
    };
    return config;
  },
};

export default nextConfig;
