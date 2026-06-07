import { describe, expect, it, vi } from "vitest";

import { FatalUploadError, withRetry } from "../../../../scripts/ingest/retry";

const noSleep = (): Promise<void> => Promise.resolve();

describe("withRetry", () => {
	it("returns the value on the first success without retrying", async () => {
		const fn = vi.fn(() => Promise.resolve("ok"));
		expect(await withRetry(fn, { sleep: noSleep })).toBe("ok");
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("retries a transient failure then succeeds", async () => {
		let calls = 0;
		const fn = vi.fn(() => {
			calls += 1;
			if (calls < 3) return Promise.reject(new Error("other side closed"));
			return Promise.resolve("ok");
		});
		const onRetry = vi.fn();
		expect(await withRetry(fn, { sleep: noSleep, onRetry })).toBe("ok");
		expect(fn).toHaveBeenCalledTimes(3);
		expect(onRetry).toHaveBeenCalledTimes(2);
	});

	it("rethrows a FatalUploadError immediately, no retries", async () => {
		const fn = vi.fn(() => Promise.reject(new FatalUploadError("HTTP 403")));
		await expect(withRetry(fn, { sleep: noSleep })).rejects.toBeInstanceOf(FatalUploadError);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("gives up after exhausting retries and throws the last error", async () => {
		const fn = vi.fn(() => Promise.reject(new Error("still failing")));
		await expect(withRetry(fn, { retries: 2, sleep: noSleep })).rejects.toThrow("still failing");
		expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
	});

	it("backs off with increasing delays between attempts", async () => {
		const delays: number[] = [];
		const fn = vi.fn(() => Promise.reject(new Error("nope")));
		await expect(
			withRetry(fn, {
				retries: 3,
				sleep: (ms) => {
					delays.push(ms);
					return Promise.resolve();
				},
			}),
		).rejects.toThrow();
		expect(delays).toEqual([1000, 2000, 4000]);
	});
});
