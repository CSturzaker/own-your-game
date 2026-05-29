/**
 * About page copy + composition helpers.
 *
 * Strings live here so the page shell (`src/pages/about.astro`) stays a
 * thin render, matching the home/letter convention. Marked for i18n —
 * the translation epic (DEV-70) swaps these literals for key lookups;
 * until then the English copy is the source of truth.
 *
 * Copy follows the prototype's "Replacement copy pass · May 2026"
 * (`design/handoff/project/hifi-about.jsx`), chosen over the DEV-64/65/66
 * issue prose where the two diverged in kind — the divergence is noted
 * in each PR. Apostrophes are the typographic form (’) to match the
 * prototype.
 */

// i18n: about page copy — translate in DEV-70 (i18n lookups).
export const ABOUT_COPY = {
	/** Eyebrow above the page title. */
	kicker: "A youth-led campaign · 2026 World Cup",
	/** Page title (display, hero-about size). */
	title: "About Own Your Game.",
	/** Supporting line beneath the title, leading into the question. */
	lede: "Own Your Game is a youth-led global campaign built around one simple question:",
	/** The campaign's central question — the call half of the moment. */
	question: "Whose game is it anyway?",
	/** Bridge line between the question and the answer. */
	questionBridge:
		"The power of the question is not the question itself, but the answer young people give back:",
	/** The answer — the response half of the designed moment. */
	answer: "It’s ours.",

	/**
	 * Programme name italicised where it appears in the body — the page
	 * renders an <em> around this exact substring (it occurs once).
	 */
	programme: "Fix My Food",
	/**
	 * The explainer body — five paragraphs, comfortable measure. No
	 * "Who / What / Why" kickers: the revised prototype dropped them.
	 */
	body: [
		"Own Your Game is part of Fix My Food, a growing global youth movement supported by UNICEF that brings together young people calling for healthier, fairer and more supportive food environments.",
		"For young people around the world, football and sport are about more than just the game itself. It is friendship. Community. Confidence. Belonging. It is the local teams, the families on the sidelines, the feeling of being part of something bigger than yourself. Sport is also where many of us learn about teamwork, effort, respect and fair play — the idea that the game should be fair for everyone.",
		"But more and more, the spaces we love are being overshadowed by junk food and drink marketing. Sometimes it feels like the joy, energy and community that football creates are being used to market products that do not always have our best interests at heart, and that some parts of the food and drink industry are not always playing fair.",
		"Own Your Game brings together young people from across countries and communities to share what football and sport really mean to us, and why we want the game to put people and communities first.",
		"This website brings together our stories, videos and voices ahead of the 2026 FIFA World Cup. Every new voice added becomes part of a growing global team asking what football should stand for, and who the game really belongs to.",
	],
	/**
	 * The closing pair — two confident statements (not pull-quotes),
	 * heavier than body, set off by a top rule. Both lines are ink.
	 */
	closing: [
		"Because football belongs to players, fans, families and communities.",
		"And young people deserve a say in the future of the game they love.",
	],

	/** Heading above the stat cards. */
	statsHeading: "The movement in numbers",
	/**
	 * Stat-card labels + subs, in card order: voices, countries,
	 * languages. The values themselves come live from the loaders
	 * (`getVoiceCount` / `getCountryCount` / `getLanguageCount`), so the
	 * page reflects the campaign's real size as the sheet grows.
	 */
	stats: [
		{ label: "Young voices", sub: "aged 11 to 18, all signatories" },
		{ label: "Countries", sub: "on six continents" },
		{ label: "Languages", sub: "every video captioned" },
	],
} as const;
