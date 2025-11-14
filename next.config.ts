import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 增加 API 路由的请求体大小限制（默认 4MB）
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
