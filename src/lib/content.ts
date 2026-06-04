/**
 * Build-time content loaders for voices and the letter.
 *
 * These functions read `content/voices.json` and `content/letter/*.md`
 * once per build, cache the parsed result in module state, and expose
 * typed accessors that pages and components can call without
 * re-parsing.
 *
 * **Build-time only.** The implementation uses `node:fs` synchronously
 * — that's fine during Astro's static build, but the same code will
 * not work inside a React island or any other browser context. Don't
 * import from `src/lib/content.ts` in `src/islands/`. If an island
 * needs voices data, the host Astro page should fetch it via these
 * loaders and pass it down as a prop.
 *
 * The cache is module-scoped: in a single build, `getVoicesFile()`
 * returns the same object on every call (referential equality holds).
 * The cache is intentionally not memoised across builds — Astro spins
 * up a fresh module instance per build, so each build reads fresh
 * content from disk.
 *
 * Failure mode: every loader throws if the underlying file is missing
 * or fails schema validation. That aborts the build with a named
 * error — far better than rendering a page with `undefined` voices.
 *
 * Schema sources of truth:
 *   - Voices: `schemas/voice.ts` (`voicesFileSchema`)
 *   - Letter: `schemas/letter.ts` (`letterFrontmatterSchema`, `LETTER_LANGS`)
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import matter from "gray-matter";

import {
	LETTER_LANGS,
	letterFrontmatterSchema,
	type LetterFrontmatter,
	type LetterLang,
} from "../../schemas/letter";
import { voicesFileSchema, type Voice, type VoicesFile } from "~/lib/voice";

// ---------------------------------------------------------------
// Paths — mutable only via the test helper at the bottom of the file.
// ---------------------------------------------------------------

interface ContentPaths {
	voicesFile: string;
	letterDir: string;
	transcriptsDir: string;
}

const defaultPaths: ContentPaths = {
	voicesFile: resolve("content/voices.json"),
	letterDir: resolve("content/letter"),
	transcriptsDir: resolve("content/transcripts"),
};

let paths: ContentPaths = { ...defaultPaths };

// ---------------------------------------------------------------
// Voices
// ---------------------------------------------------------------

let voicesCache: VoicesFile | null = null;

/**
 * Parse and return `content/voices.json`. Cached after the first call.
 * Throws if the file is missing or fails `voicesFileSchema` validation.
 */
