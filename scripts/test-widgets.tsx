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

const { render, screen, fireEvent, cleanup } = await import("@testing-library/react");
const { act } = await import("react");
const React = (await import("react")).default;

const TigersAndSheep = (await import("../src/components/games/TigersAndSheep.tsx")).default;
const BallBoggle = (await import("../src/components/games/BallBoggle.tsx")).default;
const HanoiPuzzle = (await import("../src/components/games/HanoiPuzzle.tsx")).default;
const RestlessRow = (await import("../src/components/games/RestlessRow.tsx")).default;
const TrominoPuzzle = (await import("../src/components/games/TrominoPuzzle.tsx")).default;
const MachineBuilder = (await import("../src/components/games/fsm/builder/MachineBuilder.tsx")).default;

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

  ok(stat("Tigers") === "5", `tigers starts at 5, got "${stat("Tigers")}"`);
  ok(stat("Meals so far") === "0", "no meals yet");

  // NO VERDICT IS REPORTED. The widget must not tell the student whether the
  // sheep survives -- that is the question they are here to answer.
  const text = document.body.textContent ?? "";
  for (const leak of ["eaten", "safe", "survives", "the sheep is"]) {
    ok(!text.toLowerCase().includes(leak), `widget must not say "${leak}"`);
  }

  // Exactly one sheep, and every tiger is clickable.
  const sheep = () => document.querySelectorAll('button[aria-label="the sheep"]');
  ok(sheep().length === 1, `one sheep, got ${sheep().length}`);
  const tigerBtns = () => [...document.querySelectorAll("button")]
    .filter((b) => (b.getAttribute("aria-label") ?? "").startsWith("a tiger"));
  ok(tigerBtns().length === 5, `five tigers, got ${tigerBtns().length}`);
  ok(tigerBtns().every((b) => !(b as HTMLButtonElement).disabled),
     "every tiger may eat -- the widget does not decide for the student");

  // Eating: the eater becomes the sheep, the old sheep is gone, and the
  // animation resolves.
  await click(tigerBtns()[0]);
  await settle(() => stat("Tigers") === "4", 5000);
  ok(stat("Tigers") === "4", `after a meal, 4 tigers, got "${stat("Tigers")}"`);
  ok(stat("Meals so far") === "1", "one meal recorded");
  ok(sheep().length === 1, "there is still exactly one sheep afterwards");

  // It stays playable all the way down.
  await click(tigerBtns()[0]);
  await settle(() => stat("Tigers") === "3", 5000);
  ok(stat("Tigers") === "3", "a second meal works too");
  cleanup();
}

// ------------------------------------------------------------ Ball Boggle
{
  await act(async () => { render(React.createElement(BallBoggle)); });

  const readBins = () =>
    [...document.querySelectorAll('button[aria-label^="Bin "]')].map((b) =>
      Number((b.getAttribute("aria-label") ?? "").match(/(\d+) ball/)?.[1] ?? -1));

  ok(readBins().join(",") === "2,1,3", `the book's start is 2,1,3, got "${readBins()}"`);
  ok(stat("Moves made") === "0", "no moves yet");

  // THE NUMBER OF MOVES NEEDED IS THE ANSWER TO AN EXERCISE and must not
  // be shown, nor which bin to spare, nor which bin to keep.
  const text = () => (document.body.textContent ?? "").toLowerCase();
  for (const leak of ["fewest", "minimum", "moves needed", "moves left", "remaining", "fullest"]) {
    ok(!text().includes(leak), `widget must not say "${leak}"`);
  }
  ok(stat("Moves needed") === "" && stat("Fewest moves") === "", "no move count is displayed");

  // A move feeds every bin but the one clicked.
  await click(btn(/^Bin 1,/));
  ok(readBins().join(",") === "2,2,4", `sparing B1 gives 2,2,4, got "${readBins()}"`);
  ok(stat("Moves made") === "1", `one move counted, got "${stat("Moves made")}"`);

  // Undo, back to the start.
  await click(btn(/^Undo$/));
  ok(readBins().join(",") === "2,1,3", `undo restores 2,1,3, got "${readBins()}"`);
  ok(stat("Moves made") === "0", "and the counter with it");
  ok((btn(/^Undo$/) as HTMLButtonElement).disabled, "nothing left to undo");

  // --- Delegate ------------------------------------------------------
  await click(btn(/^Delegate$/));
  // Every bin may be kept as the star. Choosing badly is the student's to
  // discover, so no bin is disabled and none is marked as the right one.
  const binBtns = () => [...document.querySelectorAll('button[aria-label^="Bin "]')];
  ok(binBtns().every((b) => !(b as HTMLButtonElement).disabled),
     "every bin may be chosen as the star");

  await click(btn(/^Bin 3,/));
  ok(!!btn(/^Bin 3,.*the star bin$/), "the third bin is now the star");

  await click(btn(/hand the others to the expert/i));
  await settle(() => stat("Moves made") === "1");
  ok(readBins().join(",") === "2,2,4",
     `the expert levels B1 and B2 and feeds the star, got "${readBins()}"`);

  // The star is ahead, never behind, so sparing it closes the gap.
  await click(btn(/^Bin 3,/));
  ok(readBins().join(",") === "3,3,4", `got "${readBins()}"`);
  await click(btn(/^Bin 3,/));
  ok(readBins().join(",") === "4,4,4", `got "${readBins()}"`);
  ok((document.body.textContent ?? "").includes("Level."), "it reports that the bins are level");

  // One undo retracts the whole hand-over, not its last move.
  await click(btn(/^Reset$/));
  ok(readBins().join(",") === "2,1,3", "reset returns to the start");
  await click(btn(/^Bin 3,/));
  await click(btn(/hand the others to the expert/i));
  await settle(() => stat("Moves made") === "1");
  await click(btn(/^Undo$/));
  ok(readBins().join(",") === "2,1,3", `undo retracts the delegation, got "${readBins()}"`);
  ok(stat("Moves made") === "0", "and its moves");
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
  ok(!(document.body.textContent ?? "").includes("fewest"),
     "the widget must not announce that 15 is optimal");
  ok(stat("Best possible") === "", "the optimum is not displayed");
  cleanup();
}

