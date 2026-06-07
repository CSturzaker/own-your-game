/**
 * Ingest orchestration (DEV-104) — Phase A (media → Cloudflare) and
 * Phase B (build campaign rows), over INJECTED clients so the whole flow
 * is unit-testable with in-memory fakes. No `process`, no `fetch`, no fs
 * here: the CLI supplies real clients and a `persist` callback.
 *
 * The idempotency guarantees live here:
 *  - canonical Drive file id is the manifest key (reorder-proof);
 *  - a known asset is reused, never re-uploaded (quota-safe);
 *  - `persist` is called immediately after EACH upload (crash-safe);
 *  - a known video reuses its persisted voiceId + publishedAt (no slug
 *    shifts, immutable publish date).
 */

import { voiceSchema, type Voice } from "~/lib/voice";

import type { CloudflareClient, DriveClient, Selection } from "./clients";
import { selectImageChild, selectVideoChild } from "./clients";
import type { DriveRef } from "./drive";
import {
	findVoiceIdByDriveVideo,
	getAsset,
	getVoice,
	nextSequence,
	putAsset,
	putVoice,
	type Manifest,
} from "./manifest";
import { mergeRows, voiceToRow, type CampaignRow, type MergeResult } from "./merge";
import { makeVoiceId, slugify } from "./normalise";
import type { RowAssessment } from "./triage";

export interface IngestContext {
	readonly drive: DriveClient;
	readonly cloudflare: CloudflareClient;
	/** ISO timestamp for `uploadedAt`; injected so runs are deterministic in tests. */
	readonly now: () => string;
	/** publishedAt for brand-new voices (written once, then immutable). */
	readonly publishedAt: string;
	/** Persist the manifest atomically — called after every upload. */
	readonly persist: (manifest: Manifest) => void;
	/** Optional progress sink — the CLI wires this to stderr. */
	readonly log?: (message: string) => void;
	/**
	 * Optional portrait pre-processor (HEIC→JPEG). Injected so unit tests
	 * don't load the WASM decoder; defaults to passing bytes through.
	 */
	readonly prepareImage?: (asset: {
		bytes: Uint8Array;
		name: string;
		mimeType: string;
	}) => Promise<{ bytes: Uint8Array; name: string }>;
}

/** Human-readable size, e.g. "12.4 MB". */
function formatBytes(bytes: number): string {
	if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
	if (bytes >= 1000) return `${Math.round(bytes / 1000)} KB`;
	return `${bytes} B`;
}

export interface RowOutcome {
	readonly assessment: RowAssessment;
	readonly voiceId: string | null;
	readonly streamUid: string | null;
	readonly imageId: string | null;
	readonly reusedVideo: boolean;
	readonly reusedImage: boolean;
	/** Set when the video couldn't be resolved/uploaded — the row is skipped. */
	readonly resolveError: string | null;
	/** Non-fatal note about the portrait (missing / ambiguous folder). */
	readonly photoNote: string | null;
}

/** Resolve a DriveRef to a concrete file id, listing folders by MIME. */
async function resolveAsset(
	ref: DriveRef | null,
	drive: DriveClient,
	kind: "video" | "image",
): Promise<Selection<string>> {
	if (!ref) return { ok: false, reason: `no ${kind} link` };
	if (ref.kind === "file") return { ok: true, value: ref.id };
	const children = await drive.listFolder(ref.id);
	const picked = kind === "video" ? selectVideoChild(children) : selectImageChild(children);
	return picked.ok ? { ok: true, value: picked.value.id } : picked;
}

/**
 * Phase A: for every row that cleared the gates (status !== blocked),
 * resolve and upload its media, reusing anything already in the manifest.
 * Returns the updated manifest and a per-row outcome.
 */
