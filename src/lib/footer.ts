/**
 * Footer data and helpers.
 *
 * Static inventory pulled out of the Astro shell so Vitest can pin
 * the contracts (link counts, hrefs, language list, description copy).
 * Astro files are excluded from coverage — anything testable lives
 * here.
 */

export interface Language {
	readonly code: string;
	readonly label: string;
}

/**
 * Launch-set languages for the campaign. The codes match BCP-47
 * region tags the i18n epic will wire into routing (DEV-69). Until
 * then the switcher is decorative.
 */
export const LANGUAGES: readonly Language[] = [
	{ code: "en-GB", label: "English (United Kingdom)" },
	{ code: "es", label: "Español" },
	{ code: "fr", label: "Français" },
	{ code: "ar", label: "العربية" },
	{ code: "pt", label: "Português" },
];

export interface FooterLink {
	readonly label: string;
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
	readonly heading: string;
	readonly items: readonly FooterLink[];
}

/**
 * Footer link inventory. Order matches the prototype's left-to-right
 * desktop layout. Internal links use real routes when the page is
 * already in scope, `#` with a `todo` marker otherwise.
 */
export const FOOTER_COLUMNS: readonly FooterColumn[] = [
	{
		heading: "The Letter",
		items: [
			{ label: "Read the letter", href: "/letter" },
			{ label: "By theme", href: "/letter#by-theme" },
			{ label: "By language", href: "/letter#by-language" },
			{ label: "Download (PDF)", href: "/letter#download" },
		],
	},
	{
		heading: "The Squad",
		items: [
			{ label: "All voices", href: "/squad" },
			{ label: "By country", href: "/squad#by-country" },
			{ label: "Starting eleven", href: "/squad#starting-eleven" },
			{ label: "By theme", href: "/squad#by-theme" },
		],
	},
	{
		heading: "Project",
		items: [
			{ label: "About", href: "/about" },
			{ label: "Partners", href: "#", todo: "DEV-MVP-PARTNERS" },
			{ label: "For press", href: "#", todo: "DEV-MVP-PRESS" },
			{ label: "For partners", href: "#", todo: "DEV-MVP-PARTNERS" },
			{ label: "Contact", href: "#", todo: "DEV-MVP-CONTACT" },
		],
	},
	{
		heading: "UNICEF",
		items: [
			{ label: "UNICEF.org", href: "https://www.unicef.org", external: true },
			{
				label: "Youth advocacy",
				href: "https://www.unicef.org/what-we-do/adolescent-development",
				external: true,
			},
			{
				label: "Child safeguarding",
				href: "https://www.unicef.org/child-safeguarding",
				external: true,
			},
			{ label: "Donate", href: "https://www.unicef.org/donate", external: true },
		],
	},
];

/**
 * Privacy / Terms / Accessibility footer-row links. Targets stub to
 * `#` until DEV-82 ships the underlying pages.
 */
export const META_LINKS: readonly FooterLink[] = [
	{ label: "Privacy", href: "#", todo: "DEV-82" },
	{ label: "Terms", href: "#", todo: "DEV-82" },
	{ label: "Accessibility", href: "#", todo: "DEV-82" },
];

/**
 * Build the brand-block description sentence. The voice count slots
 * into the copy the agency wrote; the rest is fixed campaign voice.
 */
export function footerDescription(count: number): string {
	const formatted = count.toLocaleString("en-US");
	return `A youth-led letter from ${formatted} young people, written ahead of the 2026 World Cup. About fairness, belonging, friendship — and the games we share.`;
}
