import { afterEach, describe, expect, it, vi } from "vitest";

import {
	hasStreamConfig,
	streamCustomerSubdomain,
	streamIframeUrl,
	streamOrigin,
	streamThumbnailUrl,
} from "~/lib/stream";

describe("stream config accessors", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("reports unconfigured when the subdomain is unset (the current, pre-Cloudflare state)", () => {
		vi.stubEnv("PUBLIC_STREAM_CUSTOMER_SUBDOMAIN", "");
		expect(hasStreamConfig()).toBe(false);
	});

	it("throws a loud, actionable error when the subdomain is read while unset", () => {
		vi.stubEnv("PUBLIC_STREAM_CUSTOMER_SUBDOMAIN", "");
		expect(() => streamCustomerSubdomain()).toThrow(/PUBLIC_STREAM_CUSTOMER_SUBDOMAIN/);
	});

	it("reports configured and returns the value once set", () => {
		vi.stubEnv("PUBLIC_STREAM_CUSTOMER_SUBDOMAIN", "abc123def");
		expect(hasStreamConfig()).toBe(true);
		expect(streamCustomerSubdomain()).toBe("abc123def");
	});
});

describe("stream URL builders", () => {
	const SUB = "abc123def";
	const VID = "a1b2c3d4e5f6a7b8";

	it("builds the account origin from the subdomain", () => {
		expect(streamOrigin(SUB)).toBe("https://customer-abc123def.cloudflarestream.com");
	});

	it("builds the auto-generated thumbnail URL", () => {
		expect(streamThumbnailUrl(SUB, VID)).toBe(
			"https://customer-abc123def.cloudflarestream.com/a1b2c3d4e5f6a7b8/thumbnails/thumbnail.jpg",
		);
	});

	it("builds an iframe URL with the documented defaults", () => {
		const url = new URL(streamIframeUrl(SUB, VID));
		expect(url.origin).toBe("https://customer-abc123def.cloudflarestream.com");
		expect(url.pathname).toBe("/a1b2c3d4e5f6a7b8/iframe");
		expect(url.searchParams.get("autoplay")).toBe("true");
		expect(url.searchParams.get("muted")).toBe("false");
		expect(url.searchParams.get("controls")).toBe("true");
		expect(url.searchParams.get("letterboxColor")).toBe("transparent");
		// No caption track and no poster forced on by default.
		expect(url.searchParams.has("defaultTextTrack")).toBe(false);
		expect(url.searchParams.has("poster")).toBe(false);
	});

	it("encodes the poster URL and sets the caption track when supplied", () => {
		const poster = "https://cdn.example.com/p.webp?width=800&format=webp";
		const raw = streamIframeUrl(SUB, VID, { poster, defaultTextTrack: "es" });
		// The poster's own query string must be percent-encoded inside the param.
		expect(raw).toContain(
			"poster=https%3A%2F%2Fcdn.example.com%2Fp.webp%3Fwidth%3D800%26format%3Dwebp",
		);
		const url = new URL(raw);
		expect(url.searchParams.get("poster")).toBe(poster);
		expect(url.searchParams.get("defaultTextTrack")).toBe("es");
	});

	it("honours explicit autoplay/muted/controls overrides", () => {
		const url = new URL(
			streamIframeUrl(SUB, VID, { autoplay: false, muted: true, controls: false }),
		);
		expect(url.searchParams.get("autoplay")).toBe("false");
		expect(url.searchParams.get("muted")).toBe("true");
		expect(url.searchParams.get("controls")).toBe("false");
	});
});
