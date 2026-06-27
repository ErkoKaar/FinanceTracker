// Vite build configuration: React + Tailwind v4 + PWA plugins and the "@" -> src path alias.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // injectManifest (not the default generateSW) so src/sw.ts can add a custom `push` handler
      // for the weekly/month-end reminder notifications — generateSW has no hook for that.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: "FinanceTracker",
        short_name: "FinanceTracker",
        description: "A minimal dark finance tracker for tracking expenses and income.",
        theme_color: "#0d0e10",
        background_color: "#0d0e10",
        display: "standalone",
        icons: [
          { src: "/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png?v=2", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
