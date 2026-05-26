# Contributing to Own Your Game

How to make a change that the project, the tooling, and the safeguarding
rules will accept.

For everything that isn't covered here, `CLAUDE.md` at the repo root and
the per-area READMEs (`design/`, `src/islands/ui/`, `tests/`,
`tests/e2e/`) are the source of truth.

## Setup

```bash
nvm use            # picks up .nvmrc → Node 22 (≥22.12.0 required)
corepack enable    # makes the pinned pnpm available
pnpm install       # installs deps AND wires the Husky hooks
                   # (via the prepare script)
```

After `pnpm install`, every `git commit` will run the pre-commit hook
(`pnpm lint-staged` — ESLint + Prettier on staged files) and the
commit-msg hook (commitlint + the forbidden-trailers check).

## Branches and PRs

- One branch per Linear issue. Use the `gitBranchName` Linear suggests
  on the issue.
- One PR per issue, targeting `main`. Squash merge.
- PR title: `DEV-XX: <issue title>`. Body copies the issue's Goal and
  walks through each acceptance criterion.

## Commit messages

Every commit follows
[Conventional Commits](https://www.conventionalcommits.org/) and the
commit-msg hook enforces it.

```
<type>(<optional scope>): <imperative summary>

<optional body explaining what and why, wrapped at 100 chars>

Part of DEV-XX
```

**Allowed types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`,
`style`, `perf`, `ci`, `build`.

**Subject rules** (enforced):

- Lowercase
- No trailing period
- ≤ 72 characters
- Imperative mood (`add`, not `added`/`adds`)
- Don't put the issue ID in the subject — only in the body via the
  `Part of DEV-XX` trailer (Linear watches for this exact phrase)

**Body and footer:** wrap at 100 characters per line.

**Forbidden trailers** (rejected by the commit-msg hook):

- `Co-authored-by:`
- `Signed-off-by:`
- `Generated with …`
- `🤖 Generated …`

These are blocked because the project keeps its history single-author
and uncluttered with attribution. If you really need to credit
someone, mention them in the PR description instead.

## Commit grouping

- One commit = one coherent change. Group by intent, not by file.
- A typical issue is 3–8 commits.
- No `wip` commits, no "fix typo" chase commits — rebase or amend
  before pushing. (Local rebase before push is fine; force-push of an
  already-pushed branch is not — discuss first.)
- No mixed-concern commits (e.g. a Tailwind tweak + a new test in the
  same commit).

## The local loop

Before you push, run:

```bash
pnpm lint           # eslint . --max-warnings 0
pnpm format:check   # prettier --check .
pnpm typecheck      # astro check && tsc --noEmit
pnpm test           # vitest
pnpm e2e            # playwright (slower; run for changes touching pages)
pnpm build          # final sanity
```

The pre-commit hook catches the cheap stuff (ESLint + Prettier on
staged files). CI (DEV-19) runs the full suite — but failing locally
is faster than failing in CI.

## When the hooks get in your way

Don't bypass `--no-verify` unless you genuinely cannot make progress —
hook failures are pointing at a real issue most of the time. If you
have to bypass:

1. State it explicitly in your commit message body.
2. Mention it in the PR description with the reason.
3. Fix the underlying issue in a follow-up commit on the same branch.

Repeated `--no-verify` use erodes the gate the team relies on. Don't.