// ------------------------------------------------------------ Restless Row
{
  await act(async () => { render(React.createElement(RestlessRow)); });

  // The book's row 4 2 5 1 3 has six inversions.
  // The inversion count is the answer to this chapter and must not be shown.
  ok(stat("Inversions I") === "" && stat("At the start I0") === "",
     "the inversion count is not displayed");
  ok(document.querySelectorAll("svg path").length === 0, "no inversion arcs are drawn");
  ok(stat("Moves made") === "0", "no moves yet");

  const readRow = () =>
    [...document.querySelectorAll('button[aria-label^="Entry"]')].map((b) => b.textContent?.trim());
  ok(readRow().join(" ") === "4 2 5 1 3", `row is 4 2 5 1 3, got "${readRow().join(" ")}"`);

  // Swap the 4 and the 2 -- an adjacent inversion.

  await click(btn(/Entry 4 at position 1/));
  await click(btn(/Entry 2 at position 2/));

  ok(readRow().join(" ") === "2 4 5 1 3", `after the swap: 2 4 5 1 3, got "${readRow().join(" ")}"`);
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

  ok(!!document.querySelector('button[aria-label$="the hole"]'), "a hole is marked at the start");

  // PLAY MODE MUST BE PLAYABLE FROM THE FIRST CLICK. The first version made
  // every click move the hole while the board was empty, so a tile could
  // never be laid at all -- and the earlier version of this test asserted
  // that broken behaviour as if it were the feature.
  await click(btn(/Row 3 column 3, empty/));
  ok(stat("Tiles laid") === "1", `a plain click lays a tile, got "${stat("Tiles laid")}"`);
  ok(stat("Squares left") === "60", "the tile covers three squares");

  // A second tile overlapping the first is refused.
  await click(btn(/Row 3 column 3/));
  ok(stat("Tiles laid") === "1", "an overlapping tile is refused");

  // Moving the hole is an explicit, armed action, and only on a clear board.
  await click(btn(/^Clear$/));
  ok(stat("Tiles laid") === "0", "Clear empties the board");
  await click(btn(/move the hole/i));
  await click(btn(/Row 1 column 1, empty/));
  ok(!!btn(/Row 1 column 1, the hole/), "an armed click moves the hole");
  ok(stat("Tiles laid") === "0", "moving the hole lays no tile");

  // ...and once disarmed, clicking lays a tile again rather than moving it.
  await click(btn(/Row 5 column 5, empty/));
  ok(stat("Tiles laid") === "1", "after moving the hole, clicks lay tiles again");
  await click(btn(/^Clear$/));

  // --- Undo ---------------------------------------------------------
  // It must reach a laid tile, a moved hole, and a quartering step alike.
  ok((btn(/^Undo$/) as HTMLButtonElement).disabled, "nothing to undo at the start");

  await click(btn(/Row 3 column 3, empty/));
  ok(stat("Tiles laid") === "1", "a tile is laid");
  await click(btn(/^Undo$/));
  ok(stat("Tiles laid") === "0", `undo removes the tile, got "${stat("Tiles laid")}"`);
  ok(stat("Squares left") === "63", "and the squares come back");
  ok((btn(/^Undo$/) as HTMLButtonElement).disabled, "history is empty again");

  // Undo a hole move, back to where it was.
  const holeAt = () => document.querySelector('button[aria-label$="the hole"]')
    ?.getAttribute("aria-label") ?? "";
  const originalHole = holeAt();
  await click(btn(/move the hole/i));
  await click(btn(/Row 2 column 2, empty/));
  ok(holeAt() !== originalHole, "the hole moved");
  await click(btn(/^Undo$/));
  ok(holeAt() === originalHole, `undo puts the hole back, got "${holeAt()}"`);

  // Undo several tiles in a row, newest first.
  await click(btn(/Row 3 column 3, empty/));
  await click(btn(/Row 5 column 5, empty/));
  ok(stat("Tiles laid") === "2", "two tiles down");
  await click(btn(/^Undo$/));
  ok(stat("Tiles laid") === "1", "one undone");
  await click(btn(/^Undo$/));
  ok(stat("Tiles laid") === "0", "both undone");
  await click(btn(/^Clear$/));

  // Switch to Delegate and quarter the board.
  await click(btn(/^Delegate$/));
  await click(btn(/quarter, and bridge/i));
  ok(stat("Tiles laid") === "1", `the bridge is one tile, got "${stat("Tiles laid")}"`);
  ok(stat("Squares left") === "60", "the bridge covers three squares");

  // Undo retracts a whole quartering step, not a third of a tile.
  await click(btn(/^Undo$/));
  ok(stat("Tiles laid") === "0", `undo retracts the quartering, got "${stat("Tiles laid")}"`);
  await click(btn(/quarter, and bridge/i));
  ok(stat("Tiles laid") === "1", "and it can be redone");

  // Hand the rest over and let the animation run out.
  await click(btn(/hand it all to the expert/i));
  await settle(() => stat("Tiles laid") === "21");
  ok(stat("Tiles laid") === "21", `an 8x8 board takes 21 tiles, got "${stat("Tiles laid")}"`);
  ok(stat("Squares left") === "0", `nothing left over, got "${stat("Squares left")}"`);
  ok(!!document.body.textContent?.includes("Covered."), "it reports completion");


  // Every square except the hole is covered, and the hole never is.
  const cells = [...document.querySelectorAll('button[aria-label^="Row "]')];
  ok(cells.length === 64, `64 cells drawn, got ${cells.length}`);
  const covered = cells.filter((c) => /covered$/.test(c.getAttribute("aria-label") ?? "")).length;
  const holes = cells.filter((c) => /the hole$/.test(c.getAttribute("aria-label") ?? "")).length;
  ok(covered === 63, `63 covered squares, got ${covered}`);
  ok(holes === 1, `exactly one hole, got ${holes}`);

  // One undo reverts the entire hand-over, not 20 of its 21 tiles.
  await click(btn(/^Undo$/));
  ok(stat("Tiles laid") === "1", `undo reverts the whole hand-over, got "${stat("Tiles laid")}"`);
  cleanup();
}

