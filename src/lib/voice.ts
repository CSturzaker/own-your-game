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

export type { Theme, Voice, VoicesFile } from "../../schemas/voice";
export { THEMES, voiceSchema, voicesFileSchema } from "../../schemas/voice";
