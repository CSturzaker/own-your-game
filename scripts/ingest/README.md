# Intake ingest tool (DEV-104)

A **standalone, run-by-hand** ops tool that bridges the country-office
**intake spreadsheet** to the **campaign voices sheet** the 2-hourly
pipeline reads. It uploads each youth video to Cloudflare Stream and each
portrait to Cloudflare Images, then emits a reviewed CSV for the campaign
team to import.

> **Not CI. Not the 2-hourly pipeline.** Run it locally with credentials
> when offices have added intake rows. The live pipeline
> (`scripts/fetch-voices.ts`) only ever _reads_ the campaign sheet.

## Two sheets — don't confuse them

- **Intake** (`Youth video list for website.xlsx`) — full names, full
  country/language names, Drive links, a consent column, a Theme column.
  Gitignored (youth PII). **Input.**
- **Campaign voices sheet** — clean `voiceSchema` shape, read by the
  pipeline. **Output target**, via a reviewed CSV (see open question #1).

## Quick start

```bash
# Dry-run (default): read the intake sheet, print the triage report,
# touch nothing. No credentials needed.
pnpm tsx scripts/ingest/build-voices.ts

# Apply: upload media to Cloudflare, update the manifest, write the
# merged campaign-import CSV. Requires the env below.
pnpm tsx scripts/ingest/build-voices.ts --apply \
  --campaign-csv path/to/current-campaign-export.csv \
  --out scripts/ingest/voices-import.csv
```

Flags: `--input <xlsx>` (default `content/Youth video list for
website.xlsx`), `--apply` (default off), `--campaign-csv <csv>` (current
campaign-sheet export to merge into; omitted = treat as empty),
`--out <csv>` (default `scripts/ingest/voices-import.csv`),
`--published-at <iso>` (default: now; written once per voice then
immutable), `--manifest <path>` (default `scripts/ingest/upload-manifest.json`).

## Credentials (`--apply` only)

| Env                              | What                                               |
| -------------------------------- | -------------------------------------------------- |
| `CF_ACCOUNT_ID`                  | Cloudflare account id                              |
| `CF_API_TOKEN`                   | API token, scoped to **Stream Edit + Images Edit** |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to a Google **service-account** JSON          |

The intake Drive folder (and every linked file/folder) must be **shared
(reader) with the service-account email**, or the resolve/download step
401s. The dry-run needs none of this.

## Safeguarding gates (run first, before any upload)

A row is eligible for upload only if, in order:

1. **`consent == yes`** — hard gate, case/whitespace-insensitive.
2. **age is an integer in 15–25** (matches `schemas/voice.ts`).
3. it has a **resolvable video**.

Everything failing a gate is **reported, never coerced**: over-25 ages
aren't clamped, missing consent isn't assumed, surnames are never
written. Gating before upload also conserves the Stream quota.

## Idempotency — safe to re-run

`upload-manifest.json` (committed; only Drive/Cloudflare ids, no PII) is
the identity-continuity record:

- Keyed on the **canonical Drive file id** (not the URL or row position),
  so reordered rows and `?usp=…` suffix variants resolve to the same
  asset. A known asset is **reused, never re-uploaded**.
- Written **atomically after each upload** (temp → fsync → rename), so a
  crash mid-run never causes a re-upload next time.
- `voiceId` and `publishedAt` are generated once and reused — inserting
  earlier intake rows can't shift existing slugs.
- Backup if the manifest is ever lost: every Stream video is tagged
  `meta.driveFileId`, and Images use a **deterministic custom id** (the
  voice slug), so a repeat upload is detected as already-present.

The merge into the campaign CSV is **fill-only-blank**: it fills empty
cells and appends new rows, never overwrites a non-empty cell (protects
editorial edits), never deletes a row, and **reports conflicts** rather
than auto-resolving.

## Module layer map

Built inward-out — the pure logic is proven before any network call:

| Layer | Module                                                                    | Network?         | Tested              |
| ----- | ------------------------------------------------------------------------- | ---------------- | ------------------- |
| 1     | `normalise.ts`, `drive.ts` (parse), `intake.ts`, `triage.ts`, `report.ts` | no               | unit                |
| 2     | `manifest.ts`                                                             | fs only          | unit                |
| 3     | `drive-client.ts` (`googleapis`)                                          | yes              | live (`--apply`)    |
| 4     | `cloudflare-client.ts` (Stream tus + Images)                              | yes              | live (`--apply`)    |
| 5     | `merge.ts`                                                                | no               | unit                |
| 6     | `orchestrate.ts` (Phase A + B), `build-voices.ts` (CLI)                   | injected clients | unit (fakes) + live |

The credentialed adapters (`drive-client`, `cloudflare-client`) are the
only modules not unit-tested — the orchestrator is proven against
in-memory fakes (`orchestrate.test.ts`: run-twice no-op, added-row,
consent gate, folder-by-MIME, crash-safety), so the adapters just need
live verification on first `--apply`.

## Open-question defaults (flagged for sign-off)

1. **CSV emit, not a direct Sheet write.** The live pipeline only reads
   the campaign sheet; a human-review gate before publish is the
   safeguarding-appropriate choice. Direct Sheets-API write is a possible
   follow-up.
2. **`"English and Shona"` → `en`** (Shona unsupported; site is
   English-primary). The row is held for confirmation, not auto-published.
3. **The manifest is committed** — only Drive/Cloudflare ids, diffable
   per run.
