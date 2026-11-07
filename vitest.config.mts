import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // "server-only" throws outside React Server Components; tests may import server modules directly.
      "server-only": fileURLToPath(new URL("./tests/unit/empty.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    setupFiles: ["tests/unit/setup.ts"],
    coverage: { include: ["lib/analysis/**"] },
  },
});
