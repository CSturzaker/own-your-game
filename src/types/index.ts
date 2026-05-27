/**
 * Barrel export for runtime types used across `src/`. Pages and
 * components should prefer importing from `~/types` over reaching into
 * `schemas/` or `src/lib/voice.ts`.
 */

export type { Theme, Voice, VoicesFile } from "~/lib/voice";
