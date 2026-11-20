// Machines from the notes' chapter on nondeterminism, drawn ready for the
// sandbox on the Watch a Machine Guess page. Each is an example the chapter
// itself studies, not the answer to any problem on the site.
//
// Positions are in canvas units (the canvas is 600 wide and 300 tall by
// default). Arrows between the same two states in both directions bend apart
// on their own, and loops find their own direction, so no bends are given.

export interface PresetState { id: string; name: string; x: number; y: number; accepting: boolean }
export interface PresetEdge { from: string; to: string; label: string[] }
export interface Preset { states: PresetState[]; start: string; edges: PresetEdge[] }

// N_3: the third symbol from the end is 1. It waits in q0, guesses that a 1
// is the third symbol from the end, and checks that two more symbols follow.
export const THIRD_FROM_END: Preset = {
  states: [
    { id: "q0", name: "q0", x: 90, y: 160, accepting: false },
    { id: "q1", name: "q1", x: 230, y: 160, accepting: false },
    { id: "q2", name: "q2", x: 370, y: 160, accepting: false },
    { id: "q3", name: "q3", x: 510, y: 160, accepting: true },
  ],
  start: "q0",
  edges: [
    { from: "q0", to: "q0", label: ["0", "1"] },
    { from: "q0", to: "q1", label: ["1"] },
    { from: "q1", to: "q2", label: ["0", "1"] },
    { from: "q2", to: "q3", label: ["0", "1"] },
  ],
};

// The metro map. The red line r runs through W, C and E, and the blue line b
// through P, W and Q. Each stretch of track gives an arrow in each direction.
// The friend gets on at C, and there is a cafe at Q.
export const METRO: Preset = {
  states: [
    { id: "W", name: "W", x: 170, y: 150, accepting: false },
    { id: "C", name: "C", x: 340, y: 150, accepting: false },
    { id: "E", name: "E", x: 500, y: 150, accepting: false },
    { id: "P", name: "P", x: 170, y: 45, accepting: false },
    { id: "Q", name: "Q", x: 170, y: 255, accepting: true },
  ],
  start: "C",
  edges: [
    { from: "C", to: "W", label: ["r"] },
    { from: "W", to: "C", label: ["r"] },
    { from: "C", to: "E", label: ["r"] },
    { from: "E", to: "C", label: ["r"] },
    { from: "P", to: "W", label: ["b"] },
    { from: "W", to: "P", label: ["b"] },
    { from: "W", to: "Q", label: ["b"] },
    { from: "Q", to: "W", label: ["b"] },
  ],
};
