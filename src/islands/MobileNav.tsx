import { useState, type JSX } from "react";

import { Drawer } from "~/islands/ui/Drawer";
import type { ActiveNav } from "~/lib/header";

/**
 * Mobile navigation drawer (DEV-103).
 *
 * Below `lg` the header hides the inline nav, so the hamburger is the only
 * cross-page navigation. This island IS the hamburger (the `Drawer.Trigger`)
 * plus the side-sheet it opens, so Radix restores focus to the button on
 * close for free (no manual opener capture — the controlled player modal
 * needed that only because it had no trigger slot).
 *
 * The host (`Header.astro`) resolves every string and href, since islands
 * can't import `t` (it would bundle every dictionary — see the squad
 * islands). Nav items are full-page `<a>` links: tapping one navigates and
 * the drawer is gone with the page. The whole island is `lg:hidden`.
 *
 * A11y comes from the Radix Dialog under `Drawer`: focus trap, Escape, scrim
 * click, body-scroll lock, and `aria-expanded`/`aria-controls` wired onto the
 * trigger automatically. The trigger keeps a stable accessible name and lets
 * `aria-expanded` carry open/closed (the standard disclosure pattern) rather
 * than swapping its label — that avoids a second "Close menu" control and a
 * locale-dependent name. The slide + reduced-motion behaviour live in
 * `global.css` (see the `[data-drawer-panel]` hooks).
 */

export interface MobileNavStrings {
	/** Trigger (hamburger) label — stable; state is via `aria-expanded`. */
	openMenu: string;
	/** The in-panel Close button label. */
	closeMenu: string;
	/** `aria-label` for the in-drawer `<nav>`. */
	navAriaLabel: string;
	/** The drawer's `Dialog.Title` (visually hidden). */
	menuLabel: string;
	/** Heading above the language list. */
	languageLabel: string;
	/** The in-drawer Share button label. */
	share: string;
	/** Transient label after a copy-link fallback succeeds. */
	copied: string;
	/** Screen-reader status announced on a successful copy. */
	copiedStatus: string;
	/** Screen-reader status announced when the clipboard write fails. */
	copyError: string;
}

export interface MobileNavLink {
	id: ActiveNav;
	/** Already locale-aware (`localiseUrl`). */
	href: string;
	label: string;
	active: boolean;
}

export interface MobileNavLanguage {
	/** Locale code, e.g. `"es"` — drives `lang`/`hreflang`. */
	code: string;
	/** The current path re-localised into this locale. */
	href: string;
	/** Native language name, e.g. `"Español"`. */
	label: string;
	current: boolean;
}

export interface MobileNavProps {
	links: readonly MobileNavLink[];
	/** Locale links; omit/empty to hide the language section. */
	languages?: readonly MobileNavLanguage[];
	strings: MobileNavStrings;
	/** Reading direction — sets `dir` on the portaled panel. */
	dir?: "ltr" | "rtl";
	/** Canonical campaign URL shared by the in-drawer Share control. */
	shareUrl: string;
}

export function MobileNav({
	links,
	languages = [],
	strings,
	dir = "ltr",
	shareUrl,
}: MobileNavProps): JSX.Element {
	return (
		<Drawer.Root>
			<Drawer.Trigger asChild>
				<button
					type="button"
					aria-label={strings.openMenu}
					className="border-rule rounded-card flex size-9 flex-col items-center justify-center gap-1 border lg:hidden"
				>
					<span className="bg-ink block h-px w-4" aria-hidden="true" />
					<span className="bg-ink block h-px w-4" aria-hidden="true" />
					<span className="bg-ink block h-px w-4" aria-hidden="true" />
				</button>
			</Drawer.Trigger>

			<Drawer.Portal>
				<Drawer.Overlay />
				<Drawer.Content dir={dir} aria-describedby={undefined} className="gap-1 p-5">
					<div className="mb-2 flex items-center justify-between">
						<Drawer.Title className="font-display text-h3 tracking-display">
							{strings.menuLabel}
						</Drawer.Title>
						<Drawer.Close
							aria-label={strings.closeMenu}
							className="border-rule bg-paper text-ink hover:bg-paper-2 rounded-pill flex size-9 items-center justify-center border text-[18px] leading-none"
						>
							<span aria-hidden="true">×</span>
						</Drawer.Close>
					</div>

					<nav aria-label={strings.navAriaLabel} className="flex flex-col">
						{links.map((link) => (
							<a
								key={link.id}
								href={link.href}
								aria-current={link.active ? "page" : undefined}
								className={[
									"text-body border-s-2 py-2.5 ps-3",
									link.active
										? "text-ink border-brand-orange font-semibold"
										: "text-ink-2 hover:text-ink border-transparent",
								].join(" ")}
							>
								{link.label}
							</a>
						))}
					</nav>

					{languages.length > 0 && (
						<div className="border-rule mt-4 border-t pt-4">
							<p className="font-display text-kicker tracking-14 text-ink-3 mb-2 font-bold uppercase">
								{strings.languageLabel}
							</p>
							<ul className="flex flex-col">
								{languages.map((language) => (
									<li key={language.code}>
										<a
											lang={language.code}
											hrefLang={language.code}
											href={language.href}
											aria-current={language.current ? "true" : undefined}
											className={[
												"text-caption block py-1.5",
												language.current
													? "text-ink font-semibold"
													: "text-ink-2 hover:text-ink font-medium",
											].join(" ")}
										>
											{language.label}
										</a>
									</li>
								))}
							</ul>
						</div>
					)}

					<DrawerShare url={shareUrl} strings={strings} />
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	);
}

/**
 * In-drawer Share action. Mobile is where `navigator.share` is most
 * valuable, so this prefers the native share sheet and falls back to a
 * clipboard copy (with a transient "Copied!" label + an SR status) on
 * browsers without the API. Mirrors the desktop header Share behaviour
 * and the letter's `ShareSection`, but as a self-contained island action
 * rather than an inline `<script>`.
 */
function DrawerShare({ url, strings }: { url: string; strings: MobileNavStrings }): JSX.Element {
	const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

	const onShare = async (): Promise<void> => {
		if (typeof navigator.share === "function") {
			try {
				await navigator.share({ title: document.title, url });
			} catch {
				/* user dismissed the share sheet, or the payload was rejected */
			}
			return;
		}
		try {
			await navigator.clipboard.writeText(url);
			setStatus("copied");
			window.setTimeout(() => setStatus("idle"), 2000);
		} catch {
			setStatus("error");
		}
	};

	return (
		<div className="border-rule mt-4 border-t pt-4">
			<button
				type="button"
				onClick={() => void onShare()}
				className="border-ink bg-ink text-paper text-caption rounded-pill inline-flex min-h-9 items-center gap-1.5 border px-4 py-2 font-semibold"
			>
				{status === "copied" ? strings.copied : strings.share}
				<span aria-hidden="true">↗</span>
			</button>
			<span role="status" aria-live="polite" className="sr-only">
				{status === "copied" ? strings.copiedStatus : status === "error" ? strings.copyError : ""}
			</span>
		</div>
	);
}
