/**
 * Language-code helpers — BCP 47 tag → human-readable name.
 *
 * The Voice schema (`schemas/voice.ts`) stores `language` as a BCP 47
 * tag (`"es"`, `"es-MX"`, `"sw"`). The player card shows the original
 * spoken language ("Spanish (orig.)"), so it needs a display string.
 *
 * Names come from `Intl.DisplayNames(["en"])` — English-only for now,
 * matching the documented i18n limitation (country and language display
 * names ship in English at launch; see `docs/ops/i18n.md`). The helper
 * is pure and dependency-free, so it is safe to import from a React
 * island: `Intl.DisplayNames` is available in every browser and Node
 * version the project targets.
 */

let displayNames: Intl.DisplayNames | undefined;

function languageDisplay(): Intl.DisplayNames {
	// Construct lazily and cache — `Intl.DisplayNames` is comparatively
	// expensive to build, and the player card resolves a name per render.
	displayNames ??= new Intl.DisplayNames(["en"], { type: "language" });
	return displayNames;
}

/**
 * Resolve a BCP 47 language tag to its English display name. Falls back
 * to the tag itself if `Intl` can't resolve it (an unknown or malformed
 * tag), so the page never blanks out.
 */
export function languageName(language: string): string {
	try {
		return languageDisplay().of(language) ?? language;
	} catch {
		return language;
	}
}