// ------------------------------------------------------------ Machine builder, nondeterministic
// A preset NFA for "ends in 00" (a test fixture, not stored for any page):
// p0 loops on 0 and 1 and also reads 0 to p1, p1 reads 0 to p2, p2 accepts.
// p0 has two arrows for 0 and p1, p2 have none for 1.
{
  const S = (id: string, x: number, accepting = false) => ({ id, name: id, x, y: 150, accepting });
  const ends00 = {
    states: [S("p0", 100), S("p1", 250), S("p2", 400, true)],
    start: "p0",
    edges: [
      { from: "p0", to: "p0", label: ["0", "1"] },
      { from: "p0", to: "p1", label: ["0"] },
      { from: "p1", to: "p2", label: ["0"] },
    ],
  };
  const text = () => (document.body.textContent ?? "").replace(/\s+/g, " ");
  const tapeInput = () => screen.getByLabelText("A string to run through the machine");
  const orbs = (kind: string) => document.querySelectorAll(`circle[data-orb="${kind}"]`).length;
  window.localStorage.clear();
  // The shim above passes 0 as the frame time, so an animation timed by its
  // frames (the builder's orbs) would never end. Real timestamps here.
  g.requestAnimationFrame = (cb: FrameRequestCallback) => dom.window.setTimeout(() => cb(performance.now()), 16);

  await act(async () => {
    render(React.createElement(MachineBuilder, { id: "nfa-test", language: "ends-and-beginnings/ends-00", nondeterministic: true, preset: ends00 }));
  });
  ok(/States: 3/.test(text()), "the preset is drawn: 3 states");
  ok(orbs("rest") === 1, `one orb at rest, on the start, got ${orbs("rest")}`);

  await act(async () => { fireEvent.change(tapeInput(), { target: { value: "100" } }); });
  ok(text().includes("It could end in p0, p1 or p2. p2 is accepting. Accepted."), `100 ends in {p0, p1, p2}, accepted: "${text()}"`);
  ok(orbs("rest") === 3, `an orb on each of the three states, got ${orbs("rest")}`);
  ok(text().includes("ε → {p0}") && text().includes("10 → {p0, p1}") && text().includes("100 → {p0, p1, p2}"), "the history lists the set after each prefix");

  await click(btn(/^Start$/));
  ok(text().includes("Not started. The machine is in p0, the start."), "Start goes back to the start");
  await click(btn(/^Step$/));
  ok(text().includes("Read 1 of 3. The machine could only be in p0."), "after 1, only p0");
  await click(btn(/^Step$/));
  ok(text().includes("Read 2 of 3. The machine could be in p0 or p1."), "after 10, p0 or p1");
  ok(orbs("run") === 2, `on 0 from p0 one orb runs along each of the two arrows, got ${orbs("run")}`);
  await settle(() => orbs("run") === 0, 3000);
  ok(orbs("run") === 0 && orbs("rest") === 2, `then they rest on p0 and p1, got ${orbs("rest")}`);

  await click(btn(/^Check$/));
  const verdict = () => [...document.querySelectorAll('[role="status"]')].map((e) => e.textContent).join(" ");
  ok(verdict().includes("Correct. Your machine accepts exactly the right strings"), `a correct NFA checks as correct, got "${verdict()}"`);
  ok(!/Two arrows|Not every state|fewer states/.test(verdict()), `no clash, no missing arrow, no claim about the fewest states: "${verdict()}"`);

  const keys = Object.keys(window.localStorage);
  ok(keys.some((k) => k === "dm.automata.v1::nfa:nfa-test") && !keys.some((k) => k === "dm.automata.v1::nfa-test"),
     `an NFA builder saves under its own key, got ${keys.join(" ")}`);

  await click(btn(/^Reset$/));
  ok(/States: 3/.test(text()) && (tapeInput() as HTMLInputElement).value === "", "Reset goes back to the preset, with an empty tape");
  cleanup();
}

