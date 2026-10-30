import fs from "fs";
import path from "path";
import type { NextConfig } from "next";

// Auto-resolve junction/symlink so process.cwd() matches physical filesystem on Windows
try {
  const realCwd = fs.realpathSync(process.cwd());
  if (process.cwd() !== realCwd) {
    process.chdir(realCwd);
  }
} catch {
  // Ignore fallback
}

const nextConfig: NextConfig = {
  outputFileTracingRoot: fs.realpathSync(process.cwd()),
  turbopack: {
    rules: {
      "*.html": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.html$/,
      use: "raw-loader",
    });
    return config;
  },
};

export default nextConfig;
