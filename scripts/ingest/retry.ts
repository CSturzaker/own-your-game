/**
 * Retry-with-backoff for the ingest tool's network uploads (DEV-104).
 *
 * A 20–40 asset run over a home connection reliably hits the occasional
 * transient socket drop (`UND_ERR_SOCKET: other side closed`) or 5xx from
 * Cloudflare. Those are recoverable in place — retrying the single
 * request beats crashing the whole run and resuming from the manifest.
 *
 * A `FatalUploadError` is the opt-out: throw it for non-retryable cases
 * (bad auth, malformed request) so we fail fast instead of hammering a
 * request that can't succeed.
 */

/** Marks an error as non-retryable — `withRetry` rethrows it immediately. */
export class FatalUploadError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "FatalUploadError";
	}
}

export interface RetryOptions {
	/** Number of RETRIES after the first attempt (default 3 → 4 tries total). */
	readonly retries?: number;
	/** Backoff before retry N (1-based). Default: 1s, 2s, 4s … */
	readonly delayMs?: (attempt: number) => number;
	/** Notified before each retry (used to surface progress to the user). */
	readonly onRetry?: (attempt: number, error: unknown) => void;
	/** Injectable sleep so tests run instantly. */
	readonly sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Run `fn`, retrying on any thrown error except `FatalUploadError`, up to
 * `retries` times with exponential backoff. Returns `fn`'s value on the
 * first success; rethrows the last error once retries are exhausted.
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
	const retries = opts.retries ?? 3;
	const delayMs = opts.delayMs ?? ((attempt) => 1000 * 2 ** (attempt - 1));
	const sleep = opts.sleep ?? defaultSleep;

	let lastError: unknown;
	for (let attempt = 1; attempt <= retries + 1; attempt++) {
		try {
			return await fn();
		} catch (error) {
			if (error instanceof FatalUploadError) throw error;
			lastError = error;
			if (attempt <= retries) {
				opts.onRetry?.(attempt, error);
				await sleep(delayMs(attempt));
			}
		}
	}
	throw lastError;
}
