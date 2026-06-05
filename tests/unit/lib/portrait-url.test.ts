import { describe, expect, it } from "vitest";

import { portraitUrl } from "~/lib/portrait-url";

const HASH = "acc-hash";

describe("portraitUrl", () => {
	it("builds a face-cropped tile transform URL", () => {
		expect(portraitUrl("img-1", "tile", HASH)).toBe(
			"https://imagedelivery.net/acc-hash/img-1/w=160,h=160,fit=cover,gravity=face,format=auto,quality=80",
		);
	});

	it("builds a face-cropped card transform URL", () => {
		expect(portraitUrl("img-1", "card", HASH)).toBe(
			"https://imagedelivery.net/acc-hash/img-1/w=800,h=800,fit=cover,gravity=face,format=auto,quality=80",
		);
	});

	it("builds a full-resolution public transform URL (no resize)", () => {
		expect(portraitUrl("img-1", "public", HASH)).toBe(
			"https://imagedelivery.net/acc-hash/img-1/format=auto,quality=85",
		);
	});

	it("normalises a trailing slash on the account hash", () => {
		expect(portraitUrl("img-1", "tile", "acc-hash/")).toBe(
			"https://imagedelivery.net/acc-hash/img-1/w=160,h=160,fit=cover,gravity=face,format=auto,quality=80",
		);
	});

	it("falls back to a non-absolute string when no account hash is configured", () => {
		expect(portraitUrl("img-1", "tile", undefined)).toBe(
			"img-1/w=160,h=160,fit=cover,gravity=face,format=auto,quality=80",
		);
	});

	it("treats an empty-string account hash as unset", () => {
		expect(portraitUrl("img-1", "card", "")).toBe(
			"img-1/w=800,h=800,fit=cover,gravity=face,format=auto,quality=80",
		);
	});

	it("uses the env var when no explicit account hash is passed", () => {
		// PUBLIC_CF_IMAGES_ACCOUNT_HASH is not set in the Vitest env, so the
		// default-parameter path resolves to undefined and we get the
		// non-absolute fallback. This exercises the defaultAccountHash()
		// branch that explicit-argument tests skip over.
		expect(portraitUrl("img-1", "tile")).toBe(
			"img-1/w=160,h=160,fit=cover,gravity=face,format=auto,quality=80",
		);
	});
});
