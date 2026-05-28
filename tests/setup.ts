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

afterEach(() => {
	cleanup();
});
