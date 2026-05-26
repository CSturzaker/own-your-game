import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

/**
 * ESLint flat config for Own Your Game.
 *
 * Chain (later blocks win):
 *   1. @eslint/js                  — JavaScript recommended (all files)
 *   2. typescript-eslint           — recommended (all files; no type info)
 *   3. typescript-eslint           — recommendedTypeChecked, scoped to
 *                                    .ts/.tsx only. The Astro parser
 *                                    doesn't expose full type info, so
 *                                    type-aware rules can't run on .astro.
 *   4. eslint-plugin-astro         — flat/recommended (for .astro)
 *   5. eslint-plugin-react         — flat.recommended (JSX/TSX)
 *   6. eslint-plugin-react-hooks   — flat.recommended (JSX/TSX)
 *   7. eslint-plugin-jsx-a11y      — flatConfigs.recommended (JSX/TSX)
 *   8. Project overrides
 *
 * Notably absent: `eslint-plugin-tailwindcss`. v3.18.x predates
 * Tailwind 4 and requires a JS/TS `tailwind.config.*` file to
 * function — our config is CSS-first via `@theme` in
 * src/styles/global.css, so the plugin errors out. prettier-plugin-
 * tailwindcss still handles class ordering. Swap in a Tailwind-4-
 * compatible alternative (e.g. eslint-plugin-better-tailwindcss)
 * once one is settled.
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
