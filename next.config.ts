import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer usa APIs de Node e não deve ser empacotado pelo bundler.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