// The same drawing with p0's loop left off accepts exactly 00: the check
// finds 000, the set empties on it, and the tape says so.
{
  const S = (id: string, x: number, accepting = false) => ({ id, name: id, x, y: 150, accepting });
  const exactly00 = {
    states: [S("p0", 100), S("p1", 250), S("p2", 400, true)],
    start: "p0",
    edges: [{ from: "p0", to: "p1", label: ["0"] }, { from: "p1", to: "p2", label: ["0"] }],
  };
  const text = () => (document.body.textContent ?? "").replace(/\s+/g, " ");
  await act(async () => {
    render(React.createElement(MachineBuilder, { id: "nfa-wrong", language: "ends-and-beginnings/ends-00", nondeterministic: true, preset: exactly00 }));
  });
  await click(btn(/^Check$/));
  ok(text().includes("Not yet. Your machine rejects 000, but it should accept it."), `the shortest wrong string is 000: "${text()}"`);
  ok((screen.getByLabelText("A string to run through the machine") as HTMLInputElement).value === "000", "and it is loaded on the tape");
  ok(text().includes("No state is left: every way of reading this string has got stuck. Rejected."), "the set empties on 000");
  ok(text().includes("000 → ∅"), "and the history shows the empty set");
  ok(![...document.querySelectorAll("svg text")].some((t) => /should (accept|reject)/.test(t.textContent ?? "")),
     "no single state is marked as where it should end");
  cleanup();
}

// The same drawing in the deterministic builder still clashes, exactly as before.
{
  const S = (id: string, x: number, accepting = false) => ({ id, name: id, x, y: 150, accepting });
  const ends00 = {
    states: [S("p0", 100), S("p1", 250), S("p2", 400, true)],
    start: "p0",
    edges: [{ from: "p0", to: "p0", label: ["0", "1"] }, { from: "p0", to: "p1", label: ["0"] }, { from: "p1", to: "p2", label: ["0"] }],
  };
  await act(async () => {
    render(React.createElement(MachineBuilder, { id: "dfa-test", language: "ends-and-beginnings/ends-00", preset: ends00 }));
  });
  await click(btn(/^Check$/));
  const t = (document.body.textContent ?? "").replace(/\s+/g, " ");
  ok(t.includes("Two arrows leaving p0 are labelled 0."), `the deterministic builder reports the clash: "${t}"`);
  ok(!t.includes("Where it could be"), "and shows no set history");
  cleanup();
}

