# Transcripts

Hand-edited transcripts for the player card's "Read transcript" chip
(DEV-47). One markdown file per voice, named by the voice's `id`:

```
content/transcripts/amina-ke-001.md
```

- **Plain markdown body.** A leading `---` frontmatter block is tolerated
  (and ignored); everything after it is shown as the transcript prose.
- **The filename's stem must match the voice `id`** in `content/voices.json`
  exactly. A voice with no matching file (or an empty one) shows
  "Transcript not yet available for this voice."
- **First names only** — the safeguarding rule applies here too. Never
  write a surname, school, or other identifying detail into a transcript.

These live outside `voices.json` on purpose: transcripts can be long and
most voices won't have one, so keeping them separate avoids bloating the
voices payload every page loads (`src/lib/content.ts` → `getTranscript`).

This README also keeps the directory in git while it's otherwise empty.
