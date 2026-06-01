import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["@resvg/resvg-js", "fluent-ffmpeg", "ffmpeg-static"],
};

export default nextConfig;
