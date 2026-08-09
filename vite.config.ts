import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      "@lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
      "@components": fileURLToPath(
        new URL("./src/lib/components", import.meta.url),
      ),
      "@timeline": fileURLToPath(
        new URL("./src/lib/timeline", import.meta.url),
      ),
      "@db": fileURLToPath(new URL("./src/lib/db", import.meta.url)),
    },
  },
});
