/**
 * Upload manifest (DEV-104) — the single source of identity continuity
 * that makes re-runs safe.
 *
 * Two maps, both keyed on stable ids (never URLs or row positions):
 *  - `assets`  : canonical Drive file id → the Cloudflare id it uploaded
 *                to. Looked up before every upload; a hit means "already
 *                uploaded, reuse this id" and protects the Stream Starter
 *                Bundle quota.
 *  - `voices`  : voiceId → the ids + publishedAt assigned to it once and
 *                reused forever, so an inserted earlier intake row can
 *                never shift an existing slug.
 *
 * Persisted atomically (temp → fsync → rename) after EACH successful
 * upload, so a crash mid-run (a 300 MB video timing out) never causes a
 * re-upload on the next run. The file is committed (only Drive/Cloudflare
 * ids — no PII, no secrets) and is diffable per run.
 */

import { closeSync, fsyncSync, openSync, readFileSync, renameSync, writeSync } from "node:fs";

import { z } from "zod";

const assetEntrySchema = z.object({
	kind: z.enum(["video", "image"]),
	cloudflareId: z.string().min(1),
	bytes: z.number().int().nonnegative(),
	uploadedAt: z.iso.datetime(),
});

const voiceEntrySchema = z.object({
	driveVideoId: z.string().min(1),
	streamUid: z.string().min(1),
	imageId: z.string().nullable(),
	publishedAt: z.iso.datetime(),
});

export const manifestSchema = z.object({
	assets: z.record(z.string(), assetEntrySchema),
	voices: z.record(z.string(), voiceEntrySchema),
});

export type AssetEntry = z.infer<typeof assetEntrySchema>;
export type VoiceEntry = z.infer<typeof voiceEntrySchema>;
export type Manifest = z.infer<typeof manifestSchema>;

export const MANIFEST_PATH = "scripts/ingest/upload-manifest.json";

/** A fresh, empty manifest (first run, or a reset). */
export function emptyManifest(): Manifest {
	return { assets: {}, voices: {} };
}

/**
 * Load and validate the manifest at `path`. A missing file is the
 * first-run case and yields an empty manifest. A malformed file throws —
 * silently discarding it would risk re-uploading every asset, the exact
 * failure the manifest exists to prevent.
 */
export function loadManifest(path: string): Manifest {
	let raw: string;
	try {
		raw = readFileSync(path, "utf8");
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === "ENOENT") return emptyManifest();
		throw err;
	}
	return manifestSchema.parse(JSON.parse(raw));
}

/**
 * Serialise a manifest deterministically: keys sorted so re-runs produce
 * byte-identical files (a clean no-op diff) regardless of insertion
 * order.
 */
export function serialiseManifest(manifest: Manifest): string {
	const sortKeys = <T>(rec: Record<string, T>): Record<string, T> =>
		Object.fromEntries(
			Object.keys(rec)
				.sort()
				.map((k) => [k, rec[k] as T]),
		);
	const ordered = { assets: sortKeys(manifest.assets), voices: sortKeys(manifest.voices) };
	// Tab indent + trailing newline matches Prettier (useTabs) so the
	// tool's output equals the committed, format-checked file byte-for-byte.
	return `${JSON.stringify(ordered, null, "\t")}\n`;
}

/**
 * Write the manifest atomically: write a temp sibling, fsync it, then
 * rename over the target (rename is atomic within a filesystem). A crash
 * leaves either the old file or the new file intact — never a truncated
 * one. Called immediately after every successful upload.
 */
export function saveManifestAtomic(path: string, manifest: Manifest): void {
	const tmp = `${path}.tmp-${process.pid}`;
	const fd = openSync(tmp, "w");
	try {
		writeSync(fd, serialiseManifest(manifest));
		fsyncSync(fd);
	} finally {
		closeSync(fd);
	}
	renameSync(tmp, path);
}

/** Look up an already-uploaded asset by its canonical Drive file id. */
export function getAsset(manifest: Manifest, driveFileId: string): AssetEntry | undefined {
	return manifest.assets[driveFileId];
}

/** Return a new manifest with `entry` recorded under `driveFileId`. */
export function putAsset(manifest: Manifest, driveFileId: string, entry: AssetEntry): Manifest {
	return { ...manifest, assets: { ...manifest.assets, [driveFileId]: entry } };
}

/** Look up the persisted record for a known voiceId. */
export function getVoice(manifest: Manifest, voiceId: string): VoiceEntry | undefined {
	return manifest.voices[voiceId];
}

/** Return a new manifest with `entry` recorded under `voiceId`. */
export function putVoice(manifest: Manifest, voiceId: string, entry: VoiceEntry): Manifest {
	return { ...manifest, voices: { ...manifest.voices, [voiceId]: entry } };
}

/**
 * Find the voiceId previously assigned to a given Drive video id, if any.
 * This is the reverse lookup that keeps a known video's slug stable
 * across runs even as intake rows are reordered.
 */
export function findVoiceIdByDriveVideo(manifest: Manifest, driveVideoId: string): string | null {
	for (const [voiceId, entry] of Object.entries(manifest.voices)) {
		if (entry.driveVideoId === driveVideoId) return voiceId;
	}
	return null;
}

/**
 * The next global sequence number for a brand-new voice id: one past the
 * highest `-NNN` suffix already in the manifest. Monotonic and derived
 * from persisted ids (not a live row counter), so it only ever grows —
 * existing slugs never shift when earlier intake rows are inserted.
 */
export function nextSequence(manifest: Manifest): number {
	let max = 0;
	for (const voiceId of Object.keys(manifest.voices)) {
		const m = /-(\d+)$/.exec(voiceId);
		if (m?.[1]) max = Math.max(max, Number(m[1]));
	}
	return max + 1;
}
