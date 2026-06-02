# Incoming translations — French, Spanish, Arabic

Source: campaign team translators, delivered as Word documents.
Extracted and structured by Claude (in chat with Craig) for Claude Code consumption during Epic 10 (DEV-70 onwards) and the DEV-33 follow-up.

## What's in this bundle

| File                    | Content                             | Suggested destination                                                                |
| ----------------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| `letter-es.md`          | Letter prose, Spanish               | `content/letter/es.md` (replaces the DEV-33 stub)                                    |
| `letter-fr.md`          | Letter prose, French                | `content/letter/fr.md`                                                               |
| `letter-ar.md`          | Letter prose, Arabic                | `content/letter/ar.md`                                                               |
| `about-es.md`           | About page prose, Spanish           | See "About page integration" below                                                   |
| `about-fr.md`           | About page prose, French            | ditto                                                                                |
| `about-ar.md`           | About page prose, Arabic            | ditto                                                                                |
| `homepage-strings.json` | Home page UI strings, three locales | Drop into `src/i18n/dictionaries/{es,fr,ar}.json` under the right keys during DEV-70 |

## What's NOT here

- **Portuguese.** Not in this delivery. Stays as a stub awaiting a future translation pass.
- **UI strings beyond the homepage section.** The translators delivered prose, not the full UI string surface. Nav labels, button text, filter chip labels, voice counter pill text, footer columns, empty states, accessibility labels — all still need translating. For DEV-70, these stay as English fallback values with `TODO: translate` markers per the kickoff plan.
- **Homepage hero / voice counter card / "Why this letter" band.** The homepage delivery only covered the "Today's starting eleven" section. The hero copy, voice counter card kicker/copy, and "Why this letter" band remain English-fallback.

## Letter markdown — two structural decisions to flag

The letter `.md` files match the directive structure of `en.md`: frontmatter with `lang` / `direction` / `salutation` / `signoff_italic` / `signoff_block` / `share` labels, `<!-- waypoint:* -->` anchors at the four scroll-spy points, and the six directives (`::dropcap`, `::reframe`, `::tagline-question`, `::pivot`, `::values`, `::ask`).

Two places where the translated content didn't map 1:1 to the English structure and I made a call:

### 1. The `::values` block uses single theme words

The translators delivered the values list as full sentences in the prose flow — "Sobre la comunidad. Sobre la amistad." / "Sur la communauté. Sur l'amitié." / "للمجتمع. للصداقة." etc.

I structured the `::values` directive with the bare theme words (`comunidad` / `amistad` / `confianza` / `alegría` / `pertenencia` in Spanish, and equivalents in French and Arabic) because the directive renders as the dot+label horizontal motif (per DEV-53), not as a sentence list. The "Sobre la X" / "Sur la X" sentences are dropped from the markdown.

**If the design has shifted to wanting the sentence form**, this is the place to revisit. The renderer would need updating too.

### 2. The `::ask` block holds only the first ask; the other two render as body

The translators delivered three asks as a bulleted list. The English prototype's `::ask` directive is a single anchor statement. I structured the markdown with the first ask inside `::ask` and the other two as plain body paragraphs after it.

This preserves all three pieces of content and matches the prototype's single-anchor design. **If the design wants a three-item ask list**, the renderer would need a new directive (e.g. `::ask-list`) — out of scope here, would warrant a follow-up issue.

## About page integration

The current `/about` page sources its prose from `src/lib/about.ts` (TypeScript constants), not from markdown. For i18n, three options:

1. **Refactor `about.ts` to read from `content/about/{lang}.md`** — matches the letter pattern, most consistent across the codebase
2. **Split `about.ts` per locale** (`src/lib/about/{lang}.ts`) — minimal change, keeps the existing shape
3. **Keep `about.ts` English-only**, route to locale-specific markdown via the loader — middle ground

Claude Code's call during DEV-70 (or as a small follow-up if i18n for About is out of scope for DEV-70). The markdown in this bundle is portable to any of these approaches.

## Known issues to flag for native-speaker review

These are things I noticed during extraction. None are blocking. All should be confirmed with the translator before launch. **Preserved as-delivered in the markdown** — fixing them silently isn't my call, but they should be flagged.

### Arabic letter

- **Possibly-missing connector** in `::reframe`:
  - As delivered: "هذا هو ما يعنيه الرياضة كأس العالم لفيفا 2026 بالنسبة لنا."
  - Suspected fix: "هذا هو ما يعنيه الرياضة **و**كأس العالم لفيفا 2026 بالنسبة لنا." — adding "و" (and) between الرياضة and كأس to read "sport AND the World Cup."

- **Possibly-missing preposition** in the body paragraph about advertising:
  - As delivered: "ومع ذلك، باتت الأماكن التي نحبها تمتلئ أكثر فأكثر الإعلانات والرعايات التجارية..."
  - Suspected fix: "...تمتلئ أكثر فأكثر **بـ**الإعلانات..." — adding "بـ" before الإعلانات to read "filled WITH advertising."

### French about page

- **Double period at end of one sentence** in the paragraph about junk food marketing: "...ne jouent pas toujours un jeu équitable**..**" — likely a translator typo. Preserved as-delivered.

### General

- **Brand name treatment differs by script.** Arabic uses "الفيفا" (al-fifa, with the Arabic definite article); French and Spanish use "FIFA" in Latin script. This is the translator's choice and consistent with conventional Arabic usage of foreign names. No action needed.
- **"Own Your Game" stays in Latin script across all locales** — matches how the brand wordmark is designed. The signoff in every letter ends with "Own Your Game" untranslated.

## Tagline centralisation note

The recurring brand tagline ("Whose game is it anyway?" / "¿De quién es este juego?" etc.) appears in:

- The home page's "Today's starting eleven" section (covered in `homepage-strings.json`)
- The letter, inline as `::tagline-question` (in each letter `.md` file)
- The about page, inline as a blockquote (in each about `.md` file)

When wiring DEV-70, consider whether to centralise the tagline string under a single `tagline.question` key and reference it from each surface, or keep it inline per file. The latter is simpler; the former is more DRY. Either works; Claude Code's call. I've included the tagline in `homepage-strings.json` under `tagline.question` to make the centralisation path easy if chosen.

## Future translation deliveries

Translators delivered Word documents. The originals are not preserved in the repo — the markdown extraction is the canonical source going forward. If translators deliver future updates (Portuguese, additional UI strings, content revisions), the same extraction pattern applies.

If the campaign team wants to move to a more direct translator workflow (translators editing markdown / JSON directly), that's a future improvement worth discussing — but for now Word-doc-to-markdown is fine.
