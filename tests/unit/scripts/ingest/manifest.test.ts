import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
	emptyManifest,
	findVoiceIdByDriveVideo,
	getAsset,
	loadManifest,
	nextSequence,
	putAsset,
	putVoice,
	saveManifestAtomic,
	serialiseManifest,
	type AssetEntry,
	type Manifest,
} from "../../../../scripts/ingest/manifest";

const asset: AssetEntry = {
	kind: "video",
	cloudflareId: "stream-uid-1",
	bytes: 1234,
	uploadedAt: "2026-06-01T00:00:00Z",
};

let dir: string;
beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "oyg-manifest-"));
});
afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

describe("loadManifest", () => {
	it("returns an empty manifest when the file is missing (first run)", () => {
		expect(loadManifest(join(dir, "nope.json"))).toEqual(emptyManifest());
	});

	it("throws on a malformed manifest rather than silently discarding it", () => {
		const path = join(dir, "bad.json");
		writeFileSync(path, "{ not valid json");
		expect(() => loadManifest(path)).toThrow();
	});

	it("round-trips a saved manifest", () => {
		const path = join(dir, "m.json");
		const m = putAsset(emptyManifest(), "drive-vid-1", asset);
		saveManifestAtomic(path, m);
		expect(loadManifest(path)).toEqual(m);
	});
});

describe("serialiseManifest", () => {
	it("sorts keys so re-runs are byte-identical regardless of insert order", () => {
		const a: Manifest = putAsset(putAsset(emptyManifest(), "b", asset), "a", asset);
		const b: Manifest = putAsset(putAsset(emptyManifest(), "a", asset), "b", asset);
		expect(serialiseManifest(a)).toBe(serialiseManifest(b));
	});
});

describe("asset + voice accessors", () => {
	it("getAsset/putAsset is immutable and looks up by drive file id", () => {
		const m0 = emptyManifest();
		const m1 = putAsset(m0, "drive-vid-1", asset);
		expect(getAsset(m1, "drive-vid-1")).toEqual(asset);
		expect(getAsset(m0, "drive-vid-1")).toBeUndefined(); // original untouched
	});

	it("findVoiceIdByDriveVideo reverse-looks-up a stable slug for a known video", () => {
		const m = putVoice(emptyManifest(), "mariam-eg-001", {
			driveVideoId: "drive-vid-1",
			streamUid: "uid",
			imageId: "mariam-eg-001",
			publishedAt: "2026-06-01T00:00:00Z",
		});
		expect(findVoiceIdByDriveVideo(m, "drive-vid-1")).toBe("mariam-eg-001");
		expect(findVoiceIdByDriveVideo(m, "unknown")).toBeNull();
	});
});

describe("nextSequence", () => {
	it("is 1 for an empty manifest", () => {
		expect(nextSequence(emptyManifest())).toBe(1);
	});

	it("is one past the highest persisted -NNN suffix (monotonic, never shifts)", () => {
		let m = emptyManifest();
		m = putVoice(m, "amina-ke-002", {
			driveVideoId: "v2",
			streamUid: "u",
			imageId: null,
			publishedAt: "2026-06-01T00:00:00Z",
		});
		m = putVoice(m, "carlos-br-005", {
			driveVideoId: "v5",
			streamUid: "u",
			imageId: null,
			publishedAt: "2026-06-01T00:00:00Z",
		});
		expect(nextSequence(m)).toBe(6);
	});
});

describe("saveManifestAtomic", () => {
	it("writes a sorted, newline-terminated file and leaves no temp behind", () => {
		const path = join(dir, "m.json");
		saveManifestAtomic(path, putAsset(emptyManifest(), "z", asset));
		const text = readFileSync(path, "utf8");
		expect(text.endsWith("\n")).toBe(true);
		expect(JSON.parse(text).assets.z.cloudflareId).toBe("stream-uid-1");
	});
});
