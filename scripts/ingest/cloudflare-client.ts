/**
 * Cloudflare adapter (DEV-104) — the real `CloudflareClient`.
 *
 * Credentialed and network-bound, so it is NOT unit-tested (the
 * orchestrator is proven against in-memory fakes; this is verified
 * live with `--apply`). Two uploads:
 *
 *  - Stream via the tus resumable protocol — phone video routinely
 *    exceeds the 200 MB basic-upload ceiling, and tus survives a dropped
 *    connection mid-upload. `meta.driveFileId` is tagged on every video
 *    so a lost manifest can be rebuilt by listing Stream.
 *  - Images via a deterministic custom id (the voice slug). A duplicate
 *    id comes back as HTTP 409 / code 5409, which we treat as
 *    `reused: true` — the self-healing backup that survives a lost
 *    manifest.
 *
 * Env: `CF_ACCOUNT_ID`, `CF_API_TOKEN` (Stream + Images scopes).
 */

import { Buffer } from "node:buffer";

import * as tus from "tus-js-client";

import type { CloudflareClient, ImageUploadResult, StreamUploadResult } from "./clients";

const API_BASE = "https://api.cloudflare.com/client/v4";

interface CloudflareConfig {
	readonly accountId: string;
	readonly apiToken: string;
}

/** Read CF credentials from the environment, or throw a clear error. */
export function cloudflareConfigFromEnv(): CloudflareConfig {
	const accountId = process.env.CF_ACCOUNT_ID;
	const apiToken = process.env.CF_API_TOKEN;
	if (!accountId || !apiToken) {
		throw new Error("CF_ACCOUNT_ID and CF_API_TOKEN must be set for --apply.");
	}
	return { accountId, apiToken };
}

export function createCloudflareClient(config: CloudflareConfig): CloudflareClient {
	const streamEndpoint = `${API_BASE}/accounts/${config.accountId}/stream`;
	const imagesEndpoint = `${API_BASE}/accounts/${config.accountId}/images/v1`;

	async function uploadStream(opts: {
		bytes: Uint8Array;
		name: string;
		driveFileId: string;
	}): Promise<StreamUploadResult> {
		const body = Buffer.from(opts.bytes);
		return new Promise<StreamUploadResult>((resolve, reject) => {
			let mediaId: string | null = null;
			const upload = new tus.Upload(body, {
				endpoint: streamEndpoint,
				chunkSize: 50 * 1024 * 1024, // 50 MB chunks (Stream requires a chunk size for tus)
				retryDelays: [0, 1000, 3000, 5000],
				headers: { Authorization: `Bearer ${config.apiToken}` },
				metadata: {
					name: opts.name,
					// Surfaces as `meta.driveFileId` on the Stream video.
					driveFileId: opts.driveFileId,
				},
				onAfterResponse: (_req, res) => {
					const id = res.getHeader("stream-media-id");
					if (id) mediaId = id;
				},
				onError: (err) => reject(err),
				onSuccess: () => {
					if (mediaId) resolve({ uid: mediaId });
					else
						reject(new Error("Stream upload succeeded but no stream-media-id header was returned"));
				},
			});
			upload.start();
		});
	}

	async function uploadImage(opts: {
		bytes: Uint8Array;
		name: string;
		customId: string;
	}): Promise<ImageUploadResult> {
		const form = new FormData();
		form.append("id", opts.customId);
		form.append("file", new Blob([opts.bytes as BlobPart]), opts.name);

		const res = await fetch(imagesEndpoint, {
			method: "POST",
			headers: { Authorization: `Bearer ${config.apiToken}` },
			body: form,
		});

		if (res.ok) {
			const json = (await res.json()) as { result?: { id?: string } };
			return { id: json.result?.id ?? opts.customId, reused: false };
		}

		// A repeat upload of the same deterministic id is "already there",
		// not a failure — the manifest-independent backup path.
		const text = await res.text();
		if (res.status === 409 || text.includes("5409") || /already exists/i.test(text)) {
			return { id: opts.customId, reused: true };
		}
		throw new Error(`Cloudflare Images upload failed (HTTP ${res.status}): ${text}`);
	}

	return { uploadStream, uploadImage };
}
