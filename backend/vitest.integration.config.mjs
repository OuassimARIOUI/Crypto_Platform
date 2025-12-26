import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/test/integration/**/*.test.js"],
    globalSetup: ["src/test/integration/_shared/globalSetup.js"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    globals: true,
    sequence: {
      concurrent: false,
    },
  },
});
