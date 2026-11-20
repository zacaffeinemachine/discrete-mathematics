// The nondeterministic machine builder's engine: reading a string as a set
// of states, and the exact check of an NFA against a problem's language.
// Run from Site/ with:  node --experimental-strip-types scripts/test-nfa.ts
//
// The NFAs here are textbook examples built by hand for the test, not
// solutions stored for any page: the site stores no machine anywhere.

import {
  allStrings, checkNfa, compare, compareNfa, nfaFromEdges, runMachine, runNfa, runTree, specFromEdges, targetOf,
  type DrawnEdge, type MachineSpec, type NfaSpec,
} from "../src/components/games/fsm/builder/engine.ts";

let fails = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) { console.error("FAIL:", msg); fails++; }
};

const B = ["0", "1"];
const LOWER = "abcdefghijklmnopqrstuvwxyz".split("");

// A drawn machine: states in order, the first is the start.
const nfa = (states: string[], accepting: string[], edges: [string, string, string][], alphabet = B, conv: Record<string, string[]> = {}) => {
  const drawn: DrawnEdge[] = edges.map(([from, to, label]) => ({ from, to, label: label.split(",") }));
  return nfaFromEdges(states, states[0], accepting, drawn, alphabet, conv);
};
// mulberry32: a small seeded generator whose low bits are not periodic.
const rng = (a: number) => (n: number) => {
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return (((t ^ (t >>> 14)) >>> 0) % n);
};
const show = (sets: string[][]) => sets.map((s) => `{${s.join(",")}}`).join(" ");

// The shortest string (shortlex) on which the machine and the predicate
// disagree, by brute force up to length maxLen, or null.
const brute = (m: NfaSpec, alphabet: string[], accepts: (s: string) => boolean, maxLen: number) => {
  for (const w of allStrings(alphabet, maxLen)) if (runNfa(m, w).accepted !== !!accepts(w)) return w;
  return null;
};

// ---- third symbol from the end is 1 --------------------------------------------
const third = nfa(["p0", "p1", "p2", "p3"], ["p3"], [
  ["p0", "p0", "0,1"], ["p0", "p1", "1"], ["p1", "p2", "0,1"], ["p2", "p3", "0,1"],
]);
const thirdL = (s: string) => s.length >= 3 && s[s.length - 3] === "1";
{
  ok(third.unlabeled.length === 0 && third.unknown.length === 0, "third: a clean drawing");
  ok(third.spec.arrows.p0["1"]?.join() === "p0,p1", `third: p0 on 1 goes to p0 and p1, got ${third.spec.arrows.p0["1"]}`);
  ok(third.spec.arrows.p3["0"] === undefined, "third: p3 has no arrow for 0, and that is allowed");

  const w = runNfa(third.spec, "0110");
  const want = [["p0"], ["p0"], ["p0", "p1"], ["p0", "p1", "p2"], ["p0", "p2", "p3"]];
  ok(show(w.sets) === show(want), `third on 0110: ${show(w.sets)}, expected ${show(want)}`);
  ok(w.accepted && w.diedAt === null, "third accepts 0110 and never dies");

  const v = runNfa(third.spec, "1000");
  ok(v.sets[4].join() === "p0" && !v.accepted, `third on 1000 ends {p0}, rejected, got ${show(v.sets)}`);
  ok(runNfa(third.spec, "").sets.length === 1 && !runNfa(third.spec, "").accepted, "third rejects the empty string");
}

// ---- a set that empties --------------------------------------------------------
{
  // exactly "01": a -0-> b -1-> c
  const m = nfa(["a", "b", "c"], ["c"], [["a", "b", "0"], ["b", "c", "1"]]);
  const w = runNfa(m.spec, "0110");
  ok(w.diedAt === 2, `exactly 01 on 0110 dies at the third symbol, got ${w.diedAt}`);
  ok(show(w.sets) === "{a} {b} {c} {} {}", `and stays empty, got ${show(w.sets)}`);
  ok(!w.accepted, "and rejects");
  ok(runNfa(m.spec, "01").accepted, "exactly 01 accepts 01");
  const T = targetOf({ alphabet: B, accepts: (s) => s === "01" });
  ok(checkNfa(m.spec, B, T.dfa, T.index).status === "ok", "an NFA with no dead state checks as correct");
}

