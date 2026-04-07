// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file from project root — only VITE_* vars are exposed to the client
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",   // Required for Docker bind
      port: 5173,
      strictPort: true,
      proxy: {
        // Proxy /api calls to FastAPI so the browser never hits cross-origin
        "/api": {
          target: env.VITE_API_BASE_URL ?? "http://backend:8000",
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
    },
  };
});
