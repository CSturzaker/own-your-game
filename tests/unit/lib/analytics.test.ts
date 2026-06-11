import { afterEach, describe, expect, it, vi } from "vitest";

import { BEACON_SRC, beaconConfig, beaconToken } from "~/lib/analytics";

describe("cloudflare web analytics accessors (DEV-125)", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("reports analytics off when the token is unset (preview / CI / local)", () => {
		vi.stubEnv("PUBLIC_CF_BEACON_TOKEN", "");
		expect(beaconToken()).toBeUndefined();
		// No config → BaseLayout emits no beacon script at all.
		expect(beaconConfig()).toBeUndefined();
	});

	it("returns the token and the data-cf-beacon JSON once set (production)", () => {
		vi.stubEnv("PUBLIC_CF_BEACON_TOKEN", "0123456789abcdef");
		expect(beaconToken()).toBe("0123456789abcdef");
		expect(JSON.parse(beaconConfig() ?? "")).toEqual({ token: "0123456789abcdef" });
	});

	it("configures token only — a static MPA needs no SPA mode", () => {
		vi.stubEnv("PUBLIC_CF_BEACON_TOKEN", "tok");
		expect(Object.keys(JSON.parse(beaconConfig() ?? "") as Record<string, unknown>)).toEqual([
			"token",
		]);
	});

	it("pins the beacon CDN URL the layout emits", () => {
		expect(BEACON_SRC).toBe("https://static.cloudflareinsights.com/beacon.min.js");
	});
});
