# design/

Design source-of-truth for Own Your Game. Read-only reference — no file
in this directory is built, type-checked, or shipped to the site. The
running site lives under `src/`; this directory exists so every later
issue has a single, authoritative answer for "what should this look like".

## What's here

```
design/
├── README.md             # this file
└── handoff/              # the agency bundle, verbatim — do not edit
    ├── README.md         # agency instructions for coding agents
    └── project/
        ├── Own Your Game - Hi-fi Prototype.html   ← primary reference
        ├── Own Your Game - Wireframes.html        ← older, lower-fidelity
        ├── hifi-*.jsx, hifi-tokens.css            ← hi-fi pages + tokens
        ├── wf-*.jsx, wireframes.css               ← wireframe pages
        ├── design-canvas.jsx, .design-canvas.state.json
        ├── assets/                                ← OYG + UNICEF logos
        └── uploads/                               ← additional brand assets
```

`handoff/` is committed exactly as the agency exported it. Don't refactor,
restyle, or "tidy" it — provenance matters, and later issues quote line
numbers from these files.

## Which file to read

For any visual implementation, the **hi-fi prototype** is the answer:

- `handoff/project/Own Your Game - Hi-fi Prototype.html` is the entry
  point — read it top-to-bottom, then follow its imports.
- `handoff/project/hifi-*.jsx` are the React-via-Babel-CDN page
  implementations. Read the JSX directly for layout, copy, and behaviour.
- `handoff/project/hifi-tokens.css` is the design token source. DEV-14
  translates these into Tailwind config; this file stays unchanged as
  the canonical source.
- `handoff/project/hifi-appendix.jsx` is the system reference: spacing
  scale, radius tokens, component inventory, colour matrix, navigation
  map, breakpoints, loading skeletons.

The wireframe (`wf-*.jsx`, `Own Your Game - Wireframes.html`) is an
older, lower-fidelity exploration. Use it for context on intent, not for
final visuals.

## How to use it

The prototype is React-via-Babel-CDN — it renders in a browser without a
build step. You don't need to run it. The agency README is explicit:

> Don't render these files in a browser or take screenshots unless the
> user asks you to. Everything you need — dimensions, colors, layout
> rules — is spelled out in the source. Read the HTML and CSS directly.

When you're implementing a feature, the workflow is:

1. Find the relevant page file in `handoff/project/` (e.g. `hifi-home.jsx`).
2. Read it in full. Note pixel values, colours, spacing, behaviour.
3. Recreate it in `src/` using Astro + React + Tailwind. Match the
   visual output pixel-perfectly; don't copy the prototype's structure
   where it doesn't fit Astro.

## Isolated from project tooling

- `tsconfig.json` excludes `design/**`
- `.gitattributes` marks `design/handoff/**` as `linguist-vendored`
- ESLint and Prettier will gain their own ignore rules in DEV-18

Don't import from `design/` in any `src/` file. The handoff is reference;
the implementation is the source.