export function getVoicesFile(): VoicesFile {
	if (voicesCache) return voicesCache;

	let raw: string;
	try {
		raw = readFileSync(paths.voicesFile, "utf8");
	} catch (err) {
		throw new Error(
			`Could not read voices file at ${paths.voicesFile}: ${(err as Error).message}`,
			{ cause: err },
		);
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (err) {
		throw new Error(
			`voices.json is not valid JSON (${paths.voicesFile}): ${(err as Error).message}`,
			{ cause: err },
		);
	}

	const result = voicesFileSchema.safeParse(parsed);
	if (!result.success) {
		throw new Error(
			`voices.json failed schema validation (${paths.voicesFile}):\n${result.error.message}`,
		);
	}

	voicesCache = result.data;
	return voicesCache;
}

export function getAllVoices(): readonly Voice[] {
	return getVoicesFile().voices;
}

export function getVoiceById(id: string): Voice | undefined {
	return getAllVoices().find((v) => v.id === id);
}

export function getVoiceCount(): number {
	return getAllVoices().length;
}

export function getCountryCount(): number {
	return new Set(getAllVoices().map((v) => v.countryCode)).size;
}

export function getLanguageCount(): number {
	return new Set(getAllVoices().map((v) => v.language)).size;
}

export function getVoicesByTheme(theme: Voice["theme"]): readonly Voice[] {
	return getAllVoices().filter((v) => v.theme === theme);
}

export function getVoicesByCountry(countryCode: string): readonly Voice[] {
	return getAllVoices().filter((v) => v.countryCode === countryCode);
}

/**
 * Voices in a stable, deterministic order distinct from id-sort.
 *
 * Seeded by `generatedAt` (which changes only when the voices array
 * actually changed — see DEV-32). Result: within a single build the
 * shuffle is identical on every call; across builds with the same
 * content the shuffle is also identical; only a real content change
 * produces a new shuffle.
 *
 * Use cases: the home page's "starting eleven" needs a consistent
 * order for SSR (so the first paint matches what JS may later
 * re-randomise per-visit). Social-share image generation also needs
 * a stable order across multiple renders of the same build.
 *
 * Not `Math.random` and not seeded by `Date.now()` — both would break
 * cross-build stability.
 */
export function getShuffledVoices(): readonly Voice[] {
	const file = getVoicesFile();
	return shuffleWithSeed(file.voices, hashString(file.generatedAt));
}

// ---------------------------------------------------------------
// Letter
// ---------------------------------------------------------------

export interface LetterContent {
	readonly frontmatter: LetterFrontmatter;
	readonly body: string;
}

const letterCache = new Map<LetterLang, LetterContent>();

/**
 * Read and validate the letter file for a given language. Cached
 * per-language. Throws if the file is missing or has invalid
 * frontmatter.
 */
export function getLetter(lang: LetterLang): LetterContent {
	const cached = letterCache.get(lang);
	if (cached) return cached;

	const filePath = resolve(paths.letterDir, `${lang}.md`);
	if (!existsSync(filePath)) {
		throw new Error(`Letter file not found for language "${lang}": ${filePath}`);
	}

	const raw = readFileSync(filePath, "utf8");
	const { data, content } = matter(raw);

	const result = letterFrontmatterSchema.safeParse(data);
	if (!result.success) {
		throw new Error(`Letter frontmatter failed validation for "${lang}":\n${result.error.message}`);
	}

	const letter: LetterContent = { frontmatter: result.data, body: content };
	letterCache.set(lang, letter);
	return letter;
}

/**
 * The set of languages that actually have a file on disk. Returns
 * codes from `LETTER_LANGS` whose corresponding `.md` file exists —
 * a missing translation file silently drops that language from the
 * language switcher rather than failing the build.
 */
export function getAvailableLetterLanguages(): readonly LetterLang[] {
	return LETTER_LANGS.filter((lang) => existsSync(resolve(paths.letterDir, `${lang}.md`)));
}

// ---------------------------------------------------------------
// Transcripts (DEV-47)
// ---------------------------------------------------------------

const transcriptCache = new Map<string, string | null>();

/**
 * The transcript for a voice, or `null` when none exists yet.
 *
 * Transcripts are hand-edited markdown kept as separate files
 * (`content/transcripts/{voiceId}.md`) rather than a field on the voice
 * schema — they can be long and most voices won't have one, so bundling
 * them into `voices.json` would bloat every payload (DEV-47 chose the
 * separate-files option). A leading `---` frontmatter block (if any) is
 * stripped; the markdown body is returned trimmed. An empty file counts
 * as "no transcript" → `null`, so the chip shows the "not yet available"
 * state rather than an empty modal.
 */
export function getTranscript(voiceId: string): string | null {
	const cached = transcriptCache.get(voiceId);
	if (cached !== undefined) return cached;

	const filePath = resolve(paths.transcriptsDir, `${voiceId}.md`);
	let value: string | null = null;
	if (existsSync(filePath)) {
		const body = matter(readFileSync(filePath, "utf8")).content.trim();
		value = body.length > 0 ? body : null;
	}
	transcriptCache.set(voiceId, value);
	return value;
}

/**
 * A map of `{ voiceId: transcript }` for the given ids, including only
 * those that actually have a non-empty transcript file. Used by the
 * modal overlay host to ship transcripts to the client for the active
 * voice set — the empty map (today, before any transcripts are written)
 * means zero client bloat, and it grows only with real content.
 */
export function getTranscripts(ids: readonly string[]): Record<string, string> {
	const out: Record<string, string> = {};
	for (const id of ids) {
		const transcript = getTranscript(id);
		if (transcript !== null) out[id] = transcript;
	}
	return out;
}

// ---------------------------------------------------------------
// Deterministic shuffle helpers
// ---------------------------------------------------------------

/**
 * FNV-1a 32-bit hash. Small, fast, well-distributed for short
 * strings like ISO timestamps. Not cryptographic; never use this
 * for anything security-sensitive.
 */
function hashString(input: string): number {
	let hash = 0x811c9dc5;
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}

/**
 * Mulberry32 — a tiny seeded PRNG. Returns a deterministic stream
 * of [0,1) numbers driven by the seed.
 */
function makeMulberry32(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Fisher-Yates shuffle parameterised by a seeded PRNG.
 */
function shuffleWithSeed<T>(items: readonly T[], seed: number): T[] {
	const out = [...items];
	const rand = makeMulberry32(seed);
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[out[i], out[j]] = [out[j]!, out[i]!];
	}
	return out;
}

// ---------------------------------------------------------------
// Test helpers — DO NOT USE in production code.
// ---------------------------------------------------------------

/**
 * Reset the module-level caches. Call between tests that mutate
 * content paths or want to re-read the underlying files.
 *
 * Not exported from any public barrel; tests import directly from
 * `~/lib/content`.
 */
export function __resetContentCacheForTests(): void {
	voicesCache = null;
	letterCache.clear();
	transcriptCache.clear();
}

/**
 * Point the loaders at alternative content roots. Pass `null` (or
 * call `__resetContentPathsForTests`) to restore the defaults.
 */
export function __setContentPathsForTests(next: Partial<ContentPaths>): void {
	paths = { ...paths, ...next };
}

export function __resetContentPathsForTests(): void {
	paths = { ...defaultPaths };
}
