/**
 * Copy text to the clipboard, robustly.
 *
 * Prefers the async Clipboard API, but falls back to the legacy
 * `document.execCommand("copy")` when it's unavailable or blocked. The
 * fallback matters for **non-secure contexts**: a dev server reached over
 * a LAN `http://` IP (e.g. testing the share button on a real phone) has
 * no `navigator.clipboard` *and* no `navigator.share`, so the share
 * controls "did nothing" on mobile while working on `localhost` — this is
 * the DEV-113 follow-up fix. Production (Cloudflare, https) keeps the
 * native path.
 *
 * Returns `true` when the copy succeeds.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	if (navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			// Permission denied / blocked — fall through to the legacy path.
		}
	}
	return legacyCopy(text);
}

/**
 * Pre-Clipboard-API copy via a throwaway off-screen textarea. Works in
 * non-secure contexts. `setSelectionRange` is the iOS Safari quirk
 * (`select()` alone is ignored there); the prior selection is saved and
 * restored so copying doesn't clobber the user's text selection.
 */
function legacyCopy(text: string): boolean {
	const textarea = document.createElement("textarea");
	textarea.value = text;
	textarea.setAttribute("readonly", "");
	textarea.style.position = "fixed";
	textarea.style.top = "-9999px";
	textarea.style.opacity = "0";
	document.body.appendChild(textarea);

	const selection = document.getSelection();
	const previousRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

	textarea.select();
	textarea.setSelectionRange(0, text.length);

	let copied = false;
	try {
		copied = document.execCommand("copy");
	} catch {
		// execCommand can throw in locked-down contexts; `copied` stays false.
	}

	document.body.removeChild(textarea);
	if (previousRange && selection) {
		selection.removeAllRanges();
		selection.addRange(previousRange);
	}
	return copied;
}
