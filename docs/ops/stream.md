# Cloudflare Stream (player-card video + the campaign film)

How the player-card video integration works (DEV-46) and what it needs to
run, plus the home-page campaign montage (DEV-124). Pairs with
[`secrets.md`](./secrets.md) (the env-var index) and the
player-card architecture notes in `CLAUDE.md`.

## The environment variables

| Variable                           | Scope  | Set where                                          |
| ---------------------------------- | ------ | -------------------------------------------------- |
| `PUBLIC_STREAM_CUSTOMER_SUBDOMAIN` | public | Cloudflare Pages deploy env (prod); CI `build` job |
| `PUBLIC_STREAM_MONTAGE_UID`        | public | Cloudflare Pages deploy env (prod); CI `build` job |

It's the `customer-{subdomain}` portion of the Stream URL — for a value of
`abc123def`, videos live at
`https://customer-abc123def.cloudflarestream.com/{videoId}/…`. It's public
because the resulting iframe URL is served to browsers.

Read it **only** through `src/lib/stream.ts` — never
`import.meta.env.PUBLIC_STREAM_CUSTOMER_SUBDOMAIN` directly:

- `hasStreamConfig()` — is it set? Guard with this before building a URL.
- `streamCustomerSubdomain()` — the value, or a loud throw when unset
  (a bug, not a fallback). The player guards with `hasStreamConfig()` and
  renders its error state instead of throwing.

Unset locally → pressing play shows the "video unavailable" state. Set it
in `.env.local` (copy `.env.example`) to exercise the real player in dev.

## The campaign montage (DEV-124)

The home-page campaign film is **another video on the same Stream
account** — it reuses `PUBLIC_STREAM_CUSTOMER_SUBDOMAIN`; only its UID is
new, in `PUBLIC_STREAM_MONTAGE_UID`, read through `streamMontageUid()`
(soft — `undefined` when unset, no throw). While the montage asset is in
production the variable stays unset everywhere: `CampaignFilm` renders the
poster regardless, and pressing play shows the unavailable state via the
player's empty-videoId guard. **Do not set a placeholder UID** to make it
"work". When the asset lands, set the UID in Cloudflare Pages (both the
Production and Preview environments) and mirror it into the GitHub
Actions `build` secrets, then verify playback on a preview deploy. The
9:16 poster frame is a Cloudflare Images asset
(`portraitUrl(id, "filmPoster")`, no face gravity) hard-coded in
`CampaignFilm.astro`.

## The iframe URL

Built by `streamIframeUrl(subdomain, videoId, options)` (pure, unit-tested
in `tests/unit/lib/stream.test.ts`):

```
https://customer-{subdomain}.cloudflarestream.com/{videoId}/iframe
  ?poster={encoded poster URL}
  &autoplay=true&muted=false&controls=true
  &letterboxColor=transparent
  &defaultTextTrack={lang}        # only when captions are selected (DEV-47)
```

- **Poster** — prefer the Cloudflare Images portrait
  (`portraitUrl(voice.portraitImageId, "card")`, only when the voice has
  one); it's already cache-warm from the tile. Falls back to Stream's
  auto-generated `streamThumbnailUrl(...)` when there's no portrait URL.
- **Controls** — Stream's native player owns play/pause/scrub/volume/CC.
  We don't reimplement them.
- **`defaultTextTrack`** — the captions chip (DEV-47) changes caption
  language by re-mounting the iframe with this param (the React `key` is
  the language, so a change remounts).

## Lazy loading (hard requirement)

No video bandwidth is used until the user explicitly presses play. The
iframe is **not in the DOM** until then — the pane shows the poster image
(a static URL, no playback engine) with a play button. This is asserted in
e2e: no `*.cloudflarestream.com` request fires before play.

## Player states (`src/islands/StreamPlayer.tsx`)

- **poster** — poster + play button, no iframe.
- **playing** — iframe mounted with `autoplay=true`.
- **error** — Stream couldn't load (a bad UID renders Cloudflare's own
  in-iframe error page, which the parent detects via the SDK `error` event;
  also reached immediately on play when the subdomain is unset). Shows the
  prototype's ↺ "video unavailable" pattern with a transcript pointer and a
  "Try again" that returns to poster.

## Player events

The iframe handles its own controls, so we don't need a player library.
We load the lightweight **Stream embed SDK** lazily (only after play, from
Cloudflare's CDN — see `src/lib/stream-sdk.ts`) purely to subscribe to
events the iframe can't surface cross-origin:

- `error` → drives the player's error state.
- `ended` → an analytics log (`console.log` for now; a future analytics
  epic can wire it to a real sink). Does **not** auto-advance to the next
  voice.
- The `play` analytics event is logged on the user's click (we know intent
  without the SDK).

If the SDK fails to load it's non-fatal: native controls still work, we
just miss the events.

## Both surfaces, one component

`StreamPlayer` fills the video pane in both player-card surfaces:

- **Desktop modal** (`PlayerCardModal`) — rendered as a React child,
  hydrated with the modal island.
- **Standalone `/voice/{id}` page** (`Player.astro`, the mobile full-page
  surface) — rendered as a nested Astro `client:idle` island in the card's
  video slot, hydrated independently of the SSR-static card around it (so
  it doesn't disturb `PlayerControls`' DOM enhancement).

## CI

The `build` job sets `PUBLIC_STREAM_CUSTOMER_SUBDOMAIN` (real public value
when the secret is present, else a `demo-customer` placeholder) so the
artefact e2e + Lighthouse run against has a working iframe URL. The iframe
never actually plays video in headless Chromium — Cloudflare blocks it —
so the specs assert the iframe element mounts with the right `src`, not
that video is visibly playing.
