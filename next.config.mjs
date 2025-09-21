/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@libsql/client"],
  },
  webpack: (config, { isServer }) => {
    // Ignore markdown files in node_modules
    config.module.rules.push({
      test: /\.md$/,
      use: "ignore-loader",
    });

    // Handle libSQL client issues
    if (isServer) {
      config.externals.push("@libsql/client");
    }

    return config;
  },
};

export default nextConfig;
