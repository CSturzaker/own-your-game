# Voices sheet — guide for the campaign team

Welcome! This is the guide for filling in the **Voices** sheet that
drives the Own Your Game site. Each row is one young person's video.
When you add a row, the site picks it up automatically within about
two hours.

If anything below is unclear or the sheet seems to be rejecting rows
you think are fine, see [Who to contact](#who-to-contact) at the
bottom.

## How it works in one paragraph

You add rows to the sheet. Every two hours an automated job reads the
sheet, checks each row makes sense, and writes the data into the live
site. Within a few minutes of that job running, the new voices appear
in the squad. Bad rows are skipped and a message is posted in our
Slack channel saying which row was rejected and why. You don't need
to refresh the site or tell us anything has changed — just keep
adding rows.

## Where to find the sheet

The Voices sheet lives inside the campaign's shared Google Drive
folder. It's the only sheet inside that folder titled
**Voices — site data**.

You'll need view access at minimum; the campaign lead has edit access
and can grant it to country office leads.

## Filling in a row

Every row needs all of these columns filled in. The sheet has a
template row at the top — copy it down each time you add someone.

### ID

A short unique nickname for this voice. Lowercase letters, numbers,
and dashes only. No spaces, no accents, no full names. Use the format
**first-name + country + number**, e.g. `amina-ke-001`. The number
goes up each time you add another person from the same country
(`amina-ke-002`, `omar-ke-003`, etc.).

This shows up in the URL, so keep it stable — once a row is published,
don't change its ID, or links posted by friends and family stop
working.

### First name

The young person's first name only. **Never include the surname.** The
site is built so it cannot display surnames. If a surname slips into
this column, it'll appear in big letters on the tile — please be
careful here.

Accents are fine (`Sofía`, `Aïsha`). Emoji and numbers are not — first
names only.

### Age

The young person's age right now, as a whole number between **11 and
18 inclusive**. If a 19-year-old recorded their video before their
birthday but is in the sheet now, please flag it and we'll discuss —
the schema rejects 19 by default.

### Country code

The two-letter country code (ISO 3166-1 alpha-2). Examples:

- Kenya → `KE`
- Nigeria → `NG`
- Egypt → `EG`
- Argentina → `AR`
- Brazil → `BR`
- Pakistan → `PK`
- India → `IN`
- United States → `US`

If you're unsure of a country's code, Google "ISO alpha-2 code for
\[country]" and use the two-letter result. Set up the column as a
**dropdown** in Google Sheets (Data → Data validation → Dropdown,
paste the country codes you use most often) so the team doesn't have
to remember.

If you add a country we haven't used before, the site will display the
code instead of the country name until an engineer adds the country to
our list. Slack will warn us, and we'll fix it in the next deploy.

### City

The city or town as the young person describes it. Whatever feels
natural — `Nairobi`, `Greater Nairobi`, `Kibera`. Keep it under 80
characters.

### Theme

One of these six words exactly (lowercase):

- `fairness`
- `belonging`
- `friendship`
- `confidence`
- `family`
- `community`

The theme determines the colour of the tag on the voice's card. Set
this column up as a **dropdown** with these six values to avoid typos.

### Pull quote

A short, powerful line — up to 120 characters — that captures what
this young person said. Will appear as a big quote on their player
card. Use plain text, no special formatting.

Examples:

- "Football is where I feel I belong."
- "On the pitch I'm not the new girl — I'm the striker."

If their quote is longer, trim it to the strongest 120 characters.
The full video has the rest.

### Language

The language tag for the **video itself**, in BCP 47 form. The common
ones:

| Language     | Tag     |
| ------------ | ------- |
| English      | `en`    |
| Spanish      | `es`    |
| French       | `fr`    |
| Arabic       | `ar`    |
| Portuguese   | `pt`    |
| Brazilian PT | `pt-BR` |
| Swahili      | `sw`    |
| Mandarin     | `zh`    |
| Hindi        | `hi`    |
| Urdu         | `ur`    |
| Vietnamese   | `vi`    |

Two- or three-letter lowercase code, optionally followed by a
two-letter uppercase region (`pt-BR`, `es-MX`). If you don't know the
region, just use the language code on its own (`pt`, `es`).

### Video ID

The Cloudflare Stream UID for the video. The campaign lead pastes this
in **after** uploading the approved video to Stream. It's a long string
of letters and numbers (`f7d8a9b6c5e4d3...`).

Leave this column blank if the video isn't uploaded yet — the row
will sit idle in the sheet without going live. Once you paste the UID
in, the next pipeline run picks it up.

### Portrait file

The filename of the portrait still image in our portraits bucket. Use
the same base name as the ID, with `.webp` (preferred), `.png`, or
`.jpg`:

- ID `amina-ke-001` → portrait file `amina-ke-001.webp`

The portrait still is uploaded separately by the campaign lead. If you
add a row before the portrait is uploaded, the site will show a neutral
silhouette in its place — that's fine for a few hours.

### Published at

The date and time the voice should go live, in ISO 8601 format:

```
2026-05-20T14:32:00Z
```

For "go live now", use today's date and time with `Z` on the end. For
"go live in a week" (e.g. coordinating a batch launch), use the future
date — the pipeline will skip the row until that time arrives.

The fastest way to enter this in Google Sheets: type
`=TEXT(NOW(),"yyyy-mm-dd""T""HH:mm:ss""Z""")` and copy the result as
a value into the cell.

## Do

- ✅ Fill in **all** columns for every row.
- ✅ Use the dropdowns for **Country code** and **Theme**.
- ✅ Keep IDs short, lowercase, and unique.
- ✅ Double-check the **First name** is the first name only.
- ✅ Leave **Video ID** blank if the video isn't on Stream yet.
- ✅ Tell us if you see a Slack rejection you don't understand.

## Don't

- ❌ Don't put surnames in the **First name** column — ever.
- ❌ Don't add other personal info (school, last name, email, address)
  even in extra columns — keep the sheet clean.
- ❌ Don't change an **ID** after the row has been published. Add a new
  row if you need a new ID.
- ❌ Don't translate any of the column headers — the pipeline matches
  them by name.
- ❌ Don't paste images or formulas into the data columns. Plain text
  only.

## What happens when something's wrong

If a row fails validation (typo in country code, age out of range, a
required column left blank), the pipeline:

1. **Skips that row** — the rest of the sheet still publishes fine.
2. **Posts to Slack** in the **#own-your-game-pipeline** channel
   (private, campaign team + engineering). The message names the row
   number and the field that failed.
3. **Leaves the previous data** — the live site doesn't go blank just
   because one row is broken.

Fix the row, save the sheet, and the next pipeline run picks it up.
You don't need to redeploy anything.

## How long until a new row appears live?

About **two hours** in the worst case. The pipeline runs every two
hours on the hour, plus on-demand if engineering kicks it off. So a
row added at 10:05 appears live around 12:00–12:15.

If you need a row to go live immediately (e.g. an event launch), ping
engineering in Slack and they'll trigger a manual run.

## Who to contact

- **Campaign questions** (themes, what to write in a pull quote,
  whether to include a particular city): campaign lead.
- **Sheet not behaving** (a row that should be live isn't, a Slack
  rejection you can't understand): engineering — see Slack channel.
- **Adding a new country, language, or theme**: post in
  **#own-your-game-pipeline**. Engineering needs a small PR to
  recognise it, then the column will work.

Thank you for keeping the sheet clean — every row is a young person
on the site.
