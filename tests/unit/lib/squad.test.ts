import { describe, expect, it } from "vitest";

import { SQUAD_COPY, squadHeadlineDesktop, squadHeadlineMobile } from "~/lib/squad";

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

describe("squadHeadlineMobile", () => {
	it("uses the numeral plus 'voices.'", () => {
		expect(squadHeadlineMobile(3)).toBe("3 voices.");
		expect(squadHeadlineMobile(247)).toBe("247 voices.");
	});

	it("carries a thousands separator past 999", () => {
		expect(squadHeadlineMobile(1234)).toBe("1,234 voices.");
	});
});

describe("SQUAD_COPY", () => {
	it("uses the prototype kicker and subtitle", () => {
		expect(SQUAD_COPY.kicker).toBe("The full squad");
		expect(SQUAD_COPY.subtitle).toContain("Every young person who recorded a video");
	});
});