// ---- other in NFA mode -----------------------------------------------------------
{
  // p0 reads 1 to p1, and `other` loops: other is every symbol no other arrow
  // from p0 reads, so just 0 here, not a second choice on 1.
  const m = nfa(["p0", "p1"], ["p1"], [["p0", "p1", "1"], ["p0", "p0", "other"]]);
  ok(m.expanded[1].join() === "0", `other on p0 reads 0 only, got ${m.expanded[1]}`);
  ok(m.spec.arrows.p0["1"]?.join() === "p1", "so p0 on 1 goes to p1 alone");
  // Two arrows labelled other from one state both read the leftover symbols.
  const n = nfa(["p0", "p1"], ["p1"], [["p0", "p1", "other"], ["p0", "p0", "other"]]);
  ok(n.spec.arrows.p0["0"]?.join() === "p0,p1" && n.spec.arrows.p0["1"]?.join() === "p0,p1", "two other arrows both read everything");
  // Unlabelled arrows and unknown names are still reported.
  const u = nfaFromEdges(["a", "b"], "a", [], [{ from: "a", to: "b", label: [] }, { from: "b", to: "a", label: ["V"] }], B);
  ok(u.unlabeled.join() === "0" && u.unknown.length === 1 && u.unknown[0].token === "V", "unlabelled and unknown are still errors");
}

// ---- the check accepts correct NFAs ---------------------------------------------
const correct: { name: string; m: ReturnType<typeof nfa>; accepts: (s: string) => boolean }[] = [
  { name: "third from the end is 1", m: third, accepts: thirdL },
  {
    name: "ends in 01",
    m: nfa(["q0", "q1", "q2"], ["q2"], [["q0", "q0", "0,1"], ["q0", "q1", "0"], ["q1", "q2", "1"]]),
    accepts: (s) => s.endsWith("01"),
  },
  {
    name: "contains 101",
    m: nfa(["a", "b", "c", "d"], ["d"], [["a", "a", "0,1"], ["a", "b", "1"], ["b", "c", "0"], ["c", "d", "1"], ["d", "d", "0,1"]]),
    accepts: (s) => s.includes("101"),
  },
  {
    name: "contains 0110",
    m: nfa(["a", "b", "c", "d", "e"], ["e"], [["a", "a", "0,1"], ["a", "b", "0"], ["b", "c", "1"], ["c", "d", "1"], ["d", "e", "0"], ["e", "e", "0,1"]]),
    accepts: (s) => s.includes("0110"),
  },
];
for (const { name, m, accepts } of correct) {
  const T = targetOf({ alphabet: B, accepts });
  const r = checkNfa(m.spec, B, T.dfa, T.index);
  ok(r.status === "ok", `${name}: the check accepts a correct NFA, got ${JSON.stringify(r)}`);
  ok(brute(m.spec, B, accepts, 12) === null, `${name}: and brute force agrees up to length 12`);
}

// ---- the check rejects a wrong one with the shortest counterexample ---------------
{
  // contains 101 with the last loop left off: that is "ends in 101"
  const wrong = nfa(["a", "b", "c", "d"], ["d"], [["a", "a", "0,1"], ["a", "b", "1"], ["b", "c", "0"], ["c", "d", "1"]]);
  const L = (s: string) => s.includes("101");
  const T = targetOf({ alphabet: B, accepts: L });
  const r = checkNfa(wrong.spec, B, T.dfa, T.index);
  const b = brute(wrong.spec, B, L, 10);
  ok(b === "1010", `brute force finds 1010 first, got ${b}`);
  ok(r.status === "wrong" && r.word === b && r.accepts === false, `the check names ${b}, which it rejects, got ${JSON.stringify(r)}`);
  // and one that accepts too much: third from the end with p2 accepting too
  const loose = nfa(["p0", "p1", "p2", "p3"], ["p2", "p3"], [["p0", "p0", "0,1"], ["p0", "p1", "1"], ["p1", "p2", "0,1"], ["p2", "p3", "0,1"]]);
  const T3 = targetOf({ alphabet: B, accepts: thirdL });
  const r3 = checkNfa(loose.spec, B, T3.dfa, T3.index);
  ok(r3.status === "wrong" && r3.word === "10" && r3.accepts === true, `loose third: the check names 10, accepted, got ${JSON.stringify(r3)}`);
  ok(checkNfa({ states: [], start: null, accepting: [], arrows: {} }, B, T3.dfa).status === "no-states", "no states, no check");
}

