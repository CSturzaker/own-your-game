import { describe, expect, it } from "vitest";

import {
	REQUIRED_FIELDS,
	buildHeaderIndex,
	headerToField,
	normaliseHeader,
} from "../../../scripts/pipeline/headers";

describe("normaliseHeader", () => {
	it("lowercases the cell", () => {
		expect(normaliseHeader("AGE")).toBe("age");
	});

	it("strips whitespace, dashes, and underscores", () => {
		expect(normaliseHeader("First name")).toBe("firstname");
		expect(normaliseHeader("first_name")).toBe("firstname");
		expect(normaliseHeader("First-Name")).toBe("firstname");
		expect(normaliseHeader("  first   name  ")).toBe("firstname");
		expect(normaliseHeader("Country code")).toBe("countrycode");
		expect(normaliseHeader("Published at")).toBe("publishedat");
	});
});

describe("headerToField", () => {
	it("maps every canonical header to its schema field", () => {
		expect(headerToField("ID")).toBe("id");
		expect(headerToField("First name")).toBe("firstName");
		expect(headerToField("Age")).toBe("age");
		expect(headerToField("Country code")).toBe("countryCode");
		expect(headerToField("City")).toBe("city");
		expect(headerToField("Theme")).toBe("theme");
		expect(headerToField("Pull quote")).toBe("pullQuote");
		expect(headerToField("Language")).toBe("language");
		expect(headerToField("Video ID")).toBe("videoId");
		expect(headerToField("Portrait image ID")).toBe("portraitImageId");
		expect(headerToField("Published at")).toBe("publishedAt");
	});

	it("returns null for headers it doesn't recognise", () => {
		expect(headerToField("Notes")).toBeNull();
		expect(headerToField("Moderator")).toBeNull();
		expect(headerToField("")).toBeNull();
	});
});

describe("buildHeaderIndex", () => {
	const fullHeaders = [
		"ID",
		"First name",
		"Age",
		"Country code",
		"City",
		"Theme",
		"Pull quote",
		"Language",
		"Video ID",
		"Portrait image ID",
		"Published at",
	];

	it("indexes every required field by column position", () => {
		const idx = buildHeaderIndex(fullHeaders);
		expect(idx.missing).toEqual([]);
		expect(idx.duplicates).toEqual([]);
		expect(idx.columns.get("id")).toBe(0);
		expect(idx.columns.get("firstName")).toBe(1);
		expect(idx.columns.get("publishedAt")).toBe(10);
	});

	it("tolerates extra columns and reorders them", () => {
		const headers = ["Notes", "Age", "ID", ...fullHeaders.slice(1).filter((h) => h !== "Age")];
		const idx = buildHeaderIndex(headers);
		expect(idx.missing).toEqual([]);
		expect(idx.columns.get("id")).toBe(2);
		expect(idx.columns.get("age")).toBe(1);
	});

	it("reports missing required fields", () => {
		const headers = fullHeaders.slice(0, 8); // drops Video ID, Portrait image ID, Published at
		const idx = buildHeaderIndex(headers);
		expect(idx.missing).toEqual(["videoId", "portraitImageId", "publishedAt"]);
		expect(idx.duplicates).toEqual([]);
	});

	it("reports duplicate headers", () => {
		const headers = [...fullHeaders, "first_name"];
		const idx = buildHeaderIndex(headers);
		expect(idx.duplicates).toEqual(["firstName"]);
		// The first occurrence wins.
		expect(idx.columns.get("firstName")).toBe(1);
	});
});

describe("REQUIRED_FIELDS", () => {
	it("lists every field in the canonical sheet order", () => {
		expect(REQUIRED_FIELDS).toEqual([
			"id",
			"firstName",
			"age",
			"countryCode",
			"city",
			"theme",
			"pullQuote",
			"language",
			"videoId",
			"portraitImageId",
			"publishedAt",
		]);
	});
});
