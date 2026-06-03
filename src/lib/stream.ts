/**
 * Cloudflare Stream configuration accessor.
 *
 * Scaffolded in DEV-43, consumed in DEV-46 (the Stream iframe player).
 * The customer subdomain is the `customer-{subdomain}` portion of the
 * Cloudflare Stream iframe URL, e.g. a value of `abc123def` yields
 * `https://customer-abc123def.cloudflarestream.com/{videoId}/iframe`.
 *
 * It lives in `PUBLIC_STREAM_CUSTOMER_SUBDOMAIN` — a public env var
 * because the resulting iframe URL is served to browsers. Cloudflare is
 * not provisioned yet (the agency has been paid to set up the account),
 * so the value does not exist today and nothing calls these helpers at
 * build time. They're scaffolding: when credentials land, DEV-46 becomes
 * a config drop rather than a code change.
 */

function rawSubdomain(): string | undefined {
	const value = (import.meta.env as Record<string, string | undefined>)
		.PUBLIC_STREAM_CUSTOMER_SUBDOMAIN;
	return value && value.length > 0 ? value : undefined;
}

/**
 * Whether Cloudflare Stream is configured. Lets callers (DEV-46) render
 * the video iframe when credentials exist and fall back to the stub
 * otherwise, without triggering the throw in {@link streamCustomerSubdomain}.
 */
export function hasStreamConfig(): boolean {
	return rawSubdomain() !== undefined;
}

/**
 * The Cloudflare Stream customer subdomain.
 *
 * Throws a loud, actionable error when unset rather than returning
 * `undefined` and letting a broken iframe URL render — until Cloudflare
 * is provisioned, any code that reaches for this value is a bug that
 * should fail fast. Guard with {@link hasStreamConfig} when a missing
 * value is an expected, non-fatal state.
 */
export function streamCustomerSubdomain(): string {
	const value = rawSubdomain();
	if (value === undefined) {
		throw new Error(
			"PUBLIC_STREAM_CUSTOMER_SUBDOMAIN is not set. It is required to build " +
				"Cloudflare Stream iframe URLs (DEV-46). Set it in .env.local (see " +
				".env.example) or in the deploy environment. Cloudflare is not " +
				"provisioned yet, so this value does not exist — the video pane stays " +
				"a stub until it does.",
		);
	}
	return value;
}
