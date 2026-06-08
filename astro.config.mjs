// @ts-check
import process from "node:process";

import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";

// Bundle analyser (DEV-76) — only wired in when ANALYZE=1 so normal
// builds are untouched. `pnpm analyze` emits dist/stats.html (a treemap
// of the client chunks). vite-bundle-visualizer doesn't understand
// Astro's build, so we use rollup-plugin-visualizer directly.
import { visualizer } from "rollup-plugin-visualizer";

const analyze = process.env.ANALYZE === "1";

// Locale set is owned by src/i18n/config.ts — imported here so the
// build-time routing config and the app-side helpers share one source
// of truth and can never drift.
import { DEFAULT_LOCALE, LOCALES } from "./src/i18n/config.ts";

// The canonical production origin. Drives absolute `og:image` / canonical
// URLs (see src/lib/seo.ts) and the sitemap. Hard-coded here for the same
// reason as `CAMPAIGN_SHARE_URL` (~/lib/header) — the domain is fixed
// (DEV-4) even though the DNS cutover (DEV-80) hasn't flipped yet.
const SITE = "https://ownyourgame.org";

// https://astro.build/config
export default defineConfig({
	site: SITE,

	integrations: [
		react(),
		// Search-engine sitemap (DEV-81). `i18n` emits `hreflang` alternates
		// for every locale so crawlers understand the multi-language tree;
		// the locale map mirrors src/i18n/config.ts (each code maps to its
		// own URL segment). The filter drops routes that must not be indexed:
		// the /demo/* surfaces (also blocked in robots.txt), the noindex
		// error pages, and the non-HTML data endpoints (the lazy-load index +
		// per-voice JSON from DEV-107).
		sitemap({
			i18n: {
				defaultLocale: DEFAULT_LOCALE,
				locales: Object.fromEntries(LOCALES.map((locale) => [locale, locale])),
			},
			filter: (page) =>
				!page.includes("/demo/") &&
				!/\/(404|500)\/?$/.test(page) &&
				!page.includes("/voice-data/") &&
				!page.endsWith(".json"),
		}),
	],

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
		plugins: [
			tailwindcss(),
			...(analyze
				? [
						visualizer({
							filename: "dist/stats.html",
							gzipSize: true,
							brotliSize: true,
							template: "treemap",
						}),
					]
				: []),
		],
	},
});
