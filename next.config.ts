import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // No next/image usage. unoptimized disables the runtime optimizer so sharp is never
  // invoked; the Dockerfile then prunes sharp/libvips (~17M) from the standalone output.
  images: { unoptimized: true },
  serverExternalPackages: [
    "better-sqlite3",
    "better-auth",
    "@better-auth/kysely-adapter",
    "kysely",
  ],
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Conservative security headers. CSP is intentionally omitted to avoid breaking
  // Next's inline runtime; X-Frame-Options covers clickjacking for now.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
