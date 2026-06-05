/**
 * Voice type — re-exported from the Zod schema at `schemas/voice.ts`.
 *
 * `src/lib/voice.ts` exists so feature code can `import type { Voice }
 * from "~/lib/voice"` without reaching across the `~` boundary into
 * `schemas/`. The schema file is the source of truth; this is just an
 * ergonomic alias.
 *
 * Safeguarding: the schema deliberately has no `lastName`. Don't add
 * one in any future revision.
 */

export type { Voice, VoicesFile } from "../../schemas/voice";
export { voiceSchema, voicesFileSchema } from "../../schemas/voice";
// THEMES/Theme come from the Zod-free module so importing the theme list
// from ~/lib/voice never pulls Zod into a client bundle (DEV-76).
export { THEMES } from "../../schemas/themes";
export type { Theme } from "../../schemas/themes";
