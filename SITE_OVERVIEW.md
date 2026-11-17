# Site overview

Architecture notes for the Discrete Mathematics course site.

**This file is tracked in git**, unlike its counterpart in
`HighSchool/MathematicalThinking/Site`, which is gitignored there. That convention was
copied at first and then reversed: this file carries the arena rule below, which is a
standing editorial decision rather than a working note, and a rule that lives only in an
untracked file on one laptop is a rule that gets lost. The project's `CLAUDE.md` points
here as the source of truth for the site.

Astro + MDX + React + Tailwind + KaTeX, static output, deployed to GitHub Pages under
`/discrete-mathematics/`. The skeleton is deliberately the same as the MathematicalThinking
site so that knowledge transfers between the two; the look is not.

## Layout

```
src/
  config/course.ts       team, office, booking link
  config/visibility.ts   release gating (two allow-lists)
  layouts/Base.astro     shell, theme bootstrap, laser pointer
  layouts/Chapter.astro  breadcrumb, in-chapter contents, prev/next
  components/Petersen.astro   the emblem
  components/games/           the puzzles
  components/games/models/    puzzle rules, no React
  pages/                      routes
scripts/                 tests
```

Routing is three tiers: `/` → `/<chapter>/` → `/<chapter>/<slug>`. Page discovery is by
`import.meta.glob` and ordering by frontmatter `order`; the only hand-maintained list is
the `allChapters` array on the home page, because its order and blurbs are editorial.

## Conventions

- **Frontmatter arrives as `Astro.props.frontmatter`**, not as top-level `Astro.props`.
  Reading the latter yields undefined for everything and the page renders bare. This is the
  single most common way to break a new page.
- **Every internal link is `${base}/...`.** A bare `/foo` works in dev and 404s in
  production, because the site is served from a project subpath.
- **Islands are always `client:visible`.** They are below the fold by definition — the
  puzzle statement comes first.
- **Puzzle rules live in `models/` with no React in them**, so they can be tested directly.
  The component holds only state and rendering.

## The front page

Shaped after the MathematicalThinking home page (August 2026): the emblem sits beside the
title rather than above it, drawn in `--ink` so it reads as a mark and not as a link, and
the chapter cards follow with no "Chapters" heading over them. Then the teaching team, then
office hours in a bordered card.

Two things are deliberately absent.

- **Nothing sits under the course title.** The subtitle and the paragraph that used to be
  there both described what the course covers, and the syllabus is not settled. Put a line
  back only when there is one that will still be true in a year.
- **The Induction chapter card carries no number.** `ChapterCard`'s `index` prop is optional
  and the home page omits it. The in-chapter contents still numbers the puzzles 01–05, which
  is ordering within a chapter and is a different thing.

## The palette

`Slides/AESTHETIC.md` in the parent project is the source of truth for everything except the
accent; `src/styles/global.css` implements it. Two rules from that file carry real weight
here:

1. **Never mix a token towards white.** On a charcoal canvas that lightens the mark you
   meant to soften. Mix towards `--bg`.
2. **Terms and headings do not share a colour.** `--term` (amber) names a new word;
   `--accent` (rose) is structural.

**Dark is the default**, unlike the MathematicalThinking site. The palette was built
dark-first for a lecture hall; the light theme is the book's printed identity. The
bootstrap script in `Base.astro` falls back to dark, and `:root` with no `data-theme`
carries the dark values.

**The site's accent is azure, and the decks' is not.** This is the one deliberate
divergence from AESTHETIC.md, taken at the author's call in August 2026: the brand rose
`#B70170` read as aggressive at screen sizes, and it sat at about 2.6:1 on the charcoal
canvas — below the 4.5:1 needed for body text and below even the 3:1 large-text threshold.
AESTHETIC.md already conceded it was "on the dark side of comfortable". The azure chosen is
`coolmark` from that same file, so the site is still inside the course's palette rather than
wearing an invented colour. The decks and the book keep the rose.

**The accent exists at two strengths, and this is not decoration.**

- `--accent` (`#8FBEEA`, about 8.6:1 on charcoal) carries anything body-sized: links, the
  current contents entry, focus rings, hover borders.
- `--accent-deep` (`#5E9DD0`, about 5.8:1) carries large display type and solid fills.

In the light theme both are `#1F6FB2`, about 5.1:1 on off-white. Amber `#E0AE5C` is about
8.4:1 on charcoal and needs no lift. If the accent is ever changed, re-check those three
numbers before anything else.

