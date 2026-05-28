import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom doesn't implement ResizeObserver, which several Radix UI
// primitives (Tooltip/Popover arrows via react-use-size, etc.) touch on
// mount. A no-op stub is enough for component specs that assert
// open/close + content, not pixel geometry.
if (!("ResizeObserver" in globalThis)) {
	globalThis.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}

// jsdom doesn't implement matchMedia, which islands that branch on
// `prefers-reduced-motion` (RotatingEleven, SquadGrid) read via
// useSyncExternalStore on mount. Default to motion-safe (matches:false);
// a spec that needs reduced motion passes the island's force prop.
if (typeof window.matchMedia !== "function") {
	window.matchMedia = (query: string): MediaQueryList => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener() {},
		removeEventListener() {},
		addListener() {},
		removeListener() {},
		dispatchEvent: () => false,
	});
}

afterEach(() => {
	cleanup();
});
