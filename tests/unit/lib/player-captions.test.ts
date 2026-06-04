import { afterEach, describe, expect, it, vi } from "vitest";

import { availableCaptions, dispatchCaptionChange, onCaptionChange } from "~/lib/player-captions";

describe("availableCaptions", () => {
	it("returns the voice's spoken language as the one MVP track", () => {
		expect(availableCaptions({ language: "es" })).toEqual(["es"]);
	});

	it("returns an empty list when the voice has no language (chip hides)", () => {
		expect(availableCaptions({ language: "" })).toEqual([]);
	});
});

describe("caption-change event bus", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("delivers a change to a subscriber for the same video", () => {
		const handler = vi.fn();
		const off = onCaptionChange("vid-1", handler);
		dispatchCaptionChange("vid-1", "es");
		expect(handler).toHaveBeenCalledWith("es");
		dispatchCaptionChange("vid-1", null);
		expect(handler).toHaveBeenCalledWith(null);
		off();
	});

	it("ignores events targeting a different video", () => {
		const handler = vi.fn();
		const off = onCaptionChange("vid-1", handler);
		dispatchCaptionChange("vid-2", "fr");
		expect(handler).not.toHaveBeenCalled();
		off();
	});

	it("stops delivering after unsubscribe", () => {
		const handler = vi.fn();
		const off = onCaptionChange("vid-1", handler);
		off();
		dispatchCaptionChange("vid-1", "es");
		expect(handler).not.toHaveBeenCalled();
	});
});
