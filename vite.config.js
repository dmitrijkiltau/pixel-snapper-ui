import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const usePolling = process.env.CHOKIDAR_USEPOLLING === "true";
const pollInterval = Number(process.env.CHOKIDAR_INTERVAL || 100);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: usePolling
      ? {
          usePolling: true,
          interval: pollInterval,
        }
      : undefined,
  },
});
