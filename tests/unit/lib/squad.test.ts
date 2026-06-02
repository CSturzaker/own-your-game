import { describe, expect, it } from "vitest";

import { squadHeadlineDesktop } from "~/lib/squad";

// The squad kicker/subtitle and the numeral ("{count} voices.") headline
// moved into the translation dictionary (DEV-70). The desktop spelled-out
// headline stays here — number-to-words is English-only — and is used by
// `Squad.astro` for English, with other locales reusing the numeral form.

describe("squadHeadlineDesktop", () => {
	it("spells the count out, sentence-cased, with a full stop", () => {
		expect(squadHeadlineDesktop(3)).toBe("Three.");
		expect(squadHeadlineDesktop(247)).toBe("Two hundred and forty-seven.");
		expect(squadHeadlineDesktop(350)).toBe("Three hundred and fifty.");
	});

	it("handles zero", () => {
		expect(squadHeadlineDesktop(0)).toBe("Zero.");
	});
});
