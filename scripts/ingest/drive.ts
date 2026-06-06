/**
 * Google Drive link handling for the ingest tool (DEV-104).
 *
 * This module's PURE half — `parseDriveLink` — is the idempotency
 * keystone: the same asset appears in the intake sheet with different URL
 * suffixes (`?usp=drive_link`, `?usp=sharing`, `open?id=…`) and rows get
 * reordered as offices append entries, so the manifest is keyed on the
 * stable Drive file ID extracted here, never on the URL string or row
 * position.
 *
 * The NETWORK half (folder listing by MIME, byte download via the Drive
 * API) is added in a later layer behind an injectable client, so this
 * pure parser stays unit-testable with no credentials.
 */

export type DriveRef =
	/** A concrete file — its id is the canonical manifest key. */
	| { readonly kind: "file"; readonly id: string }
	/** A folder — the child asset (resolved by MIME) supplies the canonical id. */
	| { readonly kind: "folder"; readonly id: string };

/** Drive ids are URL-safe tokens (letters, digits, `-`, `_`). */
const ID = /[A-Za-z0-9_-]+/;

const FILE_PATH = new RegExp(`/file/d/(${ID.source})`);
const FOLDER_PATH = new RegExp(`/folders/(${ID.source})`);
const ID_QUERY = new RegExp(`[?&]id=(${ID.source})`);

/**
 * Extract a canonical Drive reference from an intake link, or `null` if
 * the cell isn't a recognisable Drive URL. Recognises:
 *
 *  - `…/file/d/<id>/view?usp=…`            → file
 *  - `…/open?id=<id>` / `…/uc?id=<id>`     → file
 *  - `…/drive/folders/<id>` / `…/folders/<id>` → folder
 *
 * Folder links must still be resolved to a child file over the API
 * (later layer); the folder id is returned so the caller knows a resolve
 * step is pending.
 */
export function parseDriveLink(raw: string): DriveRef | null {
	const url = raw.trim();
	if (url === "") return null;

	const folder = FOLDER_PATH.exec(url);
	if (folder?.[1]) return { kind: "folder", id: folder[1] };

	const file = FILE_PATH.exec(url);
	if (file?.[1]) return { kind: "file", id: file[1] };

	const idQuery = ID_QUERY.exec(url);
	if (idQuery?.[1]) return { kind: "file", id: idQuery[1] };

	return null;
}