export async function runPhaseA(
	assessments: readonly RowAssessment[],
	manifestIn: Manifest,
	ctx: IngestContext,
): Promise<{ readonly manifest: Manifest; readonly outcomes: readonly RowOutcome[] }> {
	let manifest = manifestIn;
	let seq = nextSequence(manifest);
	const outcomes: RowOutcome[] = [];

	const log = ctx.log ?? ((): void => {});
	const total = assessments.filter((a) => a.status !== "blocked").length;
	let index = 0;

	for (const assessment of assessments) {
		if (assessment.status === "blocked") continue; // gate: never upload

		index += 1;
		const tag = `[${String(index).padStart(2)}/${total}]`;
		const who = `row ${assessment.row.rowNumber} · ${assessment.row.name.trim() || "(no name)"}`;

		const skip = (resolveError: string): void => {
			log(`${tag} SKIP  ${who} — ${resolveError}`);
			outcomes.push({
				assessment,
				voiceId: null,
				streamUid: null,
				imageId: null,
				reusedVideo: false,
				reusedImage: false,
				resolveError,
				photoNote: null,
			});
		};

		const video = await resolveAsset(assessment.video, ctx.drive, "video");
		if (!video.ok) {
			skip(video.reason);
			continue;
		}
		const videoFileId = video.value;

		// A voice id requires a mappable country + a name token; rows that
		// lack one (e.g. unmapped country) can't be tracked deterministically.
		if (!assessment.country.ok || assessment.name.firstName === "") {
			skip("cannot assign a voice id (unmapped country or blank name)");
			continue;
		}

		// Reuse the persisted voiceId for a known video; else allocate the
		// next global sequence. Either keeps existing slugs stable.
		let voiceId = findVoiceIdByDriveVideo(manifest, videoFileId);
		if (!voiceId) {
			voiceId = makeVoiceId(slugify(assessment.name.firstName), assessment.country.value, seq);
			seq += 1;
		}
		log(`${tag} ${voiceId}  (${who})`);

		// Portrait is optional and non-fatal.
		let photoFileId: string | null = null;
		let photoNote: string | null = null;
		if (assessment.photo) {
			const photo = await resolveAsset(assessment.photo, ctx.drive, "image");
			if (photo.ok) photoFileId = photo.value;
			else photoNote = photo.reason;
		}

		// Video upload — skip if the canonical id is already in the manifest.
		let streamUid: string;
		let reusedVideo = false;
		const knownVideo = getAsset(manifest, videoFileId);
		if (knownVideo) {
			streamUid = knownVideo.cloudflareId;
			reusedVideo = true;
			log(`   = video reused (${streamUid})`);
		} else {
			try {
				const dl = await ctx.drive.download(videoFileId);
				log(`   ↑ video ${formatBytes(dl.bytes.length)} → stream …`);
				const up = await ctx.cloudflare.uploadStream({
					bytes: dl.bytes,
					name: dl.name,
					driveFileId: videoFileId,
				});
				streamUid = up.uid;
				manifest = putAsset(manifest, videoFileId, {
					kind: "video",
					cloudflareId: streamUid,
					bytes: dl.bytes.length,
					uploadedAt: ctx.now(),
				});
			} catch (err) {
				// A bad video can't publish, but it mustn't halt the run —
				// report the row and move on (re-run resumes once it's fixed).
				const reason = `video upload failed: ${(err as Error).message}`;
				log(`   ⚠ ${reason} — skipping row`);
				skip(reason);
				continue;
			}
			// Persist OUTSIDE the catch: a failed write is genuinely fatal
			// (state can't be recorded) and must propagate, not be swallowed.
			ctx.persist(manifest); // atomic, immediately after the upload
			log(`   ✓ video uploaded (${streamUid})`);
		}

		// Portrait upload — deterministic custom id (the voice slug).
		let imageId: string | null = getVoice(manifest, voiceId)?.imageId ?? null;
		let reusedImage = false;
		if (photoFileId) {
			const knownImage = getAsset(manifest, photoFileId);
			if (knownImage) {
				imageId = knownImage.cloudflareId;
				reusedImage = true;
				log(`   = image reused (${imageId})`);
			} else {
				let uploaded = false;
				try {
					const dl = await ctx.drive.download(photoFileId);
					// HEIC→JPEG transcode (Cloudflare Images rejects some HEIC).
					const prepared = ctx.prepareImage
						? await ctx.prepareImage(dl)
						: { bytes: dl.bytes, name: dl.name };
					const converted = prepared.name !== dl.name ? " (converted from HEIC)" : "";
					log(`   ↑ image ${formatBytes(prepared.bytes.length)} → images${converted} …`);
					const up = await ctx.cloudflare.uploadImage({
						bytes: prepared.bytes,
						name: prepared.name,
						customId: voiceId,
					});
					imageId = up.id;
					reusedImage = up.reused;
					manifest = putAsset(manifest, photoFileId, {
						kind: "image",
						cloudflareId: imageId,
						bytes: prepared.bytes.length,
						uploadedAt: ctx.now(),
					});
					uploaded = true;
				} catch (err) {
					// The portrait is optional (silhouette fallback) — an
					// undecodable HEIC or a bad upload must not sink the row.
					// Continue with no portrait and report it for re-supply.
					imageId = null;
					photoNote = `image upload failed: ${(err as Error).message}`;
					log(`   ⚠ ${photoNote} — continuing without a portrait`);
				}
				if (uploaded) {
					// Persist OUTSIDE the catch — a failed write is fatal.
					ctx.persist(manifest);
					log(
						reusedImage
							? `   ✓ image already on cloudflare (${imageId})`
							: `   ✓ image uploaded (${imageId})`,
					);
				}
			}
		} else {
			log(`   · no portrait${photoNote ? ` (${photoNote})` : ""}`);
		}

		// Record the voice entry once; publishedAt is written once then reused.
		const existing = getVoice(manifest, voiceId);
		const publishedAt = existing?.publishedAt ?? ctx.publishedAt;
		if (!existing || existing.streamUid !== streamUid || existing.imageId !== imageId) {
			manifest = putVoice(manifest, voiceId, {
				driveVideoId: videoFileId,
				streamUid,
				imageId,
				publishedAt,
			});
			ctx.persist(manifest);
		}

		outcomes.push({
			assessment,
			voiceId,
			streamUid,
			imageId,
			reusedVideo,
			reusedImage,
			resolveError: null,
			photoNote,
		});
	}

	return { manifest, outcomes };
}

