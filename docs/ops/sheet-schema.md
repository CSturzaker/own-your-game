# Voices sheet — technical schema

The campaign team's Google Sheet is the upstream source for
`content/voices.json`. The fetch script (`scripts/fetch-voices.ts`,
DEV-31) reads the sheet's published CSV, normalises headers, validates
each row through the Zod schema (`schemas/voice.ts`), and writes the
result back into the repo on a 2-hourly cadence.

This document is the **technical** specification — for engineers. The
campaign-team-facing version lives in
[`sheet-guide-for-campaign-team.md`](./sheet-guide-for-campaign-team.md).

## Sheet structure

- **Worksheet name:** `voices` (case-sensitive). Additional sheets in
  the same workbook are ignored.
- **First row:** the header row. The script matches header text
  case-insensitively with whitespace tolerance (`"First Name"`,
  `"first name"`, and `"first_name"` all resolve to the same field).
- **Subsequent rows:** one Voice per row. Row order does not affect
  site display — the squad page sorts on `publishedAt` (newest first).
- **Empty rows:** silently skipped. Rows where `videoId` is empty are
  also skipped (a sheet row staged for an upload that hasn't happened
  yet).
- **Future-dated rows:** rows where `publishedAt` is later than the
  pipeline-run time are skipped on that run and picked up on the next
  one that fires after `publishedAt`. This gives the campaign team a
  "scheduled publish" escape hatch.
- **Extra columns:** any column whose header isn't in the canonical
  list below is ignored. The team can keep `"Notes"`, `"Moderator"`,
  `"Source"` columns for their own workflow without breaking the
  pipeline.
- **Sharing model:** the sheet is published as **Anyone with the link,
  Viewer**. The script fetches the CSV export URL directly with no
  authentication — there is no service account.

## Authentication model

There is no service account, no OAuth, no API key. The fetch script
calls the public CSV export URL stored in the
`VOICES_SHEET_CSV_URL` GitHub Actions secret and parses the response.

This works because:

1. The sheet contains no personal data the campaign team isn't already
   willing to publish — first names only, public city names, public
   themes.
2. Country offices moderate videos before they're uploaded to Stream;
   the sheet only ever sees vetted content.
3. The risk of the URL leaking is bounded — the worst case is a
   readonly copy of already-public information.

If a future incident calls this into question, the migration path is
to publish a small Apps Script web endpoint that returns the CSV after
a shared-secret check — no full Sheets-API auth needed.

## Canonical column list

Each column maps one-to-one onto a field in `voiceSchema`
(`schemas/voice.ts`). The "Sheet header" column lists the human-friendly
text in the template; the fetch script normalises whitespace and casing
when matching.

| Sheet header      | Schema field      | Type / format                                                          | Required | Example                                |
| ----------------- | ----------------- | ---------------------------------------------------------------------- | -------- | -------------------------------------- |
| ID                | `id`              | lowercase slug, `[a-z0-9-]{3,64}`                                      | yes      | `amina-ke-001`                         |
| First name        | `firstName`       | string, 1–40 chars                                                     | yes      | `Amina`                                |
| Age               | `age`             | integer (any value; the 15–25 range gate was dropped)                  | yes      | `16`                                   |
| Country code      | `countryCode`     | ISO 3166-1 alpha-2, uppercase                                          | yes      | `KE`                                   |
| City              | `city`            | string, 1–80 chars                                                     | yes      | `Nairobi`                              |
| Theme             | `theme`           | one of: fairness, belonging, friendship, confidence, family, community | yes      | `belonging`                            |
| Pull quote        | `pullQuote`       | string, 1–120 chars                                                    | yes      | `Football is where I belong.`          |
| Language          | `language`        | BCP 47 (`xx` or `xx-XX`)                                               | yes      | `sw`                                   |
| Video ID          | `videoId`         | Cloudflare Stream UID (hex, 8–64 chars)                                | yes      | `f7d8a9b6c5e4d3...`                    |
| Portrait image ID | `portraitImageId` | Cloudflare Images ID (letters, digits, hyphen, underscore)             | column¹  | `2cdc28f0-017a-49c4-9ed7-87056c83901a` |
| Published at      | `publishedAt`     | ISO 8601 datetime                                                      | yes      | `2026-05-20T14:32:00Z`                 |

If `Video ID` is empty the row is treated as not-yet-uploaded and
skipped silently. All other empty required fields fail validation and
are reported to Slack.

¹ **Portrait image ID** is the one exception to "required": the **column
header must exist** (it's in `REQUIRED_FIELDS`, so a missing header aborts
the pipeline run), but an **empty cell is allowed** — the voice renders
the deterministic silhouette fallback (DEV-26) until a portrait is
uploaded. See [`portraits.md`](./portraits.md) for the upload workflow.
When a cell _is_ filled, it must be a valid Cloudflare Images ID (no file
extension, no spaces, no slashes — it becomes a delivery-URL path
segment).

## Country codes

`countryCode` must be ISO 3166-1 alpha-2 (two-letter, uppercase). The
prototype used alpha-3 codes (`"NGA"`, `"EGY"`) — those don't validate.
The full list of currently-supported codes lives in
[`src/lib/countries.ts`](../../src/lib/countries.ts); adding a new
country means appending to that file (and optionally adding a flag
gradient to `src/lib/flags.ts`).

When a country code is set in the sheet but not yet in
`COUNTRY_NAMES`, the row still validates (the schema only checks
shape), but the Tile renders the bare code instead of a country name.
The pipeline emits a Slack notice listing unmapped codes so the
engineer can add them in the next PR.

## Header matching

The fetch script does:

1. Trim whitespace from each header cell.
2. Lowercase.
3. Replace runs of whitespace, dashes, or underscores with a single space.
4. Compare against a hard-coded lookup table.

So all of these match the `firstName` field:

- `First name`
- `First Name`
- `first name`
- `first_name`
- `first-name`

Unknown headers are dropped. Repeated headers fail loudly.

## Schema → sheet drift

When `schemas/voice.ts` changes, this document must change in the same
PR. The fetch script's header lookup is also defined inline in
`scripts/fetch-voices.ts` (DEV-31) — keep all three in sync. The
campaign-team guide
([`sheet-guide-for-campaign-team.md`](./sheet-guide-for-campaign-team.md))
should be updated whenever the **meaning** of a field changes for them,
not on every refactor.

## Template

The starter sheet template lives at
[`sample-voices-sheet.csv`](./sample-voices-sheet.csv) and can be
imported into a fresh Google Sheet via **File → Import → Replace data**.
It contains three example rows demonstrating different themes,
countries, ages, and languages. Use it as the basis for the live
sheet — copying the headers exactly avoids matching surprises.
