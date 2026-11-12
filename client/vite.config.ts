import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Docker on Windows does not forward file-change events into the container,
    // so poll for changes instead.
    watch: { usePolling: true, interval: 300 },
    proxy: {
      "/api": apiTarget,
      "/uploads": apiTarget,
      "/socket.io": { target: apiTarget, ws: true },
    },
  },
});
