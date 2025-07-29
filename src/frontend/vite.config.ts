import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react-swc"
import mkcert from "mkcert"
import { defineConfig } from "vite"

const APP_URL = process.env.APP_URL
const API_URL = APP_URL
const VITE_PORT = process.env.VITE_PORT

// https://vite.dev/config/
async function getConfig() {
  // Create a CA certificate
  const ca = await mkcert.createCA({
    organization: "ByteBond Development CA",
    countryCode: "CA",
    state: "Ontario",
    locality: "Waterloo",
    validity: 365,
  })

  // Create a certificate signed by that CA
  const cert = await mkcert.createCert({
    domains: ["localhost", "127.0.0.1", "40.233.124.226", "bytebond.harshallaheri.me"],
    validity: 365,
    ca: { key: ca.key, cert: ca.cert },
  })

  return defineConfig({
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
      outDir: "../backend/web/static",
      emptyOutDir: true,
    },
    server: {
      port: +`${VITE_PORT}`,
      host: "0.0.0.0",
      cors: true,
      https: {
        key: cert.key,
        cert: cert.cert,
        minVersion: "TLSv1.2",
      },
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
