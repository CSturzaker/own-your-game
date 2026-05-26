import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"~": resolve(__dirname, "./src"),
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./tests/setup.ts"],
		include: ["tests/unit/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			include: ["src/**/*.{ts,tsx}"],
			// Astro components, prototype reference, type-only files, and
			// pure entry points have no testable surface — excluding them
			// keeps the 80% threshold meaningful.
			exclude: [
				"src/**/*.astro",
				"src/**/*.test.{ts,tsx}",
				"src/**/*.d.ts",
				"src/env.d.ts",
				"src/islands/_demo/**",
			],
			thresholds: {
				statements: 80,
				branches: 80,
				functions: 80,
				lines: 80,
			},
		},
	},
});
