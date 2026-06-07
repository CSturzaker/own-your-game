import { describe, expect, it } from "vitest";

import type {
	CloudflareClient,
	DriveAsset,
	DriveChild,
	DriveClient,
} from "../../../../scripts/ingest/clients";
import { emptyManifest, type Manifest } from "../../../../scripts/ingest/manifest";
import { runPhaseA, runPhaseB, type IngestContext } from "../../../../scripts/ingest/orchestrate";
import { FatalUploadError } from "../../../../scripts/ingest/retry";
import { assessRow } from "../../../../scripts/ingest/triage";
import type { IntakeRow } from "../../../../scripts/ingest/intake";

function intake(overrides: Partial<IntakeRow> = {}): IntakeRow {
	return {
		rowNumber: 2,
		country: "Egypt",
		name: "Ahmed",
		age: "17",
		city: "Cairo",
		theme: "Belonging",
		quote: '"Football is home."',
		videoLink: "https://drive.google.com/file/d/VID1/view?usp=drive_link",
		photoLink: "https://drive.google.com/file/d/IMG1/view",
		consent: "Yes",
		language: "Arabic",
		...overrides,
	};
}

const bytes = (n: number): Uint8Array => new Uint8Array(n).fill(1);

/** In-memory Drive: counts downloads per file id; serves folder children. */
class FakeDrive implements DriveClient {
	downloads: Record<string, number> = {};
	constructor(
		private readonly folders: Record<string, DriveChild[]> = {},
		private readonly mimes: Record<string, string> = {},
	) {}
	listFolder(folderId: string): Promise<readonly DriveChild[]> {
		return Promise.resolve(this.folders[folderId] ?? []);
	}
	download(fileId: string): Promise<DriveAsset> {
		this.downloads[fileId] = (this.downloads[fileId] ?? 0) + 1;
		return Promise.resolve({
			id: fileId,
			bytes: bytes(10),
			mimeType: this.mimes[fileId] ?? "video/mp4",
			name: `${fileId}.bin`,
		});
	}
	get totalDownloads(): number {
		return Object.values(this.downloads).reduce((a, b) => a + b, 0);
	}
}

/** In-memory Cloudflare: counts uploads, returns deterministic hex uids. */
class FakeCloudflare implements CloudflareClient {
	streamUploads = 0;
	imageUploads = 0;
	uploadStream(): Promise<{ uid: string }> {
		this.streamUploads += 1;
		return Promise.resolve({ uid: `a${String(this.streamUploads).padStart(15, "0")}` });
	}
	uploadImage(opts: { customId: string }): Promise<{ id: string; reused: boolean }> {
		this.imageUploads += 1;
		return Promise.resolve({ id: opts.customId, reused: false });
	}
}

function context(
	drive: DriveClient,
	cf: CloudflareClient,
	persist: (m: Manifest) => void,
): IngestContext {
	return {
		drive,
		cloudflare: cf,
		now: () => "2026-06-01T00:00:00Z",
		publishedAt: "2026-06-05T00:00:00Z",
		persist,
	};
}

