import { afterEach, describe, expect, it, vi } from "vitest";

import { parseFilters, serialiseFilters, updateUrl } from "~/lib/squad-url";

afterEach(() => {
	vi.restoreAllMocks();
});

describe("parseFilters", () => {
	it("reads each valid dimension", () => {
		const params = new URLSearchParams("country=KE&language=sw");
		expect(parseFilters(params)).toEqual({
			country: "KE",
			language: "sw",
		});
	});

	it("returns an empty object for no params", () => {
		expect(parseFilters(new URLSearchParams(""))).toEqual({});
	});

	it("upper-cases a lowercase country code", () => {
		expect(parseFilters(new URLSearchParams("country=ke")).country).toBe("KE");
	});

	it("ignores the dropped theme/age params (DEV-110)", () => {
		// theme + age are no longer filter dimensions — an old link's params
		// are silently ignored, not parsed or warned about.
		expect(parseFilters(new URLSearchParams("theme=friendship&age=16"))).toEqual({});
	});

	it("drops a malformed country but keeps a valid language sibling", () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const result = parseFilters(new URLSearchParams("country=KENYA&language=sw"));
		expect(result.country).toBeUndefined();
		expect(result.language).toBe("sw");
	});

	it("drops a malformed language with a warning", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(parseFilters(new URLSearchParams("language=EN")).language).toBeUndefined();
		expect(warn).toHaveBeenCalledOnce();
	});
});

describe("serialiseFilters", () => {
	it("omits unset dimensions", () => {
		expect(serialiseFilters({ country: "KE" }).toString()).toBe("country=KE");
	});

	it("emits dimensions in a stable order", () => {
		const params = serialiseFilters({ language: "sw", country: "AR" });
		expect(params.toString()).toBe("country=AR&language=sw");
	});

	it("round-trips through parseFilters", () => {
		const filters = { country: "BR", language: "pt" } as const;
		expect(parseFilters(serialiseFilters(filters))).toEqual(filters);
	});

	it("serialises an empty selection to an empty string", () => {
		expect(serialiseFilters({}).toString()).toBe("");
	});
});

describe("updateUrl", () => {
	it("pushes a query string for active filters", () => {
		const push = vi.spyOn(window.history, "pushState").mockImplementation(() => {});
		updateUrl({ country: "KE", language: "sw" });
		expect(push).toHaveBeenCalledWith({}, "", expect.stringContaining("?country=KE&language=sw"));
	});

	it("pushes a clean path (no '?') when no filters are set", () => {
		const push = vi.spyOn(window.history, "pushState").mockImplementation(() => {});
		updateUrl({});
		const url = push.mock.calls[0]?.[2] as string;
		expect(url).not.toContain("?");
	});
});
