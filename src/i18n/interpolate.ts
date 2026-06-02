/**
 * `{var}` placeholder substitution — pure, dependency-free, and safe to
 * import from React islands (it pulls in no dictionary JSON).
 *
 * The translation helper `t()` uses it server-side; islands that compute
 * a count at runtime (the squad load-more button, the rotation
 * countdown) import it directly and interpolate a template string the
 * Astro host passed down as a prop, so the dictionaries never ship to
 * the client.
 *
 * Unmatched placeholders are left intact rather than blanked, so a typo
 * in a key surfaces visibly instead of silently dropping text.
 *
 * @example
 * interpolate("Showing {count} of {total} voices", { count: 24, total: 56 })
 * // "Showing 24 of 56 voices"
 */
export function interpolate(template: string, vars?: Record<string, string | number>): string {
	if (!vars) return template;
	return template.replace(/\{(\w+)\}/g, (match, name: string) => {
		const value = vars[name];
		return value === undefined ? match : String(value);
	});
}
