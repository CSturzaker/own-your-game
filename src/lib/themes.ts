/**
 * Theme vocabulary — re-exported from the Zod-free `schemas/themes` so
 * client code (squad filters, reached on every page via the player-card
 * overlay) can import the theme list without dragging Zod into the
 * browser bundle (DEV-76). Import `THEMES` from here, not `~/lib/voice`,
 * in any module that ends up in a client island's graph.
 */
export { THEMES } from "../../schemas/themes";
export type { Theme } from "../../schemas/themes";
