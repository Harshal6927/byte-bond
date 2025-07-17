import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

const APP_URL = process.env.APP_URL
const API_URL = APP_URL
const VITE_PORT = process.env.VITE_PORT

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "../app/web/static",
    emptyOutDir: true,
  },
  server: {
    port: +`${VITE_PORT}`,
    host: "0.0.0.0",
    cors: true,
    proxy: {
      "/api": {
        target: API_URL,
        changeOrigin: true,
      },
      "/ws": {
        target: API_URL,
        changeOrigin: true,
        ws: true,
      },
    },
    allowedHosts: [".harshallaheri.me"],
  },
})
