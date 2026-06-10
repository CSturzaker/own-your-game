# DNS, TLS & HSTS

Production domain configuration (DEV-80). Everything in this doc lives in
the Cloudflare dashboard, not the repo — it's the record of what was set,
why, and how to recover if HTTPS breaks. Configured 2026-06-10 (the
non-gated cutover; runbook on DEV-80).

## Primary domain

**`own-your-game.org`** — registered with Cloudflare Registrar (DEV-4) and
attached to the Pages project as a custom domain. The domain lives in the
same Cloudflare account as Pages, so the DNS records (CNAME flattened to
A/AAAA at the apex) were auto-created; nothing was added by hand.
`dig own-your-game.org` should return Cloudflare A/AAAA records and the
`adel`/`mustafa.ns.cloudflare.com` nameservers.

There are **no defensive variant domains**: the `.com` and the
unhyphenated `.org` were unavailable at registration — `ownyourgame.org`
sits on third-party nameservers and is not ours. So there are no variant
redirects, only:

- `www.own-your-game.org` → 301 → bare domain. A zone Redirect Rule (the
  "Redirect from www to root" template), preserving path + query. The bare
  domain is canonical.
- `http://…` → 301 → `https://…` via **Always Use HTTPS** (below).

`own-your-game.pages.dev` (the Pages-native hostname) stays publicly
reachable — it can't be gated at our account role. Canonical tags on every
page point at the primary origin so it doesn't get indexed as duplicate
content (see `docs/ops/seo.md`).

## SSL/TLS settings

All under the zone's **SSL/TLS** section in the dashboard:

- **Encryption mode: Full (strict).** Pages always presents a valid
  certificate on the origin side, so strict is safe. Never downgrade to
  Flexible — it causes redirect loops with Always Use HTTPS.
- **Certificate: Universal SSL** (free, auto-issued and auto-renewed by
  Cloudflare). Issuance after attaching the domain took minutes; can take
  up to ~15.
- **Always Use HTTPS: on** (Edge Certificates) — every `http://` request
  301s to `https://`.

## HSTS

Enabled **after** HTTPS was confirmed working (never before — see
rollback). Every response carries:

```
strict-transport-security: max-age=15552000; includeSubDomains
```

- `max-age=15552000` is 180 days — the Cloudflare dashboard's "6 months"
  preset. (DEV-80's spec wrote the value as 15768000 / 182.5 days; the
  dashboard preset is 15552000. Same initial-rollout posture — recorded
  here so nobody chases the 2.5-day delta as a misconfiguration.)
- `includeSubDomains`: on.
- **`preload`: off — deliberately.** The browser preload list is
  effectively one-way (removal is slow and unreliable), and the site's
  post-World-Cup future is undecided. Do not submit to the preload list.

### Escalation plan

1. **Now:** 6 months (the value above), through launch.
2. **~3 months post-launch**, once the domain and HTTPS setup have been
   stable: raise to **12 months** in the same dashboard control.
3. **Preload: only** if the campaign gets a confirmed multi-year future on
   this domain. Until then, never.

## Caching

- **Browser Cache TTL: Respect Existing Headers** (Caching →
  Configuration) — Astro + Pages already emit correct `cache-control`.
- **Tiered Cache: on** (Caching → Tiered Cache) — free, fewer origin
  fetches.

## Rollback if SSL breaks

HSTS makes "turn off HTTPS" impossible: any browser that has seen the
header refuses plain HTTP for the remaining `max-age`. Rollback therefore
always means **fix HTTPS**, in this order:

1. **Check certificate status** — SSL/TLS → Edge Certificates → Universal
   SSL should show **Active**. If it's stuck or expired, disable and
   re-enable Universal SSL to force re-issuance (Universal SSL is robust;
   this is the rare case).
2. **Check the encryption mode** is still **Full (strict)**. A mode change
   (e.g. to Flexible) breaks the site with redirect loops while looking
   like a certificate problem.
3. **Check the custom domain** is still attached to the Pages project
   (Workers & Pages → project → Custom domains). If it detached, re-add
   it — DNS records regenerate automatically.
4. While the primary domain is broken, the site remains reachable at
   `own-your-game.pages.dev` — that hostname is independent of the custom
   domain and its certificate.

Do **not** disable HSTS as a remediation step — it doesn't help clients
that already have the pin, and re-enabling later restarts trust from zero.
