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
    include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)", "**/__tests__/**/*.[jt]s?(x)", "**/__tests__/**/*.[jt]s"],
  },
});
