/**
 * Cloudflare Web Analytics configuration accessor (DEV-125).
 *
 * The Web Analytics beacon is cookie-less and aggregate-only — it stores
 * nothing on the visitor's device, so no consent banner is needed. The
 * site token ships in the page HTML's `data-cf-beacon` attribute, so it
 * is public, not a secret — but it's plumbed through an env var
 * (`PUBLIC_CF_BEACON_TOKEN`) to match the `PUBLIC_CF_IMAGES_ACCOUNT_HASH`
 * / `PUBLIC_STREAM_CUSTOMER_SUBDOMAIN` pattern.
 *
 * The token is set ONLY in the Cloudflare Pages Production environment —
 * never Preview, CI, or local — so the beacon is absent from every
 * non-production build and dev/preview traffic stays out of the
 * analytics data without any `PROD` branching.
 */

/**
 * The beacon script's CDN URL. No Content-Security-Policy exists today
 * (DEV-125 verified neither the repo nor the Cloudflare edge sets one);
 * if one is ever added it needs BOTH `script-src
 * https://static.cloudflareinsights.com` (this script) and
 * `connect-src https://cloudflareinsights.com` — the manual snippet
 * reports cross-origin to `cloudflareinsights.com/cdn-cgi/rum` even on
 * a Cloudflare-proxied origin (the beacon source hard-codes that URL
 * whenever `data-cf-beacon` lacks the `version` field only dashboard
 * auto-injection adds; same-origin `/cdn-cgi/rum` is the auto-injection
 * path only).
 */
export const BEACON_SRC = "https://static.cloudflareinsights.com/beacon.min.js";

function rawToken(): string | undefined {
	const value = (import.meta.env as Record<string, string | undefined>).PUBLIC_CF_BEACON_TOKEN;
	return value && value.length > 0 ? value : undefined;
}

/**
 * The Web Analytics site token, or undefined when analytics is off.
 * Soft (no throw) — an unset token is the expected state everywhere
 * except the production deploy.
 */
export function beaconToken(): string | undefined {
	return rawToken();
}

/**
 * The JSON payload for the snippet's `data-cf-beacon` attribute, or
 * undefined when analytics is off (the caller emits no script at all).
 * Token only — the site is a static MPA, so no SPA mode.
 */
export function beaconConfig(): string | undefined {
	const token = rawToken();
	return token === undefined ? undefined : JSON.stringify({ token });
}