describe("runPhaseA — idempotency", () => {
	it("uploads nothing the second time and keeps the manifest identical (run twice)", async () => {
		const rows = [
			assessRow(intake({ videoLink: "https://drive.google.com/file/d/VID1/view" })),
			assessRow(
				intake({
					name: "Mariam",
					videoLink: "https://drive.google.com/file/d/VID2/view",
					photoLink: "",
				}),
			),
		];
		const drive = new FakeDrive();
		const cf = new FakeCloudflare();
		const ctx = context(drive, cf, () => {});

		const first = await runPhaseA(rows, emptyManifest(), ctx);
		const streamAfterFirst = cf.streamUploads;
		const imageAfterFirst = cf.imageUploads;
		expect(streamAfterFirst).toBe(2); // VID1, VID2

		const second = await runPhaseA(rows, first.manifest, ctx);
		expect(cf.streamUploads).toBe(streamAfterFirst); // no new stream uploads
		expect(cf.imageUploads).toBe(imageAfterFirst); // no new image uploads
		expect(second.manifest).toEqual(first.manifest); // byte-identical state
	});

	it("uploads only the row added between runs", async () => {
		const initial = [
			assessRow(intake({ videoLink: "https://drive.google.com/file/d/VID1/view", photoLink: "" })),
		];
		const drive = new FakeDrive();
		const cf = new FakeCloudflare();
		const ctx = context(drive, cf, () => {});
		const first = await runPhaseA(initial, emptyManifest(), ctx);
		const streamAfterFirst = cf.streamUploads;

		const withNew = [
			...initial,
			assessRow(
				intake({
					name: "Mariam",
					videoLink: "https://drive.google.com/file/d/VID9/view",
					photoLink: "",
				}),
			),
		];
		await runPhaseA(withNew, first.manifest, ctx);
		expect(cf.streamUploads).toBe(streamAfterFirst + 1); // exactly one new upload
		expect(drive.downloads["VID1"]).toBe(1); // never re-downloaded
		expect(drive.downloads["VID9"]).toBe(1);
	});

	it("never uploads a consent-held row", async () => {
		const rows = [
			assessRow(intake({ consent: "", videoLink: "https://drive.google.com/file/d/NOPE/view" })),
		];
		const drive = new FakeDrive();
		const cf = new FakeCloudflare();
		await runPhaseA(
			rows,
			emptyManifest(),
			context(drive, cf, () => {}),
		);
		expect(cf.streamUploads).toBe(0);
		expect(drive.totalDownloads).toBe(0);
	});

	it("resolves a folder video by MIME and reports an ambiguous folder", async () => {
		const ok = new FakeDrive(
			{
				FOLD_OK: [
					{ id: "CHILD_VID", name: "v.mp4", mimeType: "video/mp4" },
					{ id: "CHILD_TXT", name: "n.txt", mimeType: "text/plain" },
				],
			},
			{ CHILD_VID: "video/mp4" },
		);
		const cf = new FakeCloudflare();
		const okRow = assessRow(
			intake({ videoLink: "https://drive.google.com/drive/folders/FOLD_OK", photoLink: "" }),
		);
		const okResult = await runPhaseA(
			[okRow],
			emptyManifest(),
			context(ok, cf, () => {}),
		);
		expect(ok.downloads["CHILD_VID"]).toBe(1);
		expect(okResult.outcomes[0]?.resolveError).toBeNull();

		const ambiguous = new FakeDrive({
			FOLD_BAD: [
				{ id: "V1", name: "a.mp4", mimeType: "video/mp4" },
				{ id: "V2", name: "b.mov", mimeType: "video/quicktime" },
			],
		});
		const cf2 = new FakeCloudflare();
		const badRow = assessRow(
			intake({ videoLink: "https://drive.google.com/drive/folders/FOLD_BAD", photoLink: "" }),
		);
		const badResult = await runPhaseA(
			[badRow],
			emptyManifest(),
			context(ambiguous, cf2, () => {}),
		);
		expect(cf2.streamUploads).toBe(0); // never guesses
		expect(badResult.outcomes[0]?.resolveError).toMatch(/ambiguous/);
	});

	it("does not re-upload an asset whose persist succeeded before a mid-run crash", async () => {
		const rows = [
			assessRow(intake({ videoLink: "https://drive.google.com/file/d/VID1/view", photoLink: "" })),
			assessRow(
				intake({
					name: "Mariam",
					videoLink: "https://drive.google.com/file/d/VID2/view",
					photoLink: "",
				}),
			),
		];
		const drive = new FakeDrive();
		const cf = new FakeCloudflare();

		// Capture every successful persist; throw on the 3rd call (after
		// VID1's asset + voice are saved, while saving VID2's asset).
		let lastPersisted: Manifest = emptyManifest();
		let calls = 0;
		const persist = (m: Manifest): void => {
			calls += 1;
			if (calls === 3) throw new Error("simulated crash mid-write");
			lastPersisted = structuredClone(m);
		};

		await expect(runPhaseA(rows, emptyManifest(), context(drive, cf, persist))).rejects.toThrow(
			/crash/,
		);

		// Re-run from the last durably-persisted manifest.
		const drive2 = new FakeDrive();
		const cf2 = new FakeCloudflare();
		// carry forward the prior download tallies for a single assertion
		drive2.downloads = { ...drive.downloads };
		const resumed = await runPhaseA(
			rows,
			lastPersisted,
			context(drive2, cf2, () => {}),
		);

		expect(drive2.downloads["VID1"]).toBe(1); // persisted before crash → reused, not re-downloaded
		expect(cf2.streamUploads).toBe(1); // only VID2 (re)uploaded on resume
		expect(resumed.outcomes.find((o) => o.assessment.row.name === "Ahmed")?.reusedVideo).toBe(true);
	});
});