// ---- random NFAs against brute force ------------------------------------------------
{
  const rnd = rng(12345);
  const langs = correct.map((c) => c.accepts);
  let wrongs = 0;
  for (let t = 0; t < 400; t++) {
    const k = 1 + rnd(4);
    const states = Array.from({ length: k }, (_, i) => `r${i}`);
    const arrows: NfaSpec["arrows"] = {};
    for (const s of states) {
      arrows[s] = {};
      for (const a of B) { const to = states.filter(() => rnd(3) === 0); if (to.length) arrows[s][a] = to; }
    }
    const m: NfaSpec = { states, start: "r0", accepting: states.filter(() => rnd(2) === 0), arrows };
    const L = langs[t % langs.length];
    const T = targetOf({ alphabet: B, accepts: L });
    const r = checkNfa(m, B, T.dfa, T.index);
    // At most 2^4 sets times 8 target states: every disagreement shows by length 128,
    // but the shortest one is far shorter. Brute force to 12 decides these.
    const b = brute(m, B, L, 12);
    if (b === null) ok(r.status === "ok", `random ${t}: brute force finds nothing up to 12 but the check says ${JSON.stringify(r)}`);
    else {
      wrongs++;
      ok(r.status === "wrong" && r.word === b && r.accepts === runNfa(m, b).accepted, `random ${t}: brute force finds ${b}, the check says ${JSON.stringify(r)}`);
    }
  }
  ok(wrongs > 0, "some random machines are wrong");
}

// ---- random NFAs against their own language, and a perturbed copy --------------------
{
  // The target is the random machine's own language (at most 2^3 = 8 sets, so
  // bound 10 is exact), so the check must pass, and a copy with one arrow
  // set changed must fail exactly where brute force says.
  const rnd = rng(4242);
  let same = 0, differ = 0;
  for (let t = 0; t < 150; t++) {
    const k = 1 + rnd(3);
    const states = Array.from({ length: k }, (_, i) => `r${i}`);
    const make = () => {
      const arrows: NfaSpec["arrows"] = {};
      for (const s of states) {
        arrows[s] = {};
        for (const a of B) { const to = states.filter(() => rnd(2) === 0); if (to.length) arrows[s][a] = to; }
      }
      return arrows;
    };
    const m: NfaSpec = { states, start: "r0", accepting: states.filter(() => rnd(2) === 0), arrows: make() };
    const own = (w: string) => runNfa(m, w).accepted;
    const T = targetOf({ alphabet: B, accepts: own, bound: 10 });
    ok(checkNfa(m, B, T.dfa, T.index).status === "ok", `own ${t}: a machine checks as correct against its own language`);
    const s = states[rnd(k)], a = B[rnd(2)];
    const to = states.filter(() => rnd(2) === 0);
    const m2: NfaSpec = { ...m, arrows: { ...m.arrows, [s]: { ...m.arrows[s], [a]: to.length ? to : undefined } } };
    const r = checkNfa(m2, B, T.dfa, T.index);
    // Two machines with at most 8 sets each disagree, if at all, by length 64.
    let b: string | null = null;
    for (const w of allStrings(B, 14)) if (runNfa(m2, w).accepted !== own(w)) { b = w; break; }
    if (b === null) { same++; ok(r.status === "ok", `own ${t}: no difference up to 14 but the check says ${JSON.stringify(r)}`); }
    else { differ++; ok(r.status === "wrong" && r.word === b, `own ${t}: brute force finds ${b}, the check says ${JSON.stringify(r)}`); }
  }
  ok(same > 10 && differ > 10, `both outcomes are exercised (${same} unchanged, ${differ} changed)`);
}

