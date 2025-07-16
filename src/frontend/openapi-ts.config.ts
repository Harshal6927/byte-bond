import type { Config } from "@hey-api/client-axios"
import { defineConfig } from "@hey-api/openapi-ts"
import type { ClientOptions } from "./src/client/types.gen"

export default defineConfig({
  input: "./openapi.json",
  output: "src/client",
  plugins: [{ name: "@hey-api/client-axios" }],
})

export const createClientConfig = <T extends ClientOptions>(override?: Config<T>): Config<Required<T>> => ({
  baseURL: import.meta.env.API_URL,
  ...override,
})
