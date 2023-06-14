import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

dotenv.config({
  path: "../../.env",
  override: true,
});

const envConfig = dotenv.config({
  path: ".env.local",
  override: true,
});

dotenvExpand.expand(envConfig);

import { UserConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import react from "@vitejs/plugin-react";
import ssr from "vite-plugin-ssr/plugin";

export const config: UserConfig = {
  plugins: [
    react(),
    ssr(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script",
      includeAssets: [
        "*.js",
        "*.css",
        "*.svg",
        "*.png",
        "apple-touch-icon.png",
        "favicon.ico",
      ],
      workbox: {
        // globPatterns: ["**/*.{js,css,ico,png,svg}"],
      },
    }),
  ],
  resolve: {
    alias: [
      {
        find: "@assets",
        replacement: path.resolve(__dirname, "src/assets"),
      },
      {
        find: "@components",
        replacement: path.resolve(__dirname, "src/components"),
      },
      {
        find: "@hooks",
        replacement: path.resolve(__dirname, "src/hooks"),
      },
      {
        find: "@pages",
        replacement: path.resolve(__dirname, "src/pages"),
      },
      {
        find: "@renderer",
        replacement: path.resolve(__dirname, "src/renderer"),
      },
      {
        find: "@stores",
        replacement: path.resolve(__dirname, "src/stores"),
      },
      {
        find: "@data",
        replacement: path.resolve(__dirname, "src/data"),
      },
    ],
  },
};

export default config;
