# SEO & social sharing

Search-engine and social-preview hygiene for the site (DEV-81). All of it
is static, generated at build time — nothing runs at request time.

## Canonical origin (`site`)

`astro.config.mjs` sets `site: "https://ownyourgame.org"` — the production
origin (DEV-4). It drives:

- absolute `og:image` and canonical URLs (relative paths break social
  crawlers — see `src/lib/seo.ts`),
- the sitemap's `<loc>` and `hreflang` URLs.

It's hard-coded (not env-driven) for the same reason as `CAMPAIGN_SHARE_URL`
(`~/lib/header`): the domain is fixed even though the DNS cutover (DEV-80)
hasn't flipped. If the domain ever changes, update it in **both** places.

## robots.txt

`public/robots.txt` — allows everything except `/demo/*` (the demo surfaces
also ship to prod for now), and points crawlers at the sitemap index. Static
file, served verbatim at `/robots.txt`.

## sitemap

`@astrojs/sitemap` emits `sitemap-index.xml` + `sitemap-0.xml` at build.
Config (in `astro.config.mjs`):

- **`i18n`** — emits `hreflang` alternates for every locale (mirrors
  `src/i18n/config.ts`), so crawlers understand the multi-language tree.
- **`filter`** — drops routes that must not be indexed: `/demo/*`, the
  `noindex` error pages (`/404`, `/500`), and the non-HTML data endpoints
  (the DEV-107 lazy-load index + per-voice JSON).

## Meta tags (`BaseLayout`)

Every page emits, via `BaseLayout` + helpers in `src/lib/seo.ts`:

- `<link rel="canonical">` + `og:url` — origin-qualified, **query and hash
  stripped** so the squad's filtered URLs and the letter's `#anchors` don't
  fork the canonical.
- `og:title`, `og:description`, `og:type`, `og:site_name`, `og:image`.
- `og:locale` (`language_TERRITORY`, e.g. `en_GB`, `es_ES`, `ar_AR`,
  `pt_BR`) + an `og:locale:alternate` for each other locale.
- `twitter:card` (`summary_large_image`), `twitter:title/description/image`.

## OG images

The pages reference five static cards at `public/og/{default,home,letter,
squad,about}.png` (1200×630). `default.png` is the fallback for any page
without its own card (the error pages, and any voice with no portrait).

**Per-voice shares use the real Cloudflare Images portrait**
(`playerOgImage`, `~/lib/player`), not a generated card — the old
"name/theme/age/city" card was dropped in the DEV-108 trim.

### Pending (not blockers for the code)

- **Final card art** — the committed PNGs are solid-paper placeholders.
  Claude Design produces the finals (brief on DEV-81); export over the same
  filenames in `public/og/`.
- **`twitter:site` handle** — omitted until the campaign confirms a Twitter/X
  account; set `TWITTER_SITE` in `src/lib/seo.ts` once it exists (the tag is
  emitted only when set, to avoid pointing at a non-existent handle).
- **UNICEF lockup** — the cards (and footer) use the partnership mark, whose
  colour/lockup is pending brand sign-off (DEV-117).

## Verifying

After the domain is live (DEV-80), run each page type through the Twitter
Card Validator and the Facebook Sharing Debugger, and eyeball a WhatsApp
preview on a phone (DEV-84 checklist). Before then, the e2e suite
(`tests/e2e/seo.spec.ts`) asserts the tags, robots, and sitemap shape.
