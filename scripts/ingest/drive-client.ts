/**
 * Google Drive adapter (DEV-104) — the real `DriveClient`.
 *
 * Credentialed and network-bound, so it is NOT unit-tested (the
 * orchestrator is proven against in-memory fakes; this is verified live
 * with `--apply`). Uses a service account: the intake Drive folder must
 * be shared to the service-account email.
 *
 * `supportsAllDrives` / `includeItemsFromAllDrives` are set so shared
 * drives resolve, which is how country offices typically share.
 *
 * Env: `GOOGLE_APPLICATION_CREDENTIALS` — path to the service-account
 * JSON (the googleapis client reads it automatically).
 */

import { auth as googleAuth, drive as driveApi } from "@googleapis/drive";

import type { DriveAsset, DriveChild, DriveClient } from "./clients";

const READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

export function createDriveClient(): DriveClient {
	if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		throw new Error(
			"GOOGLE_APPLICATION_CREDENTIALS must point to the service-account JSON for --apply.",
		);
	}
	// The Drive-only package (`@googleapis/drive`), not the `googleapis`
	// meta-package — the latter's all-APIs type surface OOMs tsc/eslint on
	// the 2 GB CI runner.
	const authClient = new googleAuth.GoogleAuth({ scopes: [READONLY_SCOPE] });
	const drive = driveApi({ version: "v3", auth: authClient });

	async function listFolder(folderId: string): Promise<readonly DriveChild[]> {
		const children: DriveChild[] = [];
		let pageToken: string | undefined;
		do {
			const res = await drive.files.list({
				q: `'${folderId}' in parents and trashed = false`,
				fields: "nextPageToken, files(id, name, mimeType)",
				supportsAllDrives: true,
				includeItemsFromAllDrives: true,
				pageSize: 1000,
				pageToken,
			});
			for (const f of res.data.files ?? []) {
				if (f.id && f.name && f.mimeType) {
					children.push({ id: f.id, name: f.name, mimeType: f.mimeType });
				}
			}
			pageToken = res.data.nextPageToken ?? undefined;
		} while (pageToken);
		return children;
	}

	async function download(fileId: string): Promise<DriveAsset> {
		const meta = await drive.files.get({
			fileId,
			fields: "name, mimeType",
			supportsAllDrives: true,
		});
		const media = await drive.files.get(
			{ fileId, alt: "media", supportsAllDrives: true },
			{ responseType: "arraybuffer" },
		);
		return {
			id: fileId,
			bytes: new Uint8Array(media.data as ArrayBuffer),
			mimeType: meta.data.mimeType ?? "application/octet-stream",
			name: meta.data.name ?? fileId,
		};
	}

	return { listFolder, download };
}