describe("runPhaseA — portrait preprocessing", () => {
	it("runs the portrait through prepareImage and uploads the converted result", async () => {
		const rows = [assessRow(intake())]; // photoLink → IMG1
		let uploadedName = "";
		const cf: CloudflareClient = {
			uploadStream: () => Promise.resolve({ uid: "a000000000000001" }),
			uploadImage: (opts) => {
				uploadedName = opts.name;
				return Promise.resolve({ id: opts.customId, reused: false });
			},
		};
		const drive = new FakeDrive({}, { IMG1: "image/heic" });
		await runPhaseA(rows, emptyManifest(), {
			drive,
			cloudflare: cf,
			now: () => "2026-06-01T00:00:00Z",
			publishedAt: "2026-06-05T00:00:00Z",
			persist: () => {},
			// Stand-in for the real HEIC→JPEG transcode.
			prepareImage: (asset) =>
				Promise.resolve({ bytes: asset.bytes, name: asset.name.replace(/\.bin$/, ".jpg") }),
		});
		expect(uploadedName).toBe("IMG1.jpg"); // converted name reached Cloudflare
	});
});

describe("runPhaseA — resilience", () => {
	it("continues without a portrait when the image upload fails (e.g. undecodable HEIC)", async () => {
		const rows = [assessRow(intake())]; // intake() has a photoLink
		const cf: CloudflareClient = {
			uploadStream: () => Promise.resolve({ uid: "a000000000000001" }),
			uploadImage: () => Promise.reject(new FatalUploadError("HTTP 422: HEIC decode error")),
		};
		const a = await runPhaseA(
			rows,
			emptyManifest(),
			context(new FakeDrive(), cf, () => {}),
		);
		const o = a.outcomes[0];
		expect(o?.resolveError).toBeNull(); // row NOT skipped
		expect(o?.streamUid).toBeTruthy(); // video still uploaded
		expect(o?.imageId).toBeNull(); // no portrait
		expect(o?.photoNote).toMatch(/image upload failed/);

		// Still publishable — the portrait is optional (silhouette fallback).
		const b = runPhaseB(a.outcomes, a.manifest, []);
		expect(b.published).toEqual([o?.voiceId]);
		expect(b.merge.rows[0]?.portraitImageId).toBe("");
	});

	it("skips only the failing row when a video upload fails — the run continues", async () => {
		const rows = [
			assessRow(
				intake({
					name: "Bad",
					videoLink: "https://drive.google.com/file/d/BADVID/view",
					photoLink: "",
				}),
			),
			assessRow(
				intake({
					name: "Good",
					videoLink: "https://drive.google.com/file/d/GOODVID/view",
					photoLink: "",
				}),
			),
		];
		let calls = 0;
		const cf: CloudflareClient = {
			uploadStream: () => {
				calls += 1;
				if (calls === 1) return Promise.reject(new Error("stream 500"));
				return Promise.resolve({ uid: "a000000000000009" });
			},
			uploadImage: () => Promise.resolve({ id: "x", reused: false }),
		};
		const a = await runPhaseA(
			rows,
			emptyManifest(),
			context(new FakeDrive(), cf, () => {}),
		);
		expect(a.outcomes[0]?.resolveError).toMatch(/video upload failed/); // first row skipped
		expect(a.outcomes[1]?.streamUid).toBeTruthy(); // second row still processed
	});
});

