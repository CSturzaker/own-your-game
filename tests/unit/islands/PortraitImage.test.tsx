import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortraitImage } from "~/islands/PortraitImage";

/**
 * PortraitImage spec.
 *
 * The island has three load paths that all need pinning, since the
 * Playwright spec only exercises the cross-browser DOM shape and
 * leaves the unit semantics to Vitest:
 *
 * 1. Happy path — image stays in the tree.
 * 2. Error after hydration — onError flips state, island returns null.
 * 3. Error before hydration — the native event fired while the island
 *    JS was still downloading. The useEffect on mount checks
 *    `complete && naturalWidth === 0` and triggers the same fallback.
 *
 * jsdom doesn't load images, so we drive the failure paths directly
 * via the rendered <img>'s onError handler and a complete/naturalWidth
 * override before mount.
 */

describe("PortraitImage", () => {
	it("renders the <img> with the supplied src, srcset and alt", () => {
		render(
			<PortraitImage
				src="https://cdn.example.com/amira.jpg"
				srcset="https://cdn.example.com/amira.jpg 1x, https://cdn.example.com/amira.jpg?dpr=2 2x"
				alt="Amira, Iraq"
			/>,
		);
		const img = screen.getByAltText("Amira, Iraq");
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute("src", "https://cdn.example.com/amira.jpg");
		expect(img).toHaveAttribute(
			"srcset",
			"https://cdn.example.com/amira.jpg 1x, https://cdn.example.com/amira.jpg?dpr=2 2x",
		);
		expect(img).toHaveAttribute("loading", "lazy");
		expect(img).toHaveAttribute("decoding", "async");
		// Below-fold default: no priority hint (DEV-129).
		expect(img).not.toHaveAttribute("fetchpriority");
	});

	it("loads eagerly at high priority when priority is set (DEV-129)", () => {
		// The above-the-fold LCP portrait: eager + fetchpriority=high so it
		// isn't queued behind the rest of a grid.
		render(<PortraitImage src="https://cdn.example.com/lcp.jpg" alt="Hero" priority />);
		const img = screen.getByAltText("Hero");
		expect(img).toHaveAttribute("loading", "eager");
		expect(img).toHaveAttribute("fetchpriority", "high");
	});

	it("unmounts the <img> when the load fires onError", () => {
		render(<PortraitImage src="https://cdn.example.com/missing.jpg" alt="Broken" />);
		const img = screen.getByAltText("Broken");
		act(() => {
			img.dispatchEvent(new Event("error"));
		});
		expect(screen.queryByAltText("Broken")).not.toBeInTheDocument();
	});

	it("unmounts when the image already errored before hydration", () => {
		// Override HTMLImageElement so any <img> reports as already-failed:
		// `complete` true and `naturalWidth` 0. This matches the race we
		// see in the wild with `client:visible` hydration.
		const origComplete = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete");
		const origNaturalWidth = Object.getOwnPropertyDescriptor(
			HTMLImageElement.prototype,
			"naturalWidth",
		);
		Object.defineProperty(HTMLImageElement.prototype, "complete", {
			configurable: true,
			get: () => true,
		});
		Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
			configurable: true,
			get: () => 0,
		});

		try {
			render(<PortraitImage src="https://cdn.example.com/pre-errored.jpg" alt="Pre-errored" />);
			// React's effect runs synchronously inside the test renderer,
			// so the img should be gone immediately after render().
			expect(screen.queryByAltText("Pre-errored")).not.toBeInTheDocument();
		} finally {
			if (origComplete) Object.defineProperty(HTMLImageElement.prototype, "complete", origComplete);
			else Reflect.deleteProperty(HTMLImageElement.prototype, "complete");
			if (origNaturalWidth)
				Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", origNaturalWidth);
			else Reflect.deleteProperty(HTMLImageElement.prototype, "naturalWidth");
		}
	});
});
