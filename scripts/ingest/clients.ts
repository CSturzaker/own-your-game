/**
 * External-client contracts for the ingest tool (DEV-104).
 *
 * Phase A talks to Google Drive (resolve + download) and Cloudflare
 * (Stream + Images). Those calls live behind these narrow interfaces so
 * the orchestrator is unit-testable with in-memory fakes — the
 * idempotency acceptance criteria (run-twice no-op, crash → no re-upload)
 * are proven against fakes, never live infrastructure.
 *
 * The MIME-selection helpers are pure and exported for their own tests:
 * a folder link must resolve to exactly one asset of the right kind, and
 * an ambiguous folder is reported, never guessed.
 */

/** A child listed inside a Drive folder. */
export interface DriveChild {
	readonly id: string;
	readonly name: string;
	readonly mimeType: string;
}

/** Downloaded bytes plus the metadata needed to upload them onward. */
export interface DriveAsset {
	readonly id: string;
	readonly bytes: Uint8Array;
	readonly mimeType: string;
	readonly name: string;
}

export interface DriveClient {
	/** List a folder's immediate children (id, name, MIME). */
	listFolder(folderId: string): Promise<readonly DriveChild[]>;
	/** Download a file's bytes by id. */
	download(fileId: string): Promise<DriveAsset>;
}

export interface StreamUploadResult {
	readonly uid: string;
}

export interface ImageUploadResult {
	readonly id: string;
	/** True when the id already existed — a deterministic-id re-upload. */
	readonly reused: boolean;
}

export interface CloudflareClient {
	/**
	 * Upload bytes to Stream (resumable/tus for phone video >200 MB),
	 * tagging `meta.driveFileId` so a lost manifest can be rebuilt by
	 * listing Stream. Returns the Stream UID.
	 */
	uploadStream(opts: {
		readonly bytes: Uint8Array;
		readonly name: string;
		readonly driveFileId: string;
	}): Promise<StreamUploadResult>;
	/**
	 * Upload bytes to Images under a deterministic custom id (the voice
	 * slug). A duplicate-id error is surfaced as `reused: true` — the
	 * self-healing backup that survives a lost manifest.
	 */
	uploadImage(opts: {
		readonly bytes: Uint8Array;
		readonly name: string;
		readonly customId: string;
	}): Promise<ImageUploadResult>;
}

export type Selection<T> =
	| { readonly ok: true; readonly value: T }
	| { readonly ok: false; readonly reason: string };

function selectByMimePrefix(
	children: readonly DriveChild[],
	prefix: string,
	kind: string,
): Selection<DriveChild> {
	const matches = children.filter((c) => c.mimeType.startsWith(prefix));
	if (matches.length === 0) return { ok: false, reason: `folder has no ${kind} file` };
	if (matches.length > 1) {
		return {
			ok: false,
			reason: `folder has ${matches.length} ${kind} files — ambiguous, resolve manually`,
		};
	}
	return { ok: true, value: matches[0] as DriveChild };
}

/** Pick the single `video/*` child of a folder, or report 0 / >1. */
export function selectVideoChild(children: readonly DriveChild[]): Selection<DriveChild> {
	return selectByMimePrefix(children, "video/", "video");
}

/** Pick the single `image/*` child of a folder, or report 0 / >1. */
export function selectImageChild(children: readonly DriveChild[]): Selection<DriveChild> {
	return selectByMimePrefix(children, "image/", "image");
}
