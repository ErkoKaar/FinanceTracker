// Vite build configuration: React + Tailwind v4 + PWA plugins and the "@" -> src path alias.
// Demo build (`--mode demo`, or FT_DEMO=1 for the demo's Vercel project): src/lib/supabase.ts is
// swapped for src/lib/demo/supabase.ts, so the app runs on sample data with no backend at all.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const demo = mode === "demo" || process.env.FT_DEMO === "1";

  return {
    define: { __DEMO__: JSON.stringify(demo) },
    plugins: [
      demo && {
        name: "financetracker-demo-data",
        enforce: "pre" as const,
        resolveId(source: string, importer?: string) {
          if (source === "./supabase" && importer && /[\\/]src[\\/]lib[\\/][^\\/]+$/.test(importer)) {
            return path.resolve(__dirname, "src/lib/demo/supabase.ts");
          }
          return null;
        },
      },
      // Regenerates src/routeTree.gen.ts from src/routes/ on dev/build — must come before react().
      tanstackRouter({ target: "react" }),
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
          name: demo ? "FinanceTracker Demo" : "FinanceTracker",
          short_name: demo ? "FT Demo" : "FinanceTracker",
          description: "A minimal dark finance tracker for tracking expenses and income.",
          theme_color: "#070e0b",
          background_color: "#070e0b",
          display: "standalone",
          icons: [
            { src: "/icon-192-v2.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512-v2.png", sizes: "512x512", type: "image/png" },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