// ---- on a deterministic machine, compareNfa and compare agree -----------------------
{
  const rnd = rng(777);
  for (let t = 0; t < 300; t++) {
    const k = 1 + rnd(5);
    const states = Array.from({ length: k }, (_, i) => `d${i}`);
    const arrows: MachineSpec["arrows"] = {};
    const sets: NfaSpec["arrows"] = {};
    for (const s of states) {
      arrows[s] = {}; sets[s] = {};
      for (const a of B) { const to = states[rnd(k)]; arrows[s][a] = to; sets[s][a] = [to]; }
    }
    const accepting = states.filter(() => rnd(2) === 0);
    const L = correct[t % correct.length].accepts;
    const T = targetOf({ alphabet: B, accepts: L });
    const d = compare({ states, start: "d0", accepting, arrows }, B, T.dfa, T.index);
    const n = compareNfa({ states, start: "d0", accepting, arrows: sets }, B, T.dfa, T.index);
    ok(JSON.stringify(d) === JSON.stringify(n), `dfa ${t}: compare says ${JSON.stringify(d)}, compareNfa ${JSON.stringify(n)}`);
    // and runNfa follows runMachine
    for (const w of ["", "0", "1", "0110", "10101"]) {
      const p = runMachine({ states, start: "d0", accepting, arrows }, w).path;
      ok(runNfa({ states, start: "d0", accepting, arrows: sets }, w).sets.map((s) => s[0]).join() === p.join(), `dfa ${t}: runNfa follows the path on ${w}`);
    }
  }
}

// ---- a large alphabet, through `relevant` and `index` --------------------------------
{
  const lang = { alphabet: LOWER, accepts: (s: string) => s.includes("ab"), relevant: ["a", "b"] };
  const T = targetOf(lang);
  ok(T.alphabet.length === 3, `the target is built over a, b and one stand-in, got ${T.alphabet}`);
  const ALL = { ALL: LOWER };
  const good = nfa(["s0", "s1", "s2"], ["s2"], [["s0", "s0", "ALL"], ["s0", "s1", "a"], ["s1", "s2", "b"], ["s2", "s2", "ALL"]], LOWER, ALL);
  ok(checkNfa(good.spec, LOWER, T.dfa, T.index).status === "ok", "contains ab, over 26 letters: correct");
  const bad = nfa(["s0", "s1", "s2"], ["s2"], [["s0", "s0", "ALL"], ["s0", "s1", "a"], ["s1", "s2", "b"]], LOWER, ALL);
  const r = checkNfa(bad.spec, LOWER, T.dfa, T.index);
  ok(r.status === "wrong" && r.word === "aba" && !r.accepts, `ends in ab is wrong on aba, got ${JSON.stringify(r)}`);
  // `other` on a large alphabet: s0 reads a to s1 and loops on everything else
  const o = nfa(["s0", "s1"], ["s1"], [["s0", "s1", "a"], ["s0", "s0", "other"], ["s1", "s1", "ALL"]], LOWER, ALL);
  ok(o.expanded[1].length === 25 && !o.expanded[1].includes("a"), "other on a large alphabet leaves out a");
  const Ta = targetOf({ alphabet: LOWER, accepts: (s) => s.includes("a"), relevant: ["a"] });
  ok(checkNfa(o.spec, LOWER, Ta.dfa, Ta.index).status === "ok", "contains a, with other: correct");
}

// ---- the deterministic reading of the same drawing is unchanged -----------------------
{
  // The third-from-end drawing, read deterministically, clashes on p0 and 1
  // and is missing arrows: exactly what the DFA builder reports.
  const drawn: DrawnEdge[] = [["p0", "p0", "0,1"], ["p0", "p1", "1"], ["p1", "p2", "0,1"], ["p2", "p3", "0,1"]]
    .map(([from, to, l]) => ({ from, to, label: l.split(",") }));
  const d = specFromEdges(["p0", "p1", "p2", "p3"], "p0", ["p3"], drawn, B);
  ok(d.clashes.length === 1 && d.clashes[0].state === "p0" && d.clashes[0].symbol === "1", "read as a DFA, p0 clashes on 1");
}

