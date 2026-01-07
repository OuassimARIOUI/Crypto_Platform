import { defineConfig } from "vitest/config";

// Default (unit-style) Vitest config for the backend.
// Integration tests live under src/test/integration and must be run via
// `npm run test:integration` so they can load backend/.env.test and use the..
// dockerized Postgres test database.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
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
        "src/test/**",
        "src/test/integration/**",
        "prisma/**",
      ],
    },
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "src/test/integration/**",
    ],
  },
});
