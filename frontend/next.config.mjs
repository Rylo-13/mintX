/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode: true,
  // images: {
  //   domains: ["gateway.pinata.cloud", "ipfs.io"],
  // },

  async rewrites() {
    return [
      {
        source: "/api/images/:path*",
        destination:
          "https://oaidalleapiprodscus.blob.core.windows.net/private/org-JHLRB02hN7WPSCejGtrOUOfE/user-hzwl2V9F4BUqCIDGG57t1i8R/:path*",
      },
    ];
  },

  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_PINATA_API_KEY: process.env.NEXT_PUBLIC_PINATA_API_KEY,
    NEXT_PUBLIC_PINATA_API_SECRET: process.env.NEXT_PUBLIC_PINATA_API_SECRET,
    MINT_CONTRACT: process.env.MINT_CONTRACT,
  },
};

export default nextConfig;
