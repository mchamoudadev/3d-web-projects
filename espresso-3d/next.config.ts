import type { NextConfig } from "next";
const config: NextConfig = {
  devIndicators: false,
  distDir: process.env.NINE_BAR_PRODUCTION ? ".next-production" : ".next",
};
export default config;
