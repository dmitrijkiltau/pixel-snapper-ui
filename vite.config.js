import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const proxyTarget = process.env.VITE_PROXY_TARGET || "http://localhost:8000";
const usePolling = process.env.CHOKIDAR_USEPOLLING === "true";
const pollInterval = Number(process.env.CHOKIDAR_INTERVAL || 100);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/process": proxyTarget,
    },
    watch: usePolling
      ? {
          usePolling: true,
          interval: pollInterval,
        }
      : undefined,
  },
});
