import type { NextConfig } from "next";
import packageJson from "../../package.json";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    NEXT_PUBLIC_DEPLOYMENT_ENVIRONMENT:
      process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
  },
};

export default nextConfig;
