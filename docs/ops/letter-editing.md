# Editing the letter

The letter is the campaign's longest piece of editorial copy. Unlike
the per-voice data (which lives in a Google Sheet and updates every
two hours), the letter prose is **hand-edited markdown reviewed by
PR**. The campaign team makes editorial changes via the same review
process developers use.

This document covers:

1. [Where the files live](#where-the-files-live)
2. [The PR workflow](#the-pr-workflow)
3. [Structural directives](#structural-directives)
4. [Adding a new language](#adding-a-new-language)
5. [Reviewer requirements](#reviewer-requirements)

## Where the files live

```
content/letter/
├── en.md   ← canonical English (the source of truth)
├── es.md   ← Spanish translation (placeholder until translated)
├── fr.md   ← French translation (placeholder)
├── ar.md   ← Arabic translation (placeholder, direction: rtl)
└── pt.md   ← Portuguese translation (placeholder)
```

Each file has two parts:

- **YAML frontmatter** (between the leading `---` lines) — structured
  metadata the renderer reads (language, direction, button labels).
- **Markdown body** — the letter prose, with a handful of custom
  block directives (see below) marking the structural moments.

The English file is canonical. When the campaign team wants to
change the letter, the change starts in `en.md` and translators
update the other language files to match. There is no automatic
translation step — humans translate.

## The PR workflow

1. **Branch from `main`.** Name it `letter-edit-{short-description}`
   (e.g. `letter-edit-clearer-ask`).
2. **Edit the file(s).** Most edits touch `en.md`; large editorial
   changes also touch the other language files so they stay roughly
   in sync (translators can refine after).
3. **Open a PR.** Title format: `letter: {what changed}`.
4. **Tag reviewers.** At a minimum:
   - The campaign lead (or their delegate)
   - One developer (for the structural directives + schema)
5. **Address review feedback.** This may include rewording, tightening,
   or restoring directive anchors.
6. **Merge when approved.** The next site build picks up the new
   prose automatically.

The Vitest spec at `tests/unit/content/letter.test.ts` validates
each file's frontmatter on every CI run, so a broken YAML block
fails fast.

## Structural directives

The letter renderer (epic landing later) reads these custom directives
and replaces them with designed components. **Keep them where they
are.** Moving or removing one changes the page's visual rhythm.

The English letter uses these directives in this order:

| Directive            | Purpose                                        | Example                                                                        |
| -------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `::dropcap`          | Opening sentence with drop-cap first letter    | `::dropcap\nWe are writing to you...\n::`                                      |
| `::reframe`          | The "that is what sport means" moment          | `::reframe\nThat is what sport, and the 2026 FIFA World Cup, means to us.\n::` |
| `::tagline-question` | The central question, set in display face      | `::tagline-question\nWhose game is it anyway?\n::`                             |
| `::pivot`            | The pivot toward "people first"                | `::pivot\nBut football should be about people first.\n::`                      |
| `::values`           | The five-value list (community, friendship, …) | `::values\n- community\n- friendship\n...\n::`                                 |
| `::ask`              | The ask line ("Please help protect…")          | `::ask\nPlease help protect the spirit of football.\n::`                       |
| `::closing-call`     | The closing summary line                       | `::closing-call\nIt is time to kick junk food...\n::`                          |

In addition, HTML comments mark waypoints the right-rail navigator
scrolls to:

```html
<!-- waypoint:opening -->
<!-- waypoint:question -->
<!-- waypoint:ask -->
<!-- waypoint:signoff -->
```

Four waypoints, in that order. Don't add a fifth without coordinating
with the letter-page renderer.

## Adding a new language

1. Copy `en.md` to `content/letter/{code}.md` (use the BCP 47 short
   form, e.g. `de` for German). Also add the code to `LETTER_LANGS`
   in `schemas/letter.ts`.
2. Update the frontmatter:
   - `lang: {code}`
   - `direction: rtl` if it's a right-to-left script, otherwise `ltr`
   - `salutation`, `signoff_italic`, `share.*` translated into the
     target language. `signoff_block` ("Own Your Game") usually stays
     English — only override if the language has a strong
     transliteration convention.
3. Translate the body — every paragraph, every directive's content.
   Keep the directives themselves untranslated (`::ask` stays `::ask`;
   the contents inside it get translated).
4. Add the language to the language switcher (epic 5 work).
5. Open a PR. Tag the campaign lead and a native-speaker reviewer.

The schema's `LETTER_LANGS` enum keeps the file list and the renderer
in sync — TypeScript will fail to compile if a referenced language
file doesn't exist (once the loader lands in DEV-34).

## Reviewer requirements

| Change                                                          | Minimum reviewers                            |
| --------------------------------------------------------------- | -------------------------------------------- |
| Typo / minor wording fix in a single language                   | 1 (campaign team OR dev)                     |
| Substantive editorial change to `en.md`                         | 2 (campaign lead + 1 other)                  |
| Adding a new language                                           | 2 (campaign lead + native-speaker reviewer)  |
| Restructuring (adding/removing a directive, changing waypoints) | 3 (campaign lead + dev + design/agency lead) |

These are baselines; tag more people as the change warrants. Letters
are public, durable artifacts — better to over-review than ship a
typo that hangs around on the site for months.

## When this workflow stops scaling

If non-technical campaign team members start finding the PR review
flow clunky (Markdown is fine; YAML frontmatter, less so), the
escape hatch is a headless markdown CMS like
[Decap](https://decapcms.org) sitting in front of these files. It
commits the same way a developer would — same files, same review
path. We've deliberately avoided that complexity for MVP; revisit if
the friction shows up.
