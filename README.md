# Discrete Mathematics — course site

Companion web build for the Discrete Mathematics course. The first chapter is a set of
playable versions of the puzzles the companion text on induction is built from.

Astro + MDX + React islands + Tailwind, math by KaTeX, static output deployed to GitHub
Pages under the base path `/discrete-mathematics/`.

## Running it

```bash
npm install
npm run dev        # http://localhost:4321/discrete-mathematics/
npm test           # puzzle rules + widget interaction tests
npm run build      # static output into dist/
npm run preview    # serve the built output
npm run check      # astro check (types)
```

Node 22 or newer. If node is not on the machine, it installs without root:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.nvm/nvm.sh && nvm install 22
```

## Adding content

**A new page in an existing chapter.** Drop an `.mdx` file into
`src/pages/<chapter>/` with this frontmatter, then add its slug to `VISIBLE_PAGES` in
`src/config/visibility.ts`:

```yaml
layout: ../../layouts/Chapter.astro
title: The Restless Row
order: 4
chapter: induction
chapterTitle: Puzzles from Induction
blurb: One line for the chapter listing.
description: One line for the page's meta description.
```

Ordering, the in-chapter contents and the prev/next links all come from `order`; nothing
else needs editing.

**A new chapter.** Add `src/pages/<slug>/index.astro` (copy `induction/index.astro`), add
an entry to the `allChapters` array in `src/pages/index.astro`, and list the slug in
`VISIBLE_CHAPTERS`.

**A new puzzle.** Put the rules in `src/components/games/models/<name>.ts` with no React in
them, and a test beside the others in `scripts/`. The component goes in
`src/components/games/` and is imported into MDX with `client:visible`.

## Releasing

`src/config/visibility.ts` holds two allow-lists. Anything not named there is hidden from
every listing and its own URL shows a "Not yet released" panel. Uncomment, commit, push.

This is listing-level gating, not security: the HTML is still built and deployed, so do not
put anything genuinely confidential behind it.

## Deploying

Push to `main`. The workflow in `.github/workflows/deploy.yml` runs the tests, builds, and
publishes. In the GitHub repo settings, **Pages → Source** must be set to **GitHub Actions**.

If the repository name is ever changed, `base` in `astro.config.mjs` has to change with it.
