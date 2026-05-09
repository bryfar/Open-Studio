import type { NextConfig } from "next";

const isDesktopExport = process.env.OPENSTUDIO_DESKTOP_EXPORT === '1';

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    root: process.cwd(),
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output = config.output ?? {};
      // Dev / redes lentas: chunks grandes (p. ej. dashboard) pueden agotar el timeout por defecto.
      config.output.chunkLoadTimeout = 180000;
    }
    return config;
  },
  ...(isDesktopExport
    ? {
        output: 'export',
      }
    : {}),
};

export default nextConfig;