export interface PhaseBResult {
	readonly merge: MergeResult;
	/** voiceIds written to the CSV this run. */
	readonly published: readonly string[];
	/** Outcomes whose media uploaded but which are held from the CSV. */
	readonly held: readonly RowOutcome[];
}

/** True when a row, post-upload, can be auto-published (no editorial hold). */
function isPublishable(o: RowOutcome): boolean {
	const a = o.assessment;
	return (
		o.resolveError === null &&
		o.voiceId !== null &&
		o.streamUid !== null &&
		a.schemaValid &&
		!a.flags.nameNeedsReview &&
		!a.flags.languageDefaulted
	);
}

/**
 * Phase B: build a validated Voice for each publishable outcome (real
 * Stream/Images ids + the manifest's immutable publishedAt), then MERGE
 * into the existing campaign rows. Held rows (media uploaded, but name /
 * language / schema needs editorial) are reported, never written.
 */
export function runPhaseB(
	outcomes: readonly RowOutcome[],
	manifest: Manifest,
	existingRows: readonly CampaignRow[],
): PhaseBResult {
	const candidates: CampaignRow[] = [];
	const published: string[] = [];
	const held: RowOutcome[] = [];

	for (const o of outcomes) {
		if (!isPublishable(o)) {
			if (o.voiceId && o.resolveError === null) held.push(o);
			continue;
		}
		const a = o.assessment;
		if (!a.country.ok || !a.language.ok || a.theme === null || a.age === null) {
			held.push(o);
			continue;
		}
		const candidate: Voice = {
			id: o.voiceId as string,
			firstName: a.name.firstName,
			age: a.age,
			countryCode: a.country.value,
			city: a.row.city,
			theme: a.theme,
			pullQuote: a.quote,
			language: a.language.value,
			videoId: o.streamUid as string,
			...(o.imageId ? { portraitImageId: o.imageId } : {}),
			publishedAt: getVoice(manifest, o.voiceId as string)?.publishedAt ?? "",
		};
		const parsed = voiceSchema.safeParse(candidate);
		if (!parsed.success) {
			held.push(o);
			continue;
		}
		candidates.push(voiceToRow(parsed.data));
		published.push(o.voiceId as string);
	}

	return { merge: mergeRows(existingRows, candidates), published, held };
}
