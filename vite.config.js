import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const proxyTarget = process.env.VITE_PROXY_TARGET || "http://localhost:8000";

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    proxy: {
      "/process": proxyTarget,
    },
  },
  build: {
    outDir: "static/dist",
    emptyOutDir: true,
    rollupOptions: {
      input: "src/main.js",
      output: {
        entryFileNames: "app.js",
        chunkFileNames: "chunk-[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "app.css";
          }
          return "assets/[name][extname]";
        },
      },
    },
  },
});
