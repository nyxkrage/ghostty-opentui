import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // Only run .bench.ts files for benchmarks
    include: ["**/*.bench.ts"],
    // Exclude node_modules from transformation
    exclude: ["**/node_modules/**"],
  },
  // Handle .scm files from @opentui/core
  assetsInclude: ["**/*.scm"],
})
