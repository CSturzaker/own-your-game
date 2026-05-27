/**
 * Voice schema — canonical shape of every approved video.
 *
 * This is the contract between the campaign team's Google Sheet (DEV-30)
 * and the site's runtime data (`content/voices.json`). It runs in two
 * places:
 *
 *  1. Pipeline-time validation in `scripts/fetch-voices.ts` (DEV-31).
 *     Each sheet row is parsed through `voiceSchema`; rejected rows are
 *     reported to Slack so the campaign team sees the error fast.
 *  2. Type-time across `src/`, via the `Voice` type re-exported through
 *     `src/types/index.ts` and `src/lib/voice.ts`.
 *
 * **Coordinate any change here with `docs/ops/sheet-schema.md`.** A field
 * added or constraint widened in this file must land in the sheet docs
 * (and ideally the sheet's column headers / data validation) in the same
 * PR — otherwise the pipeline starts rejecting previously-valid rows.
 *
 * Safeguarding: `firstName` is the only personal identifier on the
 * schema by design. Do not add `lastName`, `email`, `school`, or any
 * other field that could re-identify a young person. The project brief's
 * safeguarding rules are permanent.
 */

import { z } from "zod";

/**
 * The six campaign themes. Sheet column "Theme" must contain exactly
 * one of these tokens (lowercase). The Tile, Letter signature row, and
 * Squad filters all branch on this value.
 */
export const THEMES = [
	"fairness",
	"belonging",
	"friendship",
	"confidence",
	"family",
	"community",
] as const;

export type Theme = (typeof THEMES)[number];

export const voiceSchema = z.object({
	/**
	 * Stable slug, e.g. `amina-ke-001`. Used as the player-card route
	 * (`/voice/:id`) and as the Portrait seed, so it must be URL-safe
	 * and stable forever.
	 */
	id: z
		.string()
		.min(3, "id must be at least 3 chars")
		.max(64, "id must be at most 64 chars")
		.regex(/^[a-z0-9-]+$/, "id must be lowercase, alphanumeric or hyphen"),

	/** First name only — safeguarding rule, no surnames allowed. */
	firstName: z.string().min(1).max(40),

	/** Age 11–18 inclusive — confirmed in the project brief. */
	age: z.number().int().min(11).max(18),

	/** ISO 3166-1 alpha-2 country code, uppercase. */
	countryCode: z
		.string()
		.length(2)
		.regex(/^[A-Z]{2}$/, "countryCode must be ISO 3166-1 alpha-2, uppercase"),

	/** City name as written by the young person. */
	city: z.string().min(1).max(80),

	/** One of the six themes. */
	theme: z.enum(THEMES),

	/** Short pull-quote shown on the player card. 120 char max. */
	pullQuote: z.string().min(1).max(120),

	/**
	 * BCP 47 language tag, e.g. `en`, `es-MX`, `sw`. Loose pattern by
	 * design — strict BCP 47 is richer than we need; this catches typos
	 * without rejecting legitimate tags.
	 */
	language: z
		.string()
		.min(2)
		.max(10)
		.regex(/^[a-z]{2,3}(-[A-Z]{2})?$/, "language must look like 'xx' or 'xx-XX'"),

	/** Cloudflare Stream video UID (hex string). */
	videoId: z
		.string()
		.min(8)
		.max(64)
		.regex(/^[a-f0-9]+$/i, "videoId must be a hex string (Cloudflare Stream UID)"),

	/** Filename in the R2 portraits bucket, including extension. */
	portraitFile: z
		.string()
		.min(1)
		.max(128)
		.regex(/\.(jpe?g|webp|png)$/i, "portraitFile must end in .jpg/.jpeg/.webp/.png"),

	/**
	 * ISO 8601 datetime when this voice goes live on the site. Drives
	 * the squad-page sort order ("newest first") and is the stable
	 * tiebreaker. The fetch script filters out rows whose `publishedAt`
	 * is in the future, giving the campaign team a cheap "scheduled
	 * publish" escape hatch.
	 */
	publishedAt: z.iso.datetime(),
});

export type Voice = z.infer<typeof voiceSchema>;

/**
 * Full `voices.json` file shape. The pipeline writes this; the loader
 * in `src/lib/content/voices.ts` reads and validates it before serving.
 *
 * `schemaVersion` is a literal `1` today — bump it (and add a migration
 * step) the next time we break the field shape.
 */
export const voicesFileSchema = z.object({
	generatedAt: z.iso.datetime(),
	schemaVersion: z.literal(1),
	voices: z.array(voiceSchema),
});

export type VoicesFile = z.infer<typeof voicesFileSchema>;
