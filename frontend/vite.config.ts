import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy OAuth redirects so the browser stays on the Vite origin
      "/auth": "http://localhost:3001",
    },
  },
});