describe("runPhaseA — progress logging", () => {
	it("emits a counted line and per-asset progress when a log sink is provided", async () => {
		const rows = [
			assessRow(intake({ videoLink: "https://drive.google.com/file/d/VID1/view", photoLink: "" })),
		];
		const lines: string[] = [];
		await runPhaseA(rows, emptyManifest(), {
			drive: new FakeDrive(),
			cloudflare: new FakeCloudflare(),
			now: () => "2026-06-01T00:00:00Z",
			publishedAt: "2026-06-05T00:00:00Z",
			persist: () => {},
			log: (m) => lines.push(m),
		});
		const joined = lines.join("\n");
		expect(joined).toMatch(/\[ 1\/1\]/); // counter tag
		expect(joined).toMatch(/video .*→ stream/); // upload-in-progress line
		expect(joined).toMatch(/✓ video uploaded/); // completion line
		expect(joined).toMatch(/no portrait/); // photoLink was blank
	});
});

describe("runPhaseB — build + merge", () => {
	it("publishes a clean row and merges fill-only-blank into existing rows", async () => {
		const rows = [assessRow(intake({ photoLink: "" }))];
		const cf = new FakeCloudflare();
		const drive = new FakeDrive();
		const a = await runPhaseA(
			rows,
			emptyManifest(),
			context(drive, cf, () => {}),
		);

		const result = runPhaseB(a.outcomes, a.manifest, []);
		expect(result.published).toHaveLength(1);
		expect(result.merge.appended).toHaveLength(1);
		const appended = result.merge.rows[0];
		expect(appended?.firstName).toBe("Ahmed");
		expect(appended?.videoId).toMatch(/^a0+1$/); // the fake stream uid
	});

	it("holds a multi-token-name row from the CSV even though its media uploaded", async () => {
		const rows = [assessRow(intake({ name: "Yamal Julián Pino", photoLink: "" }))];
		const cf = new FakeCloudflare();
		const a = await runPhaseA(
			rows,
			emptyManifest(),
			context(new FakeDrive(), cf, () => {}),
		);
		expect(cf.streamUploads).toBe(1); // media uploaded
		const result = runPhaseB(a.outcomes, a.manifest, []);
		expect(result.published).toEqual([]); // but not published
		expect(result.held).toHaveLength(1);
	});

	it("re-runs to a byte-identical CSV (no shifted ids, no duplicate rows)", async () => {
		const rows = [
			assessRow(intake({ photoLink: "" })),
			assessRow(
				intake({
					name: "Mariam",
					videoLink: "https://drive.google.com/file/d/VID2/view",
					photoLink: "",
				}),
			),
		];
		const cf = new FakeCloudflare();
		const a1 = await runPhaseA(
			rows,
			emptyManifest(),
			context(new FakeDrive(), cf, () => {}),
		);
		const b1 = runPhaseB(a1.outcomes, a1.manifest, []);
		const csv1 = b1.merge.rows;

		// Second run feeds the first run's rows back in as the existing sheet.
		const a2 = await runPhaseA(
			rows,
			a1.manifest,
			context(new FakeDrive(), cf, () => {}),
		);
		const b2 = runPhaseB(a2.outcomes, a2.manifest, b1.merge.rows);
		expect(b2.merge.appended).toEqual([]);
		expect(b2.merge.conflicts).toEqual([]);
		expect(b2.merge.rows).toEqual(csv1);
	});
});
