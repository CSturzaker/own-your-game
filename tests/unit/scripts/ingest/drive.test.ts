import { describe, expect, it } from "vitest";

import { parseDriveLink } from "../../../../scripts/ingest/drive";

describe("parseDriveLink", () => {
	it("extracts the file id from a /file/d/ link regardless of URL suffix", () => {
		const id = "1WjBdXJ3-9dFwNfDd8MK1DbArCwe8-uh9";
		expect(parseDriveLink(`https://drive.google.com/file/d/${id}/view?usp=drive_link`)).toEqual({
			kind: "file",
			id,
		});
		expect(parseDriveLink(`https://drive.google.com/file/d/${id}/view?usp=sharing`)).toEqual({
			kind: "file",
			id,
		});
	});

	it("treats the same asset as the same id across drive_link / sharing / open?id variants", () => {
		const id = "1abcDEF_ghi-456";
		const a = parseDriveLink(`https://drive.google.com/file/d/${id}/view?usp=drive_link`);
		const b = parseDriveLink(`https://drive.google.com/open?id=${id}`);
		const c = parseDriveLink(`https://drive.google.com/uc?id=${id}&export=download`);
		expect(a).toEqual({ kind: "file", id });
		expect(b).toEqual({ kind: "file", id });
		expect(c).toEqual({ kind: "file", id });
	});

	it("recognises folder links and returns the folder id pending resolution", () => {
		const id = "1RVEf3Wn14M0i40GHp35M5q1wau5PwUMo";
		expect(parseDriveLink(`https://drive.google.com/drive/folders/${id}`)).toEqual({
			kind: "folder",
			id,
		});
	});

	it("returns null for blank or unrecognised links", () => {
		expect(parseDriveLink("")).toBeNull();
		expect(parseDriveLink("   ")).toBeNull();
		expect(parseDriveLink("https://example.com/not-drive")).toBeNull();
	});
});
