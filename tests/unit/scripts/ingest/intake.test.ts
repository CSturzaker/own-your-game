import { describe, expect, it } from "vitest";

import {
	buildIntakeHeaderIndex,
	intakeHeaderToField,
	parseIntakeMatrix,
} from "../../../../scripts/ingest/intake";

// The real intake headers, verbatim — descriptive prose with stray
// trailing whitespace, Theme inserted mid-row.
const REAL_HEADERS = [
	"Country (in alphabetical order)",
	"Youth name ",
	"Age",
	"City/ Town ",
	"Theme",
	"Quote",
	"Video link",
	"Photo link ",
	"Consent form signed (yes/no)",
	"Language ",
];

describe("intakeHeaderToField", () => {
	it("maps the real descriptive headers by keyword", () => {
		expect(intakeHeaderToField("Country (in alphabetical order)")).toBe("country");
		expect(intakeHeaderToField("Youth name ")).toBe("name");
		expect(intakeHeaderToField("City/ Town ")).toBe("city");
		expect(intakeHeaderToField("Consent form signed (yes/no)")).toBe("consent");
		expect(intakeHeaderToField("Language ")).toBe("language");
		expect(intakeHeaderToField("Photo link ")).toBe("photoLink");
		expect(intakeHeaderToField("Video link")).toBe("videoLink");
	});

	it("returns null for unrecognised columns", () => {
		expect(intakeHeaderToField("Notes")).toBeNull();
		expect(intakeHeaderToField("")).toBeNull();
	});
});

describe("buildIntakeHeaderIndex", () => {
	it("indexes all fields and reports nothing missing for the real header row", () => {
		const idx = buildIntakeHeaderIndex(REAL_HEADERS);
		expect(idx.missing).toEqual([]);
		expect(idx.duplicates).toEqual([]);
		expect(idx.columns.get("theme")).toBe(4);
		expect(idx.columns.get("consent")).toBe(8);
	});

	it("tolerates the Theme column being absent (handled gracefully, not required)", () => {
		const idx = buildIntakeHeaderIndex(REAL_HEADERS.filter((h) => h !== "Theme"));
		expect(idx.missing).toEqual([]); // theme is optional
		expect(idx.columns.has("theme")).toBe(false);
	});

	it("flags a genuinely missing required column", () => {
		const idx = buildIntakeHeaderIndex(REAL_HEADERS.filter((h) => h !== "Video link"));
		expect(idx.missing).toContain("videoLink");
	});
});

describe("parseIntakeMatrix", () => {
	it("maps rows by index, drops blank rows, and 1-based-numbers from the sheet", () => {
		const matrix = [
			REAL_HEADERS,
			[
				"Egypt",
				"Ahmed",
				"17",
				"Cairo",
				"Belonging",
				'"Football is home."',
				"https://drive.google.com/file/d/abc/view",
				"",
				"Yes",
				"Arabic",
			],
			["", "", "", "", "", "", "", "", "", ""], // blank row — dropped
			[
				"Viet Nam",
				"Phạm Thị Minh Thu",
				"19",
				"Hanoi",
				"Family",
				'"x"',
				"https://drive.google.com/drive/folders/fff",
				"",
				"yes",
				"Vietnamese",
			],
		];
		const { rows } = parseIntakeMatrix(matrix);
		expect(rows).toHaveLength(2);
		expect(rows[0]?.rowNumber).toBe(2);
		expect(rows[0]?.country).toBe("Egypt");
		expect(rows[0]?.theme).toBe("Belonging");
		// blank row was row 3; the VN row is sheet row 4
		expect(rows[1]?.rowNumber).toBe(4);
		expect(rows[1]?.name).toBe("Phạm Thị Minh Thu");
	});
});
