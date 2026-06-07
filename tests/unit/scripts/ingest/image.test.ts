import { describe, expect, it } from "vitest";

import { isHeic } from "../../../../scripts/ingest/image";

describe("isHeic", () => {
	it("detects HEIC/HEIF by MIME type", () => {
		expect(isHeic("image/heic", "x.jpg")).toBe(true);
		expect(isHeic("image/heif", "x.jpg")).toBe(true);
		expect(isHeic("image/heic-sequence", "x")).toBe(true);
	});

	it("detects HEIC/HEIF by file extension (case-insensitive)", () => {
		expect(isHeic("application/octet-stream", "IMG_1234.HEIC")).toBe(true);
		expect(isHeic("", "photo.heif")).toBe(true);
		expect(isHeic("", "  portrait.heic ")).toBe(true);
	});

	it("passes ordinary web images through", () => {
		expect(isHeic("image/jpeg", "photo.jpg")).toBe(false);
		expect(isHeic("image/png", "photo.png")).toBe(false);
		expect(isHeic("image/webp", "photo.webp")).toBe(false);
	});
});
