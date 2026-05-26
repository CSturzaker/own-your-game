# src/islands/ui/

Thin, Tailwind-styled wrappers around Radix UI Primitives. The whole point
of this directory is that **feature code never imports from
`@radix-ui/*` directly** — it imports from `~/islands/ui/`. That way the
project's modal scrim, dropdown chevron, tooltip arrow, focus ring, etc.
are decided once, not per-component.

## When to add a wrapper here

Add a wrapper when a Radix primitive needs:

- **Project-default styling** that several features will reuse (modal
  scrim + paper card, popover arrow + paper background, …).
- **A constrained API**, e.g. forcing a `Title` so the dialog is
  screen-reader-correct.

Skip the wrapper and import from `@radix-ui/*` directly only when:

- A single feature uses the primitive in a one-off way that won't repeat.
- You haven't yet figured out the project default. Better to ship the
  one-off, then promote to a wrapper when a second use appears.

When in doubt, wrap it. Promoting one-offs later is more painful than
unwrapping a too-eager wrapper.

## File and naming convention

- One file per primitive: `Dialog.tsx`, `Popover.tsx`, `Tooltip.tsx`, …
- Each file exports a single namespace object (`export const Dialog = { … }`)
  with the same part names as Radix (`Root`, `Trigger`, `Portal`, `Content`,
  `Overlay`, `Title`, `Description`, `Close`, …) so the import shape feels
  identical to using Radix directly.
- Re-export untouched parts as-is. Only `forwardRef`-wrap the parts that
  carry project styling.

Example: `import { Dialog } from "~/islands/ui/Dialog";` →
`<Dialog.Root>…<Dialog.Content>…</Dialog.Content></Dialog.Root>`.

## Styling

- Tailwind v4 utility classes only. No CSS-in-JS, no styled-component
  library, no per-file `.module.css`. Design tokens come from
  `src/styles/global.css`'s `@theme` block (`bg-paper`, `text-ink`,
  `rounded-card`, …).
- When the caller passes `className`, append theirs to the wrapper's
  defaults and let Tailwind's natural cascade resolve any conflicts on
  the caller's side. Don't write a merge utility — it isn't worth it
  here.

## The `asChild` pattern

Radix's `asChild` prop lets you swap the rendered element for one of
your own, inheriting Radix's behaviour without an extra DOM node:

```tsx
<Dialog.Trigger asChild>
  <button class="btn btn--primary">Open</button>
</Dialog.Trigger>
```

It uses `@radix-ui/react-slot` under the hood, which is already
installed. Use `asChild` whenever you want a `<Trigger>` or `<Close>`
to render as your styled button rather than a default `<button>`.

## Hydration

Wrappers in this directory are React components — they only run after
hydration. Mount them from an Astro page or component via one of the
`client:*` directives:

- `client:load` — hydrates immediately. Use when interaction is
  expected on first paint (e.g. an "Open" button above the fold).
- `client:visible` — hydrates when the island enters the viewport.
  Preferred for pages with many islands (the home page later).
- `client:idle` — hydrates after the browser is idle. Useful for
  non-critical interactivity.

## Adding a new primitive — checklist

1. `pnpm add @radix-ui/react-<primitive>`
2. Create `src/islands/ui/<Primitive>.tsx`, re-export the parts, wrap
   the ones that need project styling (look at `Dialog.tsx` for the
   pattern).
3. Add a Vitest + React Testing Library spec under
   `tests/unit/islands/ui/<Primitive>.test.tsx` covering the default
   open/close behaviour and keyboard accessibility (Vitest itself lands
   with DEV-16).
4. If the primitive has a visual default, drop a demo page under
   `src/pages/demo/<primitive>.astro` so the styling can be eyeballed
   without spinning up a feature page.
