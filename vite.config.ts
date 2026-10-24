import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: "script",
      manifest: {
        id: "/",
        name: "Капелюх — слова зближують",
        short_name: "Капелюх",
        description: "Затишна гра в слова для компанії: три раунди на одному телефоні.",
        lang: "uk",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#f6f1e6",
        theme_color: "#f6f1e6",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{html,js,css,webp,png,svg,ttf,woff,woff2}"],
        navigateFallback: "index.html",
      },
    }),
  ],
  server: { port: 3000, strictPort: true },
});
