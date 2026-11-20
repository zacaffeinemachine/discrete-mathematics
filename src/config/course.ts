// -----------------------------------------------------------------------
//  The course, the teaching team, the office, and the booking link.
// -----------------------------------------------------------------------
//
//  THIS DUPLICATES `Slides/slides-preamble.tex`, which sets the same
//  people as \tfone, \taone and \tatwo for the deck title footer, and
//  the room and booking link as \ohroom and \ohurl. Those are the only
//  two places any of this is written down, and both must be edited
//  together.
//
//  THE ASSISTANTS ARE IN ALPHABETICAL ORDER and nothing else -- no
//  seniority, no section allocation, nothing a student could read as a
//  ranking. The preamble carries the same rule.
// -----------------------------------------------------------------------

export const COURSE_NAME = "Discrete Mathematics";
export const COURSE_SUBTITLE = "Graphs, Number Theory, and Counting";
export const COURSE_TAGLINE =
  "An undergraduate course in discrete mathematics.";

export const INSTRUCTOR = "Abhishek Khetan";

export const TEACHING_FELLOWS: readonly string[] = ["Anirban Bhattacharjee"];

export const TEACHING_ASSISTANTS: readonly string[] = [
  "Akhilesh Balaji",
  "Mannan Gupta",
  "Shambhavi Sastry",
];

/** Room number of the instructor's office. */
export const OFFICE = "AC04-703";

/**
 * Google Calendar appointment page -- students book their own office-hour
 * slot. Booking is optional. Walking in is the ordinary way to come; a slot
 * only guarantees the instructor is in the room at the chosen time. Any copy
 * that uses this link has to say so.
 */
export const BOOKING_URL = "https://calendar.app.google/w3NFv5FVg4SC2GaXA";
