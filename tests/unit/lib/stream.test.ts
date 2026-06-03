import { afterEach, describe, expect, it, vi } from "vitest";

import { hasStreamConfig, streamCustomerSubdomain } from "~/lib/stream";

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
