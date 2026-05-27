import { describe, expect, it } from "vitest";

import { DEFAULT_OG_IMAGE, resolveOgImage } from "~/lib/seo";

describe("resolveOgImage", () => {
	it("falls back to the default path when no input is provided", () => {
		expect(resolveOgImage(undefined)).toBe(DEFAULT_OG_IMAGE);
	});

	it("returns a root-relative path unchanged when site is unknown", () => {
		expect(resolveOgImage("/og/letter.png")).toBe("/og/letter.png");
	});

	it("upgrades a root-relative path to an absolute URL when site is provided", () => {
		const site = new URL("https://ownyour.game/");
		expect(resolveOgImage("/og/letter.png", site)).toBe("https://ownyour.game/og/letter.png");
	});

	it("upgrades the default path against site for crawler compatibility", () => {
		const site = new URL("https://ownyour.game/");
		expect(resolveOgImage(undefined, site)).toBe(`https://ownyour.game${DEFAULT_OG_IMAGE}`);
	});

	it("returns absolute http(s) URLs untouched even when site is provided", () => {
		const site = new URL("https://ownyour.game/");
		expect(resolveOgImage("https://cdn.example.com/og.png", site)).toBe(
			"https://cdn.example.com/og.png",
		);
		expect(resolveOgImage("http://cdn.example.com/og.png", site)).toBe(
			"http://cdn.example.com/og.png",
		);
	});
});
