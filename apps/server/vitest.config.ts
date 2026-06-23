import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts", "__tests__/**/*.test.ts"],
    exclude: ["dist/**", "node_modules/**"],
    setupFiles: ["./__tests__/helpers/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/generated/**", "**/*.spec.ts"],
    },
  },
});
