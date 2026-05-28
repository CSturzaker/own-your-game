import { afterEach, describe, expect, it, vi } from "vitest";

import { parseFilters, serialiseFilters, updateUrl } from "~/lib/squad-url";

afterEach(() => {
	vi.restoreAllMocks();
});

describe("parseFilters", () => {
	it("reads each valid dimension", () => {
		const params = new URLSearchParams("theme=friendship&country=KE&language=sw&age=14");
		expect(parseFilters(params)).toEqual({
			theme: "friendship",
			country: "KE",
			language: "sw",
			age: 14,
		});
	});

	it("returns an empty object for no params", () => {
		expect(parseFilters(new URLSearchParams(""))).toEqual({});
	});

	it("upper-cases a lowercase country code", () => {
		expect(parseFilters(new URLSearchParams("country=ke")).country).toBe("KE");
	});

	it("drops an unknown theme with a warning", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const result = parseFilters(new URLSearchParams("theme=banter"));
		expect(result.theme).toBeUndefined();
		expect(warn).toHaveBeenCalledOnce();
	});

	it("drops an out-of-range age with a warning", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(parseFilters(new URLSearchParams("age=99")).age).toBeUndefined();
		expect(parseFilters(new URLSearchParams("age=abc")).age).toBeUndefined();
		expect(warn).toHaveBeenCalledTimes(2);
	});

	it("drops a malformed country/language but keeps valid siblings", () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const result = parseFilters(new URLSearchParams("country=KENYA&language=EN&theme=family"));
		expect(result.country).toBeUndefined();
		expect(result.language).toBeUndefined();
		expect(result.theme).toBe("family");
	});
});

describe("serialiseFilters", () => {
	it("omits unset dimensions", () => {
		expect(serialiseFilters({ theme: "family" }).toString()).toBe("theme=family");
	});

	it("emits dimensions in a stable order", () => {
		const params = serialiseFilters({ age: 12, theme: "belonging", country: "AR" });
		expect(params.toString()).toBe("theme=belonging&country=AR&age=12");
	});

	it("round-trips through parseFilters", () => {
		const filters = { theme: "confidence", country: "BR", language: "pt", age: 16 } as const;
		expect(parseFilters(serialiseFilters(filters))).toEqual(filters);
	});

	it("serialises an empty selection to an empty string", () => {
		expect(serialiseFilters({}).toString()).toBe("");
	});
});

describe("updateUrl", () => {
	it("pushes a query string for active filters", () => {
		const push = vi.spyOn(window.history, "pushState").mockImplementation(() => {});
		updateUrl({ theme: "fairness", age: 13 });
		expect(push).toHaveBeenCalledWith({}, "", expect.stringContaining("?theme=fairness&age=13"));
	});

	it("pushes a clean path (no '?') when no filters are set", () => {
		const push = vi.spyOn(window.history, "pushState").mockImplementation(() => {});
		updateUrl({});
		const url = push.mock.calls[0]?.[2] as string;
		expect(url).not.toContain("?");
	});
});
