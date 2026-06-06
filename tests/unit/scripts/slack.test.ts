import { describe, expect, it, vi } from "vitest";

import { formatSlackMessage, postToSlack } from "../../../scripts/pipeline/slack";

describe("formatSlackMessage", () => {
	it("names every rejected row with its id and field errors", () => {
		const message = formatSlackMessage([
			{
				kind: "rejected",
				rowNumber: 5,
				id: "amina-ke-001",
				errors: ["age: must be ≤ 25", "language: invalid tag"],
			},
		]);
		expect(message).toContain("1 row(s) rejected");
		expect(message).toContain("Row 5");
		expect(message).toContain("amina-ke-001");
		expect(message).toContain("age: must be ≤ 25");
		expect(message).toContain("language: invalid tag");
	});

	it("includes (no id) tag when the row had no id column value", () => {
		const message = formatSlackMessage([
			{ kind: "rejected", rowNumber: 8, id: null, errors: ["id: required"] },
		]);
		expect(message).toContain("Row 8");
		expect(message).not.toContain("(`null`)");
	});

	it("truncates the per-row error list at 5 with a count", () => {
		const errors = Array.from({ length: 8 }, (_, i) => `field${i + 1}: bad`);
		const message = formatSlackMessage([
			{ kind: "rejected", rowNumber: 2, id: "abc-de-001", errors },
		]);
		expect(message).toContain("field1: bad");
		expect(message).toContain("field5: bad");
		expect(message).not.toContain("field6: bad");
		expect(message).toContain("…and 3 more");
	});

	it("throws when called with no rejections (callers must guard)", () => {
		expect(() => formatSlackMessage([])).toThrow();
	});
});

describe("postToSlack", () => {
	it("POSTs JSON to the webhook URL", async () => {
		const fakeFetch = vi.fn<typeof fetch>().mockResolvedValue({ ok: true } as Response);
		const ok = await postToSlack(
			"https://hooks.slack.com/services/fake/test/url",
			"hello",
			fakeFetch,
		);
		expect(ok).toBe(true);
		expect(fakeFetch).toHaveBeenCalledTimes(1);
		const [url, init] = fakeFetch.mock.calls[0]!;
		expect(url).toBe("https://hooks.slack.com/services/fake/test/url");
		expect(init).toMatchObject({
			method: "POST",
			headers: { "Content-Type": "application/json" },
		});
		const body = init?.body;
		expect(typeof body).toBe("string");
		expect(JSON.parse(body as string)).toEqual({ text: "hello" });
	});

	it("returns false when the webhook responds non-2xx", async () => {
		const fakeFetch = vi.fn<typeof fetch>().mockResolvedValue({ ok: false } as Response);
		const ok = await postToSlack("x", "y", fakeFetch);
		expect(ok).toBe(false);
	});
});
