import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./"),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/e2e/**", "**/.next/**"],
  },
});
