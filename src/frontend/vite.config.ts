import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

const APP_URL = process.env.APP_URL || "http://0.0.0.0:8000"
const API_URL = APP_URL
const VITE_PORT = process.env.VITE_PORT || 8080

// TODO: Make outDir and base point to CDN

// https://vite.dev/config/
async function getConfig() {
  return defineConfig({
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      tailwindcss(),
      react(),
    ],
    base: "/static/",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "../backend/web/static",
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
}

export default getConfig()
