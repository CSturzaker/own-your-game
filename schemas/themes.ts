/**
 * The six campaign themes — the lowercase tokens the sheet's "Theme"
 * column must contain. The Tile, Letter signature row, and Squad filters
 * all branch on this value.
 *
 * Deliberately Zod-free and dependency-free. `schemas/voice.ts` imports
 * `THEMES` here for its `z.enum(...)`, but client code (the squad
 * filters, reached on every page via the player-card overlay's
 * active-set logic) imports `THEMES` from here too — so importing the
 * theme list never drags Zod and the schema-construction side effects
 * into the browser bundle (DEV-76). Keep this module value-only with no
 * imports.
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
