import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "tests/playwright/**"],
    coverage: {
      enabled: true,
      include: ["src/**"],
      reportsDirectory: "./coverage-vitest",
    },
  },
});
