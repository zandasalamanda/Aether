import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow a second dev server (e.g. another Claude session) to run against
  // its own build dir; the Next 16 dev lock is per distDir.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
