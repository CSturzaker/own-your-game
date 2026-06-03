import { useState } from "react";

import { Popover } from "~/islands/ui/Popover";
import { LANGUAGES, type Language } from "~/lib/footer";

export interface LanguageSwitcherProps {
	/** Currently active language code (e.g. `"en-GB"`). */
	lang: Language["code"];
	/**
	 * Fires when the user picks a language. Defaults to a logger
	 * stub so the switcher behaves visibly in isolation; the real
	 * `localiseUrl(currentPath, code)` + `window.location.assign`
	 * wiring lands with DEV-72.
	 */
	onSelect?: (code: Language["code"]) => void;
}

const defaultOnSelect = (code: Language["code"]): void => {
	// TODO(DEV-72): replace with `window.location.assign(localiseUrl(...))`.
	console.log("nav to", code);
};

export function LanguageSwitcher({
	lang,
	onSelect = defaultOnSelect,
}: LanguageSwitcherProps): JSX.Element {
	const [open, setOpen] = useState(false);
	const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]!;

	return (
		<Popover.Root open={open} onOpenChange={setOpen}>
			<Popover.Trigger className="border-rule bg-paper text-ink-2 text-caption hover:text-ink rounded-pill inline-flex items-center gap-2 self-start border px-3.5 py-1.5 font-medium">
				<span>{current.label}</span>
				<span aria-hidden="true">▾</span>
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content align="start" className="min-w-[220px] py-2">
					<ul className="flex flex-col">
						{LANGUAGES.map((l) => {
							const isCurrent = l.code === lang;
							return (
								<li key={l.code}>
									<button
										type="button"
										lang={l.code}
										aria-current={isCurrent ? "true" : undefined}
										onClick={() => {
											onSelect(l.code);
											setOpen(false);
										}}
										className={[
											"text-caption hover:bg-paper-2 text-ink w-full px-4 py-2 text-start",
											isCurrent ? "font-semibold" : "font-medium",
										].join(" ")}
									>
										{l.label}
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
