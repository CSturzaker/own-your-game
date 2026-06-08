/**
 * Builder for the mobile nav drawer's localised string bundle (DEV-103).
 *
 * `MobileNav` takes its UI strings as a prop (the dictionaries must not
 * ship to the client). Assembled here from a bound `t` so the live header
 * and the component test share one source rather than duplicating keys.
 */

import type { BoundT } from "~/i18n/astro";
import type { MobileNavStrings } from "~/islands/MobileNav";

export function buildMobileNavStrings(t: BoundT["t"]): MobileNavStrings {
	return {
		openMenu: t("header.openMenu"),
		closeMenu: t("header.closeMenu"),
		navAriaLabel: t("header.navAriaLabel"),
		menuLabel: t("header.menuLabel"),
		languageLabel: t("header.languageLabel"),
		share: t("header.share"),
		// Reuse the letter's generic clipboard-feedback strings.
		copied: t("letter.share.copied"),
		copiedStatus: t("letter.share.copiedStatus"),
		copyError: t("letter.share.copyError"),
	};
}
