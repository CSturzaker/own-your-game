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
		include: [
			"tests/unit/**/*.test.{ts,tsx}",
			"src/**/*.test.{ts,tsx}",
			"schemas/**/*.test.{ts,tsx}",
		],
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
				// The rotation island and its tile mirror are exercised
				// in e2e (tests/e2e/rotation.spec.ts) — they coordinate
				// timers, matchMedia, and useSyncExternalStore, all of
				// which need a real browser to exercise meaningfully.
				// The shared logic lives in `src/lib/rotation.ts` which
				// is fully unit-tested. Vitest specs for the islands
				// themselves would mock everything that matters and
				// pass without proving the contract.
				"src/islands/RotatingEleven.tsx",
				"src/islands/RotationTile.tsx",
				// LetterRail coordinates scroll position, the History API,
				// and reduced motion — browser behaviour exercised in e2e
				// (tests/e2e/letter-rail.spec.ts). Its pure data (the
				// waypoint list) lives in the unit-tested src/lib/letter.ts.
				"src/islands/LetterRail.tsx",
				// SignedByRow renders Radix Tooltip triggers; its behaviour is
				// covered in e2e (tests/e2e/signed-by.spec.ts) and the
				// selection logic is unit-tested in src/lib/signed-by.ts.
				"src/islands/SignedByRow.tsx",
				// PlayerControls enhances the SSR footer in place (DOM +
				// matchMedia + History API) — browser behaviour exercised in
				// e2e (player-mobile / player-prevnext specs). Its pure logic is
				// the unit-tested `resolveSwipe` (src/lib/swipe.ts) and
				// `resolveActiveSet`/`buildDots` (src/lib/player-context.ts); the
				// DOM swipe binder lives in src/lib/swipe-bind.ts.
				"src/islands/PlayerControls.tsx",
				"src/lib/swipe-bind.ts",
				// The Cloudflare Stream SDK loader injects an external <script>
				// and depends on the real CDN + window.Stream global — exercised
				// in e2e against the real player (player-card spec) and mocked
				// out of the StreamPlayer unit test. The pure URL builders it
				// composes with live in the fully-tested src/lib/stream.ts.
				"src/lib/stream-sdk.ts",
				// Browser-only fetch wrappers for the lazily-loaded voice index
				// + per-voice data (DEV-107). They hit static build artifacts
				// over `fetch` and set a DOM-ready marker — exercised end-to-end
				// by the player suites against the built site. The pure
				// projection they fetch (`toVoiceIndex`) is unit-tested in
				// src/lib/voice-index.ts.
				"src/lib/voice-index-client.ts",
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
