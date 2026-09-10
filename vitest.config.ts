import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    // Pin the suite to a non-UTC zone so date handling is reproducible on any
    // machine or CI runner. Asia/Jakarta (UTC+7, no DST) is the zone this app
    // is developed in, and the offset that exposes UTC-vs-local date bugs.
    env: { TZ: "Asia/Jakarta" },
  },
});
