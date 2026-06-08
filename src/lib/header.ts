/**
 * Header data and helpers.
 *
 * The Astro component (`src/components/Header.astro`) renders these
 * values verbatim. Keeping nav data and count formatting here gives
 * Vitest a stable surface — Astro files themselves are excluded from
 * unit-test coverage.
 */

export type ActiveNav = "home" | "letter" | "squad" | "about";

/**
 * Canonical, shareable campaign URL — the target of the header Share
 * control (native `navigator.share`, copy-link fallback). Points at the
 * campaign home, the safest entry point for a sharer's audience.
 *
 * Hard-coded for the same reason as `LETTER_SHARE_URL` in `~/lib/letter`:
 * Astro `site` isn't configured yet (Cloudflare account standing debt).
 * Derive both from `Astro.site` once it lands.
 */
export const CAMPAIGN_SHARE_URL = "https://ownyourgame.org/";

export interface NavItem {
	readonly id: ActiveNav;
	readonly href: string;
}

/**
 * Primary nav order + routes — matches the agency prototype.
 * `Home → The Letter → The Squad → About` left-to-right on desktop.
 * Labels are resolved per-locale in `Header.astro` via
 * `t("header.nav.<id>")`; only the structural id + href live here.
 */
export const NAV_ITEMS: readonly NavItem[] = [
	{ id: "home", href: "/" },
	{ id: "letter", href: "/letter" },
	{ id: "squad", href: "/squad" },
	{ id: "about", href: "/about" },
];

/**
 * Format the voice counter integer with grouping separators.
 *
 * Always uses the `en-US` locale on purpose: the prototype counter
 * shows the number with a comma group, and the campaign launches in
 * English first. When the i18n epic lands, callers can switch to a
 * locale-aware formatter without changing the display contract.
 */
export function formatVoiceCount(count: number): string {
	return count.toLocaleString("en-US");
}
