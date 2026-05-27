import { describe, expect, it } from "vitest";

import { portraitUrl } from "~/lib/portrait-url";

describe("portraitUrl", () => {
	it("appends width=160 and webp for tile size", () => {
		expect(portraitUrl("amira.jpg", "tile", "https://cdn.example.com")).toBe(
			"https://cdn.example.com/amira.jpg?width=160&format=webp",
		);
	});

	it("appends width=800 and webp for card size", () => {
		expect(portraitUrl("amira.jpg", "card", "https://cdn.example.com")).toBe(
			"https://cdn.example.com/amira.jpg?width=800&format=webp",
		);
	});

	it("normalises a trailing slash on the base URL", () => {
		expect(portraitUrl("amira.jpg", "tile", "https://cdn.example.com/")).toBe(
			"https://cdn.example.com/amira.jpg?width=160&format=webp",
		);
	});

	it("falls back to the bare filename when no base URL is configured", () => {
		expect(portraitUrl("amira.jpg", "tile", undefined)).toBe("amira.jpg?width=160&format=webp");
	});

	it("treats empty-string base URL as unset", () => {
		expect(portraitUrl("amira.jpg", "card", "")).toBe("amira.jpg?width=800&format=webp");
	});
});
