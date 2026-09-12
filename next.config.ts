import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // A package-lock.json in the parent C:\Users\AGUNG made Next.js guess the
  // workspace root one level up, so Turbopack traced and watched the whole
  // home directory instead of just this project. Pin it explicitly.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
