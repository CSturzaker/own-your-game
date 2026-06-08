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

| Variable                           | Scope  | Consumed by                                      | Notes                                                                                                                                                                                                                             |
| ---------------------------------- | ------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_CF_IMAGES_ACCOUNT_HASH`    | public | `src/lib/portrait-url.ts`                        | Cloudflare Images account hash (the `imagedelivery.net/{hash}/…` segment). Builds flexible-variant portrait URLs with face-detection cropping. Unset → the silhouette renderer (local/dev). See [`portraits.md`](./portraits.md). |
| `PUBLIC_STREAM_CUSTOMER_SUBDOMAIN` | public | `src/lib/stream.ts` → player card video (DEV-46) | The `customer-{subdomain}` of the Cloudflare Stream iframe URL. Scaffolded in DEV-43; unset until Cloudflare is provisioned, so the video pane stays a stub and the accessor throws if reached.                                   |
| `VOICES_SHEET_CSV_URL`             | server | `scripts/fetch-voices.ts` (DEV-31)               | Published-to-web CSV export of the campaign team's voices sheet. The URL is the only auth — see [`sheet-schema.md`](./sheet-schema.md). Required in CI.                                                                           |
| `SLACK_PIPELINE_WEBHOOK_URL`       | server | `scripts/fetch-voices.ts`                        | Slack incoming webhook for pipeline rejection alerts. Optional locally (errors print to stderr); required in CI.                                                                                                                  |
| `OUTPUT_PATH`                      | server | `scripts/fetch-voices.ts`                        | Override for the generated `voices.json` path. Defaults to `content/voices.json`.                                                                                                                                                 |
| `PIPELINE_APP_ID`                  | ci     | `.github/workflows/sync-voices.yml`              | App ID of the OYG Pipeline GitHub App. Minted into a push token so the sync can push `content/voices.json` to a protected `main` as a ruleset bypass actor (DEV-120). CI only; see [`../ci.md`](../ci.md).                        |
| `PIPELINE_APP_PRIVATE_KEY`         | ci     | `.github/workflows/sync-voices.yml`              | PEM private key of the same GitHub App. Real secret — GitHub Actions secret only, never in the repo or `.env.example`. Rotate by generating a new key on the app.                                                                 |
| `CF_ACCOUNT_ID`                    | local  | `scripts/ingest/build-voices.ts --apply`         | Cloudflare account id for the standalone intake ingest tool (DEV-104). `--apply` only; the default dry-run needs nothing. Never used in CI.                                                                                       |
| `CF_API_TOKEN`                     | local  | `scripts/ingest/build-voices.ts --apply`         | Cloudflare API token scoped to Stream Edit + Images Edit (DEV-104). Real secret — shell / `.env.local` / password manager only. `--apply` only.                                                                                   |
| `GOOGLE_APPLICATION_CREDENTIALS`   | local  | `scripts/ingest/build-voices.ts --apply`         | Path to the Google service-account JSON (DEV-104); the intake Drive folder is shared (reader) with its email. `--apply` only. See [`../../scripts/ingest/README.md`](../../scripts/ingest/README.md).                             |

## Cloudflare credentials (incoming)

Cloudflare (Pages, Stream, Images) is provisioned. The public-facing
values above (`PUBLIC_CF_IMAGES_ACCOUNT_HASH`,
`PUBLIC_STREAM_CUSTOMER_SUBDOMAIN`) are set in the deploy environment and
in GitHub Actions secrets (the `build` job bakes them into the bundle);
any private signing keys / API tokens (e.g. the Cloudflare Images Edit
token used only for the upload workflow) live in the Cloudflare dashboard
and the team password manager — never in this repo or `.env.example`.
