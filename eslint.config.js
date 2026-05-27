import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import betterTailwind from "eslint-plugin-better-tailwindcss";

/**
 * ESLint flat config for Own Your Game.
 *
 * Chain (later blocks win):
 *   1. @eslint/js                       — JavaScript recommended (all files)
 *   2. typescript-eslint                — recommended (all files; no type info)
 *   3. typescript-eslint                — recommendedTypeChecked, scoped to
 *                                         .ts/.tsx only. The Astro parser
 *                                         doesn't expose full type info, so
 *                                         type-aware rules can't run on .astro.
 *   4. eslint-plugin-astro              — flat/recommended (for .astro)
 *   5. eslint-plugin-react              — flat.recommended (JSX/TSX)
 *   6. eslint-plugin-react-hooks        — flat.recommended (JSX/TSX)
 *   7. eslint-plugin-jsx-a11y           — flatConfigs.recommended (JSX/TSX)
 *   8. eslint-plugin-better-tailwindcss — Tailwind class linting via the
 *                                         `entryPoint` setting pointing at
 *                                         src/styles/global.css (no
 *                                         tailwind.config.* file exists)
 *   9. Project overrides
 *
 * Class ordering is intentionally NOT enabled here — `prettier-plugin-
 * tailwindcss` already owns ordering and runs as part of `pnpm format`.
 * Enabling both would tug-of-war between `lint:fix` and `format`.
 *
 * Ignore patterns cover everything tooling shouldn't touch — the
 * vendored handoff, build output, generated Astro types, and the
 * test + coverage artefact directories.
 */
export default [
	{
		ignores: [
			"dist/**",
			"node_modules/**",
			"design/**",
			".astro/**",
			"playwright-report/**",
			"test-results/**",
			"playwright/.cache/**",
			"coverage/**",
		],
	},
	js.configs.recommended,
	// Both tseslint presets scoped to .ts/.tsx — without this, their
	// global parser setting overrides the astro parser on .astro files.
	...tseslint.configs.recommended.map((cfg) => ({
		...cfg,
		files: ["**/*.{ts,tsx}"],
	})),
	...tseslint.configs.recommendedTypeChecked.map((cfg) => ({
		...cfg,
		files: ["**/*.{ts,tsx}"],
	})),
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	...astro.configs["flat/recommended"],
	{
		files: ["**/*.{jsx,tsx}"],
		...react.configs.flat.recommended,
		settings: { react: { version: "18" } },
	},
	{
		files: ["**/*.{jsx,tsx}"],
		...reactHooks.configs.flat.recommended,
	},
	jsxA11y.flatConfigs.recommended,
	{
		// Tailwind class linting. `entryPoint` points the plugin at the
		// CSS file where `@theme` lives — this is how Tailwind 4's
		// CSS-first config gets surfaced to ESLint (there's no
		// tailwind.config.* file).
		files: ["**/*.{ts,tsx,jsx,astro}"],
		plugins: { "better-tailwindcss": betterTailwind },
		settings: {
			"better-tailwindcss": {
				entryPoint: "src/styles/global.css",
			},
		},
		rules: {
			"better-tailwindcss/no-unknown-classes": "warn",
			"better-tailwindcss/no-conflicting-classes": "warn",
			// Flags arbitrary values (e.g. bg-[#F5F0E8]) when a defined
			// token already covers them, and suggests the canonical
			// utility (bg-paper). Carries a ~1s startup cost per the
			// plugin docs.
			"better-tailwindcss/enforce-canonical-classes": "warn",
		},
	},
	{
		// React/JSX project-wide overrides.
		rules: {
			"react/react-in-jsx-scope": "off",
			"react/jsx-uses-react": "off",
		},
	},
	{
		// TS/TSX-only overrides — @typescript-eslint plugin is only
		// in scope where the typed presets above defined it.
		files: ["**/*.{ts,tsx}"],
		rules: {
			"@typescript-eslint/consistent-type-imports": "error",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
			],
		},
	},
	{
		// Test fixtures and helpers stay ergonomic.
		files: ["tests/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
		rules: {
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
		},
	},
];
