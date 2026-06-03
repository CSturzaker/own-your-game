/**
 * Atomic primitive class resolvers.
 *
 * Each function returns the Tailwind class string for a given variant
 * of a primitive. The Astro components in `src/components/` are thin
 * shells over these resolvers — keeping the prop-to-classes map in
 * pure functions means Vitest can pin every variant without trying
 * to render Astro (which it can't).
 *
 * Source of truth: design/handoff/project/hifi-tokens.css lines
 * 376–471 (`.btn`, `.tag`, `.chip`, `.kicker`, `.tagline`). Tokens
 * (`bg-paper`, `text-ink`, `rounded-pill`, …) come from the @theme
 * block in src/styles/global.css.
 *
 * Theme colour class names are written out literally per theme so
 * Tailwind's content scanner can see `bg-fairness`, `bg-belonging`,
 * etc. as static strings rather than computed at runtime.
 */

export type ButtonVariant = "primary" | "ghost" | "amber" | "deep";
export type ButtonSize = "sm" | "md" | "lg";
export type ChipVariant = "default" | "active";
export type TagTheme =
	| "fairness"
	| "belonging"
	| "friendship"
	| "confidence"
	| "family"
	| "community";
export type TagVariant = "filled" | "outline";

const BUTTON_BASE = [
	"group inline-flex items-center justify-center gap-2",
	"rounded-pill border border-transparent",
	"font-body font-semibold",
	"transition-[background-color,color,border-color,transform] duration-150",
	"active:scale-[0.98]",
	"disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

/**
 * Note on amber + deep variants:
 *
 * The prototype paints Amber and Deep buttons with their full brand
 * fills (Pantone 1505 #F36C21 / Process Cyan #00AEEF) and the comment
 * in hifi-tokens.css declares "white is the only legal foreground" on
 * those fills. At 14px regular weight that fails WCAG AA contrast
 * (3.0:1 and 2.5:1 respectively against #FFFFFF, well under 4.5:1
 * for normal text — and no reasonable button text size qualifies as
 * "large bold" to drop the threshold to 3:1). We default to the
 * darker companions instead — Functional Orange and Deep Cyan — both
 * of which pass AA cleanly while staying in their colour family.
 * Hovers move further into ink/rust for a clear darker direction.
 */
const BUTTON_VARIANT: Record<ButtonVariant, string> = {
	primary: "bg-ink text-paper border-ink hover:bg-deep-cyan hover:border-deep-cyan",
	ghost: "bg-transparent text-ink border-ink hover:bg-ink hover:text-paper",
	amber: "bg-fn-orange border-fn-orange text-white hover:bg-confidence hover:border-confidence",
	deep: "bg-deep-cyan border-deep-cyan text-white hover:bg-ink hover:border-ink",
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
	sm: "text-caption min-h-9 px-4 py-[9px]",
	md: "min-h-11 px-[22px] py-3 text-sm",
	lg: "text-small min-h-13 px-7 py-4",
};

export function buttonClasses(
	variant: ButtonVariant = "primary",
	size: ButtonSize = "md",
	extra?: string,
): string {
	return [BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size], extra].filter(Boolean).join(" ");
}

const TAG_BASE = [
	"inline-flex items-center gap-1.5",
	"rounded-pill px-3 py-1",
	"text-xs font-semibold whitespace-nowrap",
].join(" ");

const TAG_THEME_BG: Record<TagTheme, string> = {
	fairness: "bg-fairness",
	belonging: "bg-belonging",
	friendship: "bg-friendship",
	confidence: "bg-confidence",
	family: "bg-family",
	community: "bg-community",
};

export function tagClasses(theme: TagTheme, variant: TagVariant = "filled"): string {
	if (variant === "outline") {
		return `${TAG_BASE} text-ink-2 border-current border bg-transparent`;
	}
	return `${TAG_BASE} ${TAG_THEME_BG[theme]} text-white`;
}

const CHIP_BASE = [
	"inline-flex items-center gap-2",
	"rounded-pill border px-3.5 py-2",
	"text-caption font-body",
	"transition-[background-color,border-color,color] duration-150",
].join(" ");

const CHIP_VARIANT: Record<ChipVariant, string> = {
	default: "bg-paper border-rule text-ink-2 hover:border-ink hover:text-ink",
	active: "bg-amber-50 border-brand-orange text-ink",
};

export function chipClasses(variant: ChipVariant = "default", extra?: string): string {
	return [CHIP_BASE, CHIP_VARIANT[variant], extra].filter(Boolean).join(" ");
}

/**
 * Kicker — top-bordered, uppercase eyebrow label. Lives directly
 * above section titles. Always inline-block + self-start so the
 * top border doesn't span the parent's full width.
 */
export const KICKER_CLASSES = [
	"font-display font-bold text-kicker tracking-kicker uppercase",
	"text-ink-3",
	"border-ink inline-block self-start border-t-2 pt-3",
].join(" ");

/**
 * Colour tokens the Tagline motif supports. `ink` is the default
 * campaign treatment; `deep-cyan` is the About Q&A answer recolour.
 * Kept deliberately narrow (cf. DEV-91 out-of-scope) — add a token
 * here only when a real placement needs it.
 */
export type TaglineColor = "ink" | "deep-cyan";

const TAGLINE_BASE = ["font-display font-medium italic", "text-balance", "tracking-[-0.01em]"].join(
	" ",
);

/**
 * Tagline — the recurring campaign motif. Display face, italic,
 * balanced wrap, with the signature `-0.01em` tracking. Colour is
 * parameterised (default ink); font size is consumer-set (varies per
 * placement: home hero, letter opener, about section 1), as is any
 * per-placement tracking override (the About Q&A tightens to -0.015em
 * via inline style, matching the handoff).
 */
export function taglineClasses(color: TaglineColor = "ink"): string {
	return `${TAGLINE_BASE} text-${color}`;
}

/** The default (ink) motif string — back-compat for non-parameterised use. */
export const TAGLINE_CLASSES = taglineClasses();
