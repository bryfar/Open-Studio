import type { NextConfig } from "next";

const isDesktopExport = process.env.OPENSTUDIO_DESKTOP_EXPORT === '1';

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    root: process.cwd(),
  },
  ...(isDesktopExport
    ? {
        output: 'export',
      }
    : {}),
};

export default nextConfig;
