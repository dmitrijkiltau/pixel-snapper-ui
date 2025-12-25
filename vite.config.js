import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

const usePolling = process.env.CHOKIDAR_USEPOLLING === "true";
const pollInterval = Number(process.env.CHOKIDAR_INTERVAL || 100);

export default defineConfig({
  plugins: [svgr(), react(), tailwindcss()],
  server: {
    watch: usePolling
      ? {
          usePolling: true,
          interval: pollInterval,
        }
      : undefined,
  },
});
