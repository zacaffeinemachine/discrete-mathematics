/**
 * Interaction tests for the four puzzle islands.
 *
 * The model tests cover the rules; these cover the WIRING -- that clicking
 * the thing the student sees actually changes the state it should.
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
// node 22 defines a getter-only `navigator`, so it has to be redefined
// rather than assigned.
Object.defineProperty(g, "navigator", {
  value: dom.window.navigator,
  configurable: true,
  writable: true,
});
g.HTMLElement = dom.window.HTMLElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.getComputedStyle = dom.window.getComputedStyle;
g.requestAnimationFrame = (cb: FrameRequestCallback) => dom.window.setTimeout(() => cb(0), 0);
g.cancelAnimationFrame = (id: number) => dom.window.clearTimeout(id);
g.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
g.IS_REACT_ACT_ENVIRONMENT = true;

const { render, screen, fireEvent, cleanup, within } = await import("@testing-library/react");
const { act } = await import("react");
const React = (await import("react")).default;

const TigersAndSheep = (await import("../src/components/games/TigersAndSheep.tsx")).default;
const HanoiPuzzle = (await import("../src/components/games/HanoiPuzzle.tsx")).default;
const RestlessRow = (await import("../src/components/games/RestlessRow.tsx")).default;
const TrominoPuzzle = (await import("../src/components/games/TrominoPuzzle.tsx")).default;

let fails = 0;
const ok = (c: boolean, m: string) => {
  if (!c) { console.error("FAIL:", m); fails++; }
};

const norm = (t: string | null | undefined) =>
  (t ?? "").replace(/\s+/g, " ").trim().toLowerCase();

/**
 * The value shown under a Stat's label.
 *
 * Must be scoped to the Stat wrapper: a Slider carries the same words (both
 * say "Tigers"), so a document-wide search finds the slider first.
 */
function stat(label: string): string {
  for (const div of document.querySelectorAll("div.flex.flex-col")) {
    const kids = div.children;
    if (kids.length >= 2 && norm(kids[0].textContent) === norm(label)) {
      return kids[1].textContent?.trim() ?? "";
    }
  }
  return "";
}

/**
 * Let an animated queue drain. Each tick needs its own act() so React
 * commits between timeouts; one long act() would flush only at the end and
 * the chained effect would never schedule its successor.
 */
async function settle(done: () => boolean, budgetMs = 20000) {
  const t0 = Date.now();
  while (!done() && Date.now() - t0 < budgetMs) {
    await act(async () => {
      await new Promise((r) => dom.window.setTimeout(r, 40));
    });
  }
  return done();
}

const btn = (name: RegExp | string) => screen.getByRole("button", { name });
const click = async (el: Element) => { await act(async () => { fireEvent.click(el); }); };

// ------------------------------------------------------------ Tigers
{
  await act(async () => { render(React.createElement(TigersAndSheep)); });

  // Default is 5 tigers -- odd, so eating is safe and the sheep goes.
  ok(stat("Tigers") === "5", `tigers starts at 5, got "${stat("Tigers")}"`);
  ok(stat("The sheep is") === "eaten", `5 tigers: sheep eaten, got "${stat("The sheep is")}"`);
  ok(!(btn(/a tiger eats/i) as HTMLButtonElement).disabled, "5 tigers: eating is offered");

  await click(btn(/a tiger eats/i));
  ok(stat("Tigers") === "4", `after a meal, 4 tigers, got "${stat("Tigers")}"`);
  ok(stat("Meals so far") === "1", "one meal recorded");
  ok(stat("The sheep is") === "safe", `4 tigers: sheep safe, got "${stat("The sheep is")}"`);
  ok((btn(/a tiger eats/i) as HTMLButtonElement).disabled, "4 tigers: nobody dares");

  // 99 is odd, so the sheep is eaten -- the book's actual question.
  await click(btn(/start with 99/i));
  ok(stat("Tigers") === "99", `preset gives 99, got "${stat("Tigers")}"`);
  ok(stat("The sheep is") === "eaten", "99 tigers: the sheep is eaten");
  ok(!(btn(/a tiger eats/i) as HTMLButtonElement).disabled, "99 tigers: eating is offered");
  cleanup();
}

