import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.js"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov"],
      reportsDirectory: "./coverage",
      all: true,
      include: ["src/**"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/*.d.ts",
        "**/__tests__/**",
        "**/*.{test,spec}.*",
        "vitest.setup.js",
      ],
    },
    include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)", "**/__tests__/**/*.[jt]s?(x)", "**/__tests__/**/*.[jt]s"],
  },
});
