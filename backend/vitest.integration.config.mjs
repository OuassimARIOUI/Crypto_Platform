import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/test/integration/**/*.test.js"],
    globalSetup: ["src/test/integration/_shared/globalSetup.js"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov"],
      reportsDirectory: "./coverage-integration",
      all: false,
      include: ["src/**"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/*.d.ts",
        "src/test/**",
        "prisma/**",
      ],
    },
    sequence: {
      concurrent: false,
    },
  },
});
