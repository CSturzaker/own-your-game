# Environment variables & secrets

The single index of every environment variable the project reads, where
it lives, and what consumes it. The canonical template is
[`.env.example`](../../.env.example) — copy it to `.env.local` for local
development. Real values never go in the repo: build/runtime secrets live
in GitHub Actions secrets and (once provisioned) the Cloudflare
dashboard.

`PUBLIC_*` variables are exposed to the browser by Astro/Vite — only put
values there that are safe to ship to clients. Everything else is
build-time / server-side only.

| Variable                           | Scope  | Consumed by                                      | Notes                                                                                                                                                                                           |
| ---------------------------------- | ------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_PORTRAIT_BASE_URL`         | public | `src/lib/portrait-url.ts`                        | R2 + Image Resizing base URL for portraits. Unset → the silhouette renderer is used (local/dev, pre-R2).                                                                                        |
| `PUBLIC_STREAM_CUSTOMER_SUBDOMAIN` | public | `src/lib/stream.ts` → player card video (DEV-46) | The `customer-{subdomain}` of the Cloudflare Stream iframe URL. Scaffolded in DEV-43; unset until Cloudflare is provisioned, so the video pane stays a stub and the accessor throws if reached. |
| `VOICES_SHEET_CSV_URL`             | server | `scripts/fetch-voices.ts` (DEV-31)               | Published-to-web CSV export of the campaign team's voices sheet. The URL is the only auth — see [`sheet-schema.md`](./sheet-schema.md). Required in CI.                                         |
| `SLACK_PIPELINE_WEBHOOK_URL`       | server | `scripts/fetch-voices.ts`                        | Slack incoming webhook for pipeline rejection alerts. Optional locally (errors print to stderr); required in CI.                                                                                |
| `OUTPUT_PATH`                      | server | `scripts/fetch-voices.ts`                        | Override for the generated `voices.json` path. Defaults to `content/voices.json`.                                                                                                               |

## Cloudflare credentials (incoming)

Cloudflare (Pages, Stream, R2) is not provisioned yet — the agency has
been paid to create the account (DEV-8/9/10). When it lands, the
public-facing values above (`PUBLIC_PORTRAIT_BASE_URL`,
`PUBLIC_STREAM_CUSTOMER_SUBDOMAIN`) get set in the deploy environment, and
any private R2/Stream signing keys go in the Cloudflare dashboard — never
in this repo or `.env.example`.
