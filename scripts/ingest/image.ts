/**
 * Portrait pre-processing (DEV-104).
 *
 * Country offices upload straight from iPhones, so many portraits are
 * HEIC — and Cloudflare Images rejects some of them ("error during
 * decoding … features which are not supported", HTTP 422). We transcode
 * HEIC/HEIF to JPEG before upload.
 *
 * `heic-convert` is a pure-WASM decoder (libheif) — no native binaries to
 * build per platform, which matters for a tool run from whatever dev
 * machine has the credentials. `isHeic` is a pure detector; the transcode
 * itself is verified live on `--apply`.
 */

import { Buffer } from "node:buffer";

import convert from "heic-convert";

/** True when the asset is HEIC/HEIF by MIME type or file extension. */
export function isHeic(mimeType: string, name: string): boolean {
	const mime = mimeType.toLowerCase();
	if (mime.includes("heic") || mime.includes("heif")) return true;
	return /\.(heic|heif)$/i.test(name.trim());
}

/** Transcode HEIC/HEIF bytes to JPEG (quality 0.92). */
export async function convertHeicToJpeg(bytes: Uint8Array): Promise<Uint8Array> {
	const output = await convert({
		buffer: Buffer.from(bytes),
		format: "JPEG",
		quality: 0.92,
	});
	return new Uint8Array(output);
}

/**
 * Prepare a downloaded portrait for upload: transcode HEIC/HEIF to JPEG
 * (rewriting the filename extension), pass anything else through
 * unchanged. Wired into the orchestrator's image step via the injectable
 * `prepareImage` hook, so unit tests don't load the WASM decoder.
 */
export async function prepareImageForUpload(asset: {
	readonly bytes: Uint8Array;
	readonly name: string;
	readonly mimeType: string;
}): Promise<{ readonly bytes: Uint8Array; readonly name: string }> {
	if (!isHeic(asset.mimeType, asset.name)) {
		return { bytes: asset.bytes, name: asset.name };
	}
	const jpeg = await convertHeicToJpeg(asset.bytes);
	const name = `${asset.name.replace(/\.(heic|heif)$/i, "")}.jpg`;
	return { bytes: jpeg, name };
}
