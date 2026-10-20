/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Dev and production servers must not overwrite each other's bundles.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
