// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

// Locale set is owned by src/i18n/config.ts — imported here so the
// build-time routing config and the app-side helpers share one source
// of truth and can never drift.
import { DEFAULT_LOCALE, LOCALES } from "./src/i18n/config.ts";

// https://astro.build/config
export default defineConfig({
	integrations: [react()],

	// Per-language URL prefixes. The default locale (English) is served
	// from the root with no prefix — `/letter`; every other locale is
	// prefixed — `/es/letter`. Each of the four main pages renders real
	// localised content via an explicit `src/pages/[lang]/*.astro` route.
	//
	// We deliberately do NOT use Astro's `i18n.fallback`. In a pure
	// static build (no SSR adapter) the fallback feature generates
	// competing routes that shadow the explicit `[lang]/` pages and emit
	// empty files (verified at build time, DEV-69). The "never 404, fall
	// back to English" intent is met at the content layer instead: the
	// translation dictionary returns English for untranslated keys
	// (DEV-70) and the `content/letter/{lang}.md` files ship English copy
	// until translated. See docs/ops/i18n.md.
	i18n: {
		defaultLocale: DEFAULT_LOCALE,
		locales: [...LOCALES],
		routing: {
			prefixDefaultLocale: false,
		},
	},

	// Inline small stylesheets into <head> (Astro's default), so a page's
	// own component CSS paints without a second request. The shared
	// Tailwind bundle is larger than the inline threshold and stays an
	// external, cacheable stylesheet rather than being re-inlined into
	// every page's HTML — better for the multi-page transfer budget.
	// The bigger first-paint win in DEV-75 is self-hosting fonts (no
	// cross-origin Google Fonts round-trip); see src/styles/global.css.
	build: {
		inlineStylesheets: "auto",
	},

	vite: {
		plugins: [tailwindcss()],
	},
});