// A free sandbox: no language, no Check.
{
  await act(async () => {
    render(React.createElement(MachineBuilder, { id: "sandbox", free: true, nondeterministic: true, alphabet: ["a", "b"] }));
  });
  const t = document.body.textContent ?? "";
  ok(!t.includes("MachineBuilder:"), `a sandbox needs no language: "${t.slice(0, 120)}"`);
  ok(screen.queryByRole("button", { name: /^Check$/ }) === null, "a sandbox has no Check button");
  ok(!!screen.getByRole("button", { name: /^Add start state$/ }), "but it can be built on");
  ok((screen.getByLabelText("A string to run through the machine") as HTMLInputElement).placeholder === "type a string of a b", "over its own alphabet");
  cleanup();
}

// ------------------------------------------------------------ Machine builder, the tree of runs
{
  const { THIRD_FROM_END } = await import("../src/components/games/fsm/nfaPresets.ts");
  // Not offered in the deterministic builder.
  await act(async () => { render(React.createElement(MachineBuilder, { id: "dfa-runs", language: "ends-and-beginnings/ends-00" })); });
  ok(screen.queryByRole("button", { name: /^Show runs$/ }) === null, "the deterministic builder has no Show runs");
  cleanup();

  window.localStorage.clear();
  await act(async () => {
    render(React.createElement(MachineBuilder, { id: "runs", free: true, nondeterministic: true, alphabet: ["0", "1"], preset: THIRD_FROM_END }));
  });
  const show = () => screen.getByRole("button", { name: /^Show runs$/ });
  const panel = () => document.querySelector("[data-runs-panel]");
  const nodes = () => [...document.querySelectorAll("[data-run-node]")];
  const dimmed = () => nodes().filter((n) => n.getAttribute("opacity") !== "1").length;
  const stuck = () => document.querySelectorAll("[data-stuck]").length;
  ok(show().getAttribute("aria-pressed") === "false" && panel() === null, "the panel starts closed");

  await click(show());
  ok(show().getAttribute("aria-pressed") === "true" && panel() !== null, "Show runs opens the panel");
  ok(nodes().length === 1 && nodes()[0].getAttribute("data-run-node") === "q0", "on the empty tape the tree is just the root");

  await act(async () => { fireEvent.change(screen.getByLabelText("A string to run through the machine"), { target: { value: "0110" } }); });
  ok(nodes().length === 10 && stuck() === 0, `0110: ten nodes and nothing stuck, got ${nodes().length} and ${stuck()}`);
  ok(nodes().filter((n) => n.querySelectorAll("circle").length === 2).length === 1, "one accepting node, drawn doubled");
  ok(dimmed() === 0, "at the end of the tape nothing is dimmed");
  await click(btn(/^Start$/));
  ok(dimmed() === 9, `at the start every row but the root is dimmed, got ${dimmed()}`);
  await click(btn(/^Step$/));
  await click(btn(/^Step$/));
  ok(dimmed() === 6, `after two symbols the rows below are dimmed, got ${dimmed()}`);
  ok((panel()?.textContent ?? "").includes("reads"), "the gutter is headed reads");

  await act(async () => { fireEvent.change(screen.getByLabelText("A string to run through the machine"), { target: { value: "1000" } }); });
  ok(nodes().length === 8 && stuck() === 1, `1000: eight nodes and one stuck attempt, got ${nodes().length} and ${stuck()}`);
  ok(!/accepting run|Accepted/.test(panel()?.textContent ?? ""), "the panel gives no verdict");

  const saved = JSON.stringify(Object.entries(window.localStorage));
  ok(saved.includes('\\"runs\\":true'), "the open panel is saved with the rest");
  await act(async () => { fireEvent.change(screen.getByLabelText("A string to run through the machine"), { target: { value: "01100101011" } }); });
  ok((panel()?.textContent ?? "").includes("The tree is drawn for the first") === false, "N3 on 11 symbols still fits");

  await click(show());
  ok(show().getAttribute("aria-pressed") === "false" && panel() === null, "pressing again closes it");
  cleanup();
}

console.log(fails === 0 ? "widgets: all checks passed" : `widgets: ${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
