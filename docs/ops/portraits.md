# Portraits — upload workflow & hosting

How a young person's portrait still gets from a country office onto the
site. Portraits are hosted on **Cloudflare Images** (DEV-95); the site
builds face-cropped delivery URLs from a per-voice **image ID** stored in
the voices sheet.

This is an **admin task** — uploads happen in the Cloudflare dashboard,
never on the site (there is no public uploader, by design — safeguarding).

## How it fits together

1. A country office supplies a portrait photo (captured during the
   recording session).
2. The campaign lead uploads it to Cloudflare Images via the dashboard.
3. Cloudflare returns an **image ID**.
4. The lead pastes that ID into the **Portrait image ID** column of the
   voices sheet, on the young person's row.
5. Within ~2 hours the pipeline syncs the sheet and the portrait appears
   on the site — cropped to the face automatically.

Until step 4 is done, the site shows a neutral silhouette in place of the
photo (DEV-26). That is a deliberate, safe default — never a broken image.

## Photo requirements

Give Cloudflare the best source you have; it does the cropping.

- **Face clearly visible**, reasonably lit, looking toward the camera.
- **At least 600×600px**; 1200×1200px or larger is better (the card/poster
  upscales on large screens).
- **Any reasonable aspect ratio** — portrait, square, or landscape.
  Cloudflare crops to the face automatically (`gravity=face`), so a
  phone-orientation photo is fine; you don't need to pre-crop.
- **JPEG, PNG, or WebP.** Cloudflare converts and optimises on delivery.

## Upload, step by step

1. Sign in to the Cloudflare dashboard and open **Images**.
2. Click **Upload** and select the portrait file (or drag it in).
3. Wait for the upload to finish — the image appears in the grid.

## Finding the image ID

After upload, click the image in the Images grid. The **Image ID** is
shown in the details panel — a string of letters, digits, and hyphens,
e.g. `2cdc28f0-017a-49c4-9ed7-87056c83901a`. Copy it.

- It is **not** a filename. There is no `.jpg`/`.webp` on the end, no
  spaces, and no slashes. If what you copied has any of those, it's the
  wrong value — copy the **Image ID**, not the filename or a delivery URL.
- The ID is what the delivery URL is built from:
  `https://imagedelivery.net/{account-hash}/{image-id}/{transform}`. The
  account hash is configured once for the site (see below); you only ever
  paste the per-image ID.

## Adding the ID to the sheet

Paste the copied ID into the **Portrait image ID** column on that voice's
row. Leave it blank if the photo isn't ready yet — the silhouette covers
the gap. Format and behaviour are also covered in
[`sheet-guide-for-campaign-team.md`](./sheet-guide-for-campaign-team.md).

## Configuration (one-time, engineer/admin)

These are set once when the account is provisioned, not per portrait:

- **Flexible variants** must be enabled (Images → toggle). This is what
  lets the site pass transform parameters (including `gravity=face`) in
  the delivery URL. Named variants alone can't carry face detection.
- **Account hash** — Images → Settings. It's the `imagedelivery.net/{hash}`
  segment. It lives in the `PUBLIC_CF_IMAGES_ACCOUNT_HASH` env var (deploy
  environment + GitHub Actions secret; see [`secrets.md`](./secrets.md)).
  It is public (it ships in every delivery URL).
- **Referer restrictions** — limit hotlinking to `own-your-game.org` and
  `*.pages.dev`. A baseline guard, not watertight (see safeguarding).
- **API token** — a "Cloudflare Images Edit" token is needed only for
  scripted/bulk uploads, not for the site (the site never uploads). Keep
  it in the team password manager.

## Safeguarding

These are children's photos. Treat them accordingly.

- **Restrict dashboard access.** Only the people who need to upload should
  have Cloudflare Images access. The Edit API token is sensitive — keep it
  in the password manager, not in chat/email.
- **Treat image IDs as semi-sensitive.** Delivery URLs are public (no
  signed URLs on the current plan), and because flexible variants are on,
  any transform string resolves against a known image ID. Don't post image
  IDs in casual channels; they travel with the campaign site only.
- **Referer restrictions are a baseline**, not a hard control — they deter
  casual hotlinking but can be spoofed. If a future safeguarding review
  needs stronger control, the upgrade path is Cloudflare Images signed
  URLs (paid) or a Worker gating access.
- **No surnames, ever** — the portrait is paired only with a first name in
  the UI (the permanent schema rule).

## Failure modes

- **Face crop looks off** (head cut, off-centre): the face detector missed.
  Re-upload with a tighter source crop around the face and update the ID.
- **Broken / missing image on the site**: confirm the ID in the sheet is
  the Image ID (not a filename), that the photo still exists in the
  dashboard, and that `PUBLIC_CF_IMAGES_ACCOUNT_HASH` is set for the
  environment. While unresolved, the silhouette fallback renders cleanly.
- **Corrupt or low-quality source**: re-request the original from the
  country office; don't upscale a tiny image.