// ---- the tree of runs ------------------------------------------------------------------
{
  // N_3 of the notes, with its states named as there.
  const N3 = nfa(["q0", "q1", "q2", "q3"], ["q3"], [
    ["q0", "q0", "0,1"], ["q0", "q1", "1"], ["q1", "q2", "0,1"], ["q2", "q3", "0,1"],
  ]).spec;
  // Every path from the root to a leaf, as a list of states, and whether it ends stuck.
  const paths = (w: string) => {
    const t = runTree(N3, w);
    const out: { path: string; stuck: boolean; full: boolean }[] = [];
    t.nodes.forEach((n, i) => {
      if (n.children.length) return;
      const p: string[] = [];
      for (let j: number | null = i; j !== null; j = t.nodes[j].parent) p.unshift(t.nodes[j].state);
      out.push({ path: p.join(","), stuck: n.stuck, full: n.depth === w.length });
    });
    return { t, out };
  };

  // Figure figure:nfa-run-trees, left: three runs on 0110, ending q0, q2, q3
  // from left to right, and no stuck attempt.
  {
    const { t, out } = paths("0110");
    ok(t.truncatedAt === null && t.drawn === 4, "0110: drawn in full");
    ok(t.nodes.length === 10, `0110: ten nodes, as in the figure, got ${t.nodes.length}`);
    ok(out.map((o) => o.path).join(" ") === "q0,q0,q0,q0,q0 q0,q0,q0,q1,q2 q0,q0,q1,q2,q3",
       `0110: the three runs, got ${out.map((o) => o.path).join(" ")}`);
    ok(out.every((o) => o.full && !o.stuck), "0110: every leaf is at full depth, none stuck");
    ok(t.nodes.filter((n) => n.depth === 2).map((n) => n.state).join() === "q0,q1", "0110: children in state order");
  }
  // Right: one run on 1000, and the attempt q0, q1, q2, q3 stuck.
  {
    const { t, out } = paths("1000");
    ok(t.nodes.length === 8, `1000: eight nodes, got ${t.nodes.length}`);
    const runs = out.filter((o) => o.full), stuck = out.filter((o) => o.stuck);
    ok(runs.length === 1 && runs[0].path === "q0,q0,q0,q0,q0", `1000: one run, q0 throughout, got ${runs.map((o) => o.path)}`);
    ok(stuck.length === 1 && stuck[0].path === "q0,q1,q2,q3", `1000: one stuck attempt q0,q1,q2,q3, got ${stuck.map((o) => o.path)}`);
  }
  // The empty string: just the root.
  {
    const t = runTree(N3, "");
    ok(t.nodes.length === 1 && t.nodes[0].state === "q0" && t.drawn === 0 && !t.nodes[0].stuck, "the empty string: only the root");
    ok(runTree({ ...N3, start: null }, "01").nodes.length === 0, "no start: no tree");
  }
  // The bottom row, as a set, is what runNfa says the machine could end in.
  for (const w of allStrings(B, 7)) {
    const t = runTree(N3, w, 100000, 100000);
    const bottom = new Set(t.nodes.filter((n) => n.depth === w.length).map((n) => n.state));
    const fin = runNfa(N3, w).sets[w.length];
    ok(fin.length === bottom.size && fin.every((q) => bottom.has(q)), `${w}: the bottom row is ${[...bottom]}, the set is ${fin}`);
    // and every row d holds exactly the attempts: no merging, so the row's size is the number of paths
    ok(t.nodes.every((n) => n.stuck === (n.depth < w.length && (N3.arrows[n.state]?.[w[n.depth]] ?? []).length === 0)), `${w}: stuck exactly where there is no arrow`);
  }
  // A blow-up: two states, each with arrows to both on every symbol, so row d has 2^d nodes.
  {
    const blow = nfa(["a", "b"], ["b"], [["a", "a", "0,1"], ["a", "b", "0,1"], ["b", "a", "0,1"], ["b", "b", "0,1"]]).spec;
    const w = "01100101011";
    const t = runTree(blow, w);
    // rows 1, 2, 4, 8, 16, 32 (63 nodes) fit, and 64 leaves would pass the width of 40
    ok(t.truncatedAt === 5 && t.drawn === 5 && t.nodes.length === 63, `blow-up: cut after 5 symbols with 63 nodes, got ${t.truncatedAt}, ${t.nodes.length}`);
    ok(t.nodes.every((n) => n.depth <= 5) && t.nodes.filter((n) => n.depth === 5).length === 32, "whole rows only");
    const u = runTree(blow, w, 150, 1000);
    ok(u.truncatedAt === 6 && u.nodes.length === 127, `blow-up, node cap only: cut after 6 with 127 nodes, got ${u.truncatedAt}, ${u.nodes.length}`);
    ok(runTree(blow, "0110").truncatedAt === null, "a short string is drawn in full");
  }
}

console.log(fails === 0 ? "nfa: all checks passed" : `nfa: ${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
