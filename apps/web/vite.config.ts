import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In development the API runs on :4000; the browser talks to it through this proxy.
    proxy: { "/api": "http://localhost:4000" },
  },
});
