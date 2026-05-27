/**
 * Country code → flag gradient lookup.
 *
 * The Tile renders a 14×10 swatch next to the country code. Rather
 * than ship SVG flag art (heavy and licensing-fraught), we encode
 * each flag's primary stripes as a CSS linear gradient. The visual
 * is intentionally indicative — viewers don't read these as official
 * flags, they read them as a colour bound to the country code.
 *
 * Seed mappings are lifted from the prototype's PLAYERS array
 * (design/handoff/project/hifi-shared.jsx). The campaign team adds
 * more as new countries' voices land in voices.json.
 */

const FLAGS: Readonly<Record<string, string>> = {
	NGA: "linear-gradient(90deg,#008751 33%,#fff 33% 66%,#008751 66%)",
	EGY: "linear-gradient(180deg,#ce1126 33%,#fff 33% 66%,#000 66%)",
	ARG: "linear-gradient(180deg,#74acdf 33%,#fff 33% 66%,#74acdf 66%)",
	VNM: "linear-gradient(90deg,#da251d 100%)",
	PAK: "linear-gradient(90deg,#01411c 33%,#fff 33% 100%)",
	BRA: "linear-gradient(180deg,#009c3b 33%,#ffdf00 33% 66%,#009c3b 66%)",
	SEN: "linear-gradient(90deg,#00853f 33%,#fdef42 33% 66%,#e31b23 66%)",
	CHN: "linear-gradient(90deg,#de2910 100%)",
	IND: "linear-gradient(180deg,#ff9933 33%,#fff 33% 66%,#138808 66%)",
	USA: "linear-gradient(180deg,#b22234 50%,#fff 50% 100%)",
	MAR: "linear-gradient(90deg,#c1272d 100%)",
	ITA: "linear-gradient(90deg,#009246 33%,#fff 33% 66%,#ce2b37 66%)",
	GHA: "linear-gradient(180deg,#ce1126 33%,#fcd116 33% 66%,#006b3f 66%)",
	KEN: "linear-gradient(180deg,#000 25%,#ce1126 25% 50%,#fff 50% 75%,#006600 75%)",
};

/**
 * Neutral grey gradient used when a country code has no swatch
 * defined yet. Three-band striping signals "flag here" without
 * pretending to be any specific country.
 */
export const FALLBACK_FLAG = "linear-gradient(90deg,#888 33%,#aaa 33% 66%,#888 66%)";

/**
 * Resolve a country code (ISO 3166-1 alpha-3) to its CSS gradient
 * value. Case-insensitive; missing codes get the neutral fallback.
 */
export function flagGradient(countryCode: string): string {
	return FLAGS[countryCode.toUpperCase()] ?? FALLBACK_FLAG;
}

/**
 * Whether a country code has an explicit gradient mapping — useful
 * for tests and tooling that wants to gate on "real flag vs fallback".
 */
export function hasFlag(countryCode: string): boolean {
	return countryCode.toUpperCase() in FLAGS;
}