// ------------------------------------------------------------ Hanoi
{
  await act(async () => { render(React.createElement(HanoiPuzzle)); });

  ok(stat("Moves") === "0", "hanoi starts at zero moves");
  const pegA = () => btn(/^Peg A/);
  const pegC = () => btn(/^Peg C/);
  ok(/4 discs/.test(pegA().getAttribute("aria-label") ?? ""), "peg A starts with 4 discs");

  // A legal move, then an illegal one.
  await click(pegA());
  await click(pegC());
  ok(/3 discs/.test(pegA().getAttribute("aria-label") ?? ""), "a disc left peg A");
  ok(/1 discs/.test(pegC().getAttribute("aria-label") ?? ""), "a disc reached peg C");
  ok(stat("Moves") === "1", `one move counted, got "${stat("Moves")}"`);

  await click(pegA());   // top of A is disc 2
  await click(pegC());   // C holds disc 1 -- refused
  ok(stat("Moves") === "1", "an illegal drop is refused and not counted");
  ok(/1 discs/.test(pegC().getAttribute("aria-label") ?? ""), "peg C is unchanged after refusal");

  // Reset, then let the expert do the whole thing.
  await click(btn(/^Reset$/));
  ok(stat("Moves") === "0", "reset clears the counter");
  await click(btn(/watch it done/i));
  const arrived = await settle(() => /4 discs/.test(pegC().getAttribute("aria-label") ?? ""));
  ok(arrived, "the tower arrives on peg C");
  ok(stat("Moves") === "15", `n=4 takes 15 moves, got "${stat("Moves")}"`);
  cleanup();
}

// ------------------------------------------------------------ Restless Row
{
  await act(async () => { render(React.createElement(RestlessRow)); });

  // The book's row 4 2 5 1 3 has six inversions.
  ok(stat("Inversions I") === "6", `book row has I=6, got "${stat("Inversions I")}"`);
  ok(stat("Moves made") === "0", "no moves yet");

  const readRow = () =>
    [...document.querySelectorAll('button[aria-label^="Entry"]')].map((b) => b.textContent?.trim());
  ok(readRow().join(" ") === "4 2 5 1 3", `row is 4 2 5 1 3, got "${readRow().join(" ")}"`);

  // Swap the 4 and the 2 -- an adjacent inversion.
  const before = Number(stat("Inversions I"));
  await click(btn(/Entry 4 at position 1/));
  await click(btn(/Entry 2 at position 2/));
  const after = Number(stat("Inversions I"));
  ok(readRow().join(" ") === "2 4 5 1 3", `after the swap: 2 4 5 1 3, got "${readRow().join(" ")}"`);
  ok(after === before - 1, `I fell by exactly one: ${before} -> ${after}`);
  ok(stat("Moves made") === "1", "one move counted");

  // A pair that is NOT an adjacent inversion is refused.
  const moves1 = stat("Moves made");
  await click(btn(/Entry 2 at position 1/));
  await click(btn(/Entry 5 at position 3/));
  ok(stat("Moves made") === moves1, "a non-adjacent pair is refused under the chapter's rule");
  cleanup();
}

// ------------------------------------------------------------ Tromino
{
  await act(async () => { render(React.createElement(TrominoPuzzle)); });

  // Default board is 8x8 = 21 tiles.
  ok(stat("Tiles laid") === "0", "no tiles yet");
  ok(stat("Squares left") === "63", `an 8x8 board minus its hole is 63, got "${stat("Squares left")}"`);

  // Before any tile is laid, clicking moves the hole.
  const holeBefore = document.querySelector('button[aria-label$="the hole"]');
  ok(!!holeBefore, "a hole is marked at the start");
  await click(btn(/Row 1 column 1, empty/));
  ok(!!btn(/Row 1 column 1, the hole/), "clicking an empty square moves the hole there");

  // Switch to Delegate and quarter the board.
  await click(btn(/^Delegate$/));
  await click(btn(/quarter, and bridge/i));
  ok(stat("Tiles laid") === "1", `the bridge is one tile, got "${stat("Tiles laid")}"`);
  ok(stat("Squares left") === "60", "the bridge covers three squares");

  // Hand the rest over and let the animation run out.
  await click(btn(/hand it all to the expert/i));
  await settle(() => stat("Tiles laid") === "21");
  ok(stat("Tiles laid") === "21", `an 8x8 board takes 21 tiles, got "${stat("Tiles laid")}"`);
  ok(stat("Squares left") === "0", `nothing left over, got "${stat("Squares left")}"`);
  ok(!!document.body.textContent?.includes("Covered, with 21 tiles"), "it reports success");

  // Every square except the hole is covered, and the hole never is.
  const cells = [...document.querySelectorAll('button[aria-label^="Row "]')];
  ok(cells.length === 64, `64 cells drawn, got ${cells.length}`);
  const covered = cells.filter((c) => /covered$/.test(c.getAttribute("aria-label") ?? "")).length;
  const holes = cells.filter((c) => /the hole$/.test(c.getAttribute("aria-label") ?? "")).length;
  ok(covered === 63, `63 covered squares, got ${covered}`);
  ok(holes === 1, `exactly one hole, got ${holes}`);
  cleanup();
}

console.log(fails === 0 ? "widgets: all checks passed" : `widgets: ${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
