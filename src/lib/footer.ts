/**
 * Footer data and helpers.
 *
 * Static inventory pulled out of the Astro shell so Vitest can pin
 * the contracts (link counts, hrefs, language list, description copy).
 * Astro files are excluded from coverage — anything testable lives
 * here.
 */

// The language-switcher options moved to the translation dictionary in
// DEV-70 (`languages.{code}`) and are resolved per-locale in
// `Footer.astro` (DEV-72), keyed by the real routing locales from
// `src/i18n/config.ts` — not the BCP-47 region tags this list once held.

export interface FooterLink {
	/**
	 * Dictionary subkey under the column, e.g. `"readLetter"` resolves to
	 * `footer.columns.<column>.readLetter`. Resolved per-locale in
	 * `Footer.astro` via `t()`.
	 */
	readonly labelKey?: string;
	/**
	 * Literal label for links whose text never translates (the "Fix My
	 * Food" partner campaign — a brand name). Mutually exclusive with
	 * `labelKey`.
	 */
	readonly label?: string;
	readonly href: string;
	/** External link — open in a new tab, add the rel attrs. */
	readonly external?: boolean;
	/**
	 * Stubbed link — `href` is `#` until the page it should point at
	 * lands. Carries the Linear issue ID that will create the target,
	 * surfaced as a `data-todo` attribute on the rendered anchor.
	 */
	readonly todo?: string;
}

export interface FooterColumn {
	/**
	 * Dictionary subkey, e.g. `"letter"` resolves the column heading at
	 * `footer.columns.letter.heading` and scopes its item labels.
	 */
	readonly key: string;
	readonly items: readonly FooterLink[];
}

/**
 * Footer link inventory — structural only (routes + dict keys). Order
 * matches the prototype's left-to-right desktop layout. Labels and
 * headings are resolved per-locale in `Footer.astro`. Internal links use
 * real routes when the page is in scope, `#` with a `todo` marker
 * otherwise.
 */
export const FOOTER_COLUMNS: readonly FooterColumn[] = [
	{
		key: "letter",
		items: [{ labelKey: "readLetter", href: "/letter" }],
	},
	{
		key: "squad",
		items: [
			{ labelKey: "allVoices", href: "/squad" },
			{ labelKey: "byCountry", href: "/squad#by-country" },
		],
	},
	{
		key: "project",
		items: [
			{ labelKey: "about", href: "/about" },
			{
				label: "Fix My Food",
				href: "https://www.unicef.org/take-action/campaign/fix-my-food",
				external: true,
			},
			{
				label: "Kick Big Soda Out",
				href: "https://www.kickbigsodaout.org",
				external: true,
			},
		],
	},
];

export interface MetaLink {
	/** Dict subkey under `footer.meta`, e.g. `"privacy"`. */
	readonly key: string;
	readonly href: string;
	readonly todo?: string;
}

/**
 * Privacy / Terms / Accessibility footer-row links. Targets stub to
 * `#` until DEV-82 ships the underlying pages.
 */
export const META_LINKS: readonly MetaLink[] = [
	{ key: "privacy", href: "#", todo: "DEV-82" },
	{ key: "terms", href: "#", todo: "DEV-82" },
	{ key: "accessibility", href: "#", todo: "DEV-82" },
];
