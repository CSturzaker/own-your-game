import { afterEach, describe, expect, it, vi } from "vitest";

import { copyToClipboard } from "~/lib/clipboard";

/**
 * `copyToClipboard` prefers the async Clipboard API and falls back to the
 * legacy `execCommand("copy")` for non-secure contexts (the bug behind the
 * mobile share "doing nothing" over LAN http — DEV-113 follow-up).
 */

function setClipboard(value: { writeText: (t: string) => Promise<void> } | undefined): void {
	Object.defineProperty(navigator, "clipboard", { configurable: true, value });
}

afterEach(() => {
	setClipboard(undefined);
	vi.restoreAllMocks();
});

describe("copyToClipboard", () => {
	it("uses the Clipboard API when available and reports success", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		setClipboard({ writeText });
		const exec = vi.fn().mockReturnValue(true);
		document.execCommand = exec;

		await expect(copyToClipboard("https://own-your-game.org/")).resolves.toBe(true);
		expect(writeText).toHaveBeenCalledWith("https://own-your-game.org/");
		expect(exec).not.toHaveBeenCalled();
	});

	it("falls back to execCommand when the Clipboard API is absent (non-secure context)", async () => {
		setClipboard(undefined);
		const exec = vi.fn().mockReturnValue(true);
		document.execCommand = exec;

		await expect(copyToClipboard("https://own-your-game.org/")).resolves.toBe(true);
		expect(exec).toHaveBeenCalledWith("copy");
		// The throwaway textarea is cleaned up.
		expect(document.querySelector("textarea")).toBeNull();
	});

	it("falls back to execCommand when the Clipboard API rejects", async () => {
		const writeText = vi.fn().mockRejectedValue(new Error("blocked"));
		setClipboard({ writeText });
		const exec = vi.fn().mockReturnValue(true);
		document.execCommand = exec;

		await expect(copyToClipboard("https://own-your-game.org/")).resolves.toBe(true);
		expect(writeText).toHaveBeenCalled();
		expect(exec).toHaveBeenCalledWith("copy");
	});

	it("reports failure when both paths fail", async () => {
		setClipboard(undefined);
		document.execCommand = vi.fn().mockReturnValue(false);

		await expect(copyToClipboard("https://own-your-game.org/")).resolves.toBe(false);
	});
});
