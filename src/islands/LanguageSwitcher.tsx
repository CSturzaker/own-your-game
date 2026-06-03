import { useState } from "react";

import { localiseUrl } from "~/i18n/localise-url";
import { Popover } from "~/islands/ui/Popover";

export interface LanguageOption {
	/** Locale code, e.g. `"es"` — the URL prefix and dictionary key. */
	code: string;
	/** Native language name, e.g. `"Español"` — resolved server-side. */
	label: string;
}

export interface LanguageSwitcherProps {
	/** The active locale code (`en`/`es`/`fr`/`ar`/`pt`). */
	current: string;
	/** Native-name options, resolved from the dictionary by the host. */
	options: readonly LanguageOption[];
	/**
	 * The current page path from `Astro.url.pathname` (SSR). At click time
	 * the island prefers `window.location` (which carries any live query
	 * the SSR path lacks — e.g. the squad filters); this is the fallback.
	 */
	currentPath: string;
	/** Text direction for the popover — `"rtl"` on Arabic. */
	dir?: "ltr" | "rtl";
	/**
	 * Navigation hook. Defaults to `window.location.assign`; injectable so
	 * the unit test can assert the target URL without a real navigation.
	 */
	onNavigate?: (url: string) => void;
}

/** The live path (with query + hash) on the client; the SSR path otherwise. */
function pathAtClick(fallback: string): string {
	if (typeof window === "undefined") return fallback;
	return window.location.pathname + window.location.search + window.location.hash;
}

const defaultNavigate = (url: string): void => {
	window.location.assign(url);
};

/**
 * The footer language switcher. A Radix Popover whose options are buttons
 * (not links) because selecting triggers programmatic navigation:
 * `localiseUrl(currentPath, code)` carries the current path, query, and
 * hash into the chosen locale (the default locale loses its prefix). The
 * trigger shows the current language's native name.
 */
export function LanguageSwitcher({
	current,
	options,
	currentPath,
	dir,
	onNavigate = defaultNavigate,
}: LanguageSwitcherProps): JSX.Element {
	const [open, setOpen] = useState(false);
	const active = options.find((o) => o.code === current) ?? options[0]!;

	const choose = (code: string): void => {
		setOpen(false);
		onNavigate(localiseUrl(pathAtClick(currentPath), code));
	};

	return (
		<Popover.Root open={open} onOpenChange={setOpen}>
			<Popover.Trigger className="border-rule bg-paper text-ink-2 text-caption hover:text-ink rounded-pill inline-flex items-center gap-2 self-start border px-3.5 py-1.5 font-medium">
				<span>{active.label}</span>
				<span aria-hidden="true">▾</span>
			</Popover.Trigger>
			<Popover.Portal>
				{/* Radix Popover has no dir context, so `start`/`end` resolve
				    physically (left/right). Flip to `end` under RTL so the menu
				    aligns to the trigger's trailing edge and opens inward. */}
				<Popover.Content align={dir === "rtl" ? "end" : "start"} className="min-w-[220px] py-2">
					<ul className="flex flex-col">
						{options.map((o) => {
							const isCurrent = o.code === current;
							return (
								<li key={o.code}>
									<button
										type="button"
										lang={o.code}
										aria-current={isCurrent ? "true" : undefined}
										onClick={() => choose(o.code)}
										className={[
											"text-caption hover:bg-paper-2 text-ink w-full px-4 py-2 text-start",
											isCurrent ? "font-semibold" : "font-medium",
										].join(" ")}
									>
										{o.label}
									</button>
								</li>
							);
						})}
					</ul>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
