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
};

export default nextConfig;