One thing was left rose: `--tile-1`, the first of the five tromino fills, which is `#B70170`
because the five were greedy-coloured to match `ind-tromino-tiled.pdf` in the Induction book.
Changing it would put the widget out of step with the figure it copies.

## KaTeX

Math renders at **build time**: `remark-math` + `rehype-katex` through a shared `unified`
processor set as `markdown.processor` in `astro.config.mjs`, which MDX inherits. Astro 7
deprecated the per-integration `remarkPlugins`/`rehypePlugins` arrays the MathematicalThinking
site uses; passing them there now warns.

**A React island cannot use `$…$`.** The build never looks inside an island, so the dollars
ship literally to the browser. This is a real trap and costs an afternoon to rediscover.

No widget currently needs math — the readouts that carried it (`2ⁿ-1`, `(4ⁿ-1)/3`, the
inversion count) were exactly the ones removed under the arena rule, so the `Tex.tsx`
component that existed for this was deleted rather than left as dead code. If a widget ever
does need a formula, it is a few lines to bring back:

```tsx
import katex from "katex";
// ...
<span dangerouslySetInnerHTML={{ __html:
  katex.renderToString(src, { throwOnError: false, output: "html" }) }} />
```

The stylesheet is already imported globally, so only the JS would be new. The
MathematicalThinking site takes the other route — a small `*emphasis*` / `` `code`` ``
parser — which suits a chapter that uses no symbols at all.

## The puzzles

### The rule that governs everything here

**A puzzle app is an arena, not an answer.** It exists so a student can push the pieces
around and form a suspicion of their own. Anything that hands over the punchline kills the
thought it was built to provoke, and that includes far more than prose:

- **No verdicts.** Tigers does not say whether the sheep survives. That is the question.
- **No derived quantities that are the insight.** Hanoi does not print `2ⁿ-1`, the tromino
  does not print `(4ⁿ-1)/3`, and the Restless Row shows neither the inversion count nor the
  arcs between inverted pairs. Each of those *is* the thing the chapter proves.
- **No reasoning on the student's behalf.** An earlier version of Tigers carried a panel
  reading "ask the expert about an island of n-1 tigers: there the sheep is eaten, so a
  tiger that eats here would be safe". That is the entire solution, printed on the page.
- **No deciding for them.** Tigers used to disable the eat button when eating was unwise,
  which quietly told the student the answer through the affordance. Every tiger is now
  clickable; working out which ones *should* eat is the exercise.
- **No "what to notice" sections.** The page states the puzzle, says which control does
  what, and stops.

What may be shown: raw state (the board, the row, the pegs), counts of the student's own
actions (moves made, tiles laid, squares left), and whether a move was refused.

*Ask the expert* and *Delegate* are deliberate exceptions, and were kept at the author's
call. They are mechanisms to operate rather than conclusions to read: pressing one shows a
process happening, and what it means is still left to the student.

If a future widget needs a spoiler affordance for lecture use, it should be opt-in and off
by default — never the resting state.

### Chapter constraints

All four sit in chapters 1–6 of the induction text, which means **descent language only**.
No "base case", no "inductive hypothesis", no "P(n)", no "by induction on n". The teaching
script also says to speak of **the expert**, never of recursion — so the Hanoi button reads
*Ask the expert* and the tromino mode is *Delegate*.

| Puzzle | Chapter | What the student can do |
|---|---|---|
| Tigers and Sheep | 1 | Set the island size; click any tiger to make it eat and watch it become the sheep. |
| Ball Boggle | 2 | Click a bin to spare it and feed all the others. Under *Delegate*, keep one bin as the star and hand the rest to the expert. |
| Tower of Hanoi | 3 | Move discs; *Ask the expert* transfers the sub-tower as one act. |
| Tromino Trouble | 4 | Lay tiles by hand, move the hole, or quarter the board a level at a time. Undo steps back through any of it. |
| The Restless Row | 6 | Swap under three different rules and count their own moves. |

The Restless Row chapter has **no figure in the book**, so this widget is its only picture.
Its three move-sets are one control rather than three widgets, because the contrast between
them is the point of the chapter's exercises.

`boardSize.tsx` is ported from the MathematicalThinking site: a localStorage preference
broadcast on a window `CustomEvent`, so separate React roots stay in step, plus `fitCell`,
which clamps a board to the prose column. Its storage key is `dm-board-size`.

## Tests

`npm test` runs five suites (`scripts/`):

- **ball boggle** — the plan levels 600 random configurations of 2 to 7 bins; the chapter's
  own claim, that a star chosen as a fullest bin ends up level with or ahead of the rest
  after the expert finishes, checked over 600 more; that an *emptiest* star finishes behind,
  which is why the choice matters; and that no plan is shorter than the minimum.
- **hanoi** — the move list is legal and of length `2ⁿ-1` for n ≤ 10; the two-stage
  delegation is offered, aims correctly, and finishes; scattered discs offer no delegation.
- **tromino** — exhaustive for n ≤ 3, i.e. every one of the 84 hole positions: 84 boards
  tiled with no overlap, nothing on the hole, every tile a genuine L, exact tile count, and
  a proper 5-shading. Spot checks at n = 4.
- **restless row** — an adjacent move drops `I` by exactly one across 400 random rows, and
  every run from a given row takes exactly `I₀` moves; far swaps can drop more; the
  unrestricted rule can raise `I`.
- **widgets** — jsdom + Testing Library, driving the actual components: clicks land, illegal
  moves are refused and uncounted, `n=4` Hanoi finishes in 15 moves, the 8×8 board ends at
  21 tiles with 63 covered squares and one hole.

Model suites run under `node --experimental-strip-types`. The widget suite is bundled by
esbuild first, because node cannot strip JSX.

Two traps worth knowing if these are edited:

- **Scope any DOM query to its container.** A Slider and a Stat can carry the same words —
  both say "Tigers" — so a document-wide search finds the wrong one.
- **An animated queue needs one `act()` per tick.** A single long `act()` flushes only at
  the end, so the chained effect never schedules its successor and only one step runs.
- **A test can enshrine a bug.** The first tromino test asserted that clicking a cell moves
  the hole — which was true, and was the bug: Play mode was deadlocked, because a tile could
  not be laid until a tile had been laid. The suite now asserts that a plain click *lays a
  tile*, and separately that no widget prints its own answer.

## Undo (tromino)

Whole-state snapshots, not inverse operations: the moves are not all the same shape — one
tile, a quartering of every sub-board at once, a hole move, the whole hand-over — and a
board this size is cheap to copy. One press therefore retracts one *step* as the student
understands it, so undoing the hand-over reverts all 21 tiles rather than the last one.

Ctrl+Z / Cmd+Z is wired to the same action. Its listener is registered once and calls
through a ref, so it does not close over a stale `undo`. The page's laser-pointer handler
bails out on a modifier key, so the two do not collide.

## Dev toolbar

Disabled in `astro.config.mjs`. It is fixed to the bottom centre of the viewport, which is
exactly where the puzzle boards sit: it covered the tromino grid and the Restless Row tiles
and swallowed clicks on them, which read as "none of the buttons work".

## The Automata chapter (ported Nov 2026)

`src/pages/automata/` is pages 2 to 11 of the MathematicalThinking site's **Machines**
chapter, copied in November 2026: the design-problem pages with a machine builder under
every problem, and *Do These Agree?*. Its page 1 (what a machine is) and page 12 (*Beyond
Reach*) were left out at the author's call. The architecture, the no-solutions rule and
the builder's behaviour are documented in that site's `SITE_OVERVIEW.md` under *The
Machines pattern* and *The Machines problem pages*. Read those before changing anything
here.

What changed in the port:

- Components live in `src/components/games/fsm/` (only what the ten pages import, so
  not `machines.ts`, whose solution machines no page may use). The builder's
  `usePersistent` and button kit, which live under `circuits/problems/` there, are in
  `src/components/games/shared/` here.
- Work is saved under `dm.automata.v1:<page>:<id>` rather than `qrmt.machines.v1`, since
  both sites are served from the same GitHub Pages origin.
- `exact-words` problem 3 accepts `hate` and `math` (the original's second word was
  the other course's name), and the odd-part example on `somewhere-inside` changed to
  match. The same page's problem 9 now says `other`, not `x`, for "any other letter",
  as the overview there says every statement should.
- The `--fsm-*` and `--mcq-*` tokens were added to `global.css`, with the original's
  dark values in the (default) dark theme.
- `scripts/test-machines.ts` is the original's `machine-builder.test.ts` with the page
  paths changed. It runs inside `npm test` and takes about two and a half minutes.

Unlike the induction widgets, the builder's *Check* gives a verdict on the student's own
machine. That checks the student's work and does not hand over an answer, so it is not
taken to break the arena rule above.

## Not yet built

The other ten puzzles in the induction text — the Water War, Block Bungle, burnt pancakes,
handshake parity, Ducci, the fuel-can lap, pile splitting, and the rest — and any page for
the Discrete Mathematics book's own chapters. Handshake parity is the other chapter with no
figure in the book, so it is the next most valuable one to build.
