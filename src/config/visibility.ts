// -----------------------------------------------------------------------
//  Release gating.
// -----------------------------------------------------------------------
//
//  Two allow-lists. A chapter or page not named here is hidden from every
//  listing -- the home grid, the chapter hub, the in-chapter contents, and
//  prev/next -- and its own URL shows a "Not yet released" panel instead of
//  the content.
//
//  This is LISTING-LEVEL gating, not security: the HTML is still built and
//  still deployed. Anyone who guesses a slug and reads the page source can
//  see it. Do not put anything genuinely confidential behind it, such as
//  an unreleased exam.
//
//  To release a page: uncomment its line, commit, push. The deploy takes
//  about a minute.
// -----------------------------------------------------------------------

export const VISIBLE_CHAPTERS: readonly string[] = [
  "induction",
];

export const VISIBLE_PAGES: readonly string[] = [
  "induction/tigers-and-sheep",
  "induction/tower-of-hanoi",
  "induction/tromino-trouble",
  "induction/restless-row",
];

export function isChapterVisible(slug: string): boolean {
  return VISIBLE_CHAPTERS.includes(slug);
}

export function isPageVisible(chapter: string, pageSlug: string): boolean {
  if (!isChapterVisible(chapter)) return false;
  return VISIBLE_PAGES.includes(`${chapter}/${pageSlug}`);
}
